-- Allow workspace owners to update their own workspace (e.g. to save the API key).
-- Previously only is_admin() was allowed, which silently blocked owner updates
-- if the owner row had role != 'admin' in workspace_members.
drop policy if exists "workspaces_update" on public.workspaces;
create policy "workspaces_update" on public.workspaces
  for update using (is_admin(id) or auth.uid() = owner_id);
