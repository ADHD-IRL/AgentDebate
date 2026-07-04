import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { supabase } from '@/lib/supabase';
import { Library, X, Copy, Search, Star, Activity } from 'lucide-react';
import WrButton from '@/components/ui/WrButton';

function QualityDot({ score }) {
  if (score == null) return <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>—</span>;
  const color = score >= 80 ? '#27AE60' : score >= 60 ? '#D68910' : '#C0392B';
  return (
    <span className="text-xs font-mono font-bold" style={{ color }}>
      {score.toFixed(1)}
    </span>
  );
}

export default function LibraryBrowseModal({ onClose, onCloned }) {
  const { db, workspace } = useWorkspace();
  const [smes, setSmes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('id,name,discipline,expertise_level,severity_default,scenario_tags,persona_description,cognitive_bias,red_team_focus,usage_count,quality_score,source,cloned_from_id,vector_human,vector_technical,vector_physical,vector_futures,tags,epistemic_style,adversary_model,institutional_background,conflict_triggers,decision_style,analytical_framework,source_preferences,professional_background,reasoning_style,institutional_incentives,red_team_focus')
          .eq('is_library_sme', true)
          .order('quality_score', { ascending: false, nullsFirst: false })
          .order('usage_count', { ascending: false });
        if (!error) setSmes(data || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = smes.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.discipline?.toLowerCase().includes(q) || s.persona_description?.toLowerCase().includes(q);
  });

  const handleClone = async (sme) => {
    if (!workspace?.id) return;
    setCloning(sme.id);
    try {
      const { id, created_at, updated_at, workspace_id, ...rest } = sme;
      await db.Agent.create({
        ...rest,
        workspace_id: workspace.id,
        source: 'cloned',
        is_library_sme: false,
        cloned_from_id: sme.id,
        usage_count: 0,
        quality_score: null,
        name: `${sme.name} (Library Clone)`,
      });
      onCloned?.();
      onClose();
    } finally {
      setCloning(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-xl overflow-hidden"
        style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--wr-border)' }}>
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4" style={{ color: '#9B59B6' }} />
            <span className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-primary)' }}>SME GLOBAL LIBRARY</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(155,89,182,0.15)', color: '#9B59B6' }}>
              {smes.length} SMEs
            </span>
          </div>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--wr-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--wr-text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, discipline, or description..."
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: 'var(--wr-text-primary)' }}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-20 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-secondary)' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-center py-8" style={{ color: 'var(--wr-text-muted)' }}>
              {smes.length === 0 ? 'No library SMEs yet. Generate SMEs and promote them to the library.' : 'No matches for your search.'}
            </p>
          ) : (
            filtered.map(sme => (
              <div
                key={sme.id}
                className="flex items-start gap-3 p-3 rounded-lg"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{sme.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--wr-bg-card)', color: 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
                      {sme.discipline}
                    </span>
                    {sme.expertise_level && (
                      <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{sme.expertise_level}</span>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--wr-text-secondary)' }}>
                    {sme.persona_description}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" style={{ color: '#D68910' }} />
                      <QualityDot score={sme.quality_score} />
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3" style={{ color: 'var(--wr-text-muted)' }} />
                      <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{sme.usage_count || 0} sessions</span>
                    </div>
                    {(sme.scenario_tags || sme.tags || []).slice(0, 3).map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(155,89,182,0.1)', color: '#9B59B6', border: '1px solid rgba(155,89,182,0.2)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <WrButton
                  variant="outline"
                  onClick={() => handleClone(sme)}
                  disabled={cloning === sme.id}
                  className="flex-shrink-0 flex items-center gap-1 text-xs"
                >
                  <Copy className="w-3 h-3" />
                  {cloning === sme.id ? 'Cloning...' : 'Clone'}
                </WrButton>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-3 border-t text-xs" style={{ borderColor: 'var(--wr-border)', color: 'var(--wr-text-muted)' }}>
          Clone copies a library SME into your workspace. You can then edit it or use it directly in sessions.
        </div>
      </div>
    </div>
  );
}
