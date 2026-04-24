// ── Severity × Domain matrix with 14d sparklines ───────────────────────────

function FindingsMatrix() {
  const { DOMAINS, MATRIX } = window.DATA;
  const sevs = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  // Find max cell for color intensity scaling
  const allVals = [];
  DOMAINS.forEach(d => sevs.forEach(s => allVals.push(MATRIX[d.id]?.[s] || 0)));
  const maxVal = Math.max(...allVals, 1);

  const cellStyle = (sev, val) => {
    if (val === 0) return { backgroundColor: 'transparent', color: 'var(--wr-text-muted)' };
    const intensity = Math.min(1, val / maxVal);
    const base = SEV_COLOR[sev];
    return {
      backgroundColor: `${base}${Math.round(20 + intensity * 70).toString(16).padStart(2,'0')}`,
      color: val > maxVal * 0.5 ? '#fff' : base,
    };
  };

  const rowTotal = (d) => sevs.reduce((s, sev) => s + (MATRIX[d.id]?.[sev] || 0), 0);
  const colTotal = (sev) => DOMAINS.reduce((s, d) => s + (MATRIX[d.id]?.[sev] || 0), 0);
  const grandTotal = DOMAINS.reduce((s, d) => s + rowTotal(d), 0);

  return (
    <Card>
      <CardHeader
        title="FINDINGS · SEVERITY × DOMAIN · LAST 14 DAYS"
        right={
          <>
            <span className="text-[10px] font-mono" style={{ color: 'var(--wr-text-muted)' }}>{grandTotal} total</span>
            <a href="#" className="text-xs flex items-center gap-1" style={{ color: 'var(--wr-amber)' }}>
              Threat Map <Ico name="arrow-r" size={11} />
            </a>
          </>
        }
      />
      <div className="p-4">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left" style={{ width: '22%' }}>
                <span className="text-[10px] font-mono tracking-[0.1em] font-bold" style={{ color: 'var(--wr-text-muted)' }}>DOMAIN</span>
              </th>
              {sevs.map(s => (
                <th key={s} className="px-1">
                  <div className="flex items-center justify-center">
                    <SevPill sev={s} compact />
                  </div>
                </th>
              ))}
              <th className="text-center">
                <span className="text-[10px] font-mono tracking-[0.1em] font-bold" style={{ color: 'var(--wr-text-muted)' }}>TOTAL</span>
              </th>
              <th className="text-right pl-2">
                <span className="text-[10px] font-mono tracking-[0.1em] font-bold" style={{ color: 'var(--wr-text-muted)' }}>14D TREND</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {DOMAINS.map(d => {
              const rt = rowTotal(d);
              const gap = d.agents === 0;
              return (
                <tr key={d.id}>
                  <td className="py-1">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 3, height: 16, backgroundColor: d.color, borderRadius: 1, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: gap ? 'var(--wr-critical)' : 'var(--wr-text-primary)' }}>
                          {d.name}
                        </p>
                        <p className="text-[10px] font-mono" style={{ color: gap ? 'var(--wr-critical)' : 'var(--wr-text-muted)' }}>
                          {gap ? '⚠ 0 agents' : `${d.agents} agents`}
                        </p>
                      </div>
                    </div>
                  </td>
                  {sevs.map(s => {
                    const v = MATRIX[d.id]?.[s] || 0;
                    return (
                      <td key={s} className="text-center font-mono text-xs font-semibold rounded"
                        style={{ height: 36, ...cellStyle(s, v) }}>
                        {v || '·'}
                      </td>
                    );
                  })}
                  <td className="text-center">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--wr-text-primary)' }}>{rt}</span>
                  </td>
                  <td className="pl-2" style={{ width: 80 }}>
                    <div className="flex justify-end">
                      <Sparkline data={MATRIX[d.id].spark} color={d.color} width={72} height={18} />
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="pt-2 border-t" style={{ borderColor: 'var(--wr-border)' }}>
                <span className="text-[10px] font-mono tracking-[0.1em] font-bold" style={{ color: 'var(--wr-text-muted)' }}>COL TOTAL</span>
              </td>
              {sevs.map(s => (
                <td key={s} className="pt-2 text-center border-t" style={{ borderColor: 'var(--wr-border)' }}>
                  <span className="font-mono text-xs font-bold" style={{ color: SEV_COLOR[s] }}>{colTotal(s)}</span>
                </td>
              ))}
              <td className="pt-2 text-center border-t" style={{ borderColor: 'var(--wr-border)' }}>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--wr-amber)' }}>{grandTotal}</span>
              </td>
              <td className="pt-2 border-t" style={{ borderColor: 'var(--wr-border)' }}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

window.FindingsMatrix = FindingsMatrix;
