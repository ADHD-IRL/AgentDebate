import { Check } from 'lucide-react';

// Compact horizontal stage bar for a session's analysis lifecycle. Orientation
// only — shows where you are and what's done, mirroring the sidebar workflow
// inside the flow. `current` is the active stage key; `done` is a Set of keys.
const STAGES = [
  { key: 'setup',     label: 'Setup' },
  { key: 'round1',    label: 'Round 1' },
  { key: 'round2',    label: 'Round 2' },
  { key: 'synthesis', label: 'Synthesis' },
  { key: 'findings',  label: 'Findings' },
  { key: 'act',       label: 'Act' },
  { key: 'decide',    label: 'Decide' },
];

export default function AnalysisStages({ current, done = new Set(), onNavigate }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STAGES.map((s, i) => {
        const isDone = done.has(s.key);
        const isCurrent = current === s.key;
        const color = isCurrent ? 'var(--wr-amber)' : isDone ? '#27AE60' : 'var(--wr-text-muted)';
        return (
          <div key={s.key} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs" style={{ color: 'var(--wr-border)' }}>›</span>}
            <button
              onClick={() => onNavigate?.(s.key)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                color,
                backgroundColor: isCurrent ? 'rgba(240,165,0,0.12)' : 'transparent',
                border: isCurrent ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
                cursor: onNavigate ? 'pointer' : 'default',
                fontWeight: isCurrent ? 700 : 400,
              }}
            >
              {isDone && !isCurrent && <Check className="w-2.5 h-2.5" />}
              {s.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
