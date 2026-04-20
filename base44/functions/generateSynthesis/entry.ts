import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

const ANTHROPIC_MODEL_MAP = {
  'claude_sonnet_4_6': 'claude-sonnet-4-5',
  'claude_opus_4_6': 'claude-sonnet-4-5', // opus too slow, fall back to sonnet
  'claude_haiku': 'claude-3-haiku-20240307',
};
const DEFAULT_MODEL = 'claude-3-haiku-20240307';

async function getModel(base44, workspace_id) {
  const filter = workspace_id ? { key: 'llm_model', workspace_id } : { key: 'llm_model' };
  const configs = await base44.asServiceRole.entities.AppConfig.filter(filter);
  const val = configs[0]?.value;
  return ANTHROPIC_MODEL_MAP[val] || DEFAULT_MODEL;
}

// Parse a section out of the markdown synthesis text
function extractSection(text, heading) {
  const regex = new RegExp(`##\\s*${heading}[\\s\\S]*?(?=\\n---\\n|\\n## |$)`, 'i');
  const match = text.match(regex);
  if (!match) return '';
  // Remove the heading line itself
  return match[0].replace(/^##[^\n]*\n/, '').trim();
}

// Parse compound chains section into structured chain objects
function parseCompoundChains(chainsText) {
  if (!chainsText) return [];

  // If the section indicates inability to generate, skip
  if (/unable to generate|no.*assessment|no.*data/i.test(chainsText)) return [];

  const chains = [];

  // Split on chain headings: "### Chain Name", "**Chain Name**", or "1. Chain Name" on their own line
  const blocks = chainsText.split(/\n(?=###\s|(?:\d+\.|\*\*)[^\n]+)/).filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;

    // Extract chain name from first line (strip markdown markers)
    const rawTitle = lines[0].replace(/^(###|\d+\.|\*\*)\s*/, '').replace(/\*\*/g, '').trim();
    if (!rawTitle || rawTitle.length < 3) continue;

    // Everything after the title becomes the description / steps text
    const bodyText = lines.slice(1).join('\n').trim();

    // Extract steps: lines starting with "Step N:" or "→" or numbered list
    const stepLines = bodyText.split('\n').filter(l =>
      /^(step\s*\d+|→|\d+\.|[-•])/i.test(l.trim())
    );

    const steps = stepLines.map((line, i) => ({
      step_number: i + 1,
      agent_id: '',
      agent_label: '',
      step_text: line.replace(/^(step\s*\d+[:\-]?|→|\d+\.|[-•])\s*/i, '').trim(),
    })).filter(s => s.step_text.length > 0);

    chains.push({
      name: rawTitle,
      description: bodyText.substring(0, 300),
      steps,
    });
  }

  return chains;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { session, sessionAgents, scenarioContext, workspace_id } = await req.json();
    const model = await getModel(base44, workspace_id);

    // Truncate context to avoid timeout on large inputs
    const truncatedContext = (scenarioContext || '').substring(0, 3000);

    const agentsText = sessionAgents.map(sa => {
      const parts = [`=== ${sa.agentName} (${sa.discipline}) ===`];
      if (sa.round1_assessment) {
        parts.push(`ROUND 1 [${sa.round1_severity}]:`);
        parts.push((sa.round1_assessment || '').substring(0, 800));
      }
      if (sa.round2_rebuttal) {
        parts.push(`\nROUND 2 [${sa.round2_revised_severity}]:`);
        parts.push((sa.round2_rebuttal || '').substring(0, 600));
      }
      return parts.join('\n');
    }).join('\n\n---\n\n');

    const prompt = `You are the WARROOM synthesis engine. You have received all agent assessments from a structured two-round red team analysis session.

Session: ${session.name}
Phase Focus: ${session.phase_focus || 'General'}

Scenario Context:
${truncatedContext}

ALL AGENT ASSESSMENTS:
${agentsText}

Generate a comprehensive synthesis report covering:

## CONSENSUS FINDINGS
(Points that multiple agents agreed on, sorted by severity)

## CONTESTED FINDINGS  
(Points of significant disagreement between agents — format as "Agent A vs Agent B: [the disagreement]")

## COMPOUND CHAINS
(Multi-step threat sequences that emerged from agents building on each other's work. Format each chain EXACTLY as:
### [Chain Name]
Step 1: [description]
Step 2: [description]
Step 3: [description]
List 2-4 chains. Each must have at least 3 steps.)

## BLIND SPOTS
(Areas or threat vectors that no agent adequately covered)

## PRIORITY MITIGATIONS
(Numbered list of recommended immediate actions, based on the highest-severity consensus findings)

## SHARPEST INSIGHTS
(5 most important or surprising specific statements from individual agents, with attribution)

Write analytically. Be specific. Cite agents by name. The synthesis should be more insightful than any individual assessment.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok || data.error) return Response.json({ error: data.error?.message || 'API error', details: data }, { status: 500 });
    const synthesis = data.content[0].text.trim();

    // Parse compound chains from the synthesis text
    const chainsSection = extractSection(synthesis, 'COMPOUND CHAINS');
    const parsedChains = parseCompoundChains(chainsSection);

    // Create Chain entities in the database for each compound chain
    const createdChains = [];
    for (const chain of parsedChains) {
      const newChain = await base44.asServiceRole.entities.Chain.create({
        name: chain.name,
        description: chain.description,
        steps: chain.steps,
        scenario_id: session.scenario_id || '',
        session_id: session.id,
        is_ai_generated: true,
        tags: ['synthesis', 'compound-chain'],
        ...(workspace_id ? { workspace_id } : {}),
      });
      createdChains.push(newChain);
    }

    // Upload synthesis text as a file to avoid entity field size limits
    const file = new File([synthesis], `synthesis-${session.id}.txt`, { type: 'text/plain' });
    const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const synthesis_url = uploadRes.file_url;

    return Response.json({ synthesis_url, synthesis, compound_chains: parsedChains, chains_created: createdChains.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});