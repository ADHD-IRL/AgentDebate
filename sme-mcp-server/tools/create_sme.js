import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'create_sme',
  description: 'Create a new SME profile in a workspace. Requires a workspace token.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'profile'],
    properties: {
      workspace_token: { type: 'string', description: 'SME API token for the target workspace' },
      profile: {
        type: 'object',
        required: ['name', 'discipline'],
        description: 'SME profile fields. Required: name, discipline.',
        properties: {
          name: { type: 'string' },
          discipline: { type: 'string' },
          persona_description: { type: 'string' },
          professional_background: { type: 'string' },
          expertise_level: { type: 'string' },
          reasoning_style: { type: 'string' },
          cognitive_bias: { type: 'string' },
          red_team_focus: { type: 'string' },
          severity_default: { type: 'string' },
          epistemic_style: { type: 'string' },
          institutional_background: { type: 'string' },
          conflict_triggers: { type: 'string' },
          decision_style: { type: 'string' },
          adversary_model: { type: 'string' },
          institutional_incentives: { type: 'string' },
          analytical_framework: { type: 'string' },
          source_preferences: { type: 'string' },
          role_type: { type: 'string', description: 'sme | red-team | devil\'s-advocate | facilitator' },
          debiasing_instruction: { type: 'string', description: 'the self-correction habit countering cognitive_bias' },
          domain_expertise: { type: 'object', description: 'scored sub-dimensions, e.g. { "cyber technical": 8 }' },
          expertise_boundaries: { type: 'object', description: '{ strong[], moderate[], weak[], defer_to[], forbidden_overreach }' },
          tradecraft: { type: 'object', description: '{ common_indicators[], common_false_positives[], failure_modes[] }' },
          risk_posture: { type: 'object', description: '{ risk_sensitivity, false_negative_tolerance, false_positive_tolerance, escalation_bias }' },
          debate_behavior: { type: 'object', description: '{ debate_role, rebuttal_style, what_changes_mind }' },
          update_triggers: { type: 'object', description: '{ fast_when, slow_when, resistant_when }' },
          scenario_tags: { type: 'array', items: { type: 'string' } },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export async function handler({ workspace_token, profile }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { data, error } = await supabase
    .from('agents')
    .insert({ ...profile, workspace_id, source: 'workspace', is_library_sme: false })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
