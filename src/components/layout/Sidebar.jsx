import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Globe, Target, AlertTriangle,
  Bot, Link2, Swords, BarChart3, Wifi, Map,
  Shield, BookOpen, Brain, GitCompare, Settings2, Scissors, FlaskConical
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/domains', icon: Globe, label: 'Domains' },
  { path: '/scenarios', icon: Target, label: 'Scenarios' },
  { path: '/threats', icon: AlertTriangle, label: 'Threats' },
  { path: '/agents', icon: Bot, label: 'Agents' },
  { path: '/chains', icon: Link2, label: 'Chains' },
  { path: '/chain-breaker', icon: Scissors, label: 'Chain Breaker' },
  { path: '/simulator', icon: FlaskConical, label: 'What-If Simulator' },
  { path: '/sessions', icon: Swords, label: 'Sessions' },
];

const reportsItems = [
  { path: '/reports', icon: BarChart3, label: 'Reports' },
];

const analyticsItems = [
  { path: '/threatmap', icon: Map, label: 'Threat Map' },
  { path: '/agent-analytics', icon: Brain, label: 'Agent Analytics' },
  { path: '/compare', icon: GitCompare, label: 'Compare' },
];

const settingsItems = [
  { path: '/settings', icon: Settings2, label: 'Settings' },
];

const helpItems = [
  { path: '/guide', icon: BookOpen, label: 'User Guide' },
];

export default function Sidebar({ stats }) {
  const location = useLocation();

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
      <nav className="flex-1 py-4 overflow-y-auto flex flex-col">
        <div className="flex-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150"
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
          })}
        </div>

        {/* Reports section */}
        <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
        <p className="px-5 py-1 text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>REPORTS</p>
        {reportsItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150"
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
        })}

        {/* Analytics section */}
        <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
        <p className="px-5 py-1 text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>ANALYTICS</p>
        {analyticsItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150"
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
        })}

        {/* Settings section */}
        <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
        <p className="px-5 py-1 text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>SETTINGS</p>
        {settingsItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150"
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
        })}

        {/* Help section */}
        <div className="mx-4 mt-3 mb-1 border-t" style={{ borderColor: 'var(--wr-border)' }} />
        <p className="px-5 py-1 text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>HELP</p>
        {helpItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link key={path} to={path}
              className="flex items-center gap-3 px-5 py-2.5 mx-2 rounded text-sm font-medium transition-all duration-150"
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
        })}
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