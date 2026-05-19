const STATUS_META = {
  pending:  { label: 'PENDING',   color: '#8A9BB5' },
  round1:   { label: 'ROUND 1',   color: '#2E86AB' },
  round2:   { label: 'ROUND 2',   color: '#D68910' },
  review:   { label: 'IN REVIEW', color: '#7B2D8B' },
  complete: { label: 'COMPLETE',  color: '#27AE60' },
};

export default function StatusPill({ status, live = false }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
      fontWeight: 700, letterSpacing: '0.12em',
      padding: '2px 8px', borderRadius: 4,
      backgroundColor: `${m.color}14`,
      color: m.color,
      border: `1px solid ${m.color}40`,
      whiteSpace: 'nowrap',
    }}>
      {live && (
        <span className="pulse-dot" style={{
          width: 6, height: 6, borderRadius: '50%',
          backgroundColor: '#C0392B', flexShrink: 0,
        }} />
      )}
      {live ? `LIVE · ${m.label}` : m.label}
    </span>
  );
}
