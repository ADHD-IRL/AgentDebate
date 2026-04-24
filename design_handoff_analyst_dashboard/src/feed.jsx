// ── Enriched session feed with filters ──────────────────────────────────────

const STATUS_META = {
  pending:  { label: 'PENDING',  color: '#546E7A', step: 0 },
  round1:   { label: 'ROUND 1',  color: '#2E86AB', step: 1 },
  round2:   { label: 'ROUND 2',  color: '#D68910', step: 2 },
  complete: { label: 'COMPLETE', color: '#27AE60', step: 3 },
};

function StatusChip({ status, live }) {
  const m = STATUS_META[status];
  return (
    <span className="font-mono inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-[0.08em]"
      style={{ backgroundColor: `${m.color}18`, color: m.color, border: `1px solid ${m.color}40` }}>
      {live && <span className="pulse-dot" style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: m.color }} />}
      {live ? 'LIVE · ' + m.label : m.label}
    </span>
  );
}

function SessionRow({ s }) {
  const m = STATUS_META[s.status];
  const active = s.status === 'round1' || s.status === 'round2';
  const scenario = window.DATA.SCENARIOS.find(sc => sc.id === s.scenario);

  return (
    <a href="#" className="grid items-center gap-3 px-4 py-3 border-b last:border-0 transition-all"
      style={{
        gridTemplateColumns: '1fr 90px 110px 80px 80px 70px',
        borderColor: 'var(--wr-border)',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.035)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>

      {/* Name + scenario */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--wr-text-primary)' }}>{s.name}</p>
          {s.live && <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C0392B' }} />}
        </div>
        <p className="text-[11px] truncate" style={{ color: 'var(--wr-text-muted)' }}>
          {scenario?.name} · {timeAgo(s.created)}
        </p>
      </div>

      {/* Status + progress */}
      <div>
        <StatusChip status={s.status} live={s.live} />
        {active && (
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(138,155,181,0.12)' }}>
            <div className="h-full rounded-full" style={{ width: `${s.progress * 100}%`, backgroundColor: m.color }} />
          </div>
        )}
      </div>

      {/* Findings breakdown */}
      <div>
        {s.findings > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>{s.findings}</span>
              <span className="text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>findings</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {s.critical > 0 && <span className="font-mono text-[10px] font-bold" style={{ color: SEV_COLOR.CRITICAL }}>{s.critical}C</span>}
              {s.high > 0 && <span className="font-mono text-[10px] font-bold" style={{ color: SEV_COLOR.HIGH }}>{s.high}H</span>}
            </div>
          </>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--wr-text-muted)' }}>—</span>
        )}
      </div>

      {/* Confidence */}
      <div>
        {s.confidence > 0 ? (
          <>
            <p className="font-mono text-sm font-bold" style={{ color: s.confidence < 0.65 ? SEV_COLOR.HIGH : 'var(--wr-text-primary)' }}>
              {(s.confidence * 100).toFixed(0)}%
            </p>
            <p className="text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>confidence</p>
          </>
        ) : <span className="text-[11px]" style={{ color: 'var(--wr-text-muted)' }}>—</span>}
      </div>

      {/* R1→R2 drift */}
      <div>
        {s.drift !== 0 && s.status !== 'pending' ? (
          <div className="flex items-center gap-1">
            <Ico name={s.drift > 0 ? 'trend-u' : 'trend-d'} size={12} style={{ color: s.drift > 0 ? SEV_COLOR.CRITICAL : SEV_COLOR.LOW }} />
            <span className="font-mono text-xs font-bold" style={{ color: s.drift > 0 ? SEV_COLOR.CRITICAL : SEV_COLOR.LOW }}>
              {s.drift > 0 ? '+' : ''}{s.drift.toFixed(1)}
            </span>
          </div>
        ) : (
          <span className="font-mono text-xs" style={{ color: 'var(--wr-text-muted)' }}>—</span>
        )}
        <p className="text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>drift</p>
      </div>

      {/* Agents */}
      <div className="flex items-center justify-end">
        {s.agents > 0 ? (
          <div className="flex items-center gap-1.5">
            <Ico name="users" size={11} style={{ color: 'var(--wr-text-muted)' }} />
            <span className="font-mono text-xs" style={{ color: 'var(--wr-text-secondary)' }}>{s.agents}</span>
          </div>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--wr-text-muted)' }}>—</span>
        )}
      </div>
    </a>
  );
}

function SessionFeed() {
  const [filter, setFilter] = useState('all');
  const sessions = window.DATA.SESSIONS;
  const filtered = filter === 'all' ? sessions
    : filter === 'active' ? sessions.filter(s => s.status === 'round1' || s.status === 'round2')
    : filter === 'complete' ? sessions.filter(s => s.status === 'complete')
    : sessions;

  const sorted = filtered.slice().sort((a, b) => new Date(b.created) - new Date(a.created));
  const filters = [
    { k: 'all',      label: `ALL · ${sessions.length}` },
    { k: 'active',   label: `ACTIVE · ${sessions.filter(s => s.status === 'round1' || s.status === 'round2').length}` },
    { k: 'complete', label: `COMPLETE · ${sessions.filter(s => s.status === 'complete').length}` },
  ];

  return (
    <Card>
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>Sessions</p>
          <div className="flex items-center gap-1">
            {filters.map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)}
                className="font-mono text-[10.5px] font-bold tracking-[0.08em] px-2 py-1 rounded transition-all"
                style={{
                  color: filter === f.k ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                  backgroundColor: filter === f.k ? 'rgba(240,165,0,0.1)' : 'transparent',
                  border: `1px solid ${filter === f.k ? 'rgba(240,165,0,0.35)' : 'transparent'}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ border: '1px solid var(--wr-border)' }}>
            <Ico name="search" size={11} style={{ color: 'var(--wr-text-muted)' }} />
            <input placeholder="Search sessions, scenarios…" className="bg-transparent outline-none text-xs"
              style={{ width: 180, color: 'var(--wr-text-primary)' }} />
          </div>
          <a href="#" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-amber)' }}>
            All sessions <Ico name="arrow-r" size={11} />
          </a>
        </div>
      </div>
      {/* header row */}
      <div className="grid gap-3 px-4 py-2 border-b" style={{
        gridTemplateColumns: '1fr 90px 110px 80px 80px 70px',
        borderColor: 'var(--wr-border)', backgroundColor: 'rgba(138,155,181,0.03)',
      }}>
        {['NAME / SCENARIO', 'STATUS', 'FINDINGS', 'CONFIDENCE', 'DRIFT', 'AGENTS'].map((h, i) => (
          <span key={i} className="text-[10px] font-mono font-bold tracking-[0.1em]"
            style={{ color: 'var(--wr-text-muted)', textAlign: i >= 5 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>
      <div>
        {sorted.map(s => <SessionRow key={s.id} s={s} />)}
      </div>
    </Card>
  );
}

window.SessionFeed = SessionFeed;
