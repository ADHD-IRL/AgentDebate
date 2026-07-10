-- Quantified risk: likelihood × impact bands alongside categorical severity.
-- Likelihood and impact are 1-5 ordinal bands; severity stays as the headline label.
--   likelihood 1..5 = Rare / Unlikely / Possible / Likely / Almost Certain
--   impact     1..5 = Negligible / Minor / Moderate / Major / Severe

-- Per-agent assessments (Round 1 + Round 2)
alter table public.session_agents add column if not exists round1_likelihood integer check (round1_likelihood between 1 and 5);
alter table public.session_agents add column if not exists round1_impact     integer check (round1_impact between 1 and 5);
alter table public.session_agents add column if not exists round2_likelihood integer check (round2_likelihood between 1 and 5);
alter table public.session_agents add column if not exists round2_impact     integer check (round2_impact between 1 and 5);

-- Threat catalog entries
alter table public.threats add column if not exists likelihood integer check (likelihood between 1 and 5);
alter table public.threats add column if not exists impact     integer check (impact between 1 and 5);
