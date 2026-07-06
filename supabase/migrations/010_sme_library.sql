-- SME Library: extend agents table + add token auth for external agents

-- Extend agents table
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS source           text DEFAULT 'workspace',
  ADD COLUMN IF NOT EXISTS is_library_sme   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quality_score    numeric(4,1),
  ADD COLUMN IF NOT EXISTS cloned_from_id   uuid,
  ADD COLUMN IF NOT EXISTS scenario_tags    jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS domain_expertise jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS analytical_framework text,
  ADD COLUMN IF NOT EXISTS source_preferences   text;

-- SME API token table
CREATE TABLE IF NOT EXISTS public.sme_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token        text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name         text,
  permissions  text[] DEFAULT '{read,write}',
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz DEFAULT now(),
  last_used_at timestamptz,
  expires_at   timestamptz
);

ALTER TABLE public.sme_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sme_tokens_read"   ON public.sme_tokens FOR SELECT USING (is_admin(workspace_id));
CREATE POLICY "sme_tokens_insert" ON public.sme_tokens FOR INSERT WITH CHECK (is_admin(workspace_id));
CREATE POLICY "sme_tokens_delete" ON public.sme_tokens FOR DELETE USING (is_admin(workspace_id));

-- Library workspace (run once; note returned id as LIBRARY_WORKSPACE_ID in MCP .env)
INSERT INTO public.workspaces (name, invite_code)
  VALUES ('SME Global Library', 'sme-library-internal')
  ON CONFLICT (invite_code) DO NOTHING;

-- Library SMEs globally readable by all authenticated users
DROP POLICY IF EXISTS "agents_read_library" ON public.agents;
CREATE POLICY "agents_read_library" ON public.agents
  FOR SELECT USING (is_library_sme = true);

-- Indexes for SME discovery
CREATE INDEX IF NOT EXISTS agents_sme_search_idx
  ON public.agents
  USING gin(to_tsvector('english',
    coalesce(name, '') || ' ' ||
    coalesce(discipline, '') || ' ' ||
    coalesce(persona_description, '') || ' ' ||
    coalesce(red_team_focus, '') || ' ' ||
    coalesce(analytical_framework, '')
  ));

CREATE INDEX IF NOT EXISTS agents_scenario_tags_idx
  ON public.agents USING gin(scenario_tags);

CREATE INDEX IF NOT EXISTS agents_is_library_idx
  ON public.agents (is_library_sme) WHERE is_library_sme = true;
