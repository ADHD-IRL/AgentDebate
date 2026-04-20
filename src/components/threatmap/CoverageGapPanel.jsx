import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-react';

const SEV_COLORS = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const SEV_WEIGHT = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CoverageGapPanel({ threats, agents }) {
  const analysis = useMemo(() => {
    const disciplines = [...new Set(agents.map(a => a.discipline).filter(Boolean))];
    const categories = [...new Set(threats.map(t => t.category || 'Uncategorized'))];

    // Disciplines with zero linked threats → gaps
    const uncoveredDisciplines = disciplines.filter(disc => {
      const discAgents = agents.filter(a => a.discipline === disc);
      const domainIds = new Set(discAgents.map(a => a.domain_id).filter(Boolean));
      return threats.filter(t => !t.domain_id || domainIds.has(t.domain_id)).length === 0;
    });

    // Per-discipline load: count + weighted risk score
    const loadMap = disciplines.map(disc => {
      const discAgents = agents.filter(a => a.discipline === disc);
      const domainIds = new Set(discAgents.map(a => a.domain_id).filter(Boolean));
      const rel = threats.filter(t => !t.domain_id || domainIds.has(t.domain_id));
      const score = rel.reduce((s, t) => s + (SEV_WEIGHT[t.severity] || 1), 0);
      return {
        disc,
        count: rel.length,
        score,
        critical: rel.filter(t => t.severity === 'CRITICAL').length,
        high: rel.filter(t => t.severity === 'HIGH').length,
      };
    }).sort((a, b) => b.score - a.score);

    const hotspots = loadMap.filter(d => d.critical > 0 || d.score > 6);
    const lowRisk = loadMap.filter(d => d.count > 0 && d.critical === 0 && d.high === 0);

    // Threat categories with no agent coverage
    const uncoveredCategories = categories.filter(cat => {
      const catThreats = threats.filter(t => (t.category || 'Uncategorized') === cat);
      return !catThreats.some(t => {
        if (!t.domain_id) return true;
        return agents.some(a => a.domain_id === t.domain_id);
      });
    });

    return { uncoveredDisciplines, hotspots, lowRisk, uncoveredCategories, loadMap };
  }, [threats, agents]);

  return (
    <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
          COVERAGE GAP ANALYSIS
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {/* Hotspots */}
        <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(192,57,43,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: SEV_COLORS.CRITICAL }} />
            <span className="text-xs font-bold font-mono" style={{ color: SEV_COLORS.CRITICAL }}>HIGH-RISK ZONES</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>
            Disciplines with critical threats or high overall threat load
          </p>
          {analysis.hotspots.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--wr-text-muted)' }}>No high-risk disciplines detected</p>
          ) : (
            <div className="space-y-2">
              {analysis.hotspots.map(h => (
                <div key={h.disc} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1" title={h.disc} style={{ color: 'var(--wr-text-secondary)' }}>
                    {h.disc}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {h.critical > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-mono font-bold"
                        style={{ backgroundColor: hexToRgba(SEV_COLORS.CRITICAL, 0.2), color: SEV_COLORS.CRITICAL }}
                      >
                        {h.critical} CRIT
                      </span>
                    )}
                    <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                      {h.count} total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coverage Gaps */}
        <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(214,137,16,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 flex-shrink-0" style={{ color: SEV_COLORS.HIGH }} />
            <span className="text-xs font-bold font-mono" style={{ color: SEV_COLORS.HIGH }}>COVERAGE GAPS</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>
            Disciplines and categories with no threats mapped to them
          </p>
          {analysis.uncoveredDisciplines.length === 0 && analysis.uncoveredCategories.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--wr-text-muted)' }}>All disciplines have threat coverage</p>
          ) : (
            <div className="space-y-2">
              {analysis.uncoveredDisciplines.length > 0 && (
                <>
                  <p className="text-xs font-bold font-mono" style={{ color: 'var(--wr-text-muted)' }}>UNTHREATENED DISCIPLINES</p>
                  {analysis.uncoveredDisciplines.map(d => (
                    <div key={d} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEV_COLORS.HIGH }} />
                      <span className="text-xs truncate" title={d} style={{ color: 'var(--wr-text-secondary)' }}>{d}</span>
                    </div>
                  ))}
                </>
              )}
              {analysis.uncoveredCategories.length > 0 && (
                <>
                  <p className="text-xs font-bold font-mono mt-2" style={{ color: 'var(--wr-text-muted)' }}>UNASSIGNED CATEGORIES</p>
                  {analysis.uncoveredCategories.map(c => (
                    <div key={c} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEV_COLORS.HIGH }} />
                      <span className="text-xs truncate" title={c} style={{ color: 'var(--wr-text-secondary)' }}>{c}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Low-Risk Zones */}
        <div className="rounded p-4" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(39,174,96,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: SEV_COLORS.LOW }} />
            <span className="text-xs font-bold font-mono" style={{ color: SEV_COLORS.LOW }}>LOW-RISK ZONES</span>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>
            Disciplines with threats but no critical or high-severity items
          </p>
          {analysis.lowRisk.length === 0 ? (
            <p className="text-xs italic" style={{ color: 'var(--wr-text-muted)' }}>No low-risk zones yet</p>
          ) : (
            <div className="space-y-2">
              {analysis.lowRisk.map(h => (
                <div key={h.disc} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1" title={h.disc} style={{ color: 'var(--wr-text-secondary)' }}>{h.disc}</span>
                  <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--wr-text-muted)' }}>{h.count} threats</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Discipline Risk Score Ranking */}
      <div className="pt-4 border-t" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-bold font-mono" style={{ color: 'var(--wr-text-muted)' }}>
            DISCIPLINE RISK SCORE RANKING
          </p>
          <div className="relative group">
            <Info className="w-3.5 h-3.5 cursor-help" style={{ color: 'var(--wr-text-muted)' }} />
            <div
              className="absolute left-5 top-0 z-20 rounded px-3 py-2 text-xs font-mono hidden group-hover:block pointer-events-none"
              style={{
                backgroundColor: 'var(--wr-bg-card)',
                border: '1px solid var(--wr-border)',
                minWidth: '220px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                color: 'var(--wr-text-secondary)',
              }}
            >
              Risk score weights threats by severity:<br />
              <span style={{ color: SEV_COLORS.CRITICAL }}>CRITICAL × 4</span> ·{' '}
              <span style={{ color: SEV_COLORS.HIGH }}>HIGH × 3</span> ·{' '}
              <span style={{ color: SEV_COLORS.MEDIUM }}>MEDIUM × 2</span> ·{' '}
              <span style={{ color: SEV_COLORS.LOW }}>LOW × 1</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {analysis.loadMap.filter(d => d.count > 0).map((d, i) => {
            const maxScore = analysis.loadMap[0]?.score || 1;
            const pct = (d.score / maxScore) * 100;
            const barColor = d.critical > 0
              ? SEV_COLORS.CRITICAL
              : d.high > 0
              ? SEV_COLORS.HIGH
              : SEV_COLORS.MEDIUM;
            return (
              <div key={d.disc} className="flex items-center gap-3">
                <span
                  className="text-xs font-mono w-5 text-right flex-shrink-0"
                  style={{ color: 'var(--wr-text-muted)' }}
                >
                  {i + 1}
                </span>
                <span
                  className="text-xs w-36 truncate flex-shrink-0"
                  title={d.disc}
                  style={{ color: 'var(--wr-text-secondary)' }}
                >
                  {d.disc}
                </span>
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--wr-border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
                  <span style={{ color: 'var(--wr-text-primary)' }}>{d.count} threats</span>
                  <span
                    className="px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: hexToRgba(barColor, 0.15), color: barColor }}
                  >
                    score {d.score}
                  </span>
                </div>
              </div>
            );
          })}
          {analysis.loadMap.filter(d => d.count > 0).length === 0 && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--wr-text-muted)' }}>
              No threats ranked yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
