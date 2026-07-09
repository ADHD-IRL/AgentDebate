import { supabase } from '../lib/supabase-admin.js';
import { resolveToken, requireWrite } from '../lib/auth.js';
import { randomUUID } from 'crypto';

export const schema = {
  name: 'manage_tokens',
  description: 'Create, list, or revoke SME API tokens for a workspace. Tokens grant external agents (scripts, CI, orchestrators) access to the SME REST API at /api/sme.',
  inputSchema: {
    type: 'object',
    required: ['workspace_token', 'action'],
    properties: {
      workspace_token: { type: 'string', description: 'Existing token with write permission' },
      action: { type: 'string', enum: ['create', 'list', 'revoke'], description: 'Operation to perform' },
      name: { type: 'string', description: 'Token name (required for create)' },
      permissions: { type: 'array', items: { type: 'string' }, description: 'Permissions array, e.g. ["read","write"] (for create)' },
      expires_in_days: { type: 'number', description: 'Days until expiry (optional, for create)' },
      token_id: { type: 'string', description: 'Token UUID to revoke (required for revoke)' },
    },
  },
};

export async function handler({ workspace_token, action, name, permissions = ['read', 'write'], expires_in_days, token_id }) {
  const { workspace_id, permissions: callerPerms } = await resolveToken(workspace_token);
  requireWrite(callerPerms);

  if (action === 'create') {
    if (!name) throw new Error('name is required for create');
    const newToken = randomUUID().replace(/-/g, '');
    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
      : null;
    const { data, error } = await supabase
      .from('sme_tokens')
      .insert({ token: newToken, workspace_id, name, permissions, expires_at })
      .select('id, name, permissions, expires_at, created_at')
      .single();
    if (error) throw new Error(error.message);
    return { ...data, token: newToken, note: 'Store this token securely — it will not be shown again.' };
  }

  if (action === 'list') {
    const { data, error } = await supabase
      .from('sme_tokens')
      .select('id, name, permissions, created_at, last_used_at, expires_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  if (action === 'revoke') {
    if (!token_id) throw new Error('token_id is required for revoke');
    const { error } = await supabase
      .from('sme_tokens')
      .delete()
      .eq('id', token_id)
      .eq('workspace_id', workspace_id);
    if (error) throw new Error(error.message);
    return { revoked: true, token_id };
  }

  throw new Error(`Unknown action: ${action}`);
}
