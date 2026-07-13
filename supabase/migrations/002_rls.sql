-- AgentDebate — Row Level Security Policies
-- Apply AFTER 001_schema.sql

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.domains           enable row level security;
alter table public.agents            enable row level security;
alter table public.scenarios         enable row level security;
alter table public.threats           enable row level security;
alter table public.chains            enable row level security;
alter table public.sessions          enable row level security;
alter table public.session_agents    enable row level security;
alter table public.session_syntheses enable row level security;
alter table public.app_configs       enable row level security;

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Is the current user a member of this workspace?
create or replace function public.is_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Is the current user an admin of this workspace?
create or replace function public.is_admin(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Can the current user write to this workspace? (admin or analyst)
create or replace function public.can_write(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role in ('admin','analyst')
  );
$$ language sql security definer stable;

-- ── Profiles ──────────────────────────────────────────────────────────────────
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"   on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ── Workspaces ────────────────────────────────────────────────────────────────
drop policy if exists "workspaces_read" on public.workspaces;
create policy "workspaces_read"    on public.workspaces for select using (is_member(id));
drop policy if exists "workspaces_insert" on public.workspaces;
create policy "workspaces_insert"  on public.workspaces for insert with check (auth.uid() is not null);
drop policy if exists "workspaces_update" on public.workspaces;
create policy "workspaces_update"  on public.workspaces for update using (is_admin(id));
drop policy if exists "workspaces_delete" on public.workspaces;
create policy "workspaces_delete"  on public.workspaces for delete using (auth.uid() = owner_id);

-- ── Workspace members ─────────────────────────────────────────────────────────
drop policy if exists "members_read" on public.workspace_members;
create policy "members_read"   on public.workspace_members for select using (is_member(workspace_id));
-- Admins can add members; users can add themselves to a workspace they own (bootstrap)
drop policy if exists "members_insert" on public.workspace_members;
create policy "members_insert" on public.workspace_members for insert with check (
  is_admin(workspace_id)
  or (
    auth.uid() = user_id
    and exists (
      select 1 from public.workspaces where id = workspace_id and owner_id = auth.uid()
    )
  )
);
drop policy if exists "members_update" on public.workspace_members;
create policy "members_update" on public.workspace_members for update using (is_admin(workspace_id));
drop policy if exists "members_delete" on public.workspace_members;
create policy "members_delete" on public.workspace_members for delete using (is_admin(workspace_id));

-- ── Domains ───────────────────────────────────────────────────────────────────
drop policy if exists "domains_read" on public.domains;
create policy "domains_read"   on public.domains for select using (is_member(workspace_id));
drop policy if exists "domains_insert" on public.domains;
create policy "domains_insert" on public.domains for insert with check (can_write(workspace_id));
drop policy if exists "domains_update" on public.domains;
create policy "domains_update" on public.domains for update using (can_write(workspace_id));
drop policy if exists "domains_delete" on public.domains;
create policy "domains_delete" on public.domains for delete using (is_admin(workspace_id));

-- ── Agents ────────────────────────────────────────────────────────────────────
drop policy if exists "agents_read" on public.agents;
create policy "agents_read"   on public.agents for select using (is_member(workspace_id));
drop policy if exists "agents_insert" on public.agents;
create policy "agents_insert" on public.agents for insert with check (can_write(workspace_id));
drop policy if exists "agents_update" on public.agents;
create policy "agents_update" on public.agents for update using (can_write(workspace_id));
drop policy if exists "agents_delete" on public.agents;
create policy "agents_delete" on public.agents for delete using (is_admin(workspace_id));

-- ── Scenarios ─────────────────────────────────────────────────────────────────
drop policy if exists "scenarios_read" on public.scenarios;
create policy "scenarios_read"   on public.scenarios for select using (is_member(workspace_id));
drop policy if exists "scenarios_insert" on public.scenarios;
create policy "scenarios_insert" on public.scenarios for insert with check (can_write(workspace_id));
drop policy if exists "scenarios_update" on public.scenarios;
create policy "scenarios_update" on public.scenarios for update using (can_write(workspace_id));
drop policy if exists "scenarios_delete" on public.scenarios;
create policy "scenarios_delete" on public.scenarios for delete using (is_admin(workspace_id));

-- ── Threats ───────────────────────────────────────────────────────────────────
drop policy if exists "threats_read" on public.threats;
create policy "threats_read"   on public.threats for select using (is_member(workspace_id));
drop policy if exists "threats_insert" on public.threats;
create policy "threats_insert" on public.threats for insert with check (can_write(workspace_id));
drop policy if exists "threats_update" on public.threats;
create policy "threats_update" on public.threats for update using (can_write(workspace_id));
drop policy if exists "threats_delete" on public.threats;
create policy "threats_delete" on public.threats for delete using (is_admin(workspace_id));

-- ── Chains ────────────────────────────────────────────────────────────────────
drop policy if exists "chains_read" on public.chains;
create policy "chains_read"   on public.chains for select using (is_member(workspace_id));
drop policy if exists "chains_insert" on public.chains;
create policy "chains_insert" on public.chains for insert with check (can_write(workspace_id));
drop policy if exists "chains_update" on public.chains;
create policy "chains_update" on public.chains for update using (can_write(workspace_id));
drop policy if exists "chains_delete" on public.chains;
create policy "chains_delete" on public.chains for delete using (is_admin(workspace_id));

-- ── Sessions ──────────────────────────────────────────────────────────────────
drop policy if exists "sessions_read" on public.sessions;
create policy "sessions_read"   on public.sessions for select using (is_member(workspace_id));
drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert" on public.sessions for insert with check (can_write(workspace_id));
drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_update" on public.sessions for update using (can_write(workspace_id));
drop policy if exists "sessions_delete" on public.sessions;
create policy "sessions_delete" on public.sessions for delete using (is_admin(workspace_id));

-- ── Session agents ────────────────────────────────────────────────────────────
drop policy if exists "session_agents_read" on public.session_agents;
create policy "session_agents_read"   on public.session_agents for select using (is_member(workspace_id));
drop policy if exists "session_agents_insert" on public.session_agents;
create policy "session_agents_insert" on public.session_agents for insert with check (can_write(workspace_id));
drop policy if exists "session_agents_update" on public.session_agents;
create policy "session_agents_update" on public.session_agents for update using (can_write(workspace_id));
drop policy if exists "session_agents_delete" on public.session_agents;
create policy "session_agents_delete" on public.session_agents for delete using (is_admin(workspace_id));

-- ── Session syntheses ─────────────────────────────────────────────────────────
drop policy if exists "syntheses_read" on public.session_syntheses;
create policy "syntheses_read"   on public.session_syntheses for select using (is_member(workspace_id));
drop policy if exists "syntheses_insert" on public.session_syntheses;
create policy "syntheses_insert" on public.session_syntheses for insert with check (can_write(workspace_id));
drop policy if exists "syntheses_update" on public.session_syntheses;
create policy "syntheses_update" on public.session_syntheses for update using (can_write(workspace_id));
drop policy if exists "syntheses_delete" on public.session_syntheses;
create policy "syntheses_delete" on public.session_syntheses for delete using (is_admin(workspace_id));

-- ── App configs ───────────────────────────────────────────────────────────────
drop policy if exists "app_configs_read" on public.app_configs;
create policy "app_configs_read"   on public.app_configs for select using (is_member(workspace_id));
drop policy if exists "app_configs_insert" on public.app_configs;
create policy "app_configs_insert" on public.app_configs for insert with check (can_write(workspace_id));
drop policy if exists "app_configs_update" on public.app_configs;
create policy "app_configs_update" on public.app_configs for update using (can_write(workspace_id));
drop policy if exists "app_configs_delete" on public.app_configs;
create policy "app_configs_delete" on public.app_configs for delete using (is_admin(workspace_id));
