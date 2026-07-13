-- ============================================================
-- AgentDebate — Complete Schema (all migrations consolidated)
-- Run this in Supabase SQL Editor: Database → SQL Editor → New query
-- This replaces running migrations 001–010 individually.
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Helper functions (needed before RLS policies) ─────────────────────────────
create or replace function public.is_member(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

create or replace function public.is_admin(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

create or replace function public.can_write(ws_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role in ('admin','analyst')
  );
$$ language sql security definer stable;

-- ── Profiles ──────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url   text,
  created_at   timestamptz default now() not null
);

alter table public.profiles enable row level security;
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all"   on public.profiles for select using (true);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ── Workspaces ────────────────────────────────────────────────────────────────
create table if not exists public.workspaces (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  owner_id          uuid references public.profiles(id) on delete set null,
  anthropic_api_key text,
  invite_code       text unique,
  created_at        timestamptz default now() not null
);

alter table public.workspaces enable row level security;
drop policy if exists "workspaces_read" on public.workspaces;
create policy "workspaces_read"   on public.workspaces for select using (is_member(id));
drop policy if exists "workspaces_insert" on public.workspaces;
create policy "workspaces_insert" on public.workspaces for insert with check (auth.uid() is not null);
-- Owner OR admin can update (007: allows owner to save API key even if not admin-role member)
drop policy if exists "workspaces_update" on public.workspaces;
create policy "workspaces_update" on public.workspaces for update using (is_admin(id) or auth.uid() = owner_id);
drop policy if exists "workspaces_delete" on public.workspaces;
create policy "workspaces_delete" on public.workspaces for delete using (auth.uid() = owner_id);

-- ── Workspace members ─────────────────────────────────────────────────────────
create table if not exists public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  role         text not null default 'analyst'
                 check (role in ('admin','analyst','viewer')),
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null,
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;
drop policy if exists "members_read" on public.workspace_members;
create policy "members_read"   on public.workspace_members for select using (is_member(workspace_id));
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
create table if not exists public.domains (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  description  text,
  color        text,
  icon         text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

alter table public.domains enable row level security;
drop policy if exists "domains_read" on public.domains;
create policy "domains_read"   on public.domains for select using (is_member(workspace_id));
drop policy if exists "domains_insert" on public.domains;
create policy "domains_insert" on public.domains for insert with check (can_write(workspace_id));
drop policy if exists "domains_update" on public.domains;
create policy "domains_update" on public.domains for update using (can_write(workspace_id));
drop policy if exists "domains_delete" on public.domains;
create policy "domains_delete" on public.domains for delete using (is_admin(workspace_id));

-- ── Agents ────────────────────────────────────────────────────────────────────
-- Includes all columns from migrations 001, 009 (extended persona), and 010 (SME library)
create table if not exists public.agents (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid references public.workspaces(id) on delete cascade not null,
  domain_id               uuid,
  name                    text not null,
  discipline              text not null,
  persona_description     text,
  cognitive_bias          text,
  red_team_focus          text,
  professional_background text,
  expertise_level         text default 'Senior'
                            check (expertise_level in ('Junior','Mid-Level','Senior','Principal','World-Class')),
  reasoning_style         text default 'Analytical'
                            check (reasoning_style in ('Analytical','Intuitive','Contrarian','Systematic','Probabilistic')),
  severity_default        text default 'HIGH'
                            check (severity_default in ('CRITICAL','HIGH','MEDIUM','LOW')),
  vector_human            integer default 50,
  vector_technical        integer default 50,
  vector_physical         integer default 30,
  vector_futures          integer default 40,
  is_ai_generated         boolean default false,
  tags                    text[] default '{}',
  -- Extended persona fields (009)
  epistemic_style          text,
  institutional_background text,
  conflict_triggers        text,
  decision_style           text,
  adversary_model          text,
  institutional_incentives text,
  -- SME library fields (010)
  source                   text default 'workspace',
  is_library_sme           boolean default false,
  usage_count              integer default 0,
  quality_score            numeric(4,1),
  cloned_from_id           uuid,
  scenario_tags            jsonb default '[]',
  domain_expertise         jsonb default '{}',
  analytical_framework     text,
  source_preferences       text,
  -- Timestamps
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now()
);

-- Ensure columns added by later migrations exist (safe on fresh or partial DBs)
alter table public.agents add column if not exists epistemic_style          text;
alter table public.agents add column if not exists institutional_background text;
alter table public.agents add column if not exists conflict_triggers        text;
alter table public.agents add column if not exists decision_style           text;
alter table public.agents add column if not exists adversary_model          text;
alter table public.agents add column if not exists institutional_incentives text;
alter table public.agents add column if not exists source                   text default 'workspace';
alter table public.agents add column if not exists is_library_sme           boolean default false;
alter table public.agents add column if not exists usage_count              integer default 0;
alter table public.agents add column if not exists quality_score            numeric(4,1);
alter table public.agents add column if not exists cloned_from_id           uuid;
alter table public.agents add column if not exists scenario_tags            jsonb default '[]';
alter table public.agents add column if not exists domain_expertise         jsonb default '{}';
alter table public.agents add column if not exists analytical_framework     text;
alter table public.agents add column if not exists source_preferences       text;
alter table public.agents add column if not exists updated_at               timestamptz default now();

alter table public.agents enable row level security;
drop policy if exists "agents_read" on public.agents;
create policy "agents_read"         on public.agents for select using (is_member(workspace_id));
drop policy if exists "agents_read_library" on public.agents;
create policy "agents_read_library" on public.agents for select using (is_library_sme = true);
drop policy if exists "agents_insert" on public.agents;
create policy "agents_insert"       on public.agents for insert with check (can_write(workspace_id));
drop policy if exists "agents_update" on public.agents;
create policy "agents_update"       on public.agents for update using (can_write(workspace_id));
drop policy if exists "agents_delete" on public.agents;
create policy "agents_delete"       on public.agents for delete using (is_admin(workspace_id));

-- GIN indexes for SME library discovery (010)
create index if not exists agents_sme_search_idx
  on public.agents
  using gin(to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(discipline, '') || ' ' ||
    coalesce(persona_description, '') || ' ' ||
    coalesce(red_team_focus, '') || ' ' ||
    coalesce(analytical_framework, '')
  ));
create index if not exists agents_scenario_tags_idx on public.agents using gin(scenario_tags);
create index if not exists agents_is_library_idx    on public.agents (is_library_sme) where is_library_sme = true;

-- ── Scenarios ─────────────────────────────────────────────────────────────────
create table if not exists public.scenarios (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  domain_id        uuid,
  name             text not null,
  description      text,
  context_document text,
  status           text default 'draft'
                     check (status in ('draft','active','archived')),
  tags             text[] default '{}',
  created_by       uuid references public.profiles(id),
  created_at       timestamptz default now() not null
);

alter table public.scenarios enable row level security;
drop policy if exists "scenarios_read" on public.scenarios;
create policy "scenarios_read"   on public.scenarios for select using (is_member(workspace_id));
drop policy if exists "scenarios_insert" on public.scenarios;
create policy "scenarios_insert" on public.scenarios for insert with check (can_write(workspace_id));
drop policy if exists "scenarios_update" on public.scenarios;
create policy "scenarios_update" on public.scenarios for update using (can_write(workspace_id));
drop policy if exists "scenarios_delete" on public.scenarios;
create policy "scenarios_delete" on public.scenarios for delete using (is_admin(workspace_id));

-- ── Threats ───────────────────────────────────────────────────────────────────
create table if not exists public.threats (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  domain_id    uuid,
  scenario_id  uuid,
  name         text not null,
  description  text,
  severity     text check (severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  category     text,
  tags         text[] default '{}',
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

alter table public.threats enable row level security;
drop policy if exists "threats_read" on public.threats;
create policy "threats_read"   on public.threats for select using (is_member(workspace_id));
drop policy if exists "threats_insert" on public.threats;
create policy "threats_insert" on public.threats for insert with check (can_write(workspace_id));
drop policy if exists "threats_update" on public.threats;
create policy "threats_update" on public.threats for update using (can_write(workspace_id));
drop policy if exists "threats_delete" on public.threats;
create policy "threats_delete" on public.threats for delete using (is_admin(workspace_id));

-- ── Chains ────────────────────────────────────────────────────────────────────
create table if not exists public.chains (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  domain_id        uuid,
  scenario_id      uuid,
  session_id       uuid,
  threat_id        uuid,
  name             text not null,
  description      text,
  steps            jsonb default '[]',
  is_ai_generated  boolean default false,
  tags             text[] default '{}',
  chain_resilience text,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz default now() not null
);

alter table public.chains enable row level security;
drop policy if exists "chains_read" on public.chains;
create policy "chains_read"   on public.chains for select using (is_member(workspace_id));
drop policy if exists "chains_insert" on public.chains;
create policy "chains_insert" on public.chains for insert with check (can_write(workspace_id));
drop policy if exists "chains_update" on public.chains;
create policy "chains_update" on public.chains for update using (can_write(workspace_id));
drop policy if exists "chains_delete" on public.chains;
create policy "chains_delete" on public.chains for delete using (is_admin(workspace_id));

-- ── Sessions ──────────────────────────────────────────────────────────────────
-- Includes columns from 001, 003 (mode), 004 (source_pins), 005 (facilitator_note, pinned_chain_ids)
create table if not exists public.sessions (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  scenario_id      uuid,
  domain_id        uuid,
  name             text not null,
  status           text default 'pending'
                     check (status in ('pending','round1','round2','complete')),
  mode             text not null default 'classic'
                     check (mode in ('classic','live')),
  phase_focus      text,
  context_override text,
  agent_ids        text[] default '{}',
  source_pins      jsonb not null default '[]',
  facilitator_note text,
  pinned_chain_ids text[] default '{}',
  created_by       uuid references public.profiles(id),
  created_at       timestamptz default now() not null
);

-- Ensure session columns from later migrations exist
alter table public.sessions add column if not exists mode             text not null default 'classic';
alter table public.sessions add column if not exists source_pins      jsonb not null default '[]';
alter table public.sessions add column if not exists facilitator_note text;
alter table public.sessions add column if not exists pinned_chain_ids text[] default '{}';

alter table public.sessions enable row level security;
drop policy if exists "sessions_read" on public.sessions;
create policy "sessions_read"   on public.sessions for select using (is_member(workspace_id));
drop policy if exists "sessions_insert" on public.sessions;
create policy "sessions_insert" on public.sessions for insert with check (can_write(workspace_id));
drop policy if exists "sessions_update" on public.sessions;
create policy "sessions_update" on public.sessions for update using (can_write(workspace_id));
drop policy if exists "sessions_delete" on public.sessions;
create policy "sessions_delete" on public.sessions for delete using (is_admin(workspace_id));

-- ── Session agents ────────────────────────────────────────────────────────────
-- Includes confidence scores and round0_briefing from migration 005
create table if not exists public.session_agents (
  id                                 uuid primary key default gen_random_uuid(),
  workspace_id                       uuid references public.workspaces(id) on delete cascade not null,
  session_id                         uuid references public.sessions(id) on delete cascade not null,
  agent_id                           uuid not null,
  round0_briefing                    text,
  round1_assessment                  text,
  round1_severity                    text check (round1_severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  round1_confidence                  integer,
  round2_rebuttal                    text,
  round2_revised_severity            text check (round2_revised_severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  round2_confidence                  integer,
  round2_strongest_ally_agent_id     uuid,
  round2_strongest_disagree_agent_id uuid,
  compound_chain_text                text,
  status                             text default 'pending'
                                       check (status in ('pending','generating_r1','r1_done','generating_r2','complete')),
  created_at                         timestamptz default now() not null
);

-- Ensure session_agents columns from later migrations exist
alter table public.session_agents add column if not exists round0_briefing   text;
alter table public.session_agents add column if not exists round1_confidence integer;
alter table public.session_agents add column if not exists round2_confidence integer;

alter table public.session_agents enable row level security;
drop policy if exists "session_agents_read" on public.session_agents;
create policy "session_agents_read"   on public.session_agents for select using (is_member(workspace_id));
drop policy if exists "session_agents_insert" on public.session_agents;
create policy "session_agents_insert" on public.session_agents for insert with check (can_write(workspace_id));
drop policy if exists "session_agents_update" on public.session_agents;
create policy "session_agents_update" on public.session_agents for update using (can_write(workspace_id));
drop policy if exists "session_agents_delete" on public.session_agents;
create policy "session_agents_delete" on public.session_agents for delete using (is_admin(workspace_id));

-- ── Session syntheses ─────────────────────────────────────────────────────────
create table if not exists public.session_syntheses (
  id                   uuid primary key default gen_random_uuid(),
  workspace_id         uuid references public.workspaces(id) on delete cascade not null,
  session_id           uuid references public.sessions(id) on delete cascade not null,
  raw_text             text,
  consensus_findings   jsonb default '[]',
  contested_findings   jsonb default '[]',
  compound_chains      jsonb default '[]',
  blind_spots          jsonb default '[]',
  priority_mitigations jsonb default '[]',
  sharpest_insights    jsonb default '[]',
  created_at           timestamptz default now() not null
);

alter table public.session_syntheses enable row level security;
drop policy if exists "syntheses_read" on public.session_syntheses;
create policy "syntheses_read"   on public.session_syntheses for select using (is_member(workspace_id));
drop policy if exists "syntheses_insert" on public.session_syntheses;
create policy "syntheses_insert" on public.session_syntheses for insert with check (can_write(workspace_id));
drop policy if exists "syntheses_update" on public.session_syntheses;
create policy "syntheses_update" on public.session_syntheses for update using (can_write(workspace_id));
drop policy if exists "syntheses_delete" on public.session_syntheses;
create policy "syntheses_delete" on public.session_syntheses for delete using (is_admin(workspace_id));

-- ── Session messages (Live Debate) ────────────────────────────────────────────
create table if not exists public.session_messages (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  session_id   uuid references public.sessions(id)   on delete cascade not null,
  agent_id     uuid,
  role         text not null check (role in ('agent','user','system')),
  content      text not null,
  round        integer,
  metadata     jsonb default '{}',
  created_at   timestamptz default now() not null
);

alter table public.session_messages enable row level security;
drop policy if exists "messages_read" on public.session_messages;
create policy "messages_read"   on public.session_messages for select using (is_member(workspace_id));
drop policy if exists "messages_insert" on public.session_messages;
create policy "messages_insert" on public.session_messages for insert with check (can_write(workspace_id));
drop policy if exists "messages_delete" on public.session_messages;
create policy "messages_delete" on public.session_messages for delete using (is_admin(workspace_id));

-- ── Session sources ───────────────────────────────────────────────────────────
create table if not exists public.session_sources (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  session_id       uuid references public.sessions(id) on delete cascade not null,
  message_id       uuid,
  agent_id         uuid,
  source_type      text not null,
  url              text,
  title            text,
  domain           text,
  credibility_tier  text,
  credibility_score integer,
  cited_claim      text,
  content_snippet  text,
  created_at       timestamptz default now() not null
);

alter table public.session_sources enable row level security;
drop policy if exists "sources_read" on public.session_sources;
create policy "sources_read"   on public.session_sources for select using (is_member(workspace_id));
drop policy if exists "sources_insert" on public.session_sources;
create policy "sources_insert" on public.session_sources for insert with check (can_write(workspace_id));
drop policy if exists "sources_update" on public.session_sources;
create policy "sources_update" on public.session_sources for update using (can_write(workspace_id));
drop policy if exists "sources_delete" on public.session_sources;
create policy "sources_delete" on public.session_sources for delete using (can_write(workspace_id));

-- ── App configs ───────────────────────────────────────────────────────────────
create table if not exists public.app_configs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  key          text not null,
  value        text,
  label        text,
  created_at   timestamptz default now() not null,
  unique (workspace_id, key)
);

alter table public.app_configs enable row level security;
drop policy if exists "app_configs_read" on public.app_configs;
create policy "app_configs_read"   on public.app_configs for select using (is_member(workspace_id));
drop policy if exists "app_configs_insert" on public.app_configs;
create policy "app_configs_insert" on public.app_configs for insert with check (can_write(workspace_id));
drop policy if exists "app_configs_update" on public.app_configs;
create policy "app_configs_update" on public.app_configs for update using (can_write(workspace_id));
drop policy if exists "app_configs_delete" on public.app_configs;
create policy "app_configs_delete" on public.app_configs for delete using (is_admin(workspace_id));

-- ── SME API tokens ────────────────────────────────────────────────────────────
create table if not exists public.sme_tokens (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null default gen_random_uuid()::text,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text,
  permissions  text[] default '{read,write}',
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now(),
  last_used_at timestamptz,
  expires_at   timestamptz
);

alter table public.sme_tokens enable row level security;
drop policy if exists "sme_tokens_read" on public.sme_tokens;
create policy "sme_tokens_read"   on public.sme_tokens for select using (is_admin(workspace_id));
drop policy if exists "sme_tokens_insert" on public.sme_tokens;
create policy "sme_tokens_insert" on public.sme_tokens for insert with check (is_admin(workspace_id));
drop policy if exists "sme_tokens_delete" on public.sme_tokens;
create policy "sme_tokens_delete" on public.sme_tokens for delete using (is_admin(workspace_id));

-- ── Auto-create profile on signup ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Realtime ──────────────────────────────────────────────────────────────────
do $$
declare
  tables text[] := array['sessions','session_agents','session_syntheses','session_messages'];
  t text;
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;

-- ── SME Global Library workspace ──────────────────────────────────────────────
-- After running this, find the row with invite_code='sme-library-internal' and
-- copy its id into sme-mcp-server/.env as LIBRARY_WORKSPACE_ID
insert into public.workspaces (name, invite_code)
  values ('SME Global Library', 'sme-library-internal')
  on conflict (invite_code) do nothing;
