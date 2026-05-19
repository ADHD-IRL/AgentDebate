import { Link } from 'react-router-dom';
import { Plus, Radio, FileText, Link2 } from 'lucide-react';
import { Card } from './atoms';

const ACTIONS = [
  {
    icon: Plus,
    label: 'Start new session',
    desc:  'Structured threat assessment',
    href:  '/sessions/new',
    primary: true,
    badge: null,
  },
  {
    icon: Radio,
    label: 'Live Debate Room',
    desc:  'Real-time streaming debate',
    href:  '/sessions/new?mode=live',
    primary: false,
    badge: 'NEW',
  },
  {
    icon: FileText,
    label: 'Generate brief',
    desc:  'From completed sessions',
    href:  '/reports',
    primary: false,
    badge: null,
  },
  {
    icon: Link2,
    label: 'Chain Breaker',
    desc:  'Analyse kill-chain gaps',
    href:  '/chain-breaker',
    primary: false,
    badge: null,
  },
];

export default function QuickActions() {
  return (
    <Card>
      <div style={{ padding: '8px' }}>
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.href} style={{ textDecoration: 'none', display: 'block', marginBottom: i < ACTIONS.length - 1 ? 2 : 0 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                  backgroundColor: action.primary ? 'var(--wr-amber)' : 'transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!action.primary) e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.06)';
                }}
                onMouseLeave={e => {
                  if (!action.primary) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: action.primary ? 'rgba(13,27,42,0.12)' : 'rgba(240,165,0,0.1)',
                  color: action.primary ? '#0D1B2A' : 'var(--wr-amber)',
                }}>
                  <Icon style={{ width: 15, height: 15 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: action.primary ? '#0D1B2A' : 'var(--wr-text-primary)',
                    }}>
                      {action.label}
                    </span>
                    {action.badge && (
                      <span style={{
                        fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
                        padding: '1px 5px', borderRadius: 3,
                        backgroundColor: 'rgba(240,165,0,0.15)', color: 'var(--wr-amber)',
                      }}>
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2, color: action.primary ? 'rgba(13,27,42,0.6)' : 'var(--wr-text-muted)' }}>
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
