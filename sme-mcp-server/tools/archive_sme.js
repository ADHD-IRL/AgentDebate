import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';

export const schema = {
  name: 'archive_sme',
  description: 'Soft-delete an SME by setting its status to "archived". Archived SMEs are hidden from browse views but remain in the database for historical reference. Use this instead of delete_sme when you want to preserve the record.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'agent_id'],
    properties: {
      workspace_token: { type: 'string' },
      agent_id: { type: 'string', description: 'UUID of the SME to archive' },
      reason: { type: 'string', description: 'Optional reason for archiving' },
    },
  },
};

export async function handler({ workspace_token, agent_id, reason }) {
  const { workspace_id, permissions } = await resolveToken(workspace_token);
  requireWrite(permissions);

  const { data, error } = await supabase
    .from('agents')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', agent_id)
    .eq('workspace_id', workspace_id)
    .select('id, name, status')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('SME not found in workspace');
  return { archived: true, agent: data, reason: reason || null };
}
