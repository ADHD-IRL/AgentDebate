import { Link } from 'react-router-dom';
import { Card, CardHeader, Avatar, SEV_COLOR } from './atoms';

function CoverageBar({ domain }) {
  const covered = domain.agentCount > 0;
  const load    = Math.min(1, domain.agentCount / 3);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
      <span style={{ width: 3, height: 20, backgroundColor: domain.color || 'var(--wr-amber)', borderRadius: 1, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: covered ? 'var(--wr-text-primary)' : SEV_COLOR.CRITICAL, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {domain.name}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: covered ? 'var(--wr-text-muted)' : SEV_COLOR.CRITICAL, flexShrink: 0, marginLeft: 6 }}>
            {domain.agentCount} {domain.agentCount === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(138,155,181,0.1)' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: covered ? `${load * 100}%` : '100%',
            backgroundColor: covered ? (domain.color || 'var(--wr-amber)') : SEV_COLOR.CRITICAL,
            opacity: covered ? 1 : 0.35,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>
    </div>
  );
}

export default function CoveragePanel({ domains = [] }) {
  const gaps    = domains.filter(d => d.agentCount === 0);
  const covered = domains.length - gaps.length;

  return (
    <Card>
      <CardHeader
        title="Coverage & Workload"
        right={
          <Link to="/agents" style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-amber)', textDecoration: 'none' }}>
            Details →
          </Link>
        }
      />
      <div style={{ padding: '12px 16px' }}>

        {/* Coverage stat */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 24, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, lineHeight: 1, color: gaps.length > 0 ? SEV_COLOR.CRITICAL : SEV_COLOR.LOW }}>
              {covered} / {domains.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--wr-text-muted)', marginTop: 3 }}>domains covered</div>
          </div>
          {gaps.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: SEV_COLOR.CRITICAL }}>
                {gaps.length} GAP{gaps.length !== 1 ? 'S' : ''}
              </div>
              <div style={{ fontSize: 10, color: 'var(--wr-text-muted)', marginTop: 2 }}>need agents</div>
            </div>
          )}
        </div>

        {/* Domain bars */}
        {domains.length === 0 ? (
          <div style={{ color: 'var(--wr-text-muted)', fontSize: 11, textAlign: 'center', padding: '16px 0' }}>
            No domains configured.
          </div>
        ) : (
          domains.map((d, i) => <CoverageBar key={d.id || i} domain={d} />)
        )}

      </div>
    </Card>
  );
}
