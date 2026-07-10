-- Mitigation register: track countermeasures through their lifecycle and
-- re-score residual risk after adoption, so reports can show NET risk.

create table if not exists public.mitigations (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid references public.workspaces(id) on delete cascade not null,
  -- optional provenance links
  session_id          uuid references public.sessions(id) on delete set null,
  chain_id            uuid references public.chains(id) on delete set null,
  scenario_id         uuid references public.scenarios(id) on delete set null,

  title               text not null,
  description         text,
  control_type        text check (control_type in ('PREVENTIVE','DETECTIVE','RESPONSIVE')),
  effort              text check (effort in ('LOW','MEDIUM','HIGH')),
  time_to_deploy      text check (time_to_deploy in ('DAYS','WEEKS','MONTHS')),
  breaks_steps        jsonb default '[]',          -- chain step numbers this addresses
  effect              text,                         -- what it does to the adversary

  owner               text,
  status              text default 'proposed'
                        check (status in ('proposed','accepted','in_progress','implemented','verified','rejected')),

  -- Risk before / after this mitigation (1-5 bands, mirrors lib/risk.js)
  inherent_likelihood  integer check (inherent_likelihood between 1 and 5),
  inherent_impact      integer check (inherent_impact between 1 and 5),
  residual_likelihood  integer check (residual_likelihood between 1 and 5),
  residual_impact      integer check (residual_impact between 1 and 5),

  source              text default 'manual',        -- 'chain_breaker' | 'manual'
  notes               text,
  created_at          timestamptz default now() not null,
  updated_at          timestamptz default now() not null
);

create index if not exists mitigations_workspace on public.mitigations (workspace_id);
create index if not exists mitigations_session   on public.mitigations (session_id);
create index if not exists mitigations_status     on public.mitigations (status);

alter table public.mitigations enable row level security;
drop policy if exists "mitigations_read" on public.mitigations;
create policy "mitigations_read"   on public.mitigations for select using (is_member(workspace_id));
drop policy if exists "mitigations_insert" on public.mitigations;
create policy "mitigations_insert" on public.mitigations for insert with check (can_write(workspace_id));
drop policy if exists "mitigations_update" on public.mitigations;
create policy "mitigations_update" on public.mitigations for update using (can_write(workspace_id));
drop policy if exists "mitigations_delete" on public.mitigations;
create policy "mitigations_delete" on public.mitigations for delete using (can_write(workspace_id));
