import { Link } from 'react-router-dom';
import { Plus, Radio, FileText, Link2 } from 'lucide-react';
import { Card, CardHeader } from './atoms';

const ACTIONS = [
  {
    icon: Plus,
    label: 'Start new session',
    desc:  'Classic red team debate',
    href:  '/sessions/new',
    primary: true,
    badge: null,
  },
  {
    icon: Radio,
    label: 'Live Debate Room',
    desc:  'Real-time AI moderation',
    href:  '/live',
    primary: false,
    badge: 'NEW',
  },
  {
    icon: FileText,
    label: 'Generate brief',
    desc:  'Executive summary export',
    href:  '/reports',
    primary: false,
    badge: null,
  },
  {
    icon: Link2,
    label: 'Chain Breaker',
    desc:  'Analyse kill-chain gaps',
    href:  '/chainbreaker',
    primary: false,
    badge: null,
  },
];

export default function QuickActions() {
  return (
    <Card>
      <CardHeader title="Quick Actions" />
      <div style={{ padding: '8px 12px 12px' }}>
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.href} style={{ textDecoration: 'none', display: 'block', marginTop: i === 0 ? 0 : 6 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                  backgroundColor: action.primary ? 'rgba(240,165,0,0.1)' : 'transparent',
                  border: action.primary ? '1px solid rgba(240,165,0,0.3)' : '1px solid var(--wr-border)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = action.primary ? 'rgba(240,165,0,0.17)' : 'rgba(138,155,181,0.07)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = action.primary ? 'rgba(240,165,0,0.1)' : 'transparent';
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: action.primary ? 'rgba(240,165,0,0.2)' : 'rgba(138,155,181,0.1)',
                }}>
                  <Icon style={{ width: 14, height: 14, color: action.primary ? 'var(--wr-amber)' : 'var(--wr-text-secondary)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 12.5, fontWeight: 600,
                      color: action.primary ? 'var(--wr-amber)' : 'var(--wr-text-primary)',
                    }}>
                      {action.label}
                    </span>
                    {action.badge && (
                      <span style={{
                        fontSize: 8.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                        padding: '1px 5px', borderRadius: 3,
                        backgroundColor: 'rgba(39,174,96,0.18)', color: '#27AE60',
                        border: '1px solid rgba(39,174,96,0.3)',
                      }}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--wr-text-muted)', marginTop: 1 }}>
                    {action.desc}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
