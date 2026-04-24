const OPENAI_KEY_LS = 'agd_openai_key';

export function getOpenAiKey() {
  return localStorage.getItem(OPENAI_KEY_LS) || import.meta.env.VITE_OPENAI_KEY || '';
}
export function setOpenAiKey(key) {
  localStorage.setItem(OPENAI_KEY_LS, key.trim());
}

async function getBlobDuration(blob) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf);
    ctx.close();
    return decoded.duration;
  } catch {
    return 0;
  }
}

export async function synthesize(text, voiceId = 'alloy') {
  const key = getOpenAiKey();
  if (!key) throw new Error('No OpenAI API key — add one in Settings to enable voice.');
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: voiceId, input: text }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`TTS failed (${res.status}): ${err}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const duration = await getBlobDuration(blob);
  return { url, duration };
}

export async function transcribe(blob) {
  const key = getOpenAiKey();
  if (!key) throw new Error('No OpenAI API key — add one in Settings to enable voice input.');
  const form = new FormData();
  form.append('file', new File([blob], 'audio.webm', { type: blob.type || 'audio/webm' }));
  form.append('model', 'whisper-1');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.status);
    throw new Error(`Transcription failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.text || '';
}

export function hexToHue(hex) {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return 210;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else                h = ((r - g) / d + 4) * 60;
  return Math.round(h);
}

// Default voices for agents by roster index
export const DEFAULT_VOICES = ['alloy', 'echo', 'nova', 'onyx', 'fable', 'shimmer'];
