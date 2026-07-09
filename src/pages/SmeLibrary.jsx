import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/lib/WorkspaceContext';
import LibraryStats from '@/components/sme/LibraryStats';
import LibraryTable from '@/components/sme/LibraryTable';
import SmeDetailPanel from '@/components/sme/SmeDetailPanel';
import SmeGeneratorPanel from '@/components/sme/SmeGeneratorPanel';
import QualityMonitor from '@/components/sme/QualityMonitor';
import BulkOperations from '@/components/sme/BulkOperations';
import TokenManager from '@/components/sme/TokenManager';
import SmeImportExport from '@/components/sme/SmeImportExport';

const TABS = ['Overview', 'Library', 'Workspace', 'Generate', 'Quality', 'Tokens', 'Import/Export'];

export default function SmeLibrary() {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState('Overview');
  const [librarySmes, setLibrarySmes] = useState([]);
  const [workspaceSmes, setWorkspaceSmes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [detailSme, setDetailSme] = useState(null);

  const load = useCallback(async () => {
    if (!workspace?.id) return;
    setLoading(true);
    const [libRes, wsRes] = await Promise.all([
      supabase.from('agents').select('*').eq('is_library_sme', true).order('quality_score', { ascending: false, nullsFirst: false }),
      supabase.from('agents').select('*').eq('workspace_id', workspace.id).eq('is_library_sme', false).order('created_at', { ascending: false }),
    ]);
    const lib = libRes.data || [];
    const ws = wsRes.data || [];
    setLibrarySmes(lib);
    setWorkspaceSmes(ws);

    const withScore = lib.filter(s => s.quality_score != null);
    const avgQ = withScore.length ? Math.round(withScore.reduce((s, x) => s + x.quality_score, 0) / withScore.length * 10) / 10 : null;
    const topByUsage = [...lib, ...ws].sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 10);
    setStats({
      library: {
        total: lib.length,
        avg_quality: avgQ,
        high_quality_count: lib.filter(s => s.quality_score >= 80).length,
        no_quality_score: lib.filter(s => s.quality_score == null).length,
        low_quality_count: lib.filter(s => s.quality_score != null && s.quality_score < 60).length,
      },
      top_by_usage: topByUsage,
    });
    setLoading(false);
  }, [workspace?.id]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(id, fields) {
    const { id: _id, created_at: _ca, updated_at: _ua, workspace_id: _ws, ...safe } = fields;
    await supabase.from('agents').update({ ...safe, updated_at: new Date().toISOString() }).eq('id', id);
    await load();
    setDetailSme(s => s?.id === id ? { ...s, ...fields } : s);
  }

  async function handlePromote(ids) {
    if (!window.confirm(`Promote ${ids.length} SME(s) to the library?`)) return;
    await supabase.from('agents').update({ is_library_sme: true, source: 'library', updated_at: new Date().toISOString() }).in('id', ids);
    await load();
    setSelected([]);
  }

  async function handleArchive(ids) {
    if (!window.confirm(`Archive ${ids.length} SME(s)?`)) return;
    await supabase.from('agents').update({ status: 'archived', updated_at: new Date().toISOString() }).in('id', ids);
    await load();
    setSelected([]);
    if (detailSme && ids.includes(detailSme.id)) setDetailSme(null);
  }

  async function handleDelete(ids) {
    if (!window.confirm(`Permanently delete ${ids.length} SME(s)?`)) return;
    await supabase.from('agents').delete().in('id', ids);
    await load();
    setSelected([]);
    if (detailSme && ids.includes(detailSme.id)) setDetailSme(null);
  }

  async function handleClone(id) {
    const src = [...librarySmes, ...workspaceSmes].find(s => s.id === id);
    if (!src) return;
    const { id: _id, created_at: _ca, updated_at: _ua, workspace_id: _ws, ...rest } = src;
    await supabase.from('agents').insert({ ...rest, workspace_id: workspace.id, name: `${src.name} (Copy)`, is_library_sme: false, source: 'cloned', cloned_from_id: id, usage_count: 0, quality_score: null });
    await load();
  }

  async function handleImport(profiles) {
    const toInsert = profiles.map(p => {
      const { id: _id, created_at: _ca, ...rest } = p;
      return { ...rest, workspace_id: workspace.id, is_library_sme: false, source: 'workspace' };
    });
    await supabase.from('agents').insert(toInsert);
    await load();
  }

  const allSmes = [...librarySmes, ...workspaceSmes];
  const tableSmes = tab === 'Workspace' ? workspaceSmes : librarySmes;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200, marginRight: detailSme ? 540 : 0 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--wr-text-primary)', marginBottom: 4 }}>SME Library</h1>
        <p style={{ fontSize: 12, color: 'var(--wr-text-muted)' }}>
          Global Subject Matter Expert library — create, manage, quality-rate, and provision SMEs via MCP or REST
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--wr-border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
              color: tab === t ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
              borderBottom: tab === t ? '2px solid var(--wr-amber)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.12s',
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <>
          <LibraryStats stats={stats} />
          <QualityMonitor stats={stats} smes={librarySmes} />
        </>
      )}

      {(tab === 'Library' || tab === 'Workspace') && (
        <>
          <BulkOperations
            selected={selected}
            onPromote={tab === 'Workspace' ? handlePromote : null}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onExport={ids => {
              const subset = allSmes.filter(s => ids.includes(s.id));
              const blob = new Blob([JSON.stringify(subset, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'sme-export.json'; a.click();
              URL.revokeObjectURL(url);
            }}
            onClear={() => setSelected([])}
          />
          <LibraryTable
            smes={tableSmes}
            loading={loading}
            selected={selected}
            onSelect={setSelected}
            onRowClick={s => setDetailSme(s)}
            onPromote={tab === 'Workspace' ? handlePromote : null}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onClone={handleClone}
          />
        </>
      )}

      {tab === 'Generate' && (
        <SmeGeneratorPanel onGenerated={load} />
      )}

      {tab === 'Quality' && (
        <QualityMonitor stats={stats} smes={librarySmes} />
      )}

      {tab === 'Tokens' && (
        <TokenManager />
      )}

      {tab === 'Import/Export' && (
        <SmeImportExport smes={allSmes} onImport={handleImport} />
      )}

      {/* Detail panel */}
      {detailSme && (
        <SmeDetailPanel
          sme={detailSme}
          onClose={() => setDetailSme(null)}
          onSave={handleSave}
          onPromote={!detailSme.is_library_sme ? (id) => handlePromote([id]) : null}
          onArchive={(id) => handleArchive([id])}
          onDelete={(id) => handleDelete([id])}
        />
      )}
    </div>
  );
}
