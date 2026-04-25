import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Radio } from 'lucide-react';
import { Card, CardHeader, SevPill, SEV_COLOR, SEV_ORDINAL, timeAgo, AmberLink } from './atoms';

const STATUS_META = {
  pending:  { label: 'DRAFT',    color: 'var(--wr-text-muted)', progress: 0   },
  round1:   { label: 'ROUND 1',  color: '#2E86AB',              progress: 33  },
  round2:   { label: 'ROUND 2',  color: '#D68910',              progress: 66  },
  complete: { label: 'COMPLETE', color: 'var(--wr-amber)',      progress: 100 },
};

function StatusCell({ session }) {
  const raw    = session.status || 'pending';
  const meta   = STATUS_META[raw] || STATUS_META.pending;
  const isLive = session.mode === 'live';
  const isInProgress = raw === 'round1' || raw === 'round2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isLive && isInProgress && (
          <Radio style={{ width: 9, height: 9, color: meta.color, flexShrink: 0 }} />
        )}
        <span style={{
          fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
          letterSpacing: '0.08em', color: meta.color,
          fontStyle: raw === 'pending' ? 'italic' : 'normal',
        }}>
          {meta.label}
        </span>
      </div>
      <div style={{ height: 3, width: '100%', borderRadius: 2, backgroundColor: 'var(--wr-border)' }}>
        <div style={{ height: '100%', width: `${meta.progress}%`, borderRadius: 2, backgroundColor: meta.color, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function ConfCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--wr-text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>—</span>;
  const pct   = Math.round(value * 100);
  const color = value >= 0.75 ? '#27AE60' : value >= 0.55 ? 'var(--wr-amber)' : SEV_COLOR.CRITICAL;
  return (
    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>
      {pct}%
    </span>
  );
}

function DriftCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--wr-text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>—</span>;
  const color = value > 0 ? SEV_COLOR.CRITICAL : value < 0 ? '#27AE60' : 'var(--wr-text-muted)';
  const sign  = value > 0 ? '+' : '';
  return (
    <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>
      {sign}{value.toFixed(1)}
    </span>
  );
}

const COL_HEADER = { fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--wr-text-muted)', padding: '0 8px 8px', whiteSpace: 'nowrap' };

export default function SessionFeed({ sessions = [], kpiFilter }) {
  const [tab,    setTab]    = useState('ALL');
  const [search, setSearch] = useState('');

  const activeCount   = sessions.filter(s => s.status === 'round1' || s.status === 'round2').length;
  const completeCount = sessions.filter(s => s.status === 'complete').length;

  const visible = sessions.filter(s => {
    const isActive = s.status === 'round1' || s.status === 'round2';
    const tabOk    = tab === 'ALL' || (tab === 'ACTIVE' && isActive) || (tab === 'COMPLETE' && s.status === 'complete');
    const searchOk = !search || (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.scenario || '').toLowerCase().includes(search.toLowerCase());
    const kpiOk    = !kpiFilter || kpiFilter !== 'critical' || (s.criticalCount || 0) > 0;
    return tabOk && searchOk && kpiOk;
  });

  return (
    <Card>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--wr-border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {[
            { id: 'ALL',      label: `ALL · ${sessions.length}` },
            { id: 'ACTIVE',   label: `ACTIVE · ${activeCount}` },
            { id: 'COMPLETE', label: `COMPLETE · ${completeCount}` },
          ].map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.06em',
                backgroundColor: active ? 'rgba(240,165,0,0.12)' : 'transparent',
                color: active ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Search */}
        <div style={{ position: 'relative', width: 180 }}>
          <Search style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: 'var(--wr-text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions…"
            style={{
              width: '100%', padding: '5px 8px 5px 24px',
              backgroundColor: 'var(--wr-bg-hover)', border: '1px solid var(--wr-border)',
              borderRadius: 5, color: 'var(--wr-text-primary)',
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <AmberLink to="/sessions">All →</AmberLink>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--wr-text-muted)', fontSize: 12 }}>
          No sessions match.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--wr-border)' }}>
                <th style={{ ...COL_HEADER, textAlign: 'left', paddingLeft: 16 }}>SESSION / SCENARIO</th>
                <th style={{ ...COL_HEADER, width: 90, textAlign: 'left' }}>STATUS</th>
                <th style={{ ...COL_HEADER, width: 90, textAlign: 'center' }}>FINDINGS</th>
                <th style={{ ...COL_HEADER, width: 80, textAlign: 'center' }}>CONF</th>
                <th style={{ ...COL_HEADER, width: 80, textAlign: 'center' }}>DRIFT</th>
                <th style={{ ...COL_HEADER, width: 70, textAlign: 'center' }}>AGENTS</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s, i) => {
                const isLast   = i === visible.length - 1;
                const href     = s.mode === 'live' ? `/sessions/${s.id}/live` : `/sessions/${s.id}`;
                const topSev   = s.topSeverity;
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: isLast ? 'none' : '1px solid var(--wr-border)', transition: 'background-color 0.12s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(138,155,181,0.035)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => window.location.href = href}
                  >
                    {/* Name / scenario */}
                    <td style={{ padding: '10px 8px 10px 16px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {topSev && <div style={{ width: 3, height: 28, borderRadius: 2, backgroundColor: SEV_COLOR[topSev], flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--wr-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                            {s.name || `Session ${s.id?.slice(0, 6)}`}
                          </div>
                          <div style={{ fontSize: 10.5, color: 'var(--wr-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
                            {s.scenario || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle' }}>
                      <StatusCell session={s} />
                    </td>

                    {/* Findings */}
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      {(s.findingCount || 0) > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-text-primary)' }}>
                            {s.findingCount}
                          </span>
                          {topSev && <SevPill sev={topSev} compact />}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Confidence */}
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <ConfCell value={s.confidence} />
                    </td>

                    {/* Drift */}
                    <td style={{ padding: '10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <DriftCell value={s.drift} />
                    </td>

                    {/* Agents */}
                    <td style={{ padding: '10px 8px 10px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                      <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-secondary)' }}>
                        {s.agentCount ?? '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
