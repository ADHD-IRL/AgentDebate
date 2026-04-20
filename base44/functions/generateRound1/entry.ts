import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const ANTHROPIC_MODEL_MAP = {
  'claude_sonnet_4_6': 'claude-sonnet-4-5',
  'claude_opus_4_6': 'claude-opus-4-5',
  'claude_haiku': 'claude-3-haiku-20240307',
};
const DEFAULT_MODEL = 'claude-sonnet-4-5';

async function getModel(base44, workspace_id) {
  const filter = workspace_id ? { key: 'llm_model', workspace_id } : { key: 'llm_model' };
  const configs = await base44.asServiceRole.entities.AppConfig.filter(filter);
  const val = configs[0]?.value;
  return ANTHROPIC_MODEL_MAP[val] || DEFAULT_MODEL;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { agent, scenarioContext, phaseFocus, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    const expertiseLine = agent.expertise_level ? `Expertise level: ${agent.expertise_level}` : '';
    const backgroundLine = agent.professional_background ? `Professional background: ${agent.professional_background}` : '';
    const reasoningLine = agent.reasoning_style ? `Reasoning style: ${agent.reasoning_style} — let this shape your argumentation and tone.` : '';

    const prompt = `You are ${agent.name}, ${agent.persona_description}
${backgroundLine}
${expertiseLine}
${reasoningLine}

Your cognitive bias: ${agent.cognitive_bias}
Your red-team focus: ${agent.red_team_focus}

SCENARIO CONTEXT:
${scenarioContext}

PHASE/FOCUS: ${phaseFocus || 'General analysis'}

Write a Round 1 independent threat/scenario assessment (600-900 words) covering:
1. Opening position — your primary framing of the situation from your discipline
2. Threat/Finding 1 — with specific mechanism, what defenders/analysts are missing, and severity (CRITICAL/HIGH/MEDIUM) with rationale
3. Threat/Finding 2 — same structure
4. Threat/Finding 3 — same structure
5. Invalidating assumption — one assumption that if wrong would change your entire assessment
6. Key finding — one-sentence bottom line

After your assessment, on the very last line output exactly:
SEVERITY: [CRITICAL|HIGH|MEDIUM|LOW]

Write in first person as the expert. Be specific, opinionated, and willing to disagree with conventional wisdom.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) return Response.json({ error: data.error?.message || 'API error', details: data }, { status: 500 });
    const fullText = data.content[0].text.trim();
    
    const lines = fullText.split('\n');
    let severity = agent.severity_default || 'HIGH';
    let assessment = fullText;
    
    const lastLine = lines[lines.length - 1];
    const sevMatch = lastLine.match(/SEVERITY:\s*(CRITICAL|HIGH|MEDIUM|LOW)/i);
    if (sevMatch) {
      severity = sevMatch[1].toUpperCase();
      assessment = lines.slice(0, -1).join('\n').trim();
    }

    return Response.json({ assessment, severity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});