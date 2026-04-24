import { Sparkline, Delta, SEV_COLOR } from './atoms';

const TILES = [
  { key: 'critical', label: 'Critical findings', format: 'count', good: 'down', severe: true },
  { key: 'open',     label: 'Open findings',     format: 'count', good: 'down', severe: false },
  { key: 'sessions', label: 'Sessions / period', format: 'count', good: 'up',   severe: false },
  { key: 'conf',     label: 'Avg. confidence',   format: 'pct',   good: 'up',   severe: false },
  { key: 'drift',    label: 'Median R1→R2 drift', format: 'signed', good: 'down', severe: false },
];

function fmt(value, format) {
  if (value == null) return '—';
  if (format === 'pct')    return `${Math.round(value * 100)}%`;
  if (format === 'signed') return value === 0 ? '0.0' : `${value > 0 ? '+' : ''}${value.toFixed(1)}`;
  return String(value);
}

export default function KpiStrip({ kpis, activeFilter, onFilter }) {
  return (
    <div style={{
      display: 'flex',
      backgroundColor: 'var(--wr-bg-card)',
      border: '1px solid var(--wr-border)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      {TILES.map((tile, i) => {
        const kpi    = kpis[tile.key] || {};
        const active = activeFilter === tile.key;
        const color  = tile.severe && kpi.value > 0 ? SEV_COLOR.CRITICAL : 'var(--wr-text-primary)';

        return (
          <button
            key={tile.key}
            onClick={() => onFilter(active ? null : tile.key)}
            style={{
              flex: 1,
              padding: '14px 18px',
              display: 'flex', flexDirection: 'column', gap: 6,
              borderRight: i < TILES.length - 1 ? '1px solid var(--wr-border)' : 'none',
              backgroundColor: active ? 'rgba(240,165,0,0.07)' : 'transparent',
              cursor: 'pointer', textAlign: 'left',
              outline: 'none', position: 'relative',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.04)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {/* Pulse dot for critical when value > 0 */}
            {tile.severe && kpi.value > 0 && (
              <span className="pulse-dot" style={{
                position: 'absolute', top: 10, right: 10,
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: SEV_COLOR.CRITICAL,
              }} />
            )}

            {/* Label row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{
                fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--wr-text-secondary)',
              }}>
                {tile.label}
              </span>
              {kpi.spark && <Sparkline data={kpi.spark} color={tile.severe && kpi.value > 0 ? SEV_COLOR.CRITICAL : 'var(--wr-amber)'} width={72} height={28} />}
            </div>

            {/* Value + delta */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontSize: 28, fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700, lineHeight: 1, color,
              }}>
                {fmt(kpi.value, tile.format)}
              </span>
              {kpi.delta != null && (
                <Delta value={kpi.delta} good={tile.good} format={tile.format === 'count' ? 'count' : tile.format} />
              )}
            </div>

            {active && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                backgroundColor: 'var(--wr-amber)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}
