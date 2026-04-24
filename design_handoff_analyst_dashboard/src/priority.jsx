// ── Priority queue — the new analyst "inbox" ───────────────────────────────

const KIND_META = {
  drift:      { icon: 'trend-u', label: 'SEV DRIFT' },
  unresolved: { icon: 'flame',   label: 'UNRESOLVED' },
  gap:        { icon: 'alert',   label: 'COVERAGE GAP' },
  stale:      { icon: 'clock',   label: 'STALE' },
  lowconf:    { icon: 'trend-d', label: 'LOW CONFIDENCE' },
};

function PriorityRow({ p }) {
  const meta = KIND_META[p.kind];
  return (
    <a href="#" className="flex items-stretch transition-all border-b last:border-0 group"
      style={{ borderColor: 'var(--wr-border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.035)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
      {/* severity rail */}
      <div style={{ width: 3, backgroundColor: SEV_COLOR[p.severity], flexShrink: 0 }} />
      <div className="flex-1 px-4 py-3 flex items-start gap-3 min-w-0">
        <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center"
          style={{ backgroundColor: SEV_BG[p.severity], color: SEV_COLOR[p.severity] }}>
          <Ico name={meta.icon} size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SevPill sev={p.severity} compact />
            <span className="text-[10px] font-mono font-bold tracking-[0.1em]" style={{ color: 'var(--wr-text-muted)' }}>{meta.label}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>·</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>{p.meta}</span>
          </div>
          <p className="text-sm font-semibold leading-snug truncate" style={{ color: 'var(--wr-text-primary)' }}>{p.title}</p>
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--wr-text-secondary)' }}>{p.subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {p.agents.length > 0 && <AvatarStack names={p.agents} max={3} size={18} />}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--wr-amber)',
              border: '1px solid rgba(240,165,0,0.3)',
            }}>
            {p.action}
            <Ico name="arrow-r" size={11} />
          </div>
        </div>
      </div>
    </a>
  );
}

function PriorityQueue() {
  const items = window.DATA.PRIORITY;
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? items : items.filter(p => p.severity === tab);

  const tabs = [
    { k: 'all', label: `ALL · ${items.length}` },
    { k: 'CRITICAL', label: `CRITICAL · ${items.filter(p => p.severity === 'CRITICAL').length}`, color: SEV_COLOR.CRITICAL },
    { k: 'HIGH',     label: `HIGH · ${items.filter(p => p.severity === 'HIGH').length}`,         color: SEV_COLOR.HIGH },
    { k: 'MEDIUM',   label: `MEDIUM · ${items.filter(p => p.severity === 'MEDIUM').length}`,     color: SEV_COLOR.MEDIUM },
  ];

  return (
    <Card>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2">
          <Ico name="flame" size={14} style={{ color: 'var(--wr-amber)' }} />
          <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Needs your attention</p>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(240,165,0,0.12)', color: 'var(--wr-amber)' }}>
            {items.length} ITEMS
          </span>
        </div>
        <a href="#" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-amber)' }}>
          All items <Ico name="arrow-r" size={11} />
        </a>
      </div>
      <div className="px-4 pt-2.5 pb-1 flex items-center gap-1 border-b" style={{ borderColor: 'var(--wr-border)' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className="font-mono text-[10.5px] font-bold tracking-[0.08em] px-2 py-1 rounded transition-all"
            style={{
              color: tab === t.k ? (t.color || 'var(--wr-text-primary)') : 'var(--wr-text-muted)',
              backgroundColor: tab === t.k ? (t.color ? `${t.color}18` : 'rgba(138,155,181,0.08)') : 'transparent',
              border: `1px solid ${tab === t.k ? (t.color ? `${t.color}50` : 'var(--wr-border)') : 'transparent'}`,
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center stripe">
            <Ico name="check" size={22} style={{ color: 'var(--wr-low)' }} />
            <p className="text-sm mt-2 font-medium" style={{ color: 'var(--wr-text-secondary)' }}>Inbox zero</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>No {tab.toLowerCase()} items need attention</p>
          </div>
        ) : filtered.map(p => <PriorityRow key={p.id} p={p} />)}
      </div>
    </Card>
  );
}

window.PriorityQueue = PriorityQueue;
