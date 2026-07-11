import { useState, useEffect, useRef } from 'react';

// Ticks elapsed milliseconds while `active` is true; resets to 0 when it flips
// on. Lightweight (500ms interval) — for "something is happening" indicators.
export function useElapsed(active, intervalMs = 500) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (!active) { startRef.current = null; setElapsed(0); return; }
    startRef.current = Date.now();
    setElapsed(0);
    const t = setInterval(() => {
      if (startRef.current != null) setElapsed(Date.now() - startRef.current);
    }, intervalMs);
    return () => clearInterval(t);
  }, [active, intervalMs]);

  return elapsed;
}

// "42s" / "1m 05s" / "12m 30s"
export function fmtDuration(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${String(rem).padStart(2, '0')}s`;
}
