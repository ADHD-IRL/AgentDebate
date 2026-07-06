import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';
import { generateSmeProfile } from '../lib/anthropic.js';

export const schema = {
  name: 'bulk_generate_smes',
  description: 'Generate multiple SME profiles for a scenario in one call. Use when you need a full expert panel (2-10 SMEs) quickly. Each SME is generated with a distinct discipline lens and persisted to the workspace.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'scenario_name', 'scenario_description'],
    properties: {
      workspace_token: { type: 'string' },
      scenario_name: { type: 'string' },
      scenario_description: { type: 'string' },
      scenario_tags: { type: 'array', items: { type: 'string' } },
      disciplines: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific discipline labels to generate. If omitted, the model chooses diverse disciplines.',
      },
      count: { type: 'number', description: 'Number of SMEs to generate (2-10, default 4)' },
      auto_promote: { type: 'boolean', description: 'Immediately promote all generated SMEs to the library (default false)' },
    },
  },
};

const DEFAULT_DISCIPLINES = [
  'Adversarial Threat Intelligence',
  'Supply Chain Risk',
  'Cyber Operations',
  'Human Factors & Insider Threat',
  'Geopolitical Risk Analysis',
  'Physical Security & Infrastructure',
  'Financial & Economic Risk',
  'Information Operations',
];

export async function handler({ workspace_token, scenario_name, scenario_description, scenario_tags = [], disciplines, count = 4, auto_promote = false }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const n = Math.min(Math.max(count, 2), 10);
  const expertTypes = disciplines?.length
    ? disciplines.slice(0, n)
    : DEFAULT_DISCIPLINES.slice(0, n);

  const profiles = await Promise.all(
    expertTypes.map(d =>
      generateSmeProfile({
        expert_type: d,
        key_focus: scenario_name,
        prior_background: `Relevant to: ${scenario_description.slice(0, 300)}`,
      })
    )
  );

  const toInsert = profiles.map(p => ({
    ...p,
    workspace_id,
    source: 'generated',
    is_library_sme: auto_promote,
    scenario_tags: [...(p.tags || []), ...scenario_tags],
    usage_count: 0,
    quality_score: null,
    status: 'active',
  }));

  const { data, error } = await supabase.from('agents').insert(toInsert).select('id, name, discipline, scenario_tags');
  if (error) throw new Error(error.message);

  return {
    generated: data?.length || 0,
    promoted_to_library: auto_promote,
    smes: data || [],
    scenario_name,
  };
}
