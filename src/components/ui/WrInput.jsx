export function WrInput({ label, value, onChange, placeholder, type = 'text', className = '', rows }) {
  const baseStyle = {
    backgroundColor: 'var(--wr-bg-secondary)',
    border: '1px solid var(--wr-border)',
    color: 'var(--wr-text-primary)',
    borderRadius: '0.375rem',
  };
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>{label}</label>}
      {rows ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 text-sm outline-none focus:ring-1 resize-none"
          style={{ ...baseStyle, '--tw-ring-color': 'var(--wr-amber)' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm outline-none focus:ring-1"
          style={baseStyle}
        />
      )}
    </div>
  );
}

export function WrSelect({ label, value, onChange, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1.5 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none focus:ring-1 rounded"
        style={{
          backgroundColor: 'var(--wr-bg-secondary)',
          border: '1px solid var(--wr-border)',
          color: 'var(--wr-text-primary)',
        }}
      >
        {children}
      </select>
    </div>
  );
}