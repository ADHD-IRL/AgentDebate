import { useState, useEffect } from 'react';
import { entities } from '@/api/entities';
import { useWorkspace } from '@/lib/WorkspaceContext';
import {
  Edit2, Check, X, RefreshCw, Copy, Trash2, UserMinus,
  ShieldCheck, User, Loader2, AlertTriangle, Users, Building2,
} from 'lucide-react';
import WrButton from '@/components/ui/WrButton';

const ROLES = ['admin', 'analyst', 'viewer'];
const ROLE_COLOR = { admin: 'var(--wr-amber)', analyst: '#2E86AB', viewer: '#546E7A' };

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() +
         Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ── Inline editable field ─────────────────────────────────────────────────────
function EditableField({ label, value, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = async () => {
    if (!draft.trim() || draft === value) { setEditing(false); setDraft(value); return; }
    await onSave(draft.trim());
    setEditing(false);
  };

  return (
    <div>
      <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>{label}</p>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setEditing(false); setDraft(value); } }}
            className="flex-1 px-3 py-2 rounded text-sm outline-none"
            style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-amber)', color: 'var(--wr-text-primary)' }}
          />
          <button onClick={commit} disabled={saving} className="p-2 rounded transition-colors hover:bg-white/5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--wr-amber)' }} /> : <Check className="w-4 h-4" style={{ color: '#27AE60' }} />}
          </button>
          <button onClick={() => { setEditing(false); setDraft(value); }} className="p-2 rounded transition-colors hover:bg-white/5">
            <X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <span className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{value}</span>
          <button
            onClick={() => { setDraft(value); setEditing(true); }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
            style={{ color: 'var(--wr-text-muted)' }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────
function MemberRow({ m, isSelf, isAdmin, onChangeRole, onRemove }) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [busy, setBusy]         = useState(false);

  const handleRole = async (role) => {
    setRoleOpen(false);
    if (role === m.role) return;
    setBusy(true);
    await onChangeRole(m.id, role);
    setBusy(false);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${m.user_email || m.user_id} from the workspace?`)) return;
    setBusy(true);
    await onRemove(m.id);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--wr-border)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
        <User className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: 'var(--wr-text-primary)' }}>
          {m.user_email || m.user_id}
          {isSelf && <span className="ml-1.5 text-xs" style={{ color: 'var(--wr-text-muted)' }}>(you)</span>}
        </p>
      </div>

      {/* Role badge / picker */}
      <div className="relative flex-shrink-0">
        {isAdmin && !isSelf ? (
          <>
            <button
              onClick={() => setRoleOpen(o => !o)}
              disabled={busy}
              className="flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded transition-colors"
              style={{ backgroundColor: `${ROLE_COLOR[m.role] || '#546E7A'}22`, color: ROLE_COLOR[m.role] || '#546E7A', border: `1px solid ${ROLE_COLOR[m.role] || '#546E7A'}44` }}
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : m.role?.toUpperCase()}
            </button>
            {roleOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded shadow-lg"
                style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', minWidth: 110 }}>
                {ROLES.map(r => (
                  <button key={r} onClick={() => handleRole(r)}
                    className="w-full text-left text-xs px-3 py-2 transition-colors hover:bg-white/5 font-mono"
                    style={{ color: ROLE_COLOR[r] }}>
                    {r.toUpperCase()}
                    {r === m.role && <Check className="w-3 h-3 inline ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs font-mono px-2 py-1 rounded"
            style={{ backgroundColor: `${ROLE_COLOR[m.role] || '#546E7A'}22`, color: ROLE_COLOR[m.role] || '#546E7A' }}>
            {m.role?.toUpperCase()}
          </span>
        )}
      </div>

      {isAdmin && !isSelf && (
        <button
          onClick={handleRemove}
          disabled={busy}
          className="p-1.5 rounded transition-colors hover:bg-red-900/20 flex-shrink-0"
          style={{ color: '#C0392B' }}
          title="Remove from workspace"
        >
          <UserMinus className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WorkspaceManagement() {
  const { workspace, member, isAdmin, leaveWorkspace, localUserId } = useWorkspace();

  const [members, setMembers]         = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [savingName, setSavingName]   = useState(false);
  const [inviteCode, setInviteCode]   = useState(workspace?.invite_code || '');
  const [regenBusy, setRegenBusy]     = useState(false);
  const [copied, setCopied]           = useState(false);

  // Delete workspace confirmation
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    if (!workspace) return;
    loadMembers();
  }, [workspace?.id]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const ms = await entities.WorkspaceMember.filter({ workspace_id: workspace.id });
      setMembers(ms);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveName = async (newName) => {
    setSavingName(true);
    try {
      await entities.Workspace.update(workspace.id, { name: newName });
      // Update local workspace name via a shallow page reload fallback —
      // or nudge the user to see the change reflected in the sidebar.
      workspace.name = newName; // mutate so EditableField shows new value immediately
    } finally {
      setSavingName(false);
    }
  };

  const handleRegenCode = async () => {
    if (!confirm('Regenerate invite code? The current code will stop working immediately.')) return;
    setRegenBusy(true);
    const code = generateInviteCode();
    try {
      await entities.Workspace.update(workspace.id, { invite_code: code });
      setInviteCode(code);
    } finally {
      setRegenBusy(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChangeRole = async (memberId, role) => {
    await entities.WorkspaceMember.update(memberId, { role });
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
  };

  const handleRemoveMember = async (memberId) => {
    await entities.WorkspaceMember.delete(memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirm !== workspace.name) return;
    setDeleting(true);
    try {
      // Remove all members first, then delete the workspace record
      await Promise.all(members.map(m => entities.WorkspaceMember.delete(m.id)));
      await entities.Workspace.delete(workspace.id);
      leaveWorkspace();
    } catch (err) {
      console.error('Delete workspace failed:', err);
      setDeleting(false);
    }
  };

  if (!workspace) return null;

  return (
    <div className="rounded p-5" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <Building2 className="w-4 h-4" style={{ color: 'var(--wr-amber)' }} />
        <h2 className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>WORKSPACE</h2>
      </div>

      {/* ── Name ── */}
      <div className="mb-5">
        {isAdmin ? (
          <EditableField label="NAME" value={workspace.name} onSave={handleSaveName} saving={savingName} />
        ) : (
          <div>
            <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>NAME</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>{workspace.name}</p>
          </div>
        )}
      </div>

      {/* ── Invite Code (admin only) ── */}
      {isAdmin && (
        <>
          <div className="border-t pt-5 mb-5" style={{ borderColor: 'var(--wr-border)' }}>
            <p className="text-xs font-bold tracking-widest font-mono mb-2" style={{ color: 'var(--wr-text-muted)' }}>INVITE CODE</p>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded font-mono text-lg font-bold tracking-widest"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-amber)', border: '1px solid var(--wr-border)' }}>
                {inviteCode || workspace.invite_code || '—'}
              </span>
              <button onClick={handleCopyCode}
                className="text-xs px-3 py-2 rounded transition-colors"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', color: copied ? '#27AE60' : 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
                {copied ? <><Check className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy</>}
              </button>
              <button onClick={handleRegenCode} disabled={regenBusy}
                className="text-xs px-3 py-2 rounded transition-colors flex items-center gap-1"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-muted)', border: '1px solid var(--wr-border)' }}>
                <RefreshCw className={`w-3 h-3 ${regenBusy ? 'animate-spin' : ''}`} />
                Regenerate
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--wr-text-muted)' }}>Share with team members so they can join this workspace.</p>
          </div>
        </>
      )}

      {/* ── Members ── */}
      <div className="border-t pt-5" style={{ borderColor: 'var(--wr-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--wr-text-muted)' }} />
            <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>MEMBERS</p>
          </div>
          <span className="text-xs font-mono" style={{ color: 'var(--wr-text-muted)' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>

        {loadingMembers ? (
          <div className="flex items-center gap-2 py-3">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--wr-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>Loading members...</span>
          </div>
        ) : members.length === 0 ? (
          <p className="text-xs py-3" style={{ color: 'var(--wr-text-muted)' }}>No members found.</p>
        ) : (
          <div>
            {members.map(m => (
              <MemberRow
                key={m.id}
                m={m}
                isSelf={m.user_id === localUserId}
                isAdmin={isAdmin}
                onChangeRole={handleChangeRole}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        )}

        {!isAdmin && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--wr-border)' }}>
            <button
              onClick={() => { if (confirm('Leave this workspace?')) { handleRemoveMember(member?.id).then(() => leaveWorkspace()); } }}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: '#C0392B' }}>
              <UserMinus className="w-3.5 h-3.5" /> Leave workspace
            </button>
          </div>
        )}
      </div>

      {/* ── Danger Zone (admin only) ── */}
      {isAdmin && (
        <div className="border-t mt-5 pt-5" style={{ borderColor: 'rgba(192,57,43,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
            <p className="text-xs font-bold tracking-widest font-mono" style={{ color: '#C0392B' }}>DANGER ZONE</p>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--wr-text-muted)' }}>
            Deleting the workspace removes all member access permanently. Workspace data (sessions, scenarios, threats) is not automatically deleted but will become inaccessible.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--wr-text-muted)' }}>
                Type <span className="font-bold" style={{ color: '#C0392B' }}>{workspace.name}</span> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={workspace.name}
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid rgba(192,57,43,0.3)', color: 'var(--wr-text-primary)' }}
              />
            </div>
            <button
              onClick={handleDeleteWorkspace}
              disabled={deleteConfirm !== workspace.name || deleting}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded transition-colors disabled:opacity-40"
              style={{ backgroundColor: 'rgba(192,57,43,0.15)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.3)' }}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Delete Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}