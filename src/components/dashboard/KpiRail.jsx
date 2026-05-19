const TILES = [
  { label: 'CRITICAL RISKS IDENTIFIED', color: 'var(--wr-critical)', key: 'critical' },
  { label: 'AVG CONFIDENCE',   color: 'var(--wr-low)',      key: 'conf'     },
  { label: 'EVENTS THIS WEEK', color: 'var(--wr-amber)',    key: 'week'     },
];

function fmt(key, value) {
  if (value == null) return '—';
  if (key === 'conf') return `${Math.round(value * 100)}%`;
  return String(value);
}

function SubLabel({ delta, label }) {
  if (delta == null) return <span style={{ color: 'var(--wr-text-muted)', fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>;
  const isUp = delta > 0;
  const color = delta === 0 ? 'var(--wr-text-muted)' : isUp ? 'var(--wr-low)' : 'var(--wr-text-muted)';
  const sign  = delta > 0 ? '+' : '';
  return (
    <span style={{ color, fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }}>
      {sign}{label}
    </span>
  );
}

export default function KpiRail({ kpis = {} }) {
  return (
    <div style={{
      backgroundColor: 'var(--wr-bg-card)',
      border: '1px solid var(--wr-border)',
      borderRadius: 6,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
    }}>
      {TILES.map((tile, i) => {
        const kpi = kpis[tile.key] || {};
        return (
          <div key={tile.key} style={{
            padding: '20px',
            borderRight: i < 2 ? '1px solid var(--wr-border)' : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            {/* Label row — min-height 32px for cross-tile alignment */}
            <div style={{
              minHeight: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', color: 'var(--wr-text-muted)', textAlign: 'center',
            }}>
              {tile.label}
            </div>

            {/* Value row — min-height 42px */}
            <div style={{
              minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
              color: tile.color, textAlign: 'center',
            }}>
              {fmt(tile.key, kpi.value)}
            </div>

            {/* Sub label */}
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <SubLabel delta={kpi.delta} label={kpi.subLabel || '—'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
