import { useState, useEffect } from 'react';
import { queued } from '@/lib/apiQueue';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { Globe, Plus, Edit2, Trash2, X, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import WrButton from '@/components/ui/WrButton';
import { WrInput } from '@/components/ui/WrInput';

const PRESET_COLORS = ['#2E75B6','#F0A500','#27AE60','#C0392B','#7B2D8B','#2E86AB','#E67E22','#546E7A'];
const DOMAIN_COLORS = ['#F0A500','#2E86AB','#27AE60','#C0392B','#7B2D8B','#E67E22','#16A085','#8E44AD'];

// ── Domain edit modal ─────────────────────────────────────────────────────────
function DomainModal({ domain, onSave, onClose }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#2E75B6', icon: 'Globe', ...domain });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-[480px] rounded-lg p-6" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
            {domain?.id ? 'EDIT DOMAIN' : 'NEW DOMAIN'}
          </h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>
        <div className="space-y-4">
          <WrInput label="NAME" value={form.name} onChange={v => set('name', v)} placeholder="Domain name" />
          <WrInput label="DESCRIPTION" value={form.description} onChange={v => set('description', v)} placeholder="Describe this domain..." rows={3} />
          <div>
            <label className="block text-xs font-medium mb-2 tracking-wide" style={{ color: 'var(--wr-text-secondary)' }}>COLOR</label>
            <div className="flex gap-2">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: form.color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
          <WrButton onClick={() => onSave(form)}>Save Domain</WrButton>
        </div>
      </div>
    </div>
  );
}

