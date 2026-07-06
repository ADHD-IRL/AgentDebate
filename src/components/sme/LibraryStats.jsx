export default function LibraryStats({ stats }) {
  if (!stats) return null;
  const { library } = stats;

  const kpis = [
    { label: 'LIBRARY SMEs', value: library.total, unit: '' },
    { label: 'AVG QUALITY', value: library.avg_quality != null ? library.avg_quality : '—', unit: library.avg_quality != null ? '/100' : '' },
    { label: 'HIGH QUALITY', value: library.high_quality_count, unit: ' ≥80' },
    { label: 'NEED REVIEW', value: library.no_quality_score, unit: ' unscored' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
      {kpis.map(k => (
        <div key={k.label} style={{
          backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)',
          borderRadius: 6, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 6 }}>
            {k.label}
          </p>
          <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--wr-amber)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
            {k.value}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--wr-text-muted)' }}>{k.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
