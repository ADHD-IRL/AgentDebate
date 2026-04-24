# Voice + Avatars for Live Debate Room — Handoff

**Reference mock:** `Live Debate Room with Voice.html` (in the parent project)
**Target file:** `src/pages/LiveDebateRoom.jsx` (+ new components below)

This document is the source of truth. The HTML mock is for visuals only — do **not** port its markup. Recreate the patterns in the existing React codebase using shadcn, WARROOM tokens (`var(--wr-*)`), and the existing `useWorkspace()` / `generateAgentReply*` hooks.

---

## 1. Data model changes

### Extend the Agent entity
Add two fields where agents are defined (look for the existing agent schema — likely `src/lib/agents.ts` or similar):

```ts
type Agent = {
  // …existing fields (id, name, discipline, color, …)
  voiceId: string;          // e.g. "alloy", "nova", "sage" — one of OpenAI TTS voices
                            // or an ElevenLabs voice_id if using 11Labs
  hue: number;              // 0–360, used for avatar gradient (derive from color once, persist)
};
```

Seed the existing agents with distinct voices. Store `voiceId` on the Agent so every debate uses the same voice per analyst.

### Extend the Message type
In whatever type backs the transcript (probably in `LiveDebateRoom.jsx` or `lib/llm.ts`):

```ts
type DebateMessage = {
  // …existing fields
  voice?: {
    audioUrl?: string;        // blob URL or CDN URL of the rendered TTS
    durationSec?: number;
    transcribed?: boolean;    // true if this was a user voice message converted to text
    voiceId?: string;         // the TTS voice used (for replay/regeneration)
  };
  targetAgentId?: string;     // when user addresses a specific agent
};
```

---

## 2. New components (create these)

```
src/components/debate/
  AgentAvatar.tsx        — portrait avatar with 4 status variants
  SpeakerStage.tsx       — hero row of 6 avatars above transcript
  VoicePlayer.tsx        — inline waveform + play/pause for one message
  PushToTalkButton.tsx   — hold-to-record button + live waveform
  AddressChips.tsx       — horizontal chip row for "ALL | Ava | Nik | …"
  Waveform.tsx           — analyser-driven bars (WebAudio)
```

### `AgentAvatar.tsx` — key props

```ts
type Props = {
  agent: Agent;
  size?: number;                                                // default 40
  status?: 'idle' | 'speaking' | 'listening' | 'thinking';
  active?: boolean;
  onClick?: () => void;
};
```

- Background: `conic-gradient(from 210deg, oklch(0.58 0.14 ${agent.hue}), oklch(0.38 0.10 ${(agent.hue+30)%360}), oklch(0.28 0.08 ${(agent.hue+60)%360}), oklch(0.58 0.14 ${agent.hue}))`
- Initials overlay (first letter of first + last name)
- Status ring via pseudo-elements (`::before`/`::after` with `@keyframes` for speaking pulse; box-shadow for listening halo) — CSS is in the mock
- Status badge (bottom-right): SpeakingBars for speaking, Mic icon for listening, ThinkingDots for thinking
- **Not** a `<button>` internally — wrap in a button at the call site when clickable

### `VoicePlayer.tsx`

Controlled component:
```ts
type Props = {
  audioUrl: string;
  duration: number;
  color: string;          // agent.color
  voiceLabel: string;     // agent.voiceId
  isPlaying: boolean;
  onPlayPause: () => void;
};
```

Real WebAudio implementation (replace the fake bars in the mock):
- `new Audio(audioUrl)` + `AudioContext.createMediaElementSource(audio)` + `AnalyserNode`
- `requestAnimationFrame` reading `analyser.getByteFrequencyData()` → 48 bar heights
- When `isPlaying` is false, show static bars

### `PushToTalkButton.tsx`

```ts
type Props = {
  onRecordingComplete: (blob: Blob, transcript: string) => void;
};
```

- `navigator.mediaDevices.getUserMedia({ audio: true })` on hold
- `MediaRecorder` captures while held
- Release → stop recorder → send blob to Whisper for transcription → call `onRecordingComplete`
- Binds `keydown`/`keyup` on SPACE as alternative trigger (only when composer is focused or nothing is focused)

---

## 3. Wire-up in `LiveDebateRoom.jsx`

### State additions

```ts
const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
const [targetAgentId, setTargetAgentId] = useState<string | null>(null);    // null = room
const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
const [mutedAgents, setMutedAgents] = useState<Record<string, boolean>>({});
const [autoPlayTTS, setAutoPlayTTS] = useState(true);
```

### Hook changes

The existing `generateAgentReply` / `generateAgentReplyWithTools` functions return text. Wrap them:

