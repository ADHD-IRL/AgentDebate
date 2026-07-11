import { Loader2 } from 'lucide-react';
import { fmtDuration } from '@/hooks/useElapsed';

// Progress indicator for AI processing.
// - Determinate: pass `value` (0-1); shows a filling bar + optional ETA.
// - Indeterminate: omit `value`; shows an animated sweeping bar (unknown length).
// `elapsedMs` shows time-so-far; `etaMs` shows an approximate remaining time.
export default function ProcessingBar({
  label = 'Working…',
  value = null,
  elapsedMs = 0,
  etaMs = null,
  color = 'var(--wr-amber)',
  sublabel,
}) {
  const determinate = value != null;
  const pct = determinate ? Math.min(100, Math.max(0, value * 100)) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--wr-text-secondary)' }}>
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color }} />
          {label}
        </span>
        <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--wr-text-muted)' }}>
          {fmtDuration(elapsedMs)}
          {etaMs != null && etaMs > 0 && <span style={{ color }}> · ~{fmtDuration(etaMs)} left</span>}
        </span>
      </div>

      <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: 'var(--wr-border)', position: 'relative' }}>
        {determinate ? (
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: color }} />
        ) : (
          <div className="h-full rounded-full pb-indeterminate"
            style={{ width: '40%', backgroundColor: color }} />
        )}
      </div>

      {sublabel && <p className="text-xs mt-1.5" style={{ color: 'var(--wr-text-muted)' }}>{sublabel}</p>}

      <style>{`
        @keyframes pb-sweep { 0% { transform: translateX(-110%); } 100% { transform: translateX(320%); } }
        .pb-indeterminate { animation: pb-sweep 1.1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
