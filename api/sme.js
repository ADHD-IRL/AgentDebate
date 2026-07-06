// Vercel Edge Function — REST shim for the SME library.
// Allows non-MCP callers (Python scripts, CI, custom orchestrators) to call
// the same SME operations via HTTP.
//
// POST /api/sme
// Authorization: Bearer <sme_token>
// Body: { "tool": "search_smes", "params": { ... } }
export const config = { runtime: 'edge' };

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LIBRARY_WORKSPACE_ID = process.env.LIBRARY_WORKSPACE_ID || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

function sbHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Prefer': 'return=representation',
  };
}

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: { ...sbHeaders(), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'object' ? (data.message || JSON.stringify(data)) : data);
  return data;
}

async function resolveToken(token) {
  if (!token) throw new Error('No token provided');
  const rows = await sbFetch(`/sme_tokens?token=eq.${encodeURIComponent(token)}&select=workspace_id,permissions,expires_at&limit=1`);
  if (!rows || rows.length === 0) throw new Error('Invalid token');
  const row = rows[0];
  if (row.expires_at && new Date(row.expires_at) < new Date()) throw new Error('Token expired');
  // fire-and-forget last_used_at update
  sbFetch(`/sme_tokens?token=eq.${encodeURIComponent(token)}`, {
    method: 'PATCH',
    body: JSON.stringify({ last_used_at: new Date().toISOString() }),
  }).catch(() => {});
  return { workspace_id: row.workspace_id, permissions: row.permissions || ['read', 'write'] };
}

