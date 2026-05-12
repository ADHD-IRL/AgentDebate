-- Debate system improvements: confidence scores, round0 briefings, facilitator note, pinned chains

-- session_agents: confidence scores and pre-session briefing
alter table public.session_agents
  add column if not exists round1_confidence integer,
  add column if not exists round2_confidence integer,
  add column if not exists round0_briefing   text;

-- sessions: facilitator note and pinned chain IDs
alter table public.sessions
  add column if not exists facilitator_note  text,
  add column if not exists pinned_chain_ids  text[] default '{}';
