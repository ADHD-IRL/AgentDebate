import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, AlertTriangle, Clock, TrendingUp, TrendingDown, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, SevPill, AvatarStack, SEV_COLOR, SEV_BG, timeAgo, AmberLink } from './atoms';

const KIND_META = {
  drift:      { icon: TrendingUp,    label: 'SEVERITY DRIFT' },
  unresolved: { icon: AlertTriangle, label: 'UNRESOLVED CRITICALS' },
  gap:        { icon: Users,         label: 'COVERAGE GAP' },
  stale:      { icon: Clock,         label: 'STALE SCENARIO' },
  lowconf:    { icon: TrendingDown,  label: 'LOW CONFIDENCE' },
};

const TABS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

export default function PriorityQueue({ items = [], kpiFilter }) {
  const [tab, setTab] = useState('ALL');

  const filtered = items.filter(p => {
    const tabOk = tab === 'ALL' || p.severity === tab;
    const kpiOk = !kpiFilter || (kpiFilter === 'critical' && p.severity === 'CRITICAL');
    return tabOk && kpiOk;
  });

  const counts = { ALL: items.length };
  TABS.slice(1).forEach(t => { counts[t] = items.filter(p => p.severity === t).length; });

  return (
    <Card>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wr-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Flame style={{ width: 14, height: 14, color: SEV_COLOR.CRITICAL, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--wr-text-primary)', flex: 1 }}>
          Needs your attention
        </span>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          padding: '2px 7px', borderRadius: 10,
          backgroundColor: items.length > 0 ? 'rgba(192,57,43,0.15)' : 'rgba(138,155,181,0.1)',
          color: items.length > 0 ? SEV_COLOR.CRITICAL : 'var(--wr-text-muted)',
        }}>
          {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <AmberLink to="/sessions">All items →</AmberLink>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--wr-border)', padding: '0 16px' }}>
        {TABS.map(t => {
          const active = tab === t;
          const color  = t === 'ALL' ? 'var(--wr-amber)' : SEV_COLOR[t];
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 12px', fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 700, letterSpacing: '0.06em',
              color: active ? color : 'var(--wr-text-muted)',
              backgroundColor: active ? (t === 'ALL' ? 'rgba(240,165,0,0.1)' : `${SEV_BG[t]}`) : 'transparent',
              border: 'none', borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginBottom: -1,
            }}>
              {t} <span style={{ opacity: 0.7 }}>· {counts[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <div className="stripe" style={{ padding: '32px 16px', textAlign: 'center' }}>
          <CheckCircle2 style={{ width: 28, height: 28, color: '#27AE60', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--wr-text-primary)', marginBottom: 4 }}>Inbox zero</p>
          <p style={{ fontSize: 11, color: 'var(--wr-text-muted)' }}>No items need attention right now.</p>
        </div>
      ) : (
        <div>
          {filtered.map((p, i) => {
            const kindMeta = KIND_META[p.kind] || KIND_META.unresolved;
            const KindIcon = kindMeta.icon;
            return (
              <Link key={i} to={p.href || '#'} style={{ textDecoration: 'none', display: 'block' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--wr-border)' : 'none',
                    position: 'relative',
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.035)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Severity rail */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: SEV_COLOR[p.severity] }} />

                  {/* Kind icon tile */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 5, flexShrink: 0, marginLeft: 4,
                    backgroundColor: SEV_BG[p.severity],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <KindIcon style={{ width: 13, height: 13, color: SEV_COLOR[p.severity] }} />
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <SevPill sev={p.severity} compact />
                      <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--wr-text-muted)', letterSpacing: '0.08em' }}>
                        {kindMeta.label}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--wr-text-muted)' }}>{p.meta}</span>
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--wr-text-primary)', marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--wr-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.subtitle}
                    </p>
                  </div>

                  {/* Right: avatars + action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {p.agents?.length > 0 && <AvatarStack names={p.agents} max={3} size={18} />}
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
                      padding: '4px 10px', borderRadius: 4,
                      color: 'var(--wr-amber)', backgroundColor: 'transparent',
                      border: '1px solid rgba(240,165,0,0.4)', cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.action} <ArrowRight style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
