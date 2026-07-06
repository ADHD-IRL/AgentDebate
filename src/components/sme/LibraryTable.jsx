import { useState } from 'react';

const SORT_OPTIONS = [
  { value: 'quality_score', label: 'Quality ↓' },
  { value: 'usage_count', label: 'Usage ↓' },
  { value: '-created_at', label: 'Newest' },
  { value: 'name', label: 'Name A→Z' },
];

export default function LibraryTable({ smes = [], loading, selected = [], onSelect, onRowClick, onPromote, onArchive, onDelete, onClone }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sort, setSort] = useState('quality_score');

  const filtered = smes
    .filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || (s.discipline || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const desc = sort.startsWith('-');
      const key = desc ? sort.slice(1) : sort;
      const va = a[key] ?? (typeof b[key] === 'number' ? -Infinity : '');
      const vb = b[key] ?? (typeof a[key] === 'number' ? -Infinity : '');
      if (va < vb) return desc ? 1 : -1;
      if (va > vb) return desc ? -1 : 1;
      return 0;
    });

  function toggleAll() {
    if (selected.length === filtered.length) onSelect([]);
    else onSelect(filtered.map(s => s.id));
  }

  function toggleOne(id) {
    if (selected.includes(id)) onSelect(selected.filter(x => x !== id));
    else onSelect([...selected, id]);
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or discipline…"
          style={{ padding: '6px 10px', backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 4, color: 'var(--wr-text-primary)', fontSize: 12, minWidth: 220 }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          {['active', 'archived', 'all'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 10px', borderRadius: 4, fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                border: statusFilter === s ? '1px solid var(--wr-amber)' : '1px solid var(--wr-border)',
                backgroundColor: statusFilter === s ? 'rgba(240,165,0,0.1)' : 'transparent',
                color: statusFilter === s ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
              }}
            >{s}</button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ padding: '5px 10px', backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 4, color: 'var(--wr-text-secondary)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontSize: 11, color: 'var(--wr-text-muted)', marginLeft: 'auto' }}>{filtered.length} SMEs</span>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--wr-border)' }}>
                <th style={{ padding: '10px 12px', width: 32 }}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                </th>
                {['NAME', 'DISCIPLINE', 'QUALITY', 'USAGE', 'SOURCE', 'STATUS', ''].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--wr-text-muted)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--wr-text-muted)', fontSize: 11 }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: 'var(--wr-text-muted)', fontSize: 11 }}>No SMEs found</td></tr>
              ) : filtered.map(s => {
                const qColor = s.quality_score >= 80 ? '#2ECC71' : s.quality_score >= 60 ? '#F0A500' : s.quality_score != null ? '#C0392B' : 'var(--wr-text-muted)';
                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid var(--wr-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => onRowClick?.(s)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--wr-bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td style={{ padding: '10px 12px' }} onClick={e => { e.stopPropagation(); toggleOne(s.id); }}>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleOne(s.id)} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div>
                        <p style={{ fontWeight: 600, color: 'var(--wr-text-primary)', marginBottom: 1 }}>{s.name}</p>
                        {s.is_library_sme && (
                          <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 2, backgroundColor: 'rgba(46,204,113,0.12)', color: '#2ECC71', fontFamily: 'JetBrains Mono, monospace' }}>LIB</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--wr-text-secondary)' }}>{s.discipline}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: qColor, fontSize: 13 }}>
                        {s.quality_score != null ? s.quality_score : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{s.usage_count || 0}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5 }}>{s.source || 'workspace'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 3, fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace',
                        backgroundColor: s.status === 'archived' ? '#88888818' : s.status === 'draft' ? 'rgba(240,165,0,0.1)' : 'rgba(46,204,113,0.1)',
                        color: s.status === 'archived' ? '#888' : s.status === 'draft' ? 'var(--wr-amber)' : '#2ECC71',
                        border: '1px solid currentColor', opacity: 0.8,
                      }}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {!s.is_library_sme && onPromote && (
                          <MiniBtn onClick={() => onPromote([s.id])} color="var(--wr-amber)">Promote</MiniBtn>
                        )}
                        {onClone && (
                          <MiniBtn onClick={() => onClone(s.id)} color="#4EA8DE">Clone</MiniBtn>
                        )}
                        {onArchive && s.status !== 'archived' && (
                          <MiniBtn onClick={() => onArchive([s.id])} color="#888">Archive</MiniBtn>
                        )}
                        {onDelete && (
                          <MiniBtn onClick={() => onDelete([s.id])} color="#C0392B">Del</MiniBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniBtn({ onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px', borderRadius: 3, border: `1px solid ${color}30`,
        backgroundColor: `${color}10`, color, cursor: 'pointer',
        fontSize: 10, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}
