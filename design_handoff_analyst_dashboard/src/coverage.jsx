// ── Coverage panel: domain coverage + agent workload + quick actions ───────

function CoverageBar({ domain, scenarios }) {
  const covered = domain.agents > 0;
  const load = Math.min(1, domain.agents / 3); // 3 is "full" coverage
  const scenarioCount = scenarios.filter(s => true).length; // placeholder — we don't map scenarios to domains in data
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span style={{ width: 3, height: 20, backgroundColor: domain.color, borderRadius: 1, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium truncate" style={{ color: covered ? 'var(--wr-text-primary)' : 'var(--wr-critical)' }}>{domain.name}</span>
          <span className="font-mono text-[10px]" style={{ color: covered ? 'var(--wr-text-muted)' : 'var(--wr-critical)' }}>
            {domain.agents} {domain.agents === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(138,155,181,0.1)' }}>
          <div className="h-full rounded-full" style={{
            width: covered ? `${load * 100}%` : '100%',
            backgroundColor: covered ? domain.color : 'var(--wr-critical)',
            opacity: covered ? 1 : 0.35,
          }} />
        </div>
      </div>
    </div>
  );
}

function CoveragePanel() {
  const { DOMAINS, SCENARIOS, AGENTS } = window.DATA;
  const gaps = DOMAINS.filter(d => d.agents === 0);
  const maxAgentLoad = Math.max(...AGENTS.map(a => a.sessions));
  const topAgents = AGENTS.slice().sort((a, b) => b.sessions - a.sessions).slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="COVERAGE & WORKLOAD"
        right={
          <a href="#" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-amber)' }}>
            Details <Ico name="arrow-r" size={11} />
          </a>
        }
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-2xl font-bold" style={{ color: gaps.length > 0 ? SEV_COLOR.CRITICAL : SEV_COLOR.LOW }}>
              {DOMAINS.length - gaps.length} / {DOMAINS.length}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--wr-text-muted)' }}>domains covered</p>
          </div>
          {gaps.length > 0 && (
            <div className="text-right">
              <p className="font-mono text-xs font-bold" style={{ color: SEV_COLOR.CRITICAL }}>
                {gaps.length} GAP{gaps.length > 1 ? 'S' : ''}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>need agents</p>
            </div>
          )}
        </div>
        <div className="space-y-0.5 mb-4">
          {DOMAINS.map(d => <CoverageBar key={d.id} domain={d} scenarios={SCENARIOS} />)}
        </div>

        <div className="pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-mono font-bold tracking-[0.1em]" style={{ color: 'var(--wr-text-muted)' }}>TOP ANALYSTS · LAST 7D</p>
            <a href="#" className="text-[10px] font-mono" style={{ color: 'var(--wr-amber)' }}>All agents →</a>
          </div>
          <div className="space-y-1.5">
            {topAgents.map(a => {
              const domain = DOMAINS.find(d => d.id === a.domain);
              return (
                <div key={a.name} className="flex items-center gap-2">
                  <Avatar name={a.name} size={20} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{a.name}</span>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--wr-text-muted)' }}>{a.sessions} sess · {(a.avgConf*100).toFixed(0)}%</span>
                    </div>
                    <div className="h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(138,155,181,0.1)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${(a.sessions / maxAgentLoad) * 100}%`,
                        backgroundColor: domain?.color || 'var(--wr-amber)',
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { icon: 'swords',  label: 'Start new session',   sub: 'Structured threat assessment', primary: true },
    { icon: 'bolt',    label: 'Live Debate Room',    sub: 'Real-time streaming debate',   badge: 'NEW' },
    { icon: 'report',  label: 'Generate brief',      sub: 'From completed sessions' },
    { icon: 'scissors',label: 'Chain Breaker',       sub: 'Analyze attack chains' },
  ];
  return (
    <Card>
      <div className="p-2">
        {actions.map((a, i) => (
          <a key={a.label} href="#"
            className="flex items-center gap-3 px-3 py-2.5 rounded transition-all"
            style={{
              backgroundColor: a.primary ? 'var(--wr-amber)' : 'transparent',
              marginBottom: 2,
            }}
            onMouseEnter={e => { if (!a.primary) e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.06)'; }}
            onMouseLeave={e => { if (!a.primary) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: a.primary ? 'rgba(13,27,42,0.12)' : 'rgba(240,165,0,0.1)',
                color: a.primary ? '#0D1B2A' : 'var(--wr-amber)',
              }}>
              <Ico name={a.icon} size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: a.primary ? '#0D1B2A' : 'var(--wr-text-primary)' }}>{a.label}</p>
                {a.badge && <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)' }}>{a.badge}</span>}
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: a.primary ? 'rgba(13,27,42,0.65)' : 'var(--wr-text-muted)' }}>{a.sub}</p>
            </div>
            <Ico name="chev-r" size={14} style={{ color: a.primary ? 'rgba(13,27,42,0.6)' : 'var(--wr-text-muted)' }} />
          </a>
        ))}
      </div>
    </Card>
  );
}

window.CoveragePanel = CoveragePanel;
window.QuickActions = QuickActions;
