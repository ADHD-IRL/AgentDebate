// ── KPI strip: 5 tiles with spark + 7d delta ───────────────────────────────

function KpiTile({ k, onClick, active }) {
  const fmt = (v) => {
    if (k.format === 'pct') return (v * 100).toFixed(0) + '%';
    if (k.format === 'signed') return (v >= 0 ? '+' : '') + v.toFixed(1);
    return v;
  };
  const severe = k.severe && k.value > 0;
  return (
    <button onClick={onClick}
      className="text-left flex-1 px-4 py-3.5 transition-all"
      style={{
        backgroundColor: active ? 'rgba(240,165,0,0.06)' : 'transparent',
        borderRight: '1px solid var(--wr-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = active ? 'rgba(240,165,0,0.08)' : 'rgba(138,155,181,0.04)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = active ? 'rgba(240,165,0,0.06)' : 'transparent'}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[10.5px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'var(--wr-text-secondary)' }}>
          {k.label}
        </p>
        {severe && <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: k.color, marginTop: 4, flexShrink: 0 }} />}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono font-bold leading-none" style={{ fontSize: 28, color: severe ? k.color : 'var(--wr-text-primary)' }}>
            {fmt(k.value)}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <Delta value={k.delta} good={k.key === 'critical' || k.key === 'open' || k.key === 'drift' ? 'down' : 'up'} format={k.format} />
            <span className="text-[10px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>{k.deltaLabel}</span>
          </div>
        </div>
        <Sparkline data={k.spark} color={k.color} width={72} height={28} />
      </div>
    </button>
  );
}

function KpiStrip({ filter, setFilter }) {
  const k = window.DATA.KPIS;
  return (
    <div className="rounded-md overflow-hidden flex" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      {k.map((item, i) => (
        <div key={item.key} style={{ flex: 1, display: 'flex' }}>
          <KpiTile k={item} active={filter === item.key} onClick={() => setFilter(filter === item.key ? null : item.key)} />
        </div>
      ))}
    </div>
  );
}

window.KpiStrip = KpiStrip;
