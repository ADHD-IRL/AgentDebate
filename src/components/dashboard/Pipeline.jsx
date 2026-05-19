const STAGES = [
  { key: 'pending',  label: 'PENDING',  color: '#8A9BB5' },
  { key: 'round1',   label: 'ROUND 1',  color: '#2E86AB' },
  { key: 'round2',   label: 'ROUND 2',  color: '#D68910' },
  { key: 'review',   label: 'REVIEW',   color: '#7B2D8B' },
  { key: 'complete', label: 'COMPLETE', color: '#27AE60' },
];

export default function Pipeline({ counts = {}, total = 0 }) {
  return (
    <div style={{
      backgroundColor: 'var(--wr-bg-card)',
      border: '1px solid var(--wr-border)',
      borderRadius: 6,
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 8px',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--wr-text-muted)' }}>
          WORKFLOW STATE
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--wr-text-muted)' }}>
          {total} TOTAL
        </span>
      </div>

      {/* Boxes */}
      <div style={{ padding: '0 20px 20px', display: 'flex', gap: 6 }}>
        {STAGES.map(s => (
          <div key={s.key} style={{
            flex: '1 1 0', minWidth: 0,
            padding: '12px',
            borderRadius: 2,
            backgroundColor: `${s.color}16`,
            border: `1px solid ${s.color}44`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: s.color }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, lineHeight: 1, marginTop: 4, color: 'var(--wr-text-primary)' }}>
              {counts[s.key] ?? 0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
