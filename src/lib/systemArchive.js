// System archive + danger-close reset.
//
// archiveWorkspace() serializes EVERY entity in the workspace to a single
// markdown document. resetWorkspace() clears everything EXCEPT domains and
// agents (the reusable library), deleting child rows before parents so foreign
// keys never block a delete.

// Every entity the workspace holds. Domains + Agents are preserved on reset.
const ALL_ENTITIES = [
  'Domain', 'Agent', 'Scenario', 'Threat', 'Chain', 'Session', 'SessionAgent',
  'SessionSynthesis', 'SessionMessage', 'SessionSource', 'Mitigation',
  'Decision', 'DecisionOption', 'DecisionAssumption',
  'KnowledgeDocument', 'KnowledgeChunk', 'AppConfig',
];

// Delete order for reset: children first so FK references are gone before the
// parent row. Domains and Agents are deliberately absent — they survive.
const RESET_ORDER = [
  'SessionSynthesis', 'SessionSource', 'SessionMessage', 'SessionAgent', 'Session',
  'Chain', 'Threat', 'Mitigation',
  'DecisionAssumption', 'DecisionOption', 'Decision',
  'KnowledgeChunk', 'KnowledgeDocument', 'Scenario', 'AppConfig',
];

// What reset clears, in human terms — shown in the confirmation dialog.
export const RESET_CLEARS = [
  'Sessions & all round assessments', 'Syntheses', 'Threats', 'Chains',
  'Mitigations', 'Decisions (options & assumptions)', 'Knowledge base',
  'Scenarios', 'Debate messages & sources', 'Saved analyses (app configs)',
];
export const RESET_KEEPS = ['Domains', 'Agents / SMEs'];

export async function fetchAll(db) {
  const out = {};
  for (const name of ALL_ENTITIES) {
    try { out[name] = (await db[name].list()) || []; }
    catch { out[name] = []; }
  }
  return out;
}

// ── Markdown helpers ──────────────────────────────────────────────────────────

function val(v) {
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) return v.length ? v.map(x => (typeof x === 'object' ? JSON.stringify(x) : x)).join(', ') : '—';
  if (typeof v === 'object') {
    const entries = Object.entries(v).filter(([, x]) => x != null && x !== '' && !(Array.isArray(x) && !x.length));
    if (!entries.length) return '—';
    return entries.map(([k, x]) => `${k}: ${Array.isArray(x) ? x.join('/') : (typeof x === 'object' ? JSON.stringify(x) : x)}`).join('; ');
  }
  return String(v);
}

function fmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'; } catch { return iso; }
}

// Render selected fields of an object as a bullet list.
function fields(obj, keys) {
  return keys
    .filter(([, k]) => obj[k] != null && obj[k] !== '' && !(Array.isArray(obj[k]) && !obj[k].length))
    .map(([label, k]) => `- **${label}:** ${val(obj[k])}`)
    .join('\n');
}

