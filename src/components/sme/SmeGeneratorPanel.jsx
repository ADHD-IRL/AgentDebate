import { useState } from 'react';
import { useWorkspace } from '@/lib/WorkspaceContext';

export default function SmeGeneratorPanel({ onGenerated }) {
  const { db } = useWorkspace();
  const [form, setForm] = useState({
    scenario_name: '',
    scenario_description: '',
    count: 4,
    disciplines: '',
    scenario_tags: '',
  });
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!form.scenario_name.trim()) return;
    setGenerating(true);
    setError('');
    setResults(null);
    try {
      const tags = form.scenario_tags.split(',').map(t => t.trim()).filter(Boolean);
      const disciplines = form.disciplines.split('\n').map(d => d.trim()).filter(Boolean);
      const res = await fetch('/api/sme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'generate_sme_for_scenario',
          params: {
            scenario_name: form.scenario_name,
            scenario_description: form.scenario_description,
            count: form.count,
            scenario_tags: tags,
            required_disciplines: disciplines,
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.result || []);
      onGenerated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function promoteToLibrary(agentId) {
    await fetch('/api/sme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'promote_to_library', params: { agent_id: agentId } }),
    });
    setResults(r => r.map(s => s.id === agentId ? { ...s, is_library_sme: true } : s));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '16px 20px' }}>
        <p style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--wr-text-muted)', marginBottom: 16 }}>
          GENERATE SMEs FOR SCENARIO
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="SCENARIO NAME">
            <input
              value={form.scenario_name}
              onChange={e => setForm(f => ({ ...f, scenario_name: e.target.value }))}
              placeholder="e.g. TSMC Taiwan Earthquake"
              style={inputStyle}
            />
          </Field>
          <Field label="SCENARIO DESCRIPTION">
            <textarea
              value={form.scenario_description}
              onChange={e => setForm(f => ({ ...f, scenario_description: e.target.value }))}
              placeholder="Describe the scenario context, key actors, timeline, and risk vectors…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="SME COUNT">
              <input
                type="number"
                min={1} max={10}
                value={form.count}
                onChange={e => setForm(f => ({ ...f, count: Math.min(10, Math.max(1, Number(e.target.value))) }))}
                style={{ ...inputStyle, width: 80 }}
              />
            </Field>
            <Field label="SCENARIO TAGS (comma-separated)">
              <input
                value={form.scenario_tags}
                onChange={e => setForm(f => ({ ...f, scenario_tags: e.target.value }))}
                placeholder="semiconductor, geopolitical, supply-chain"
                style={inputStyle}
              />
            </Field>
          </div>
          <Field label="DISCIPLINES (one per line, optional — leave blank to auto-select)">
            <textarea
              value={form.disciplines}
              onChange={e => setForm(f => ({ ...f, disciplines: e.target.value }))}
              placeholder={`Adversarial Threat Intelligence\nSupply Chain Risk\nCyber Operations`}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
        </div>

        {error && <p style={{ fontSize: 11, color: '#C0392B', marginTop: 10 }}>{error}</p>}

        <button
          onClick={handleGenerate}
          disabled={generating || !form.scenario_name.trim()}
          style={{
            marginTop: 16, padding: '8px 20px', borderRadius: 4,
            border: '1px solid var(--wr-amber)', backgroundColor: 'rgba(240,165,0,0.12)',
            color: 'var(--wr-amber)', cursor: generating || !form.scenario_name.trim() ? 'not-allowed' : 'pointer',
            fontSize: 12, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            opacity: generating || !form.scenario_name.trim() ? 0.5 : 1,
          }}
        >
          {generating ? 'Generating…' : `Generate ${form.count} SME${form.count !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--wr-text-muted)', marginBottom: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            {results.length} SME{results.length !== 1 ? 's' : ''} generated and saved to your workspace
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {results.map(s => (
              <SmeResultCard key={s.id} sme={s} onPromote={promoteToLibrary} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--wr-text-muted)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function SmeResultCard({ sme, onPromote }) {
  return (
    <div style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)', borderRadius: 6, padding: '12px 14px' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--wr-text-primary)', marginBottom: 2 }}>{sme.name}</p>
      <p style={{ fontSize: 11, color: 'var(--wr-text-muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>{sme.discipline}</p>
      <p style={{ fontSize: 11.5, color: 'var(--wr-text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
        {(sme.persona_description || '').slice(0, 160)}…
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {(sme.tags || []).slice(0, 4).map(t => (
          <span key={t} style={{ padding: '2px 7px', borderRadius: 3, border: '1px solid var(--wr-border)', fontSize: 9.5, fontFamily: 'JetBrains Mono, monospace', color: 'var(--wr-text-muted)' }}>{t}</span>
        ))}
      </div>
      {!sme.is_library_sme ? (
        <button
          onClick={() => onPromote(sme.id)}
          style={{ padding: '4px 12px', borderRadius: 4, border: '1px solid rgba(240,165,0,0.4)', backgroundColor: 'rgba(240,165,0,0.08)', color: 'var(--wr-amber)', cursor: 'pointer', fontSize: 10.5, fontFamily: 'JetBrains Mono, monospace' }}
        >
          Promote to Library
        </button>
      ) : (
        <span style={{ fontSize: 10.5, color: '#2ECC71', fontFamily: 'JetBrains Mono, monospace' }}>✓ In Library</span>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  backgroundColor: 'var(--wr-bg-secondary)',
  border: '1px solid var(--wr-border)',
  borderRadius: 4,
  color: 'var(--wr-text-primary)',
  fontSize: 12,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
