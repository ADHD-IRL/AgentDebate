-- AgentDebate — Initial Schema
-- Apply this in the Supabase SQL editor (Database → SQL Editor → New query)

-- ── Extensions ────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Auto-created when a user signs up via the trigger below
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- ── Workspaces ────────────────────────────────────────────────────────────────
create table public.workspaces (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  owner_id           uuid references public.profiles(id) on delete set null,
  anthropic_api_key  text,
  invite_code        text unique,
  created_at         timestamptz default now() not null
);

-- ── Workspace members ─────────────────────────────────────────────────────────
create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  role         text not null default 'analyst'
                 check (role in ('admin','analyst','viewer')),
  invited_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null,
  unique (workspace_id, user_id)
);

-- ── Domains ───────────────────────────────────────────────────────────────────
create table public.domains (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name         text not null,
  description  text,
  color        text,
  icon         text,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz default now() not null
);

-- ── Agents ────────────────────────────────────────────────────────────────────
create table public.agents (
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
  created_by              uuid references public.profiles(id),
  created_at              timestamptz default now() not null
);

-- ── Scenarios ─────────────────────────────────────────────────────────────────
create table public.scenarios (
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

-- ── Threats ───────────────────────────────────────────────────────────────────
create table public.threats (
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

-- ── Chains ────────────────────────────────────────────────────────────────────
create table public.chains (
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

-- ── Sessions ──────────────────────────────────────────────────────────────────
create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references public.workspaces(id) on delete cascade not null,
  scenario_id      uuid,
  domain_id        uuid,
  name             text not null,
  status           text default 'pending'
                     check (status in ('pending','round1','round2','complete')),
  phase_focus      text,
  context_override text,
  agent_ids        text[] default '{}',
  created_by       uuid references public.profiles(id),
  created_at       timestamptz default now() not null
);

-- ── Session agents ────────────────────────────────────────────────────────────
create table public.session_agents (
  id                               uuid primary key default gen_random_uuid(),
  workspace_id                     uuid references public.workspaces(id) on delete cascade not null,
  session_id                       uuid references public.sessions(id) on delete cascade not null,
  agent_id                         uuid not null,
  round1_assessment                text,
  round1_severity                  text check (round1_severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  round2_rebuttal                  text,
  round2_revised_severity          text check (round2_revised_severity in ('CRITICAL','HIGH','MEDIUM','LOW')),
  round2_strongest_ally_agent_id   uuid,
  round2_strongest_disagree_agent_id uuid,
  compound_chain_text              text,
  status                           text default 'pending'
                                     check (status in ('pending','generating_r1','r1_done','generating_r2','complete')),
  created_at                       timestamptz default now() not null
);

-- ── Session syntheses ─────────────────────────────────────────────────────────
create table public.session_syntheses (
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

-- ── App configs ───────────────────────────────────────────────────────────────
-- Generic KV store for workspace settings, chain analyses, risk snapshots
create table public.app_configs (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  key          text not null,
  value        text,
  label        text,
  created_at   timestamptz default now() not null,
  unique (workspace_id, key)
);

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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Realtime ──────────────────────────────────────────────────────────────────
-- Enable realtime for live session updates
alter publication supabase_realtime add table public.session_agents;
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.session_syntheses;