// ── Duplicate merge modal ─────────────────────────────────────────────────────
function DuplicateModal({ group, agentCounts, onMerge, onClose }) {
  const [keepId, setKeepId] = useState(() =>
    group.reduce((best, d) =>
      (agentCounts[d.id] || 0) > (agentCounts[best.id] || 0) ? d : best
    ).id
  );
  const [merging, setMerging] = useState(false);
  const toDelete = group.filter(d => d.id !== keepId);

  const handleMerge = async () => {
    setMerging(true);
    await onMerge(keepId, toDelete);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="w-[520px] rounded-lg p-6" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: '#E67E22' }} />
            <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
              DUPLICATE DOMAINS
            </h2>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>
        <p className="text-xs mb-5" style={{ color: 'var(--wr-text-muted)' }}>
          These domains share the same name. Select which one to keep — the others will be deleted
          and their agents reassigned to the kept domain.
        </p>

        <div className="space-y-2 mb-5">
          {group.map(d => {
            const count = agentCounts[d.id] || 0;
            const isKeep = d.id === keepId;
            return (
              <button key={d.id} onClick={() => setKeepId(d.id)}
                className="w-full flex items-center gap-3 p-3 rounded text-left transition-all"
                style={{
                  backgroundColor: isKeep ? 'rgba(240,165,0,0.08)' : 'var(--wr-bg-secondary)',
                  border: `1px solid ${isKeep ? 'rgba(240,165,0,0.4)' : 'var(--wr-border)'}`,
                }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color || '#F0A500' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{d.name}</p>
                  {d.description && (
                    <p className="text-xs truncate" style={{ color: 'var(--wr-text-muted)' }}>{d.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right mr-2">
                  <p className="text-sm font-bold font-mono" style={{ color: d.color || '#F0A500' }}>{count}</p>
                  <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>agents</p>
                </div>
                <span className="flex-shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: isKeep ? 'rgba(240,165,0,0.15)' : 'rgba(192,57,43,0.1)',
                    color: isKeep ? 'var(--wr-amber)' : '#C0392B',
                    border: `1px solid ${isKeep ? 'rgba(240,165,0,0.3)' : 'rgba(192,57,43,0.3)'}`,
                  }}>
                  {isKeep ? 'KEEP' : 'DELETE'}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs mb-5 px-1" style={{ color: 'var(--wr-text-muted)' }}>
          {toDelete.length} domain{toDelete.length !== 1 ? 's' : ''} will be deleted.
          {toDelete.reduce((s, d) => s + (agentCounts[d.id] || 0), 0) > 0 &&
            ` ${toDelete.reduce((s, d) => s + (agentCounts[d.id] || 0), 0)} agent${toDelete.reduce((s, d) => s + (agentCounts[d.id] || 0), 0) !== 1 ? 's' : ''} will be reassigned.`}
        </p>

        <div className="flex justify-end gap-2">
          <WrButton variant="secondary" onClick={onClose} disabled={merging}>Cancel</WrButton>
          <WrButton onClick={handleMerge} disabled={merging}>
            {merging ? 'Merging...' : `Keep "${group.find(d => d.id === keepId)?.name}" & Delete ${toDelete.length} Duplicate${toDelete.length !== 1 ? 's' : ''}`}
          </WrButton>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Domains() {
  const { db } = useWorkspace();
  const [domains, setDomains]             = useState([]);
  const [agentCounts, setAgentCounts]     = useState({});
  const [disciplineCounts, setDisciplineCounts] = useState({}); // unsynced agents matching by discipline
  const [unassignedCount, setUnassignedCount]   = useState(0);  // agents with no domain match at all
  const [scenarioCounts, setScenarioCounts]     = useState({});
  const [duplicates, setDuplicates]       = useState([]); // array of duplicate groups
  const [modal, setModal]               = useState(null);
  const [dupModal, setDupModal]         = useState(null); // duplicate group being reviewed
  const [loading, setLoading]           = useState(true);
  const [syncing, setSyncing]           = useState(false);
  const [syncResult, setSyncResult]     = useState(null);

  const load = async () => {
    if (!db) return;
    const doms = await queued(() => db.Domain.list());
    setDomains(doms);

    // Fetch all at once and count client-side — much faster than per-domain queries
    const [agents, scenarios] = await Promise.all([
      queued(() => db.Agent.list()),
      queued(() => db.Scenario.list()),
    ]);

    const agentCounts = {};
    agents.forEach(a => { if (a.domain_id) agentCounts[a.domain_id] = (agentCounts[a.domain_id] || 0) + 1; });
    const scenarioCounts = {};
    scenarios.forEach(s => { if (s.domain_id) scenarioCounts[s.domain_id] = (scenarioCounts[s.domain_id] || 0) + 1; });

    setAgentCounts(agentCounts);
    setScenarioCounts(scenarioCounts);
    setLoading(false);
  };

  useEffect(() => { load(); }, [db]);

  const handleSave = async (form) => {
    if (form.id) {
      await db.Domain.update(form.id, form);
    } else {
      await db.Domain.create(form);
    }
    setModal(null);
    load();
  };

  // Sync: create domains from agent disciplines, assign agents with missing domain_id
  const syncDomainsFromAgents = async () => {
    setSyncing(true);
    setSyncResult(null);
    const currentDomains = await queued(() => db.Domain.list());
    const agents = await queued(() => db.Agent.list());

    const existingIds   = new Set(currentDomains.map(d => d.id));
    const existingNames = new Map(currentDomains.map(d => [d.name.toLowerCase(), d.id]));

    // Collect discipline names from agents that lack a valid domain
    const disciplineCandidates = new Set();
    agents.forEach(a => {
      if (!a.domain_id || !existingIds.has(a.domain_id)) {
        if (a.discipline) {
          const broad = a.discipline.split(/[\/,]/)[0].trim();
          if (broad) disciplineCandidates.add(broad);
        }
      }
    });

    // Build lookup: discipline name → domain id (existing or newly created)
    const domainCache = new Map(existingNames);
    let created = 0;
    const createdNames = [];
    let colorIdx = currentDomains.length;

    for (const name of disciplineCandidates) {
      if (!domainCache.has(name.toLowerCase())) {
        const color = DOMAIN_COLORS[colorIdx % DOMAIN_COLORS.length];
        const newDomain = await db.Domain.create({
          name,
          color,
          description: 'Auto-created from agent discipline sync.',
        });
        domainCache.set(name.toLowerCase(), newDomain.id);
        createdNames.push(name);
        created++;
        colorIdx++;
      }
    }

    // Assign domain_id to agents that were missing one
    let reassigned = 0;
    for (const agent of agents) {
      if (!agent.domain_id || !existingIds.has(agent.domain_id)) {
        if (agent.discipline) {
          const broad = agent.discipline.split(/[\/,]/)[0].trim();
          const newId = domainCache.get(broad.toLowerCase());
          if (newId) {
            await db.Agent.update(agent.id, { domain_id: newId });
            reassigned++;
          }
        }
      }
    }

    setSyncResult({ created, names: createdNames, reassigned });
    setSyncing(false);
    load();
  };

  // Merge duplicates: reassign agents from deleted domains, then delete them
  const handleMergeDuplicates = async (keepId, toDelete) => {
    const deleteIds = new Set(toDelete.map(d => d.id));
    // Use list + JS filter — avoids unreliable per-domain filter API
    const allAgents = await db.Agent.list();
    const affected = allAgents.filter(a => deleteIds.has(a.domain_id));
    await Promise.all(affected.map(a => db.Agent.update(a.id, { domain_id: keepId })));
    await Promise.all(toDelete.map(d => db.Domain.delete(d.id)));
    setDupModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this domain? Agents assigned to it will lose their domain assignment.')) return;
    await db.Domain.delete(id);
    load();
  };

  return (
    <div style={{ backgroundColor: 'var(--wr-bg-primary)', minHeight: '100vh' }}>
      <PageHeader
        icon={Globe}
        title="DOMAINS"
        subtitle="Organizational categories for your analysis workspace"
        actions={
          <div className="flex gap-2">
            <WrButton variant="outline" onClick={syncDomainsFromAgents} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Agents'}
            </WrButton>
            <WrButton onClick={() => setModal('new')}><Plus className="w-4 h-4" /> New Domain</WrButton>
          </div>
        }
      />

      {/* Duplicate warning banner */}
      {duplicates.length > 0 && (
        <div className="mx-6 mt-4 px-4 py-3 rounded text-xs flex items-center justify-between"
          style={{ backgroundColor: 'rgba(230,126,34,0.1)', border: '1px solid rgba(230,126,34,0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E67E22' }} />
            <span style={{ color: '#E67E22' }}>
              {duplicates.length} duplicate domain name{duplicates.length !== 1 ? 's' : ''} detected
              ({duplicates.map(g => `"${g[0].name}"`).join(', ')}) — this can cause inconsistent agent assignments.
            </span>
          </div>
          <button
            onClick={() => setDupModal(duplicates[0])}
            className="ml-4 flex items-center gap-1 px-2 py-1 rounded font-mono font-bold flex-shrink-0 transition-colors"
            style={{ backgroundColor: 'rgba(230,126,34,0.15)', color: '#E67E22', border: '1px solid rgba(230,126,34,0.3)' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(230,126,34,0.25)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(230,126,34,0.15)'}
          >
            Review <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Sync result banner */}
      {syncResult && (
        <div className="mx-6 mt-4 px-4 py-3 rounded text-xs flex items-center justify-between"
          style={{
            backgroundColor: syncResult.created > 0 || syncResult.reassigned > 0 ? 'rgba(39,174,96,0.1)' : 'rgba(240,165,0,0.1)',
            border: `1px solid ${syncResult.created > 0 || syncResult.reassigned > 0 ? 'rgba(39,174,96,0.3)' : 'rgba(240,165,0,0.3)'}`,
            color: syncResult.created > 0 || syncResult.reassigned > 0 ? '#27AE60' : 'var(--wr-amber)',
          }}>
          <span>
            {syncResult.created > 0 || syncResult.reassigned > 0 ? (
              [
                syncResult.created > 0 && `Created ${syncResult.created} domain${syncResult.created !== 1 ? 's' : ''}${syncResult.names.length ? ` (${syncResult.names.join(', ')})` : ''}`,
                syncResult.reassigned > 0 && `assigned ${syncResult.reassigned} agent${syncResult.reassigned !== 1 ? 's' : ''}`,
              ].filter(Boolean).join(' · ')
            ) : (
              'All agents already have valid domain assignments — nothing to sync.'
            )}
          </span>
          <button onClick={() => setSyncResult(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Unassigned agents banner — shown when agents have no domain assignment */}
      {!loading && !syncing && (unassignedCount > 0 || Object.values(disciplineCounts).some(v => v > 0)) && !syncResult && (
        <div className="mx-6 mt-4 px-4 py-3 rounded text-xs flex items-center justify-between"
          style={{ backgroundColor: 'rgba(46,134,171,0.08)', border: '1px solid rgba(46,134,171,0.3)' }}>
          <div style={{ color: '#2E86AB' }}>
            {Object.values(disciplineCounts).reduce((s, v) => s + v, 0) > 0 && (
              <span>
                <strong>{Object.values(disciplineCounts).reduce((s, v) => s + v, 0)} agent{Object.values(disciplineCounts).reduce((s, v) => s + v, 0) !== 1 ? 's' : ''}</strong> match domains by discipline but are not yet assigned a domain_id
                {unassignedCount > 0 && ` · `}
              </span>
            )}
            {unassignedCount > 0 && (
              <span>
                <strong>{unassignedCount} agent{unassignedCount !== 1 ? 's' : ''}</strong> have no domain match at all
              </span>
            )}
            {' — '}run <strong>Sync from Agents</strong> to assign them automatically.
          </div>
          <div className="ml-4 flex-shrink-0">
            <WrButton variant="outline" onClick={syncDomainsFromAgents} disabled={syncing}>
              <RefreshCw className="w-3.5 h-3.5" /> Sync Now
            </WrButton>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded animate-pulse" style={{ backgroundColor: 'var(--wr-bg-card)' }} />)}
        </div>
      ) : domains.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No domains yet"
          description="Domains are top-level categories that organize your agents, scenarios, and chains."
          action={() => setModal('new')}
          actionLabel="Create First Domain"
        />
      ) : (
        <div className="p-6 grid grid-cols-3 gap-4">
          {domains.map(d => {
            const isDuplicate = duplicates.some(g => g.find(x => x.id === d.id));
            return (
              <div key={d.id} className="rounded overflow-hidden"
                style={{
                  backgroundColor: 'var(--wr-bg-card)',
                  border: `1px solid ${isDuplicate ? 'rgba(230,126,34,0.4)' : 'var(--wr-border)'}`,
                }}>
                <div className="h-1" style={{ backgroundColor: d.color || '#F0A500' }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{d.name}</h3>
                        {isDuplicate && (
                          <span className="text-xs font-mono px-1 py-0.5 rounded flex-shrink-0"
                            style={{ backgroundColor: 'rgba(230,126,34,0.12)', color: '#E67E22', border: '1px solid rgba(230,126,34,0.3)' }}>
                            DUP
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>{d.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setModal(d)} className="p-1.5 rounded hover:bg-white/5 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-white/5 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono" style={{ color: d.color || '#F0A500' }}>
                        {scenarioCounts[d.id] || 0}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Scenarios</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold font-mono" style={{ color: d.color || '#F0A500' }}>
                        {agentCounts[d.id] || 0}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Agents</div>
                      {!agentCounts[d.id] && disciplineCounts[d.id] > 0 && (
                        <div
                          className="text-xs mt-0.5 font-mono"
                          title="These agents match by discipline but haven't been synced — run Sync from Agents to assign them."
                          style={{ color: '#E67E22', cursor: 'help' }}
                        >
                          +{disciplineCounts[d.id]} by discipline
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DomainModal
          domain={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {dupModal && (
        <DuplicateModal
          group={dupModal}
          agentCounts={agentCounts}
          onMerge={handleMergeDuplicates}
          onClose={() => setDupModal(null)}
        />
      )}
    </div>
  );
}