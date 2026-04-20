import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useWorkspace } from '@/lib/WorkspaceContext';
import { X, Search, Download, Loader2, CheckSquare, Square, Target, AlertTriangle, Link2, Swords, CheckCircle2, Globe } from 'lucide-react';
import WrButton from '@/components/ui/WrButton';

const TABS = [
  { key: 'Domain',    label: 'Domains',   icon: Globe },
  { key: 'Scenario',  label: 'Scenarios', icon: Target },
  { key: 'Threat',    label: 'Threats',   icon: AlertTriangle },
  { key: 'Chain',     label: 'Chains',    icon: Link2 },
  { key: 'Session',   label: 'Sessions',  icon: Swords },
];

// Fields to copy per entity type.
// Sessions include agent_ids so round 1/2 agent assignments transfer over.
// Workspace-specific FK refs (scenario_id, session_id, threat_id) are intentionally omitted.
const COPY_FIELDS = {
  Domain:   ['name', 'description', 'color', 'icon'],
  Scenario: ['name', 'description', 'domain_id', 'context_document', 'tags'],
  Threat:   ['name', 'description', 'domain_id', 'severity', 'category', 'tags'],
  Chain:    ['name', 'description', 'domain_id', 'steps', 'tags', 'is_ai_generated'],
  Session:  ['name', 'domain_id', 'phase_focus', 'context_override', 'agent_ids'],
};

const SEVERITY_COLOR = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };

function pick(obj, fields) {
  return Object.fromEntries(
    fields
      .filter(f => obj[f] !== undefined && obj[f] !== null && obj[f] !== '')
      .map(f => [f, obj[f]])
  );
}