async function handleTool(tool, params, auth) {
  switch (tool) {
    case 'list_smes': {
      const { workspace_id, library_only, domain, limit = 20 } = params;
      let filter = library_only ? 'is_library_sme=eq.true' : workspace_id ? `workspace_id=eq.${workspace_id}` : 'is_library_sme=eq.true';
      if (domain) filter += `&discipline=ilike.*${encodeURIComponent(domain)}*`;
      return sbFetch(`/agents?${filter}&select=id,name,discipline,expertise_level,severity_default,scenario_tags,is_library_sme,usage_count,quality_score,source,workspace_id&order=quality_score.desc.nullslast&limit=${limit}`);
    }

    case 'get_sme': {
      const rows = await sbFetch(`/agents?id=eq.${params.id}&select=*&limit=1`);
      if (!rows.length) throw new Error('SME not found');
      return rows[0];
    }

    case 'search_smes': {
      const { capability, tags, library_only, workspace_id, limit = 10 } = params;
      let filter = library_only ? 'is_library_sme=eq.true' : workspace_id ? `workspace_id=eq.${workspace_id}` : 'is_library_sme=eq.true';
      if (capability) filter += `&persona_description=ilike.*${encodeURIComponent(capability)}*`;
      return sbFetch(`/agents?${filter}&select=id,name,discipline,persona_description,scenario_tags,is_library_sme,usage_count,quality_score,expertise_level,severity_default&order=quality_score.desc.nullslast&limit=${limit}`);
    }

    case 'create_sme': {
      if (!auth) throw new Error('workspace_token required');
      if (!auth.permissions.includes('write')) throw new Error('Write permission required');
      const { profile } = params;
      const rows = await sbFetch('/agents', {
        method: 'POST',
        body: JSON.stringify({ ...profile, workspace_id: auth.workspace_id, source: 'workspace', is_library_sme: false }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    case 'update_sme': {
      if (!auth) throw new Error('workspace_token required');
      const { id, fields } = params;
      const { id: _id, workspace_id: _ws, created_at: _ca, ...safe } = fields;
      const rows = await sbFetch(`/agents?id=eq.${id}&workspace_id=eq.${auth.workspace_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...safe, updated_at: new Date().toISOString() }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    case 'delete_sme': {
      if (!auth) throw new Error('workspace_token required');
      await sbFetch(`/agents?id=eq.${params.id}&workspace_id=eq.${auth.workspace_id}&is_library_sme=eq.false`, { method: 'DELETE' });
      return { deleted: true, id: params.id };
    }

    case 'clone_sme': {
      if (!auth) throw new Error('workspace_token required');
      const src = await sbFetch(`/agents?id=eq.${params.source_id}&select=*&limit=1`);
      if (!src.length) throw new Error('Source SME not found');
      const { id, created_at, updated_at, workspace_id: _ws, ...rest } = src[0];
      const rows = await sbFetch('/agents', {
        method: 'POST',
        body: JSON.stringify({ ...rest, ...(params.overrides || {}), workspace_id: auth.workspace_id, source: 'cloned', is_library_sme: false, cloned_from_id: params.source_id, usage_count: 0, quality_score: null }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    case 'promote_to_library': {
      if (!auth) throw new Error('workspace_token required');
      if (!LIBRARY_WORKSPACE_ID) throw new Error('LIBRARY_WORKSPACE_ID not configured');
      const src = await sbFetch(`/agents?id=eq.${params.agent_id}&workspace_id=eq.${auth.workspace_id}&select=*&limit=1`);
      if (!src.length) throw new Error('SME not found in workspace');
      const { id, created_at, updated_at, ...rest } = src[0];
      const rows = await sbFetch('/agents', {
        method: 'POST',
        body: JSON.stringify({ ...rest, workspace_id: LIBRARY_WORKSPACE_ID, source: 'library', is_library_sme: true, cloned_from_id: params.agent_id }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    case 'record_session_quality': {
      if (!auth) throw new Error('workspace_token required');
      const score = Math.min(100, Math.max(0, params.quality_score));
      const agent = await sbFetch(`/agents?id=eq.${params.agent_id}&select=usage_count,quality_score&limit=1`);
      if (!agent.length) throw new Error('SME not found');
      const prev = agent[0];
      const prevCount = prev.usage_count || 0;
      const prevScore = prev.quality_score ?? score;
      const newCount = prevCount + 1;
      const newScore = Math.round(((prevScore * prevCount) + score) / newCount * 10) / 10;
      const rows = await sbFetch(`/agents?id=eq.${params.agent_id}`, {
        method: 'PATCH',
        body: JSON.stringify({ usage_count: newCount, quality_score: newScore }),
      });
      return Array.isArray(rows) ? rows[0] : rows;
    }

    case 'generate_sme_for_scenario': {
      if (!auth) throw new Error('workspace_token required');
      // Call Anthropic to generate profile, then insert
      const count = Math.min(params.count || 2, 5);
      const disciplines = params.required_disciplines?.length
        ? params.required_disciplines.slice(0, count)
        : Array.from({ length: count }, (_, i) => `Expert ${i + 1} for ${params.scenario_name}`);

      const profiles = await Promise.all(disciplines.map(async (d) => {
        const prompt = buildGeneratePrompt(d, params);
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1800, messages: [{ role: 'user', content: prompt }] }),
        });
        const r = await resp.json();
        const text = r.content?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : text);
      }));

      const toInsert = profiles.map(p => ({
        ...p,
        workspace_id: auth.workspace_id,
        source: 'generated',
        is_library_sme: false,
        scenario_tags: [...(p.tags || []), ...(params.scenario_tags || [])],
        usage_count: 0,
        quality_score: null,
      }));

      const rows = await sbFetch('/agents', { method: 'POST', body: JSON.stringify(toInsert), headers: { 'Prefer': 'return=representation' } });
      return rows;
    }

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

function buildGeneratePrompt(discipline, params) {
  return `You are building an expert agent profile for the AgentDebate strategic analysis system.
Generate a detailed agent profile for the following expert type:

Expert type: ${discipline}
Key focus area: ${params.scenario_name}
Prior background hints: Relevant to: ${(params.scenario_description || '').slice(0, 300)}

Return a JSON object with exactly these fields:
{ "name": "short descriptive name", "discipline": "2-4 word discipline label", "persona_description": "3-4 sentences", "professional_background": "2-3 sentences", "cognitive_bias": "1-2 sentences", "red_team_focus": "2-3 sentences", "expertise_level": "Senior", "reasoning_style": "1-2 sentences", "severity_default": "HIGH", "vector_human": 50, "vector_technical": 50, "vector_physical": 30, "vector_futures": 40, "tags": ["tag1","tag2"], "epistemic_style": "1-2 sentences", "institutional_background": "1-2 sentences", "conflict_triggers": "1 sentence", "decision_style": "1 sentence", "adversary_model": "1 sentence", "institutional_incentives": "1 sentence", "analytical_framework": "1-2 sentences", "source_preferences": "1 sentence" }

Return ONLY the JSON object.`;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let auth = null;
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const body = await req.json().catch(() => null);
  if (!body?.tool) return new Response(JSON.stringify({ error: 'Body must include { tool, params }' }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });

  try {
    // Read-only tools don't require a token; write tools resolve it inside handleTool
    if (token) auth = await resolveToken(token);

    const result = await handleTool(body.tool, body.params || {}, auth);
    return new Response(JSON.stringify({ result }), { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
  }
}
