import { useState } from 'react';
import { X } from 'lucide-react';

const FIELDS = [
  { key: 'persona_description', label: 'PERSONA DESCRIPTION', rows: 4 },
  { key: 'professional_background', label: 'PROFESSIONAL BACKGROUND', rows: 3 },
  { key: 'cognitive_bias', label: 'COGNITIVE BIAS', rows: 2 },
  { key: 'red_team_focus', label: 'RED-TEAM FOCUS', rows: 3 },
  { key: 'epistemic_style', label: 'EPISTEMIC STYLE', rows: 2 },
  { key: 'institutional_background', label: 'INSTITUTIONAL BACKGROUND', rows: 2 },
  { key: 'conflict_triggers', label: 'CONFLICT TRIGGERS', rows: 2 },
  { key: 'decision_style', label: 'DECISION STYLE', rows: 2 },
  { key: 'adversary_model', label: 'ADVERSARY MODEL', rows: 2 },
  { key: 'institutional_incentives', label: 'INSTITUTIONAL INCENTIVES', rows: 2 },
  { key: 'analytical_framework', label: 'ANALYTICAL FRAMEWORK', rows: 2 },
  { key: 'source_preferences', label: 'SOURCE PREFERENCES', rows: 2 },
];

export default function SmeDetailPanel({ sme, onClose, onSave, onPromote, onArchive, onDelete }) {
  const [draft, setDraft] = useState(sme);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  function set(key, val) {
    setDraft(d => ({ ...d, [key]: val }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      await onSave?.(draft.id, draft);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  const qColor = sme.quality_score >= 80 ? '#2ECC71' : sme.quality_score >= 60 ? '#F0A500' : sme.quality_score != null ? '#C0392B' : 'var(--wr-text-muted)';

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, zIndex: 100,
      backgroundColor: 'var(--wr-bg-secondary)', borderLeft: '1px solid var(--wr-border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--wr-border)', display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--wr-text-primary)', marginBottom: 2 }}>{sme.name}</p>
          <p style={{ fontSize: 11, color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{sme.discipline}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {sme.quality_score != null && (
            <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: qColor }}>
              {sme.quality_score}
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--wr-text-muted)', cursor: 'pointer', padding: 4 }}><X size={18} /></button>
        </div>
      </div>

      {/* Meta strip */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--wr-border)', display: 'flex', gap: 14, flexWrap: 'wrap', flexShrink: 0 }}>
        <Meta label="SOURCE" value={sme.source || 'workspace'} />
        <Meta label="USAGE" value={`${sme.usage_count || 0} sessions`} />
        <Meta label="SEVERITY" value={sme.severity_default || '—'} />
        <Meta label="EXPERTISE" value={sme.expertise_level || '—'} />
        {sme.is_library_sme && <span style={{ padding: '2px 7px', borderRadius: 3, fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(46,204,113,0.12)', color: '#2ECC71', border: '1px solid rgba(46,204,113,0.3)' }}>LIBRARY</span>}
      </div>

      {/* Tags */}
      {sme.tags?.length > 0 && (
        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--wr-border)', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
          {sme.tags.map(t => (
            <span key={t} style={{ padding: '2px 7px', borderRadius: 3, border: '1px solid var(--wr-border)', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>{t}</span>
          ))}
        </div>
      )}

      {/* Vector weights */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--wr-border)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, flexShrink: 0 }}>
        {[['HUMAN', 'vector_human'], ['TECH', 'vector_technical'], ['PHYSICAL', 'vector_physical'], ['FUTURES', 'vector_futures']].map(([l, k]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', marginBottom: 3 }}>{l}</p>
            <div style={{ height: 4, backgroundColor: 'var(--wr-bg-primary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${sme[k] || 0}%`, backgroundColor: 'var(--wr-amber)', borderRadius: 2 }} />
            </div>
            <p style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-secondary)', marginTop: 2 }}>{sme[k] || 0}</p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FIELDS.map(({ key, label, rows }) => (
          <div key={key}>
            <label style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--wr-text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
            <textarea
              value={draft[key] || ''}
              onChange={e => set(key, e.target.value)}
              rows={rows}
              style={{ width: '100%', padding: '7px 10px', backgroundColor: 'var(--wr-bg-primary)', border: '1px solid var(--wr-border)', borderRadius: 4, color: 'var(--wr-text-primary)', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--wr-border)', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        {dirty && (
          <ActionBtn onClick={save} disabled={saving} color="var(--wr-amber)">{saving ? 'Saving…' : 'Save Changes'}</ActionBtn>
        )}
        {!sme.is_library_sme && onPromote && (
          <ActionBtn onClick={() => onPromote(sme.id)} color="#2ECC71">Promote to Library</ActionBtn>
        )}
        {onArchive && sme.status !== 'archived' && (
          <ActionBtn onClick={() => onArchive(sme.id)} color="#888">Archive</ActionBtn>
        )}
        {onDelete && (
          <ActionBtn onClick={() => onDelete(sme.id)} color="#C0392B">Delete</ActionBtn>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <p style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)', letterSpacing: '0.08em' }}>{label}</p>
      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-secondary)', fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function ActionBtn({ onClick, disabled, color, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 14px', borderRadius: 4, border: `1px solid ${color}40`,
        backgroundColor: `${color}12`, color, cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
