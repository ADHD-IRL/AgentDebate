const vectors = {
  human:     { label: 'Human',     color: '#C0392B' },
  technical: { label: 'Technical', color: '#2E86AB' },
  physical:  { label: 'Physical',  color: '#27AE60' },
  futures:   { label: 'Futures',   color: '#7B2D8B' },
};

export function VectorBar({ type, value }) {
  const v = vectors[type];
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        {v.label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--wr-border)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value || 0}%`, backgroundColor: v.color }} />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
        {value || 0}
      </span>
    </div>
  );
}

export function VectorBars({ agent }) {
  return (
    <div className="space-y-1.5">
      {['human', 'technical', 'physical', 'futures'].map(t => (
        <VectorBar key={t} type={t} value={agent[`vector_${t}`]} />
      ))}
    </div>
  );
}