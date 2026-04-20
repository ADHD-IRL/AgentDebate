import { getPosture } from '@/lib/scrsEngine';

export default function RiskBreakdownCard({ breakdown, scrs, previousScrs }) {
  const posture = getPosture(scrs);
  const delta   = previousScrs !== undefined ? scrs - previousScrs : null;

  const Row = ({ label, value, note, color }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-0"
      style={{ borderColor: 'var(--wr-border)' }}>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--wr-text-secondary)' }}>{label}</p>
        {note && <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{note}</p>}
      </div>
      <span className="text-sm font-bold font-mono" style={{ color: color || 'var(--wr-text-primary)' }}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="rounded-lg overflow-hidden"
      style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--wr-border)' }}>
        <p className="text-xs font-bold tracking-widest font-mono"
          style={{ color: 'var(--wr-text-muted)' }}>RISK BREAKDOWN</p>
        {delta !== null && delta !== 0 && (
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded"
            style={{
              color: delta < 0 ? '#27AE60' : '#C0392B',
              backgroundColor: delta < 0 ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
            }}>
            {delta > 0 ? '+' : ''}{delta} pts
          </span>
        )}
      </div>
      <div className="px-4 divide-y" style={{ divideColor: 'var(--wr-border)' }}>
        <Row
          label="Base Score"
          note={`${breakdown?.agentCount || 0} agent findings, expertise-weighted`}
          value={`${breakdown?.baseScore ?? 0}`}
          color="var(--wr-text-primary)"
        />
        <Row
          label="Chain Resilience"
          note="Brittle chains reduce score"
          value={`${breakdown?.resilienceModifier ?? 0}`}
          color={breakdown?.resilienceModifier < 0 ? '#27AE60' : 'var(--wr-text-muted)'}
        />
        <Row
          label="Countermeasure Coverage"
          note={`${breakdown?.coveredHighSteps ?? 0} / ${breakdown?.totalHighSteps ?? 0} HIGH-leverage steps covered`}
          value={`${breakdown?.countermeasureModifier ?? 0}`}
          color={breakdown?.countermeasureModifier < 0 ? '#27AE60' : 'var(--wr-text-muted)'}
        />
        <div className="flex items-center justify-between py-3">
          <p className="text-sm font-bold" style={{ color: 'var(--wr-text-primary)' }}>
            SCRS
          </p>
          <span className="text-xl font-bold font-mono" style={{ color: posture.color }}>
            {scrs} / 100
          </span>
        </div>
      </div>
    </div>
  );
}
