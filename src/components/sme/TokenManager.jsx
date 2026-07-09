import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/lib/WorkspaceContext';

export default function TokenManager() {
  const { workspace } = useWorkspace();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: ['read', 'write'], expires_in_days: '' });

  useEffect(() => { if (workspace?.id) load(); }, [workspace?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('sme_tokens').select('*').eq('workspace_id', workspace.id).order('created_at', { ascending: false });
    setTokens(data || []);
    setLoading(false);
  }

  async function createToken() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      const expires_at = form.expires_in_days
        ? new Date(Date.now() + Number(form.expires_in_days) * 86400000).toISOString()
        : null;
      const { data, error } = await supabase
        .from('sme_tokens')
        .insert({ token, workspace_id: workspace.id, name: form.name.trim(), permissions: form.permissions, expires_at })
        .select()
        .single();
      if (error) throw error;
      setNewToken(token);
      setForm({ name: '', permissions: ['read', 'write'], expires_in_days: '' });
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(id) {
    if (!window.confirm('Revoke this token? Any systems using it will lose access.')) return;
    await supabase.from('sme_tokens').delete().eq('id', id).eq('workspace_id', workspace.id);
    await load();
  }

  const togglePerm = (p) => setForm(f => ({
    ...f,
    permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* One-time token reveal */}
      {newToken && (
        <div style={{ backgroundColor: 'rgba(240,165,0,0.08)', border: '1px solid var(--wr-amber)', borderRadius: 6, padding: '14px 16px' }}>
          <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-amber)', marginBottom: 8 }}>
            TOKEN CREATED — COPY NOW (shown once)
          </p>
          <code style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-primary)', wordBreak: 'break-all' }}>
            {newToken}
          </code>
          <button
            onClick={() => { navigator.clipboard.writeText(newToken); setNewToken(null); }}
            style={{ display: 'block', marginTop: 10, padding: '5px 12px', borderRadius: 4, border: '1px solid var(--wr-amber)', background: 'none', color: 'var(--wr-amber)', cursor: 'pointer', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          >
            Copy & Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '16px 20px' }}>
        <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 14 }}>
          CREATE TOKEN
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', display: 'block', marginBottom: 4 }}>NAME</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. CI Pipeline"
              style={{ width: '100%', padding: '6px 10px', backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', borderRadius: 4, color: 'var(--wr-text-primary)', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', display: 'block', marginBottom: 4 }}>EXPIRES (DAYS)</label>
            <input
              type="number"
              value={form.expires_in_days}
              onChange={e => setForm(f => ({ ...f, expires_in_days: e.target.value }))}
              placeholder="Never"
              style={{ width: 90, padding: '6px 10px', backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', borderRadius: 4, color: 'var(--wr-text-primary)', fontSize: 12 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', display: 'block', marginBottom: 4 }}>PERMISSIONS</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['read', 'write'].map(p => (
                <button
                  key={p}
                  onClick={() => togglePerm(p)}
                  style={{
                    padding: '5px 10px', borderRadius: 4, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    border: form.permissions.includes(p) ? '1px solid var(--wr-amber)' : '1px solid var(--wr-border)',
                    backgroundColor: form.permissions.includes(p) ? 'rgba(240,165,0,0.12)' : 'var(--wr-bg-secondary)',
                    color: form.permissions.includes(p) ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={createToken}
            disabled={creating || !form.name.trim()}
            style={{
              padding: '6px 16px', borderRadius: 4, border: '1px solid var(--wr-amber)',
              backgroundColor: 'rgba(240,165,0,0.12)', color: 'var(--wr-amber)',
              cursor: creating || !form.name.trim() ? 'not-allowed' : 'pointer', fontSize: 12, opacity: creating || !form.name.trim() ? 0.5 : 1,
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>

      {/* Token table */}
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--wr-border)' }}>
                {['NAME', 'PERMISSIONS', 'CREATED', 'LAST USED', 'EXPIRES', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--wr-text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '20px 14px', color: 'var(--wr-text-muted)', fontSize: 11, textAlign: 'center' }}>Loading…</td></tr>
              ) : tokens.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '20px 14px', color: 'var(--wr-text-muted)', fontSize: 11, textAlign: 'center' }}>No tokens yet</td></tr>
              ) : tokens.map(t => {
                const expired = t.expires_at && new Date(t.expires_at) < new Date();
                return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--wr-border)', opacity: expired ? 0.5 : 1 }}>
                    <td style={{ padding: '10px 14px', color: 'var(--wr-text-primary)', fontWeight: 600 }}>{t.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(t.permissions || []).map(p => (
                          <span key={p} style={{ padding: '2px 6px', borderRadius: 3, border: '1px solid var(--wr-border)', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>{p}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{fmt(t.created_at)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>{t.last_used_at ? fmt(t.last_used_at) : '—'}</td>
                    <td style={{ padding: '10px 14px', color: expired ? '#C0392B' : 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      {t.expires_at ? fmt(t.expires_at) : 'Never'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => revokeToken(t.id)} style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #C0392B30', backgroundColor: '#C0392B12', color: '#C0392B', cursor: 'pointer', fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }}>
                        Revoke
                      </button>
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

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}