```ts
// src/lib/voice.ts
export async function synthesize(text: string, voiceId: string): Promise<{url: string, duration: number}> {
  const res = await fetch('/api/tts', { method: 'POST', body: JSON.stringify({ text, voiceId }) });
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), duration: await getBlobDuration(blob) };
}
```

Server route `/api/tts` calls OpenAI `audio.speech.create` (model `tts-1`, voice from the agent). For ElevenLabs, swap the endpoint.

After an agent's text stream finishes in the existing handler, if `autoPlayTTS && !mutedAgents[agent.id]`:
```ts
const { url, duration } = await synthesize(fullText, agent.voiceId);
setMessages(prev => prev.map(m => m.id === msgId ? { ...m, voice: { audioUrl: url, durationSec: duration, voiceId: agent.voiceId } } : m));
setPlayingMessageId(msgId);
setCurrentSpeakerId(agent.id);
```

### Targeting an agent

When the user sends with `targetAgentId !== null`:
- Call `generateAgentReply` for that agent first (skip round-robin)
- Include a system hint: `"The facilitator has addressed you directly. Respond before other analysts chime in."`
- After its response, the other agents may rebut as in Round 2 flow

### Interrupt / raise hand

```ts
function interrupt() {
  // 1. Pause current TTS audio
  if (currentAudioRef.current) currentAudioRef.current.pause();
  // 2. Abort the current LLM stream if mid-generation
  streamControllerRef.current?.abort();
  // 3. Focus the composer mic button
  micButtonRef.current?.focus();
}
```

Bind to the `H` key and the hand button in the composer.

---

## 4. Layout changes to `LiveDebateRoom.jsx`

Current layout (from the existing file) is roughly `[agent cards | transcript]`. New layout:

```
┌──────────────────────────────────────────────┐
│ Top bar (unchanged)                          │
├─────────────────────────────────┬────────────┤
│ SpeakerStage  (new, hero row)   │            │
├─────────────────────────────────┤   Roster   │
│                                 │  (was left │
│ Transcript (existing, enhanced  │   column)  │
│  with avatars + VoicePlayer)    │            │
│                                 ├────────────┤
│                                 │ Voice      │
│                                 │ settings   │
├─────────────────────────────────┤            │
│ Composer (AddressChips + PTT +  │            │
│  textarea + raise-hand + send)  │            │
└─────────────────────────────────┴────────────┘
```

Delete the existing left-column agent list; it moves to the right rail as a compact roster. The transcript area expands.

---

## 5. Keyboard shortcuts

Add a `useEffect` with a keydown listener on `document`:

| Key | Action |
|---|---|
| `SPACE` (hold, when no input focused) | push-to-talk |
| `⌘1`…`⌘6` | address agent by roster index |
| `⌘0` | address the room (clear target) |
| `H` | raise hand / interrupt |
| `⌘↵` | send composer |
| `ESC` | cancel recording, clear target |

---

## 6. Accessibility requirements

- Every voice message MUST keep its text transcript in the DOM — voice is additive, never a replacement
- TTS is opt-in per agent (roster mute toggle) and globally (settings toggle)
- `prefers-reduced-motion`: disable the speaking-ring CSS animations, keep the static state colors
- All controls keyboard-reachable with visible focus rings
- Live regions: announce `"{agent.name} is speaking"` on speaker change via `aria-live="polite"`

---

## 7. Backend work

Two new endpoints needed:

**POST `/api/tts`** — `{ text, voiceId }` → `audio/mpeg` stream. Call OpenAI `audio.speech.create` or ElevenLabs. Cache by `hash(text + voiceId)` — regeneration is wasteful.

**POST `/api/transcribe`** — `{ audio: Blob }` → `{ text }`. Call OpenAI Whisper or your STT of choice. Accept up to 30s clips for the PTT use case.

Both endpoints should stream where possible so playback can start before generation finishes.

---

## 8. Claude Code prompt

Give Claude Code this prompt along with this folder:

> Implement the voice + avatar features described in `design_handoff_voice_debate/README.md` for the live debate room. The visual reference is `Live Debate Room with Voice.html` — do not port its HTML; rebuild the patterns in React using the existing WARROOM tokens, shadcn primitives, and the `generateAgentReply*` / `useWorkspace` hooks already in the codebase. Extend the Agent type with `voiceId` and `hue` and seed existing agents with distinct OpenAI TTS voices. Create the six new components under `src/components/debate/`. Add `/api/tts` and `/api/transcribe` routes. Refactor `src/pages/LiveDebateRoom.jsx` to the new layout without breaking the existing streaming flow. Preserve all existing functionality — voice is additive.
