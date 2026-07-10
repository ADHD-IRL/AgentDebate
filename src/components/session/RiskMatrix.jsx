import { useMemo, useState, Fragment } from 'react';
import { matrixCellColor, riskScore, likelihoodLabel, impactLabel, expectedExposure } from '@/lib/risk';

// 5×5 likelihood × impact risk matrix plotting each agent's assessment for a
// round. Likelihood on Y (5 at top), Impact on X (5 at right).
export default function RiskMatrix({ sessionAgents, agents, round }) {
  const [hover, setHover] = useState(null);

  const agentMap = useMemo(() => Object.fromEntries((agents || []).map(a => [a.id, a])), [agents]);

  const points = useMemo(() => {
    return (sessionAgents || []).map(sa => {
      const l = round === 1 ? sa.round1_likelihood : sa.round2_likelihood;
      const i = round === 1 ? sa.round1_impact : sa.round2_impact;
      const conf = round === 1 ? sa.round1_confidence : sa.round2_confidence;
      if (!l || !i) return null;
      const agent = agentMap[sa.agent_id];
      return { l, i, conf, name: agent?.name || 'SME', discipline: agent?.discipline || '' };
    }).filter(Boolean);
  }, [sessionAgents, agentMap, round]);

  // Aggregate exposure: confidence-weighted sum, and the single highest cell
  const summary = useMemo(() => {
    if (!points.length) return null;
    const exposures = points.map(p => expectedExposure(p.l, p.i, p.conf) || 0);
    const peak = Math.max(...points.map(p => riskScore(p.l, p.i)));
    const avgExposure = Math.round((exposures.reduce((a, b) => a + b, 0) / points.length) * 10) / 10;
    return { peak, avgExposure, count: points.length };
  }, [points]);

  if (!points.length) {
    return (
      <div className="rounded p-4 text-center text-xs" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-muted)' }}>
        No quantified likelihood × impact yet for this round. Generate assessments to populate the risk matrix.
      </div>
    );
  }

  // Bucket agents per cell
  const cellPoints = {};
  points.forEach(p => {
    const key = `${p.l}-${p.i}`;
    (cellPoints[key] = cellPoints[key] || []).push(p);
  });

  const rows = [5, 4, 3, 2, 1]; // likelihood, top-down
  const cols = [1, 2, 3, 4, 5]; // impact, left-right

  return (
    <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
            RISK MATRIX — LIKELIHOOD × IMPACT
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
            Each dot is an SME's rating for their top {round === 1 ? 'Round 1' : 'Round 2'} risk
          </p>
        </div>
        {summary && (
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>PEAK RISK</p>
              <p className="text-lg font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>{summary.peak}<span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>/25</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>AVG EXPOSURE</p>
              <p className="text-lg font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }} title="Confidence-weighted average risk score">{summary.avgExposure}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {/* Y axis label */}
        <div className="flex items-center">
          <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            LIKELIHOOD →
          </span>
        </div>

        <div className="flex-1">
          <div className="grid" style={{ gridTemplateColumns: 'auto repeat(5, 1fr)', gap: 3 }}>
            {rows.map(l => (
              <Fragment key={`row-${l}`}>
                <div className="flex items-center justify-end pr-1">
                  <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{l}</span>
                </div>
                {cols.map(i => {
                  const key = `${l}-${i}`;
                  const pts = cellPoints[key] || [];
                  const bg = matrixCellColor(l, i);
                  const isHover = hover === key;
                  return (
                    <div
                      key={key}
                      onMouseEnter={() => pts.length && setHover(key)}
                      onMouseLeave={() => setHover(null)}
                      className="relative rounded flex items-center justify-center"
                      style={{
                        aspectRatio: '1.6', backgroundColor: `${bg}22`,
                        border: `1px solid ${bg}${pts.length ? '99' : '33'}`,
                        outline: isHover ? `2px solid ${bg}` : 'none',
                      }}
                    >
                      {pts.length > 0 && (
                        <span className="text-sm font-bold font-mono" style={{ color: bg }}>{pts.length}</span>
                      )}
                      {isHover && (
                        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-1 rounded p-2 w-48 pointer-events-none"
                          style={{ backgroundColor: 'var(--wr-bg-card)', border: `1px solid ${bg}`, boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}>
                          <p className="text-xs font-mono mb-1" style={{ color: bg }}>
                            {likelihoodLabel(l)} × {impactLabel(i)} = {riskScore(l, i)}
                          </p>
                          {pts.map((p, idx) => (
                            <p key={idx} className="text-xs truncate" style={{ color: 'var(--wr-text-secondary)' }}>
                              {p.name}{p.conf != null ? ` · ${p.conf}%` : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
            {/* X axis numbers */}
            <div />
            {cols.map(i => (
              <div key={`xnum-${i}`} className="text-center">
                <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{i}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs font-mono mt-1" style={{ color: 'var(--wr-text-muted)' }}>IMPACT →</p>
        </div>
      </div>
    </div>
  );
}