export default function WorkspaceImportModal({ onClose }) {
  const { db, workspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState('Domain');
  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  // Tracks source IDs already imported this session so they're hidden after import
  const [importedIds, setImportedIds] = useState(new Set());
  // { count, names[] } for the success banner
  const [lastImport, setLastImport] = useState(null);

  useEffect(() => {
    entities.Domain.list().then(setDomains);
  }, []);

  useEffect(() => {
    setSelected(new Set());
    setSearch('');
    setLastImport(null);
    loadTab(activeTab);
  }, [activeTab]);

  const loadTab = async (type) => {
    setLoading(true);
    try {
      const all = await entities[type].list();
      // Exclude items that belong to the current workspace
      const foreign = all.filter(item => item.workspace_id !== workspace?.id);
      setItems(foreign);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Items available to select: foreign items minus already-imported ones
  const available = items.filter(item => !importedIds.has(item.id));

  const filtered = available.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.name || '').toLowerCase().includes(q) ||
           (item.description || '').toLowerCase().includes(q);
  });

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id)));
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    const toImport = items.filter(i => selected.has(i.id));
    const fields = COPY_FIELDS[activeTab];
    try {
      await Promise.all(toImport.map(item => db[activeTab].create(pick(item, fields))));
      if (activeTab === 'Session') {
        // Sessions need SessionAgent records created after the session is copied,
        // one per agent_id, so round 1/2 slots appear in the workspace.
        await Promise.all(toImport.map(async (item) => {
          const newSession = await db.Session.create(pick(item, fields));
          const agentIds = item.agent_ids || [];
          await Promise.all(
            agentIds.map(agentId =>
              db.SessionAgent.create({ session_id: newSession.id, agent_id: agentId, status: 'pending' })
            )
          );
        }));
      } else {
        await Promise.all(toImport.map(item => db[activeTab].create(pick(item, fields))));
      }
      // Mark source IDs as imported so they disappear from the list
      setImportedIds(prev => new Set([...prev, ...toImport.map(i => i.id)]));
      setLastImport({ count: toImport.length, names: toImport.map(i => i.name) });
      setSelected(new Set());
    } finally {
      setImporting(false);
    }
  };

  const domainName = (id) => domains.find(d => d.id === id)?.name || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-[760px] max-h-[88vh] flex flex-col rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--wr-border)' }}>
          <div>
            <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>
              IMPORT INTO WORKSPACE
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
              Copy items from the global library into{' '}
              <span style={{ color: 'var(--wr-text-primary)' }}>{workspace?.name}</span>
            </p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--wr-border)' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-5 py-3 text-xs font-medium tracking-wide transition-colors"
              style={{
                color: activeTab === key ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--wr-amber)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Success banner */}
        {lastImport && (
          <div className="flex items-start gap-3 px-5 py-3 flex-shrink-0"
            style={{ backgroundColor: 'rgba(39,174,96,0.12)', borderBottom: '1px solid rgba(39,174,96,0.25)' }}>
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#27AE60' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: '#27AE60' }}>
                {lastImport.count} {activeTab.toLowerCase()}{lastImport.count !== 1 ? 's' : ''} imported successfully
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(39,174,96,0.8)' }}>
                {lastImport.names.join(', ')}
              </p>
            </div>
            <button onClick={() => setLastImport(null)} className="flex-shrink-0 mt-0.5">
              <X className="w-3.5 h-3.5" style={{ color: 'rgba(39,174,96,0.6)' }} />
            </button>
          </div>
        )}

        {/* Search + select-all bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
          <button onClick={toggleAll} className="flex-shrink-0" title="Select all">
            {selected.size > 0 && selected.size === filtered.length
              ? <CheckSquare className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
              : <Square className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />
            }
          </button>
          <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded"
            style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--wr-text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeTab.toLowerCase()}s...`}
              className="flex-1 text-xs outline-none bg-transparent"
              style={{ color: 'var(--wr-text-primary)' }}
            />
          </div>
          {selected.size > 0 && (
            <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--wr-amber)' }}>
              {selected.size} selected
            </span>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--wr-text-muted)' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              {available.length === 0 && importedIds.size > 0 ? (
                <>
                  <CheckCircle2 className="w-8 h-8" style={{ color: '#27AE60' }} />
                  <p className="text-sm font-medium" style={{ color: '#27AE60' }}>All available items imported</p>
                  <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Nothing left to import for this type</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--wr-text-muted)' }}>
                  {available.length === 0
                    ? `No ${activeTab.toLowerCase()}s available from other workspaces`
                    : 'No results match your search'}
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--wr-border)' }}>
              {filtered.map(item => {
                const isSelected = selected.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className="flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors hover:bg-white/3"
                    style={{ backgroundColor: isSelected ? 'rgba(240,165,0,0.05)' : 'transparent' }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {isSelected
                        ? <CheckSquare className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
                        : <Square className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" style={{ color: 'var(--wr-text-primary)' }}>
                          {item.name}
                        </span>
                        {item.severity && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${SEVERITY_COLOR[item.severity]}22`, color: SEVERITY_COLOR[item.severity] }}>
                            {item.severity}
                          </span>
                        )}
                        {item.status && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-muted)' }}>
                            {item.status}
                          </span>
                        )}
                        {item.is_ai_generated && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'rgba(123,45,139,0.2)', color: '#9B59B6' }}>AI</span>
                        )}
                        {activeTab === 'Session' && item.agent_ids?.length > 0 && (
                          <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'rgba(46,118,182,0.15)', color: '#2E75B6' }}>
                            {item.agent_ids.length} agent{item.agent_ids.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--wr-text-muted)' }}>
                          {item.description}
                        </p>
                      )}
                      {item.domain_id && domainName(item.domain_id) && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--wr-text-muted)' }}>
                          {domainName(item.domain_id)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
          <div className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
            {importedIds.size > 0 && (
              <span style={{ color: '#27AE60' }}> · {importedIds.size} already imported this session</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <WrButton variant="secondary" onClick={onClose}>Close</WrButton>
            <WrButton onClick={handleImport} disabled={selected.size === 0 || importing}>
              {importing
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</>
                : <><Download className="w-3.5 h-3.5" /> Import {selected.size > 0 ? selected.size : ''} Selected</>
              }
            </WrButton>
          </div>
        </div>

      </div>
    </div>
  );
}