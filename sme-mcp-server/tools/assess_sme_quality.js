import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';
import Anthropic from '@anthropic-ai/sdk';

export const schema = {
  name: 'assess_sme_quality',
  description: 'Use AI to evaluate an SME profile\'s completeness, specificity, and analytical value. Returns a quality score (0-100), gaps, strengths, and recommendations. Can optionally write the score back to the database.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'agent_id'],
    properties: {
      workspace_token: { type: 'string' },
      agent_id: { type: 'string', description: 'UUID of the SME to assess' },
      persist_score: { type: 'boolean', description: 'Write the AI-generated score back to quality_score field (default false)' },
    },
  },
};

export async function handler({ workspace_token, agent_id, persist_score = false }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { data: agent, error: fetchErr } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agent_id)
    .single();
  if (fetchErr || !agent) throw new Error('SME not found');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are evaluating the completeness and quality of a Subject Matter Expert (SME) profile for strategic analysis debates.

Profile:
Name: ${agent.name}
Discipline: ${agent.discipline}
Persona Description: ${agent.persona_description || '(missing)'}
Professional Background: ${agent.professional_background || '(missing)'}
Cognitive Bias: ${agent.cognitive_bias || '(missing)'}
Red-Team Focus: ${agent.red_team_focus || '(missing)'}
Epistemic Style: ${agent.epistemic_style || '(missing)'}
Institutional Background: ${agent.institutional_background || '(missing)'}
Conflict Triggers: ${agent.conflict_triggers || '(missing)'}
Decision Style: ${agent.decision_style || '(missing)'}
Adversary Model: ${agent.adversary_model || '(missing)'}
Institutional Incentives: ${agent.institutional_incentives || '(missing)'}
Analytical Framework: ${agent.analytical_framework || '(missing)'}
Source Preferences: ${agent.source_preferences || '(missing)'}
Tags: ${(agent.tags || []).join(', ') || '(none)'}

— Human-matching dimensions (weight these HIGHEST; they most separate a bona fide expert from a confident generalist) —
Domain Fluency: ${JSON.stringify(agent.domain_expertise || {})}
Expertise Boundaries (strong/weak/defer_to/forbidden_overreach): ${JSON.stringify(agent.expertise_boundaries || {})}
Debiasing Instruction (should pair with the cognitive bias): ${agent.debiasing_instruction || '(missing)'}
Tradecraft (indicators/false_positives/failure_modes): ${JSON.stringify(agent.tradecraft || {})}
Risk Posture (FP/FN asymmetry): ${JSON.stringify(agent.risk_posture || {})}
Debate Behavior: ${JSON.stringify(agent.debate_behavior || {})}
Belief-Update Rules: ${JSON.stringify(agent.update_triggers || {})}

Score on 0-100 based on completeness, specificity, consistency, distinctiveness, and — weighted HIGHEST — human-matching depth: does it declare competence boundaries and defer outside them, pair its bias with a debiasing habit, express a false-negative/false-positive asymmetry, and give concrete belief-update rules? A profile missing these should not score above 70 however polished its prose.

Return ONLY this JSON:
{
  "score": 75,
  "summary": "2-3 sentence assessment",
  "gaps": ["specific missing or weak fields"],
  "strengths": ["what this profile does well"],
  "recommendations": ["actionable improvements"]
}`;

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  const assessment = JSON.parse(match ? match[0] : text);

  if (persist_score && typeof assessment.score === 'number') {
    const prev = agent.usage_count || 0;
    const prevScore = agent.quality_score ?? assessment.score;
    const newScore = prev > 0
      ? Math.round(((prevScore * prev) + assessment.score) / (prev + 1) * 10) / 10
      : assessment.score;
    await supabase
      .from('agents')
      .update({ quality_score: newScore, updated_at: new Date().toISOString() })
      .eq('id', agent_id);
    assessment.persisted_score = newScore;
  }

  return { agent_id, agent_name: agent.name, ...assessment };
}
