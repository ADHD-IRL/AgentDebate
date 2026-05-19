// ── Sidebar (matches existing WARROOM pattern) ─────────────────────────────

function Sidebar() {
  const active = '/';
  const items = [
    { group: null, links: [
      { path: '/',               icon: 'dashboard', label: 'Dashboard' },
      { path: '/domains',        icon: 'globe',     label: 'Domains' },
      { path: '/scenarios',      icon: 'target',    label: 'Scenarios' },
      { path: '/threats',        icon: 'alert',     label: 'Threats' },
      { path: '/agents',         icon: 'bot',       label: 'Agents' },
      { path: '/chains',         icon: 'link',      label: 'Chains' },
      { path: '/chain-breaker',  icon: 'scissors',  label: 'Chain Breaker' },
      { path: '/simulator',      icon: 'flask',     label: 'What-If Simulator' },
      { path: '/sessions',       icon: 'swords',    label: 'Sessions' },
    ]},
    { group: 'REPORTS', links: [
      { path: '/reports',        icon: 'report',    label: 'Reports' },
    ]},
    { group: 'ANALYTICS', links: [
      { path: '/threatmap',       icon: 'map',       label: 'Threat Map' },
      { path: '/agent-analytics', icon: 'brain',     label: 'Agent Analytics' },
      { path: '/compare',         icon: 'layers',    label: 'Compare' },
    ]},
    { group: 'SETTINGS', links: [
      { path: '/settings',       icon: 'gear',      label: 'Settings' },
    ]},
    { group: 'HELP', links: [
      { path: '/guide',          icon: 'book',      label: 'User Guide' },
    ]},
  ];

  const renderLink = ({ path, icon, label }) => {
    const isActive = path === active;
    return (
      <a key={path} href="#"
        className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all"
        style={{
          color: isActive ? 'var(--wr-amber)' : 'var(--wr-text-secondary)',
          backgroundColor: isActive ? 'rgba(240,165,0,0.1)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--wr-amber)' : '2px solid transparent',
        }}>
        <Ico name={icon} size={15} />
        <span className="tracking-wide">{label}</span>
      </a>
    );
  };

  return (
    <div className="fixed left-0 top-0 h-full w-56 flex flex-col z-40"
      style={{ backgroundColor: 'var(--wr-bg-secondary)', borderRight: '1px solid var(--wr-border)' }}>
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2">
          <Ico name="shield" size={18} style={{ color: 'var(--wr-amber)' }} />
          <span className="text-lg font-bold tracking-[0.15em] font-mono" style={{ color: 'var(--wr-amber)' }}>AgentDebate</span>
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {items.map((section, si) => (
          <div key={si}>
            {section.group && (
              <>
                <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
                <p className="px-5 py-1 text-xs font-bold tracking-[0.18em] font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                  {section.group}
                </p>
              </>
            )}
            {section.links.map(renderLink)}
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t text-xs space-y-2" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--wr-text-muted)' }}>
          <Ico name="wifi" size={12} style={{ color: '#27AE60' }} />
          <span>API Connected</span>
        </div>
        <div className="flex justify-between" style={{ color: 'var(--wr-text-muted)' }}>
          <span>13 agents</span>
          <span>2 active sessions</span>
        </div>
      </div>
    </div>
  );
}

window.Sidebar = Sidebar;
