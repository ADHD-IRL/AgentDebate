# AgentDebate

Structured multi-agent risk assessment platform. Build expert agent panels, run two-round red team sessions, and produce decision briefs — or drop into the **Live Debate Room** for a real-time streaming debate with voice narration you can facilitate on the fly.

Multi-user, workspace-aware deployment backed by Supabase. All AI calls go directly from your browser to the Anthropic API using your own key. Voice features use the OpenAI API directly from the browser.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- A [Supabase](https://supabase.com/) project (free tier is sufficient)
- An [Anthropic API key](https://console.anthropic.com/) with Messages API access
- An [OpenAI API key](https://platform.openai.com/) *(optional — required only for voice TTS and push-to-talk)*

---

## Supabase setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Note down your **Project URL** and **anon public key** from **Project Settings → API**.

### 2. Run the database migrations

Open the [SQL editor](https://supabase.com/dashboard/project/_/sql/new) for your project and run the migration files in order:

1. [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) — tables, triggers, Realtime config
2. [`supabase/migrations/002_rls.sql`](supabase/migrations/002_rls.sql) — Row Level Security with workspace-scoped policies
3. [`supabase/migrations/003_debate.sql`](supabase/migrations/003_debate.sql) — Live Debate session mode and transcript storage
4. [`supabase/migrations/004_source_urls.sql`](supabase/migrations/004_source_urls.sql) — pinned source document support

### 3. Apply post-migration patches

Run the following SQL in the editor. This fixes workspace bootstrap for new users and adds the `voice_id` column used by the Live Debate Room:

```sql
-- Allow workspace owners to bootstrap their own member record on first login
create policy "workspaces_read_owner" on public.workspaces
  for select using (auth.uid() = owner_id);

create or replace function public.owns_workspace(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspaces
    where id = ws_id and owner_id = auth.uid()
  );
$$ language sql security definer stable;

drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert" on public.workspace_members for insert with check (
  is_admin(workspace_id)
  or (
    auth.uid() = user_id
    and owns_workspace(workspace_id)
  )
);

-- Voice ID for agents (OpenAI TTS voice assigned per analyst)
alter table public.agents add column if not exists voice_id text;
```

### 4. Configure authentication

In your Supabase dashboard go to **Authentication → URL Configuration** and add your app's URL (e.g. `http://localhost:5173`) to **Redirect URLs**.

Optionally enable **Google OAuth** under **Authentication → Providers → Google** by supplying your Google OAuth client credentials.

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/ADHD-IRL/AgentDebate.git
cd AgentDebate
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# Optional: set OpenAI key via env instead of Settings UI
# VITE_OPENAI_KEY=sk-...
```

Both Supabase values are found under **Project Settings → API**.

> If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing the app shows a **Setup Required** screen with instructions rather than a blank page.

### 3. Add the splash page hero image

Place your hero image at:

```
public/splash-hero.jpg
```

This is displayed as the full-bleed background on the login/splash page. The app works without it (dark fallback background), but the image completes the visual identity.

### 4. Start the development server

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

---

## First-time use

1. Open the app — the splash page is always shown first
2. Click **Request access** to create an account, or sign in with Google
3. A workspace is automatically created and you are added as admin
4. Go to **Settings** and configure your API keys:
   - **Anthropic API key** — required for all AI analysis (stored in your workspace record, shared with members)
   - **OpenAI API key** — required for voice TTS narration and push-to-talk transcription (stored in browser `localStorage`, per-device)

---

## Workflow

### Classic session

1. **Domains** — define the subject areas relevant to your assessment (e.g. *Cybersecurity*, *Supply Chain*)
2. **Agents** — build your expert panel; use **AI Generate** or **Import** from Markdown; assign each analyst a TTS voice
3. **Scenarios** — create a scenario with a context document describing the system or threat environment
4. **Sessions → New Session → Classic Analysis** — choose agents and scenario, click **Create Session**
5. From the session workspace, run **Round 1**, then **Round 2**, then **Synthesize**
6. **Results** — view synthesis, consensus findings, SCRS scores, threat chains, and chain-breaker analysis

### Live Debate Room

1. **Sessions → New Session → Live Debate** — configure agents, scenario, and optional pinned source URLs
2. Click **Create Session** to land on the session workspace
3. Click **Enter Debate Room** to open the live room
4. Click **Round 1** — agent responses stream in with real-time voice narration (if OpenAI key is set)
5. Ask questions at any time; use **Address** chips to direct a question at a specific agent
6. Hold **Space** (or click the mic button) to speak a question via push-to-talk
7. Click **Round 2** after Round 1 completes, then **Synthesize** when done

---

## Voice features

Voice requires an **OpenAI API key** added in Settings. All TTS and transcription calls are made directly from the browser to `api.openai.com` — no server required.

### Text-to-speech (TTS)

Each agent speaks in a distinct OpenAI TTS voice assigned when the agent is created. Available voices:

| Voice | Character |
|---|---|
| `alloy` | Neutral · balanced |
| `echo` | Male · measured |
| `nova` | Female · energetic |
| `onyx` | Male · deep |
| `fable` | British · expressive |
| `shimmer` | Female · soft |

Voices are assigned per agent in the **Agent** form and persisted to the database. If no voice is explicitly set, voices are auto-assigned by roster position using the list above.

To set a voice: open **Agents**, click an agent to edit, scroll to the **VOICE** section, and select a voice — you can click **Preview** to hear it before saving.

### Push-to-talk (PTT)

In the Live Debate Room, hold **Space** (or the mic button) to record a question. On release, the recording is sent to OpenAI Whisper for transcription and inserted as your message. The transcript appears immediately in the conversation for full accessibility.

### Muting

Each agent in the roster has a mute toggle. Muted agents do not produce audio. A global **Auto-play TTS** toggle in the voice settings panel disables all voice output while keeping the text transcript.

### Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` (hold, no input focused) | Push-to-talk |
| `⌘1` … `⌘6` | Address agent by roster index |
| `⌘0` | Address the room (clear target) |
| `H` | Raise hand / interrupt current speaker |
| `⌘↵` | Send message |
| `Esc` | Cancel recording, clear target |

---

## Session states

Sessions move through four states visible on the Sessions page and dashboard:

| State | Meaning |
|---|---|
| **DRAFT** | Created but not yet run — shown with dashed border |
| **ROUND 1** | Round 1 assessments in progress or complete |
| **ROUND 2** | Rebuttal round in progress or complete |
| **COMPLETE** | Both rounds done and synthesis generated |

Findings (severity counts) only appear once agents have actually produced assessments — draft sessions show no findings.

---

## Dashboard

The analyst dashboard (`/dashboard`) gives a workspace-wide view:

- **KPI strip** — critical findings, open findings (active sessions only), total sessions, average confidence, median severity drift — all scoped to a configurable time window (7 / 14 / 30 / 90 days)
- **Priority queue** — unresolved criticals, high-drift sessions, coverage gaps, stale scenarios, low-confidence results
- **Findings matrix** — per-domain severity breakdown for the last 14 days with sparkline trend bars
- **Session feed** — filterable table of all sessions with status, findings, confidence, drift, and agent count
- **Coverage panel** — domain × agent coverage heat map
- **Quick actions** — one-click shortcuts to common tasks

---

## Agent import format

Agents can be bulk-imported from a `.md` file. Each block starts with an `##` heading:

```markdown
## Agent Name / Discipline

**Persona:** Who this expert is and how they think

**Cognitive Bias:** What they systematically underweight

**Primary Focus:** What they hunt for in an assessment

**Severity:** CRITICAL | HIGH | MEDIUM | LOW

**Voice:** alloy | echo | nova | onyx | fable | shimmer

**Vectors:**
- Human: 85
- Technical: 40
- Physical: 50
- Futures: 30

**Tags:** comma, separated, keywords

**Domain Tags:** Domain Name, Another Domain
```

The `Voice` field is optional. Domains are matched by name (case-insensitive) or auto-created if they don't exist.

---

## Splash page / login

`/` always displays the splash page regardless of authentication state:

- **Not signed in** — shows email/password form and Google SSO button
- **Signed in** — shows your email address, an **Enter Workspace** button (→ Sessions), a **Go to Dashboard** button, and a sign-out link

To replace the default dark background with the branded hero image, place your image at `public/splash-hero.jpg`. Any standard JPEG or PNG works; the image is displayed with `object-fit: contain` so the full graphic is always visible.

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Vercel, Netlify, GitHub Pages, S3, etc.). Set the Supabase environment variables in your hosting platform's settings:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The OpenAI API key is entered by each user in Settings and stored in their browser — it does not need to be set at build time.

---

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 18 + Vite |
| Styling | Tailwind CSS + CSS variables (`--wr-*` tokens) |
| Routing | React Router v6 |
| Auth & database | Supabase (PostgreSQL + Row Level Security) |
| Realtime | Supabase Realtime (sessions, session agents, live transcripts) |
| AI — analysis | Anthropic API — `claude-sonnet-4-6`, `claude-opus-4-7`, `claude-haiku-4-5` |
| AI — voice TTS | OpenAI `tts-1` (`alloy`, `echo`, `nova`, `onyx`, `fable`, `shimmer`) |
| AI — transcription | OpenAI Whisper (`whisper-1`) |
| Knowledge search | Wikipedia API (CORS-friendly, used by agent tool calls) |
| Charts | Recharts |
| Icons | Lucide React |