export function buildArchiveMarkdown(data, workspace) {
  const now = new Date();
  const L = [];
  const p = (s = '') => L.push(s);

  p(`# AgentDebate — System Archive`);
  p();
  p(`- **Workspace:** ${workspace?.name || '—'}`);
  p(`- **Generated:** ${now.toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  p();

  // Summary counts
  p(`## Contents`);
  p();
  p(`| Section | Count |`);
  p(`| --- | ---: |`);
  const countRow = (label, arr) => p(`| ${label} | ${arr.length} |`);
  countRow('Domains', data.Domain);
  countRow('Agents / SMEs', data.Agent);
  countRow('Scenarios', data.Scenario);
  countRow('Sessions', data.Session);
  countRow('Threats', data.Threat);
  countRow('Chains', data.Chain);
  countRow('Mitigations', data.Mitigation);
  countRow('Decisions', data.Decision);
  countRow('Knowledge documents', data.KnowledgeDocument);
  countRow('Saved analyses (app configs)', data.AppConfig);
  p();

  // Lookups
  const agentById = Object.fromEntries(data.Agent.map(a => [a.id, a]));
  const domainById = Object.fromEntries(data.Domain.map(d => [d.id, d]));

  // ── Domains ──
  p(`---`);
  p(`## Domains (${data.Domain.length})`);
  p();
  for (const d of data.Domain) {
    p(`### ${d.name || 'Unnamed domain'}`);
    p(fields(d, [['Description', 'description'], ['Color', 'color'], ['Created', 'created_at']]) || '- —');
    p();
  }

  // ── Agents / SMEs ──
  p(`---`);
  p(`## Agents / SMEs (${data.Agent.length})`);
  p();
  for (const a of data.Agent) {
    const dom = a.domain_id ? domainById[a.domain_id]?.name : null;
    p(`### ${a.name || 'Unnamed'}${a.discipline ? ` / ${a.discipline}` : ''}`);
    // Explicit field block (agents carry the most detail)
    const rows = [
      ['Domain', dom || '—'],
      ['Expertise level', a.expertise_level], ['Role type', a.role_type],
      ['Reasoning style', a.reasoning_style], ['Default severity', a.severity_default],
      ['Persona', a.persona_description], ['Professional background', a.professional_background],
      ['Institutional background', a.institutional_background],
      ['Cognitive bias', a.cognitive_bias], ['Debiasing instruction', a.debiasing_instruction],
      ['Red-team focus', a.red_team_focus], ['Adversary model', a.adversary_model],
      ['Epistemic style', a.epistemic_style], ['Source preferences', a.source_preferences],
      ['Analytical framework', a.analytical_framework],
      ['Decision style', a.decision_style], ['Conflict triggers', a.conflict_triggers],
      ['Institutional incentives', a.institutional_incentives],
      ['Domain fluency', a.domain_expertise], ['Expertise boundaries', a.expertise_boundaries],
      ['Tradecraft', a.tradecraft], ['Risk posture', a.risk_posture],
      ['Debate behavior', a.debate_behavior], ['Update triggers', a.update_triggers],
      ['Tags', a.tags],
    ];
    p(rows.filter(([, v]) => v != null && v !== '' && val(v) !== '—').map(([k, v]) => `- **${k}:** ${val(v)}`).join('\n') || '- —');
    p();
  }

  // ── Scenarios ──
  if (data.Scenario.length) {
    p(`---`);
    p(`## Scenarios (${data.Scenario.length})`);
    p();
    for (const s of data.Scenario) {
      p(`### ${s.name || 'Unnamed scenario'}`);
      p(fields(s, [['Status', 'status'], ['Description', 'description'], ['Tags', 'tags'], ['Created', 'created_at']]) || '- —');
      if (s.context_document) { p(); p(`> ${String(s.context_document).replace(/\n/g, '\n> ')}`); }
      p();
    }
  }

  // ── Sessions (with nested assessments, synthesis, sources) ──
  p(`---`);
  p(`## Sessions (${data.Session.length})`);
  p();
  const saBySession = groupBy(data.SessionAgent, 'session_id');
  const synBySession = groupBy(data.SessionSynthesis, 'session_id');
  const srcBySession = groupBy(data.SessionSource, 'session_id');
  const msgBySession = groupBy(data.SessionMessage, 'session_id');

  for (const s of data.Session) {
    p(`### ${s.name || 'Unnamed session'}`);
    p(fields(s, [['Status', 'status'], ['Mode', 'mode'], ['Phase focus', 'phase_focus'], ['Created', 'created_at']]) || '- —');
    p();

    const sas = saBySession[s.id] || [];
    if (sas.length) {
      p(`#### Assessments (${sas.length})`);
      for (const sa of sas) {
        const name = agentById[sa.agent_id]?.name || 'Unknown SME';
        p(`##### ${name}`);
        if (sa.round1_assessment) {
          p(`**Round 1** — severity ${val(sa.round1_severity)}${sa.round1_confidence != null ? `, confidence ${sa.round1_confidence}%` : ''}${sa.round1_likelihood ? `, L${sa.round1_likelihood}×I${sa.round1_impact}` : ''}`);
          p();
          p(sa.round1_assessment);
          p();
        }
        if (sa.round2_rebuttal) {
          p(`**Round 2** — severity ${val(sa.round2_revised_severity)}${sa.round2_confidence != null ? `, confidence ${sa.round2_confidence}%` : ''}${sa.round2_likelihood ? `, L${sa.round2_likelihood}×I${sa.round2_impact}` : ''}`);
          p();
          p(sa.round2_rebuttal);
          p();
        }
      }
    }

    const syns = synBySession[s.id] || [];
    for (const syn of syns) {
      if (syn.raw_text) { p(`#### Synthesis`); p(); p(syn.raw_text); p(); }
      const chains = toArr(syn.compound_chains);
      if (chains.length) {
        p(`#### Compound chains (${chains.length})`);
        chains.forEach((c, i) => {
          p(`${i + 1}. **${c.name || c.chain_name || `Chain ${i + 1}`}** — ${val(c.description)}`);
          (c.steps || []).forEach(st => p(`   - Step ${st.step_number || ''}: ${val(st.step_text)}`));
        });
        p();
      }
    }

    const srcs = srcBySession[s.id] || [];
    if (srcs.length) {
      p(`#### Sources cited (${srcs.length})`);
      for (const src of srcs) p(`- ${src.title || src.url || src.domain || 'source'}${src.credibility_tier ? ` (${src.credibility_tier})` : ''}${src.cited_claim ? ` — "${src.cited_claim}"` : ''}`);
      p();
    }

    const msgs = msgBySession[s.id] || [];
    if (msgs.length) {
      p(`#### Live debate transcript (${msgs.length} messages)`);
      for (const m of msgs) {
        const who = m.role === 'agent' ? (agentById[m.agent_id]?.name || 'Agent') : (m.role === 'user' ? 'Facilitator' : 'System');
        p(`- **${who}:** ${val(m.content)}`);
      }
      p();
    }
  }

  // ── Threats ──
  if (data.Threat.length) {
    p(`---`);
    p(`## Threats (${data.Threat.length})`);
    p();
    p(`| Severity | Name | Category | L×I | Description |`);
    p(`| --- | --- | --- | --- | --- |`);
    for (const t of data.Threat) {
      const li = t.likelihood && t.impact ? `${t.likelihood}×${t.impact}` : '—';
      p(`| ${val(t.severity)} | ${val(t.name)} | ${val(t.category)} | ${li} | ${escapeCell(t.description)} |`);
    }
    p();
  }

  // ── Chains ──
  if (data.Chain.length) {
    p(`---`);
    p(`## Chains (${data.Chain.length})`);
    p();
    for (const c of data.Chain) {
      p(`### ${c.name || 'Unnamed chain'}`);
      p(fields(c, [['Description', 'description'], ['Resilience', 'chain_resilience']]) || '');
      const steps = toArr(c.steps);
      steps.forEach((st, i) => p(`${i + 1}. ${val(st.step_text || st.text || st)}${st.agent_label ? ` — _${st.agent_label}_` : ''}`));
      p();
    }
  }

  // ── Mitigations ──
  if (data.Mitigation.length) {
    p(`---`);
    p(`## Mitigations (${data.Mitigation.length})`);
    p();
    for (const m of data.Mitigation) {
      p(`### ${m.title || 'Untitled mitigation'}`);
      p(fields(m, [
        ['Status', 'status'], ['Control type', 'control_type'], ['Effort', 'effort'],
        ['Time to deploy', 'time_to_deploy'], ['Owner', 'owner'], ['Effect', 'effect'],
        ['Description', 'description'], ['Notes', 'notes'],
      ]) || '- —');
      if (m.inherent_likelihood || m.residual_likelihood) {
        p(`- **Risk:** inherent ${m.inherent_likelihood || '?'}×${m.inherent_impact || '?'} → residual ${m.residual_likelihood || '?'}×${m.residual_impact || '?'}`);
      }
      p();
    }
  }

  // ── Decisions ──
  if (data.Decision.length) {
    p(`---`);
    p(`## Decisions (${data.Decision.length})`);
    p();
    const optByDec = groupBy(data.DecisionOption, 'decision_id');
    const asmByDec = groupBy(data.DecisionAssumption, 'decision_id');
    for (const d of data.Decision) {
      p(`### ${d.title || 'Untitled decision'}`);
      p(fields(d, [['Status', 'status'], ['Description', 'description'], ['Acceptance criteria', 'acceptance_criteria'], ['Rationale', 'decision_rationale'], ['Decided by', 'decided_by'], ['Decided at', 'decided_at']]) || '- —');
      const opts = optByDec[d.id] || [];
      if (opts.length) {
        p(`**Options:**`);
        for (const o of opts) p(`- ${o.name}${o.description ? ` — ${o.description}` : ''}${o.id === d.chosen_option_id ? ' ✅ (chosen)' : ''}`);
      }
      const asms = asmByDec[d.id] || [];
      if (asms.length) {
        p(`**Assumptions:**`);
        for (const a of asms) p(`- [${val(a.criticality)}/${val(a.status)}] ${a.text}`);
      }
      p();
    }
  }

  // ── Knowledge base ──
  if (data.KnowledgeDocument.length) {
    p(`---`);
    p(`## Knowledge base (${data.KnowledgeDocument.length} documents)`);
    p();
    const chunksByDoc = groupBy(data.KnowledgeChunk, 'document_id');
    for (const doc of data.KnowledgeDocument) {
      const n = (chunksByDoc[doc.id] || []).length;
      p(`### ${doc.title || 'Untitled document'}`);
      p(fields(doc, [['Source', 'source'], ['Tags', 'tags']]) || '');
      p(`- **Chunks:** ${n}`);
      if (doc.content) { p(); p(`> ${String(doc.content).slice(0, 2000).replace(/\n/g, '\n> ')}${doc.content.length > 2000 ? '…' : ''}`); }
      p();
    }
  }

  // ── App configs ──
  if (data.AppConfig.length) {
    p(`---`);
    p(`## Saved analyses / app configs (${data.AppConfig.length})`);
    p();
    for (const c of data.AppConfig) {
      p(`- **${c.key}**${c.label ? ` (${c.label})` : ''}: ${String(c.value || '').slice(0, 200)}${(c.value || '').length > 200 ? '…' : ''}`);
    }
    p();
  }

  p(`---`);
  p(`_End of archive — ${ALL_ENTITIES.reduce((n, k) => n + (data[k]?.length || 0), 0)} total records._`);

  return L.join('\n');
}

function groupBy(arr, key) {
  const m = {};
  for (const x of arr || []) (m[x[key]] = m[x[key]] || []).push(x);
  return m;
}
function toArr(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}
function escapeCell(s) {
  return String(s == null ? '—' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ').slice(0, 300);
}

// ── Reset ─────────────────────────────────────────────────────────────────────

// Delete everything except domains and agents. Children before parents so FK
// constraints never block. onProgress(entityName, deletedInThisEntity) fires
// after each entity is cleared.
export async function resetWorkspace(db, onProgress) {
  let deleted = 0;
  for (const name of RESET_ORDER) {
    let rows = [];
    try { rows = (await db[name].list()) || []; } catch { rows = []; }
    for (const r of rows) {
      try { await db[name].delete(r.id); deleted++; } catch { /* keep going */ }
    }
    onProgress?.(name, rows.length);
  }
  return { deleted };
}

// Trigger a browser download of a markdown string.
export function downloadMarkdown(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
