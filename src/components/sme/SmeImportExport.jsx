import { useState, useRef } from 'react';

export default function SmeImportExport({ smes = [], onImport }) {
  const [preview, setPreview] = useState(null);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  function handleExportJSON(subset) {
    const data = subset || smes;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sme-export.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportCSV() {
    if (!smes.length) return;
    const fields = ['id', 'name', 'discipline', 'expertise_level', 'quality_score', 'usage_count', 'source', 'is_library_sme', 'status', 'created_at'];
    const header = fields.join(',');
    const rows = smes.map(s => fields.map(f => {
      const v = s[f]; if (v == null) return '';
      return typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sme-export.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e) {
    setImportError('');
    setPreview(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        setPreview(arr);
      } catch {
        setImportError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!preview?.length || !onImport) return;
    setImporting(true);
    try {
      await onImport(preview);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setImportError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Export */}
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '16px 20px' }}>
        <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 12 }}>
          EXPORT
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => handleExportJSON()}>Download All as JSON</Btn>
          <Btn onClick={handleExportCSV}>Download All as CSV</Btn>
        </div>
        <p style={{ fontSize: 10.5, color: 'var(--wr-text-muted)', marginTop: 10 }}>
          Exports all {smes.length} SMEs currently loaded in this view.
        </p>
      </div>

      {/* Import */}
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '16px 20px' }}>
        <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 12 }}>
          IMPORT FROM JSON
        </p>
        <div
          style={{
            border: '2px dashed var(--wr-border)', borderRadius: 6, padding: '20px',
            textAlign: 'center', cursor: 'pointer', marginBottom: 12,
          }}
          onClick={() => fileRef.current?.click()}
        >
          <p style={{ fontSize: 12, color: 'var(--wr-text-secondary)' }}>Click to select a JSON file</p>
          <p style={{ fontSize: 10.5, color: 'var(--wr-text-muted)', marginTop: 4 }}>Array of SME objects exported from AgentDebate</p>
        </div>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

        {importError && (
          <p style={{ fontSize: 11, color: '#C0392B', marginBottom: 8 }}>{importError}</p>
        )}

        {preview && (
          <div>
            <p style={{ fontSize: 11, color: 'var(--wr-text-secondary)', marginBottom: 10 }}>
              {preview.length} SME{preview.length !== 1 ? 's' : ''} ready to import:
            </p>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--wr-border)', borderRadius: 4, padding: 8, marginBottom: 12 }}>
              {preview.map((s, i) => (
                <div key={i} style={{ fontSize: 11, padding: '3px 0', borderBottom: '1px solid var(--wr-border)', color: 'var(--wr-text-secondary)' }}>
                  <strong style={{ color: 'var(--wr-text-primary)' }}>{s.name || '(unnamed)'}</strong> — {s.discipline || '(no discipline)'}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={confirmImport} disabled={importing}>
                {importing ? 'Importing…' : `Import ${preview.length} SME${preview.length !== 1 ? 's' : ''}`}
              </Btn>
              <Btn onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}>Cancel</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 16px', borderRadius: 4, border: '1px solid var(--wr-border)',
        backgroundColor: 'var(--wr-bg-secondary)', color: 'var(--wr-text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}
