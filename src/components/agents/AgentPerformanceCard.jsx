import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

const SEV_COLORS  = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SIGNAL_CLR  = { critical: '#C0392B', warn: '#D68910', ok: '#27AE60' };

// ── Inline mini progress bar ──────────────────────────────────────────────────
function MiniBar({ pct, color }) {
  return (
    <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 2 }}>
      <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Single metric column (label + value + bar) ────────────────────────────────
function MetricCol({ label, value, pct, color }) {
  return (
    <div style={{ width: 86, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 10, color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color }}>{value}</span>
      </div>
      <MiniBar pct={pct} color={color} />
    </div>
  );
}

// ── Analyst signal generator ──────────────────────────────────────────────────
function getSignals(total, completionRate, revisionRate, escalationRate) {
  if (total === 0) return [];
  const out = [];
  if (completionRate < 50)
    out.push({ text: `Only ${completionRate}% of rounds completed — creates blind spots in risk coverage`, level: 'critical' });
  else if (completionRate < 75)
    out.push({ text: `${completionRate}% completion — some rounds unfinished; verify no threats were dropped`, level: 'warn' });
  if (revisionRate > 50)
    out.push({ text: `Severity changed ${revisionRate}% of the time R1→R2 — possible uncertainty or peer influence`, level: 'warn' });
  if (escalationRate >= 70)
    out.push({ text: `${escalationRate}% rated CRIT/HIGH — pessimistic skew; adjust weighting when aggregating team risk`, level: 'warn' });
  else if (escalationRate <= 15 && total > 3)
    out.push({ text: `Only ${escalationRate}% rated CRIT/HIGH — optimistic skew; may under-rate genuine threats`, level: 'warn' });
  if (out.length === 0)
    out.push({ text: 'No anomalous patterns — assessments appear balanced and complete', level: 'ok' });
  return out;
}

