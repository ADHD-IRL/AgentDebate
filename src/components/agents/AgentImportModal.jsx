import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import WrButton from '@/components/ui/WrButton';
import { useWorkspace } from '@/lib/WorkspaceContext';

// ─── Format Guide ────────────────────────────────────────────────────────────

const FORMAT_EXAMPLE = `## Counterintelligence / HUMINT Officer

**Persona:** Former DIA counterintelligence officer with 22 years...

**Cognitive Bias:** Overweights human collection vectors...

**Primary Focus:** Foreign adversary elicitation of key personnel...

**Severity:** HIGH

**Vectors:**
- Human: 85
- Technical: 40
- Physical: 50
- Futures: 30

**Tags:** HUMINT, counterintelligence, insider-threat

**Domain Tags:** DoD, National Security

---

## All-Source Intelligence Analyst

**Persona:** Career CIA all-source analyst...

**Cognitive Bias:** Confirmation bias in evaluation...

**Primary Focus:** Geopolitical intelligence gaps...

**Severity:** HIGH

**Vectors:**
- Human: 70
- Technical: 60
- Physical: 40
- Futures: 50

**Tags:** OSINT, analysis, geopolitical

**Domain Tags:** DoD, National Security`;

// ─── Parser ──────────────────────────────────────────────────────────────────

function parseCategoryHeader(lines) {
  // Category line: "# Category XY — Some Name" or "# XY — Some Name"
  for (const line of lines) {
    const m = line.match(/^#\s+(?:Category\s+\w+\s+[—–-]+\s+)?(.+)/i);
    if (m && !line.startsWith('## ')) {
      // Pull just a clean category name
      const raw = m[1].trim();
      // Strip leading "Category XX —" patterns
      const cleaned = raw.replace(/^Category\s+\w+\s*[—–-]+\s*/i, '').trim();
      if (cleaned && !cleaned.match(/^\d+ Agents/i) && !cleaned.match(/^These agents/i)) {
        return cleaned;
      }
    }
  }
  return null;
}

function getSection(lines, startIdx, label) {
  // Check for inline value on the same line
  const sameLine = lines[startIdx].replace(new RegExp(`.*\\*\\*${label}:\\*\\*\\s*`, 'i'), '').trim();
  if (sameLine) return sameLine;
  // Gather continuation lines
  const result = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^\*\*\w/.test(lines[i]) || /^#{1,3}\s/.test(lines[i]) || /^---/.test(lines[i])) break;
    if (lines[i].trim()) result.push(lines[i].replace(/^-\s*/, '').trim());
  }
  return result.join(' ') || null;
}

