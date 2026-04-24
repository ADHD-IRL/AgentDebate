import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, Avatar, SEV_COLOR } from './atoms';

function DomainBar({ domain, maxSessions }) {
  const pct      = maxSessions > 0 ? Math.round((domain.sessions / maxSessions) * 100) : 0;
  const hasGap   = domain.agentCount === 0;
  const color    = hasGap ? SEV_COLOR.CRITICAL : (domain.color || 'var(--wr-amber)');

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 3, height: 12, borderRadius: 2, backgroundColor: color, flexShrink: 0 }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: hasGap ? SEV_COLOR.CRITICAL : 'var(--wr-text-primary)', flex: 1 }}>
          {domain.name}
        </span>
        {hasGap && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: SEV_COLOR.CRITICAL }}>
            <AlertTriangle style={{ width: 9, height: 9 }} />
            NO AGENTS
          </span>
        )}
        <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>
          {domain.sessions}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, backgroundColor: 'var(--wr-border)' }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${pct}%`,
          backgroundColor: color,
          transition: 'width 0.4s',
          opacity: hasGap ? 0.4 : 1,
        }} />
      </div>
      {!hasGap && (
        <div style={{ fontSize: 9.5, color: 'var(--wr-text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
          {domain.agentCount} agent{domain.agentCount !== 1 ? 's' : ''} · {domain.openFindings ?? 0} open
        </div>
      )}
    </div>
  );
}

export default function CoveragePanel({ domains = [], analysts = [] }) {
  const gaps       = domains.filter(d => d.agentCount === 0);
  const maxSessions = Math.max(...domains.map(d => d.sessions || 0), 1);
  const topAnalysts = analysts.slice(0, 5);

  return (
    <Card>
      <CardHeader title="Coverage" />
      <div style={{ padding: '12px 16px' }}>

        {/* Gap warning banner */}
        {gaps.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 10px', borderRadius: 5, marginBottom: 12,
            backgroundColor: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.25)',
          }}>
            <AlertTriangle style={{ width: 12, height: 12, color: SEV_COLOR.CRITICAL, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: SEV_COLOR.CRITICAL, fontWeight: 600 }}>
              {gaps.length} domain{gaps.length !== 1 ? 's' : ''} with no agents assigned
            </span>
          </div>
        )}

        {/* Domain bars */}
        {domains.length === 0 ? (
          <div style={{ color: 'var(--wr-text-muted)', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>
            No domains configured.
          </div>
        ) : (
          domains.map((d, i) => <DomainBar key={d.id || i} domain={d} maxSessions={maxSessions} />)
        )}

        {/* Analysts section */}
        {topAnalysts.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid var(--wr-border)', margin: '12px 0 10px', paddingTop: 10 }}>
              <span style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.07em', color: 'var(--wr-text-muted)' }}>
                TOP ANALYSTS
              </span>
            </div>
            {topAnalysts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < topAnalysts.length - 1 ? 7 : 0 }}>
                <Avatar name={a.name} size={22} />
                <span style={{ fontSize: 11.5, color: 'var(--wr-text-primary)', flex: 1 }}>{a.name}</span>
                <span style={{ fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>
                  {a.sessionCount} session{a.sessionCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}
