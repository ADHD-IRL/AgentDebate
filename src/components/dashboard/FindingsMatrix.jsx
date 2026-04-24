import { Link } from 'react-router-dom';
import { Card, CardHeader, Sparkline, SEV_COLOR, AmberLink } from './atoms';

const SEVS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

function cellStyle(val, maxVal, sev) {
  if (val === 0) return { backgroundColor: 'transparent', color: 'var(--wr-text-muted)' };
  const intensity = 0.125 + (val / Math.max(maxVal, 1)) * 0.375;
  const hex = SEV_COLOR[sev];
  const textColor = intensity > 0.5 ? '#fff' : SEV_COLOR[sev];
  return {
    backgroundColor: `${hex}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
    color: textColor,
    fontWeight: 700,
  };
}

export default function FindingsMatrix({ matrix = [], domainMap = {}, totalFindings = 0 }) {
  if (!matrix.length) {
    return (
      <Card>
        <CardHeader title="Findings · Severity × Domain · Last 14 days" right={<AmberLink to="/threatmap">Threat Map →</AmberLink>} />
        <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--wr-text-muted)', fontSize: 12 }}>
          No findings yet — complete a session to see the matrix.
        </div>
      </Card>
    );
  }

  const colTotals = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  matrix.forEach(row => SEVS.forEach(s => { colTotals[s] += row[s] || 0; }));
  const maxCell = Math.max(...matrix.flatMap(row => SEVS.map(s => row[s] || 0)), 1);

  const headerCell = (text, color) => (
    <th style={{
      padding: '7px 8px', fontSize: 9.5,
      fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
      letterSpacing: '0.08em', color: color || 'var(--wr-text-muted)',
      borderBottom: '1px solid var(--wr-border)', textAlign: 'center',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </th>
  );

  return (
    <Card>
      <CardHeader
        title={`Findings · Severity × Domain · Last 14 days`}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-amber)', fontWeight: 700 }}>
              {totalFindings} total
            </span>
            <AmberLink to="/threatmap">Threat Map →</AmberLink>
          </div>
        }
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 2, padding: '4px 8px' }}>
          <thead>
            <tr>
              {headerCell('DOMAIN', null)}
              {SEVS.map(s => headerCell(s, SEV_COLOR[s]))}
              {headerCell('TOTAL', null)}
              {headerCell('14D TREND', null)}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => {
              const domain   = domainMap[row.domain_id] || {};
              const domColor = domain.color || '#8A9BB5';
              const rowTotal = SEVS.reduce((s, k) => s + (row[k] || 0), 0);
              const noAgents = (domain.agentCount || 0) === 0;

              return (
                <tr key={i}>
                  {/* Domain cell */}
                  <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 3, height: 16, borderRadius: 2, backgroundColor: domColor, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: noAgents ? 'var(--wr-critical)' : 'var(--wr-text-primary)', whiteSpace: 'nowrap' }}>
                          {domain.name || row.domain_id || 'Unknown'}
                        </span>
                        <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: noAgents ? 'var(--wr-critical)' : 'var(--wr-text-muted)' }}>
                          {noAgents ? '⚠ 0 agents' : `${domain.agentCount} agent${domain.agentCount !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Severity cells */}
                  {SEVS.map(sev => {
                    const val = row[sev] || 0;
                    const cs  = cellStyle(val, maxCell, sev);
                    return (
                      <td key={sev} style={{ padding: '2px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{
                          height: 32, minWidth: 36, borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                          ...cs,
                        }}>
                          {val === 0 ? <span style={{ color: 'var(--wr-text-muted)', fontWeight: 400 }}>·</span> : val}
                        </div>
                      </td>
                    );
                  })}

                  {/* Row total */}
                  <td style={{ padding: '2px 8px', textAlign: 'center', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-text-primary)' }}>
                    {rowTotal}
                  </td>

                  {/* Sparkline */}
                  <td style={{ padding: '2px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Sparkline data={row.spark || []} color={domColor} width={72} height={18} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer totals row */}
          <tfoot>
            <tr style={{ borderTop: '1px solid var(--wr-border)' }}>
              <td style={{ padding: '8px 8px', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--wr-text-muted)' }}>
                COL TOTAL
              </td>
              {SEVS.map(s => (
                <td key={s} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: SEV_COLOR[s] }}>
                  {colTotals[s]}
                </td>
              ))}
              <td style={{ padding: '8px 8px', textAlign: 'center', fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-amber)' }}>
                {totalFindings}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