function parseAgentBlock(blockLines) {
  const agent = {
    name: '', discipline: '', persona_description: '', cognitive_bias: '',
    red_team_focus: '', severity_default: 'HIGH',
    vector_human: 50, vector_technical: 50, vector_physical: 30, vector_futures: 40,
    tags: [], is_ai_generated: false, domain_tags: [],
  };

  // Name from ## heading: "## LIB-IC01 — Some Name" → "Some Name"
  const h2 = blockLines.find(l => l.startsWith('## '));
  if (h2) {
    const nameMatch = h2.match(/^##\s+(?:[\w-]+\s+[—–-]+\s+)?(.+)/);
    if (nameMatch) {
      agent.name = nameMatch[1].trim();
      // Use the ID portion as a prefix tag
      const idMatch = h2.match(/^##\s+([\w-]+)\s+[—–-]/);
      if (idMatch) agent._id_prefix = idMatch[1];
    }
    // Discipline = last part of name (after the slash or comma if present)
    const discMatch = agent.name.match(/[\/,]\s*(.+)$/);
    agent.discipline = discMatch ? discMatch[1].trim() : agent.name;
  }

  const lines = blockLines;

  const findAndGet = (label) => {
    const idx = lines.findIndex(l => new RegExp(`\\*\\*${label}:\\*\\*`, 'i').test(l));
    if (idx === -1) return null;
    return getSection(lines, idx, label);
  };

  const persona = findAndGet('Persona');
  if (persona) agent.persona_description = persona;

  const bias = findAndGet('Cognitive Bias');
  if (bias) agent.cognitive_bias = bias;

  // Primary Focus → red_team_focus
  const focus = findAndGet('Primary Focus') || findAndGet('Red Team Focus') || findAndGet('Red-Team Focus');
  if (focus) agent.red_team_focus = focus;

  // Severity
  const sev = findAndGet('Severity');
  if (sev) {
    const s = sev.toUpperCase();
    if (['CRITICAL','HIGH','MEDIUM','LOW'].includes(s)) agent.severity_default = s;
  }

  // Vectors section
  const vecIdx = lines.findIndex(l => /\*\*Vectors:\*\*/i.test(l));
  if (vecIdx !== -1) {
    for (let i = vecIdx; i < Math.min(vecIdx + 8, lines.length); i++) {
      const l = lines[i];
      const h = l.match(/human:\s*(\d+)/i); if (h) agent.vector_human = parseInt(h[1]);
      const t = l.match(/technical:\s*(\d+)/i); if (t) agent.vector_technical = parseInt(t[1]);
      const p = l.match(/physical:\s*(\d+)/i); if (p) agent.vector_physical = parseInt(p[1]);
      const f = l.match(/futures:\s*(\d+)/i); if (f) agent.vector_futures = parseInt(f[1]);
    }
  }

  // Tags
  const tagsLine = findAndGet('Tags');
  if (tagsLine) {
    agent.tags = tagsLine.split(',').map(t => t.trim()).filter(Boolean);
  }

  // Domain Tags — used to match/create domains
  const domainTagsLine = findAndGet('Domain Tags');
  if (domainTagsLine) {
    // "All domains" → special marker
    if (/all domains/i.test(domainTagsLine)) {
      agent.domain_tags = ['_ALL_'];
    } else {
      agent.domain_tags = domainTagsLine.split(/[,;]/).map(t => t.trim()).filter(Boolean);
    }
  }

  return agent;
}

export function parseMultiAgentMarkdown(text) {
  const lines = text.split('\n');
  const categoryName = parseCategoryHeader(lines);

  // Split into per-agent blocks by ## headings
  const blocks = [];
  let current = [];
  for (const line of lines) {
    if (line.startsWith('## ') && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0 && current.some(l => l.startsWith('## '))) blocks.push(current);

  const agents = blocks
    .map(parseAgentBlock)
    .filter(a => a.name);

  return { categoryName, agents };
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

const DOMAIN_COLORS = ['#F0A500','#2E86AB','#27AE60','#C0392B','#7B2D8B','#E67E22','#16A085','#8E44AD'];

async function resolveOrCreateDomain(name, existingDomains, createdCache, db) {
  const key = name.toLowerCase().trim();
  if (createdCache[key]) return createdCache[key];
  const existing = existingDomains.find(d => d.name.toLowerCase() === key);
  if (existing) { createdCache[key] = existing.id; return existing.id; }
  const color = DOMAIN_COLORS[Object.keys(createdCache).length % DOMAIN_COLORS.length];
  const created = await db.Domain.create({ name, color, description: `Auto-created during agent import` });
  createdCache[key] = created.id;
  return created.id;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AgentImportModal({ existingDomains, onClose, onDone }) {
  const { db } = useWorkspace();
  const [showFormat, setShowFormat] = useState(false);
  const [parsed, setParsed] = useState(null); // { categoryName, agents }
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const fileRef = useRef();

  const handleFiles = (files) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const { categoryName, agents } = parseMultiAgentMarkdown(e.target.result);
      if (agents.length === 0) {
        setErrors(['No agents found. Make sure each agent starts with a ## heading.']);
      } else {
        setParsed({ categoryName, agents });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleImport = async () => {
    setImporting(true);
    const createdDomains = {};
    let count = 0;

    // Always fetch fresh domains before import to avoid stale cache issues
    const freshDomains = await db.Domain.list();

    for (const agent of parsed.agents) {
      let domain_id = null;

      // Use only domain tags (first one if multiple)
      const domainName = agent.domain_tags[0] !== '_ALL_' ? agent.domain_tags[0] : null;

      if (domainName) {
        domain_id = await resolveOrCreateDomain(domainName, freshDomains, createdDomains, db);
      }

      const { domain_tags, _id_prefix, ...agentData } = agent;
      await db.Agent.create({ ...agentData, domain_id });
      count++;
    }

    setImportCount(count);
    setImporting(false);
    setDone(true);
    onDone(); // reload parent
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="w-[620px] max-h-[90vh] overflow-y-auto rounded-lg" style={{ backgroundColor: 'var(--wr-bg-card)', border: '1px solid var(--wr-border)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
          <h2 className="text-sm font-bold tracking-widest font-mono" style={{ color: 'var(--wr-amber)' }}>IMPORT AGENTS</h2>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--wr-text-muted)' }} /></button>
        </div>

        <div className="p-6 space-y-5">

          {/* Format Guide */}
          <div className="rounded" style={{ border: '1px solid var(--wr-border)', backgroundColor: 'var(--wr-bg-secondary)' }}>
            <button
              onClick={() => setShowFormat(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold tracking-widest font-mono"
              style={{ color: 'var(--wr-text-secondary)' }}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--wr-amber)' }} />
                MARKDOWN FORMAT GUIDE
              </span>
              {showFormat ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showFormat && (
              <div className="px-4 pb-4 border-t space-y-4" style={{ borderColor: 'var(--wr-border)' }}>
                <div className="mt-3 space-y-2 text-xs" style={{ color: 'var(--wr-text-secondary)' }}>
                  <p>A single <code className="px-1 rounded" style={{ backgroundColor: 'var(--wr-bg-card)', color: 'var(--wr-amber)' }}>.md</code> file can contain <strong>one or many agents</strong>.</p>
                  <p><strong style={{ color: 'var(--wr-text-primary)' }}>File structure:</strong></p>
                  <ul className="space-y-1.5 ml-2">
                    <li><span style={{ color: 'var(--wr-amber)' }}>## Agent Name</span> — H2 heading starts each agent and becomes the agent's display name <span style={{ color: '#C0392B' }}>(required)</span></li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Persona:**</span> — who this expert is and how they think</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Cognitive Bias:**</span> — what they systematically underweight</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Primary Focus:**</span> — what they hunt for (maps to Red Team Focus)</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Severity:**</span> — CRITICAL / HIGH / MEDIUM / LOW (default: HIGH)</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Vectors:**</span> — Human / Technical / Physical / Futures (0–100 each)</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Tags:**</span> — comma-separated keyword tags</li>
                    <li><span style={{ color: 'var(--wr-amber)' }}>**Domain Tags:**</span> — comma-separated domain names to assign agents <span style={{ color: '#C0392B' }}>(required)</span></li>
                  </ul>
                  <p className="text-xs pt-1" style={{ color: 'var(--wr-text-muted)' }}>
                   Domains are matched by name (case-insensitive) or auto-created if they don't exist. If an agent has multiple domain tags, the first one will be used. Other fields are safely ignored.
                  </p>
                </div>
                <pre className="text-xs rounded p-3 overflow-x-auto" style={{ backgroundColor: 'var(--wr-bg-primary)', color: 'var(--wr-text-secondary)', border: '1px solid var(--wr-border)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap' }}>
{FORMAT_EXAMPLE}
                </pre>
              </div>
            )}
          </div>

          {/* Drop Zone */}
          {!done && (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              className="rounded border-2 border-dashed flex flex-col items-center justify-center py-10 cursor-pointer transition-colors hover:border-amber-500/50"
              style={{ borderColor: parsed ? 'rgba(240,165,0,0.4)' : 'var(--wr-border)' }}
            >
              <Upload className="w-8 h-8 mb-3" style={{ color: parsed ? 'var(--wr-amber)' : 'var(--wr-text-muted)' }} />
              {parsed ? (
                <p className="text-sm font-medium" style={{ color: 'var(--wr-amber)' }}>{fileName} — click to replace</p>
              ) : (
                <>
                  <p className="text-sm font-medium" style={{ color: 'var(--wr-text-secondary)' }}>Drop a .md file here or click to browse</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--wr-text-muted)' }}>Single file containing one or more agents</p>
                </>
              )}
              <input ref={fileRef} type="file" accept=".md,.txt" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </div>
          )}

          {/* Errors */}
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded" style={{ backgroundColor: 'rgba(192,57,43,0.1)', color: '#C0392B', border: '1px solid rgba(192,57,43,0.2)' }}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {e}
            </div>
          ))}

          {/* Preview */}
          {parsed && !done && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-widest font-mono" style={{ color: 'var(--wr-text-muted)' }}>
                  READY TO IMPORT — {parsed.agents.length} AGENT{parsed.agents.length !== 1 ? 'S' : ''}
                </p>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {parsed.agents.map((agent, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded" style={{ backgroundColor: 'var(--wr-bg-secondary)', border: '1px solid var(--wr-border)' }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--wr-text-primary)' }}>{agent.name}</p>
                      <p className="text-xs" style={{ color: 'var(--wr-text-muted)' }}>{agent.discipline}</p>
                    </div>
                    <span className="ml-3 text-xs px-2 py-0.5 rounded font-bold font-mono flex-shrink-0"
                      style={{
                        backgroundColor: `${{'CRITICAL':'#C0392B','HIGH':'#D68910','MEDIUM':'#2E86AB','LOW':'#27AE60'}[agent.severity_default]}22`,
                        color: {'CRITICAL':'#C0392B','HIGH':'#D68910','MEDIUM':'#2E86AB','LOW':'#27AE60'}[agent.severity_default]
                      }}>
                      {agent.severity_default}
                    </span>
                  </div>
                ))}
              </div>
              {parsed.agents.some(a => !a.domain_tags.length) && (
               <p className="text-xs" style={{ color: '#C0392B' }}>
                 ⚠ Some agents are missing Domain Tags. All agents must have at least one domain tag to be imported.
               </p>
              )}
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="flex flex-col items-center py-8 gap-3">
              <CheckCircle2 className="w-10 h-10" style={{ color: '#27AE60' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--wr-text-primary)' }}>
                {importCount} agent{importCount !== 1 ? 's' : ''} imported successfully
              </p>

              <WrButton onClick={onClose}>Done</WrButton>
            </div>
          )}
        </div>

        {/* Footer */}
        {!done && parsed && (
          <div className="sticky bottom-0 flex justify-end gap-2 px-6 py-4 border-t" style={{ backgroundColor: 'var(--wr-bg-card)', borderColor: 'var(--wr-border)' }}>
            <WrButton variant="secondary" onClick={onClose}>Cancel</WrButton>
            <WrButton onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : `Import ${parsed.agents.length} Agent${parsed.agents.length !== 1 ? 'S' : ''}`}
            </WrButton>
          </div>
        )}
      </div>
    </div>
  );
}