// ── Main component ────────────────────────────────────────────────────────────
// Renders as a horizontal roster row. Click to expand full detail.
export default function AgentPerformanceCard({ stats, rank }) {
  const [expanded, setExpanded] = useState(false);
  const { agent, domain, perf, counts = {}, escalationRate = 0 } = stats;
  const total = perf.total;

  const scoreColor  = total === 0 ? '#555' : perf.score >= 75 ? '#27AE60' : perf.score >= 50 ? '#D68910' : '#C0392B';
  const scoreLabel  = total === 0 ? 'NO DATA' : perf.score >= 75 ? 'STRONG' : perf.score >= 50 ? 'MODERATE' : 'LOW';
  const doneColor   = perf.completionRate >= 80 ? '#27AE60' : perf.completionRate >= 50 ? '#D68910' : '#C0392B';
  const crithColor  = escalationRate >= 60 ? '#C0392B' : escalationRate >= 35 ? '#D68910' : '#27AE60';
  const stabColor   = (100 - perf.revisionRate) >= 70 ? '#27AE60' : (100 - perf.revisionRate) >= 50 ? '#D68910' : '#C0392B';

  const sevBarData = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => ({
    name: s, value: counts[s] || 0,
    pct: total > 0 ? Math.round(((counts[s] || 0) / total) * 100) : 0,
  }));

  const signals    = getSignals(total, perf.completionRate, perf.revisionRate, escalationRate);
  const hasError   = signals.some(s => s.level === 'critical');
  const hasWarning = signals.some(s => s.level === 'warn');
  const dotColor   = total === 0 ? '#444' : hasError ? '#C0392B' : hasWarning ? '#D68910' : '#27AE60';

  return (
    <div style={{ border: '1px solid var(--wr-border)', borderRadius: 6, backgroundColor: 'var(--wr-bg-card)', overflow: 'hidden', opacity: total === 0 ? 0.5 : 1 }}>

      {/* ── Main row ── */}
      <div
        style={{ display: 'flex', alignItems: 'stretch', cursor: total > 0 ? 'pointer' : 'default' }}
        onClick={() => total > 0 && setExpanded(v => !v)}
      >
        {/* Domain accent bar */}
        <div style={{ width: 4, flexShrink: 0, backgroundColor: domain?.color || '#444' }} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>

          {/* Rank + Identity */}
          <div style={{ flex: '1 1 210px', minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-text-muted)', flexShrink: 0, marginTop: 2 }}>
              #{rank}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--wr-text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
                {agent.name}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0 6px' }}>
                {agent.discipline && (
                  <span style={{ fontSize: 11, color: 'var(--wr-text-muted)', lineHeight: 1.4 }}>{agent.discipline}</span>
                )}
                {domain && (
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: domain.color, flexShrink: 0 }}>
                    · {domain.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score */}
          <div style={{ width: 62, flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1, color: scoreColor }}>
              {total > 0 ? perf.score : '—'}
            </div>
            <div style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: scoreColor, marginTop: 2 }}>
              {scoreLabel}
            </div>
          </div>

          {/* Metric columns (only when data exists) */}
          {total === 0 ? (
            <div style={{ flex: '1 0 258px' }}>
              <p style={{ fontSize: 11, color: 'var(--wr-text-muted)' }}>No assessments yet</p>
            </div>
          ) : (
            <>
              <MetricCol label="DONE" value={`${perf.completionRate}%`} pct={perf.completionRate} color={doneColor} />
              <MetricCol label="CRIT/H" value={`${escalationRate}%`} pct={escalationRate} color={crithColor} />
              <MetricCol label="STABLE" value={`${100 - perf.revisionRate}%`} pct={100 - perf.revisionRate} color={stabColor} />
            </>
          )}

          {/* Sessions */}
          <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-secondary)' }}>
              {perf.sessionsParticipated}
            </div>
            <div style={{ fontSize: 10, color: 'var(--wr-text-muted)' }}>sess</div>
          </div>

          {/* Signal dot + chevron */}
          <div style={{ width: 32, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }}
              title={total === 0 ? 'No data' : hasError ? 'Action needed' : hasWarning ? 'Review recommended' : 'OK'}
            />
            {total > 0 && (
              expanded
                ? <ChevronUp style={{ width: 12, height: 12, color: 'var(--wr-text-muted)', flexShrink: 0 }} />
                : <ChevronDown style={{ width: 12, height: 12, color: 'var(--wr-text-muted)', flexShrink: 0 }} />
            )}
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && total > 0 && (
        <div style={{ borderTop: '1px solid var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)', padding: '14px 16px 16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left: analyst signal + round shift */}
            <div>
              <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-text-muted)', marginBottom: 8, letterSpacing: '0.08em' }}>
                ANALYST SIGNAL
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {signals.map((sig, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: SIGNAL_CLR[sig.level], flexShrink: 0, marginTop: 4 }} />
                    <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--wr-text-secondary)' }}>{sig.text}</p>
                  </div>
                ))}
              </div>

              {perf.avgSevShift !== null && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--wr-border)' }}>
                  {perf.avgSevShift > 0.1 ? (
                    <>
                      <TrendingUp style={{ width: 13, height: 13, color: '#C0392B', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--wr-text-secondary)' }}>
                        Round 2 tends to <strong style={{ color: '#C0392B' }}>escalate</strong> severity — aggregate risk scores may run higher than initial reads
                      </p>
                    </>
                  ) : perf.avgSevShift < -0.1 ? (
                    <>
                      <TrendingDown style={{ width: 13, height: 13, color: '#27AE60', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--wr-text-secondary)' }}>
                        Round 2 tends to <strong style={{ color: '#27AE60' }}>de-escalate</strong> — may soften the risk picture after group reflection
                      </p>
                    </>
                  ) : (
                    <>
                      <Minus style={{ width: 13, height: 13, color: 'var(--wr-text-muted)', flexShrink: 0, marginTop: 2 }} />
                      <p style={{ fontSize: 11, color: 'var(--wr-text-muted)' }}>Severity stable between rounds — no systematic shift</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Right: severity distribution + metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Severity bar + grid */}
              <div>
                <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>
                  SEVERITY DISTRIBUTION
                </p>
                <div style={{ display: 'flex', height: 10, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  {sevBarData.filter(d => d.value > 0).map(d => (
                    <div key={d.name} style={{ width: `${d.pct}%`, backgroundColor: SEV_COLORS[d.name] }} />
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                  {sevBarData.map(d => (
                    <div key={d.name} style={{ textAlign: 'center', backgroundColor: 'var(--wr-bg-card)', borderRadius: 4, padding: '4px 2px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: SEV_COLORS[d.name] }}>{d.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--wr-text-muted)' }}>{d.name.slice(0, 3)}</div>
                      <div style={{ fontSize: 10, color: 'var(--wr-text-muted)', opacity: 0.6 }}>{d.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 8, borderTop: '1px solid var(--wr-border)' }}>
                {[
                  { label: 'Performance score', value: `${perf.score}/100`, note: '(reliability)', color: scoreColor },
                  { label: 'Engagement', value: `${perf.engagementScore}%`, note: 'of available sessions', color: 'var(--wr-text-secondary)' },
                  { label: 'Revision rate', value: `${perf.revisionRate}%`, note: 'changed R1→R2', color: perf.revisionRate > 40 ? '#D68910' : '#27AE60' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--wr-text-muted)' }}>{m.label}</span>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: m.color, flexShrink: 0 }}>
                      {m.value} <span style={{ fontWeight: 400, color: 'var(--wr-text-muted)', opacity: 0.6 }}>{m.note}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
