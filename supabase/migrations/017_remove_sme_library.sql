-- Remove the SME Library feature.
--
-- Drops the library-only table, columns, policies, indexes, and the shared
-- library workspace. The SME *reasoning* fields on agents
-- (domain_expertise, analytical_framework, source_preferences, scenario_tags,
-- source) are RETAINED — they are injected into the debate prompts and are
-- not part of the library feature.

-- The RLS policy references is_library_sme, so it must go before the column.
drop policy if exists "agents_read_library" on public.agents;

drop index if exists public.agents_is_library_idx;
drop index if exists public.agents_sme_search_idx;

alter table public.agents
  drop column if exists is_library_sme,
  drop column if exists quality_score,
  drop column if exists usage_count,
  drop column if exists cloned_from_id;

-- External-access token table (drops its RLS policies with it).
drop table if exists public.sme_tokens cascade;

-- The shared "SME Global Library" workspace and everything scoped to it
-- (cascades to its members, domains, and agents).
delete from public.workspaces where invite_code = 'sme-library-internal';
