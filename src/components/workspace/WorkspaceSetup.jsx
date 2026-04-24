import { useState } from 'react';
import { Shield, Plus, LogIn, Loader2, Building2, ChevronRight, ArrowLeft } from 'lucide-react';
import { entities } from '@/api/entities';
import { useWorkspace } from '@/lib/WorkspaceContext';
import WrButton from '@/components/ui/WrButton';

const ROLE_COLOR = { admin: 'var(--wr-amber)', analyst: '#2E86AB', viewer: '#546E7A' };

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ── Workspace card ────────────────────────────────────────────────────────────
function WorkspaceCard({ workspace: ws, member: m, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded text-left transition-all"
      style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(240,165,0,0.4)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--wr-border)'}
    >
      <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)' }}>
        <Building2 className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--wr-text-primary)' }}>{ws.name}</p>
        <p className="text-xs mt-0.5 font-mono" style={{ color: ROLE_COLOR[m.role] || 'var(--wr-text-muted)' }}>
          {m.role?.toUpperCase()}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--wr-text-muted)' }} />
    </button>
  );
}

// ── Resume picker ─────────────────────────────────────────────────────────────
function WorkspacePicker({ pairs, onOther }) {
  const { selectWorkspace } = useWorkspace();

  return (
    <div className="space-y-3">
      <p className="text-sm mb-5" style={{ color: 'var(--wr-text-secondary)' }}>
        Select a workspace to resume, or switch to a different one.
      </p>

      {pairs.map(({ workspace: ws, member: m }) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          member={m}
          onClick={() => selectWorkspace({ workspace: ws, member: m })}
        />
      ))}

      <div className="pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
        <button
          onClick={onOther}
          className="w-full text-xs py-2 text-center transition-colors"
          style={{ color: 'var(--wr-text-muted)' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--wr-amber)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--wr-text-muted)'}
        >
          Create or join a different workspace →
        </button>
      </div>
    </div>
  );
}

// ── Create / Join form ────────────────────────────────────────────────────────
function WorkspaceForm({ showBack, onBack }) {
  const { onWorkspaceReady, localUserId } = useWorkspace();

  const [tab, setTab]         = useState('create');
  const [name, setName]       = useState('');
  const [code, setCode]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCreate = async () => {
    if (!name.trim()) { setError('Workspace name is required.'); return; }
    setLoading(true); setError('');
    try {
      const inviteCode = generateInviteCode();
      const ws = await entities.Workspace.create({
        name: name.trim(),
        owner_id: localUserId,
        invite_code: inviteCode,
      });
      await entities.WorkspaceMember.create({
        workspace_id: ws.id,
        user_id: localUserId,
        role: 'admin',
      });
      await onWorkspaceReady();
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) { setError('Invite code is required.'); return; }
    setLoading(true); setError('');
    try {
      const workspaces = await entities.Workspace.filter({ invite_code: code.trim().toUpperCase() });
      if (workspaces.length === 0) { setError('Invalid invite code — no matching workspace found.'); setLoading(false); return; }
      const ws = workspaces[0];
      const existing = await entities.WorkspaceMember.filter({ workspace_id: ws.id, user_id: localUserId });
      if (existing.length === 0) {
        await entities.WorkspaceMember.create({
          workspace_id: ws.id,
          user_id: localUserId,
          role: 'analyst',
        });
      }
      await onWorkspaceReady();
    } catch (err) {
      setError(err.message || 'Failed to join workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {showBack && (
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs mb-2 transition-colors"
          style={{ color: 'var(--wr-text-muted)' }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--wr-amber)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--wr-text-muted)'}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to workspaces
        </button>
      )}

      <div className="flex gap-1 p-1 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)' }}>
        {[['create', 'Create', Plus], ['join', 'Join with code', LogIn]].map(([t, label, Icon]) => (
          <button key={t} onClick={() => { setTab(t); setError(''); }}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-bold tracking-wide font-mono transition-all"
            style={{
              backgroundColor: tab === t ? 'var(--wr-bg-card)' : 'transparent',
              color: tab === t ? 'var(--wr-amber)' : 'var(--wr-text-muted)',
              border: tab === t ? '1px solid var(--wr-border)' : '1px solid transparent',
            }}>
            <Icon className="w-3.5 h-3.5" />
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'create' && (
        <div className="space-y-3">
          <input
            className="w-full px-3 py-2.5 rounded text-sm outline-none"
            style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}
            placeholder="Workspace name (e.g. Acme Red Team)"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
            You'll be assigned the <span style={{ color: 'var(--wr-amber)' }}>admin</span> role and receive an invite code to share with your team.
          </p>
          {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}
          <WrButton onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Workspace'}
          </WrButton>
        </div>
      )}

      {tab === 'join' && (
        <div className="space-y-3">
          <input
            className="w-full px-3 py-2.5 rounded text-sm font-mono outline-none tracking-widest uppercase"
            style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)', color: 'var(--wr-text-primary)' }}
            placeholder="XXXXXXXX"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={8}
            autoFocus
          />
          <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>
            Ask your workspace admin for the invite code found in Settings.
          </p>
          {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}
          <WrButton onClick={handleJoin} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</> : 'Join Workspace'}
          </WrButton>
        </div>
      )}
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function WorkspaceSetup() {
  const { availableWorkspaces, allWorkspaces, workspace } = useWorkspace();
  const [showForm, setShowForm] = useState(false);

  // When opened from the switcher, show all known workspaces as picker options
  const pickerPairs = availableWorkspaces.length > 0
    ? availableWorkspaces
    : allWorkspaces.filter(p => p.workspace.id !== workspace?.id);

  const hasPicker = pickerPairs.length > 0;
  const showPicker = hasPicker && !showForm;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'var(--wr-bg-primary)' }}>
      <div className="w-full max-w-md px-6">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-7 h-7" style={{ color: 'var(--wr-amber)' }} />
          <div>
            <p className="text-lg font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>AgentDebate</p>
            <p className="text-xs tracking-widest" style={{ color: 'var(--wr-text-muted)' }}>
              {showPicker ? 'SELECT WORKSPACE' : 'WORKSPACE SETUP'}
            </p>
          </div>
        </div>
        {showPicker
          ? <WorkspacePicker pairs={pickerPairs} onOther={() => setShowForm(true)} />
          : <WorkspaceForm showBack={hasPicker} onBack={() => setShowForm(false)} />
        }
      </div>
    </div>
  );
}