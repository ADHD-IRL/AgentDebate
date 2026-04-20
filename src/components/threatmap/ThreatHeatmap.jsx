import { useMemo, useState, useCallback } from 'react';

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const SEV_COLORS = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
const TOOLTIP_W = 340;
const TOOLTIP_H = 360; // conservative max height estimate

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

export default function ThreatHeatmap({ threats, agents, domains }) {
  const [hovered, setHovered] = useState(null); // { disc, cat }
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = e.clientX + 18;
    const y = e.clientY + 18;
    setTooltipPos({
      x: x + TOOLTIP_W > vw ? e.clientX - TOOLTIP_W - 10 : x,
      y: y + TOOLTIP_H > vh ? e.clientY - TOOLTIP_H - 10 : y,
    });
  }, []);

  const disciplines = useMemo(() => {
    const set = new Set(agents.map(a => a.discipline).filter(Boolean));
    return Array.from(set).sort();
  }, [agents]);

  const categories = useMemo(() => {
    const set = new Set(threats.map(t => t.category || 'Uncategorized'));
    return Array.from(set).sort();
  }, [threats]);

  // Build heatmap: each cell tracks count, maxSev, per-severity counts, and threat names
  const heatData = useMemo(() => {
    const map = {};
    disciplines.forEach(disc => {
      map[disc] = {};
      categories.forEach(cat => {
        map[disc][cat] = { count: 0, maxSev: null, severities: {}, threatList: [] };
      });
    });

    threats.forEach(threat => {
      const cat = threat.category || 'Uncategorized';
      const sev = threat.severity || 'MEDIUM';
      const matchedAgents = agents.filter(a => !threat.domain_id || a.domain_id === threat.domain_id);
      const discs = matchedAgents.length > 0
        ? [...new Set(matchedAgents.map(a => a.discipline).filter(Boolean))]
        : ['Uncategorized'];

      discs.forEach(disc => {
        if (!map[disc]) map[disc] = {};
        if (!map[disc][cat]) map[disc][cat] = { count: 0, maxSev: null, severities: {}, threatList: [] };
        map[disc][cat].count++;
        map[disc][cat].severities[sev] = (map[disc][cat].severities[sev] || 0) + 1;
        map[disc][cat].threatList.push({ name: threat.name || 'Unnamed', severity: sev });
        const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        if (!map[disc][cat].maxSev || sevOrder.indexOf(sev) < sevOrder.indexOf(map[disc][cat].maxSev)) {
          map[disc][cat].maxSev = sev;
        }
      });
    });
    return map;
  }, [threats, agents, disciplines, categories]);

  const maxCount = useMemo(() => {
    let m = 0;
    disciplines.forEach(d => categories.forEach(c => {
      if (heatData[d]?.[c]?.count > m) m = heatData[d][c].count;
    }));
    return Math.max(m, 1);
  }, [heatData, disciplines, categories]);

  const discTotals = useMemo(() => {
    const t = {};
    disciplines.forEach(disc => {
      t[disc] = categories.reduce((s, cat) => s + (heatData[disc]?.[cat]?.count || 0), 0);
    });
    return t;
  }, [heatData, disciplines, categories]);

  const catTotals = useMemo(() => {
    const t = {};
    categories.forEach(cat => {
      t[cat] = disciplines.reduce((s, disc) => s + (heatData[disc]?.[cat]?.count || 0), 0);
    });
    return t;
  }, [heatData, disciplines, categories]);

  // Use rgba background so text stays fully opaque at all intensity levels
  const getCellBg = (disc, cat) => {
    const cell = heatData[disc]?.[cat];
    if (!cell || cell.count === 0) return 'transparent';
    const intensity = 0.15 + (cell.count / maxCount) * 0.65;
    return hexToRgba(SEV_COLORS[cell.maxSev], intensity);
  };

  const hoveredCell = hovered ? heatData[hovered.disc]?.[hovered.cat] : null;

  return (
    <div>
      {/* Header + Legend */}
      <div className="mb-4 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
            THREAT CONCENTRATION HEATMAP
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>
            Rows = agent disciplines · Columns = threat categories · Color = highest severity · Intensity = volume
          </p>
        </div>
        <div className="flex items-center flex-wrap gap-4">
          {SEVERITIES.map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: SEV_COLORS[s] }} />
              <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{s}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pl-3" style={{ borderLeft: '1px solid var(--wr-border)' }}>
            <div className="w-16 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, rgba(46,134,171,0.15), rgba(46,134,171,0.8))' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>low → high volume</span>
          </div>
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--wr-border)', backgroundColor: 'var(--wr-bg-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th
                  className="text-left px-4 py-3 text-xs font-mono font-bold sticky left-0 z-10"
                  style={{
                    color: 'var(--wr-text-muted)',
                    backgroundColor: 'var(--wr-bg-card)',
                    borderBottom: '1px solid var(--wr-border)',
                    borderRight: '1px solid var(--wr-border)',
                    minWidth: '160px',
                    maxWidth: '200px',
                  }}
                >
                  DISCIPLINE
                </th>
                {categories.map(cat => (
                  <th
                    key={cat}
                    title={cat}
                    className="px-2 py-2 text-center"
                    style={{
                      backgroundColor: 'var(--wr-bg-card)',
                      borderBottom: '1px solid var(--wr-border)',
                      borderLeft: '1px solid var(--wr-border)',
                      minWidth: '80px',
                      maxWidth: '130px',
                    }}
                  >
                    <div
                      className="text-xs font-mono font-bold mx-auto"
                      style={{
                        color: 'var(--wr-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px',
                      }}
                    >
                      {cat}
                    </div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                      {catTotals[cat]} threat{catTotals[cat] !== 1 ? 's' : ''}
                    </div>
                  </th>
                ))}
                <th
                  className="px-3 py-3 text-center text-xs font-mono font-bold"
                  style={{
                    color: 'var(--wr-text-muted)',
                    backgroundColor: 'var(--wr-bg-card)',
                    borderBottom: '1px solid var(--wr-border)',
                    borderLeft: '2px solid var(--wr-border)',
                    minWidth: '64px',
                  }}
                >
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {disciplines.map((disc) => (
                <tr key={disc} style={{ borderTop: '1px solid var(--wr-border)' }}>
                  <td
                    title={disc}
                    className="px-4 py-2 text-xs font-mono font-medium sticky left-0 z-10"
                    style={{
                      color: 'var(--wr-text-secondary)',
                      backgroundColor: 'var(--wr-bg-card)',
                      borderRight: '1px solid var(--wr-border)',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {disc}
                  </td>
                  {categories.map(cat => {
                    const cell = heatData[disc]?.[cat];
                    const isActive = hovered?.disc === disc && hovered?.cat === cat;
                    return (
                      <td
                        key={cat}
                        className="px-1 py-1.5 text-center cursor-default"
                        style={{ borderLeft: '1px solid rgba(255,255,255,0.04)' }}
                        onMouseEnter={() => setHovered({ disc, cat })}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <div
                          className="mx-1 rounded flex items-center justify-center transition-all duration-150"
                          style={{
                            height: '34px',
                            backgroundColor: getCellBg(disc, cat),
                            outline: isActive ? '2px solid rgba(240,165,0,0.7)' : '2px solid transparent',
                            outlineOffset: '1px',
                          }}
                        >
                          {cell?.count > 0 && (
                            <span
                              className="text-sm font-bold font-mono"
                              style={{ color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                            >
                              {cell.count}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className="px-3 py-2 text-center"
                    style={{ borderLeft: '2px solid var(--wr-border)' }}
                  >
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: discTotals[disc] > 0 ? 'var(--wr-text-primary)' : 'var(--wr-text-muted)' }}
                    >
                      {discTotals[disc] || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {disciplines.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--wr-text-muted)' }}>
            No agent disciplines defined. Add agents with disciplines to populate the heatmap.
          </div>
        )}
      </div>

      {/* Floating tooltip — fixed position, follows cursor, never clipped by table overflow */}
      {hoveredCell && hoveredCell.count > 0 && (
        <div
          className="rounded p-3 pointer-events-none"
          style={{
            position: 'fixed',
            left: tooltipPos.x,
            top: tooltipPos.y,
            width: TOOLTIP_W,
            zIndex: 9999,
            backgroundColor: 'var(--wr-bg-card)',
            border: '1px solid rgba(240,165,0,0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="mb-2 pb-2" style={{ borderBottom: '1px solid var(--wr-border)' }}>
            <p className="text-xs font-bold font-mono" style={{ color: 'var(--wr-amber)' }}>
              {hovered.disc}
            </p>
            <p className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>
              {hovered.cat}
            </p>
          </div>

          {/* Severity breakdown */}
          <div className="flex items-center gap-3 mb-2">
            {SEVERITIES.map(s => hoveredCell.severities[s] > 0 && (
              <div key={s} className="text-center">
                <div className="text-sm font-bold font-mono" style={{ color: SEV_COLORS[s] }}>
                  {hoveredCell.severities[s]}
                </div>
                <div className="text-xs font-mono leading-none mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                  {s.slice(0, 4)}
                </div>
              </div>
            ))}
            <div className="ml-auto text-center">
              <div className="text-sm font-bold font-mono" style={{ color: 'var(--wr-text-primary)' }}>
                {hoveredCell.count}
              </div>
              <div className="text-xs font-mono leading-none mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                TOTAL
              </div>
            </div>
          </div>

          {/* Threat list — full titles, scrollable */}
          {hoveredCell.threatList.length > 0 && (
            <div className="pt-2" style={{ borderTop: '1px solid var(--wr-border)' }}>
              <p className="text-xs font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                THREATS ({hoveredCell.threatList.length})
              </p>
              <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 180 }}>
                {hoveredCell.threatList.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="flex-shrink-0 rounded-sm mt-0.5"
                      style={{
                        width: 3,
                        height: 12,
                        backgroundColor: SEV_COLORS[t.severity],
                      }}
                    />
                    <span
                      className="text-xs leading-snug"
                      style={{ color: 'var(--wr-text-secondary)' }}
                    >
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
