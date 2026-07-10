import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Globe, Target, AlertTriangle,
  Bot, Link2, Swords, BarChart3, Wifi, Map,
  Shield, BookOpen, Brain, GitCompare, Settings2, Scissors, FlaskConical, Library
} from 'lucide-react';

// Menu is ordered as the actual workflow: build a reusable library, plan the
// engagement, run the red team, then act on what it surfaces.
const primary = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

const groups = [
  {
    title: '1 · Build',
    hint: 'Your reusable panel & taxonomy',
    items: [
      { path: '/domains', icon: Globe, label: 'Domains' },
      { path: '/agents', icon: Bot, label: 'Agents' },
      { path: '/sme-library', icon: Library, label: 'SME Library' },
    ],
  },
  {
    title: '2 · Plan',
    hint: 'What you want to stress-test',
    items: [
      { path: '/scenarios', icon: Target, label: 'Scenarios' },
      { path: '/threats', icon: AlertTriangle, label: 'Threats' },
    ],
  },
  {
    title: '3 · Run',
    hint: 'The red-team analysis',
    items: [
      { path: '/sessions', icon: Swords, label: 'Sessions' },
      { path: '/simulator', icon: FlaskConical, label: 'What-If Simulator' },
    ],
  },
  {
    title: '4 · Act on Findings',
    hint: 'Coverage, chains & mitigation',
    items: [
      { path: '/threatmap', icon: Map, label: 'Threat Map' },
      { path: '/chains', icon: Link2, label: 'Chains' },
      { path: '/chain-breaker', icon: Scissors, label: 'Chain Breaker' },
      { path: '/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { path: '/agent-analytics', icon: Brain, label: 'Agent Analytics' },
      { path: '/compare', icon: GitCompare, label: 'Compare' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/settings', icon: Settings2, label: 'Settings' },
      { path: '/guide', icon: BookOpen, label: 'User Guide' },
    ],
  },
];

function NavLink({ path, icon: Icon, label, active }) {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 px-5 py-2 mx-2 rounded text-sm font-medium transition-all duration-150"
      style={{
        color: active ? 'var(--wr-amber)' : 'var(--wr-text-secondary)',
        backgroundColor: active ? 'rgba(240,165,0,0.1)' : 'transparent',
        borderLeft: active ? '2px solid var(--wr-amber)' : '2px solid transparent',
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="tracking-wide">{label}</span>
    </Link>
  );
}

export default function Sidebar({ stats }) {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="fixed left-0 top-0 h-full w-56 flex flex-col z-50"
      style={{ backgroundColor: 'var(--wr-bg-secondary)', borderRight: '1px solid var(--wr-border)' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: 'var(--wr-amber)' }} />
          <span className="text-lg font-bold tracking-widest" style={{ color: 'var(--wr-amber)', fontFamily: 'JetBrains Mono, monospace' }}>
            AgentDebate
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto flex flex-col">
        <div className="mb-1">
          {primary.map(item => (
            <NavLink key={item.path} {...item} active={isActive(item.path)} />
          ))}
        </div>

        {groups.map((group, gi) => (
          <div key={group.title}>
            <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
            <div className="px-5 pt-1 pb-0.5">
              <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                {group.title.toUpperCase()}
              </p>
              {group.hint && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)', opacity: 0.55 }}>
                  {group.hint}
                </p>
              )}
            </div>
            {group.items.map(item => (
              <NavLink key={item.path} {...item} active={isActive(item.path)} />
            ))}
          </div>
        ))}
      </nav>

      {/* Status bar */}
      <div className="px-4 py-4 border-t text-xs space-y-2" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--wr-text-muted)' }}>
          <Wifi className="w-3 h-3 text-green-500" />
          <span>API Connected</span>
        </div>
        <div className="flex justify-between" style={{ color: 'var(--wr-text-muted)' }}>
          <span>{stats?.agentCount ?? 0} agents</span>
          <span>{stats?.activeSessions ?? 0} active sessions</span>
        </div>
      </div>
    </div>
  );
}
