export default function BulkOperations({ selected, onArchive, onDelete, onExport, onPromote, onClear }) {
  if (!selected?.length) return null;

  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 20,
      backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-amber)',
      borderRadius: 6, padding: '10px 16px', margin: '0 0 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--wr-amber)', flexShrink: 0 }}>
        {selected.length} SELECTED
      </span>
      <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onPromote && (
          <BulkBtn onClick={() => onPromote(selected)} color="var(--wr-amber)">Promote to Library</BulkBtn>
        )}
        {onExport && (
          <BulkBtn onClick={() => onExport(selected)} color="#4EA8DE">Export JSON</BulkBtn>
        )}
        {onArchive && (
          <BulkBtn onClick={() => onArchive(selected)} color="#888">Archive</BulkBtn>
        )}
        {onDelete && (
          <BulkBtn onClick={() => onDelete(selected)} color="#C0392B">Delete</BulkBtn>
        )}
      </div>
      <button onClick={onClear} style={{ background: 'none', border: 'none', color: 'var(--wr-text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

function BulkBtn({ onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 4, border: `1px solid ${color}30`,
        backgroundColor: `${color}12`, color, cursor: 'pointer',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
