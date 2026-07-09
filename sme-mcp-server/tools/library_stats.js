import { supabase } from '../lib/supabase-admin.js';

export const schema = {
  name: 'library_stats',
  description: 'Get aggregate statistics about the global SME library: total count, average quality score, domain distribution, top SMEs by usage, and SMEs ready for promotion.',
  inputSchema: {
    type: 'object',
    properties: {
      workspace_id: { type: 'string', description: 'Optional workspace to include workspace-specific stats' },
    },
  },
};

export async function handler({ workspace_id } = {}) {
  const [libraryRes, topRes] = await Promise.all([
    supabase
      .from('agents')
      .select('id, name, discipline, quality_score, usage_count, source, scenario_tags')
      .eq('is_library_sme', true)
      .eq('status', 'active')
      .order('quality_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('agents')
      .select('id, name, discipline, usage_count, quality_score, is_library_sme, workspace_id')
      .order('usage_count', { ascending: false, nullsFirst: false })
      .limit(10),
  ]);

  if (libraryRes.error) throw new Error(libraryRes.error.message);
  const smes = libraryRes.data || [];

  const total = smes.length;
  const withScore = smes.filter(s => s.quality_score != null);
  const avgQuality = withScore.length
    ? Math.round(withScore.reduce((sum, s) => sum + s.quality_score, 0) / withScore.length * 10) / 10
    : null;

  const domainMap = {};
  for (const s of smes) {
    const d = s.discipline || 'Unknown';
    domainMap[d] = (domainMap[d] || 0) + 1;
  }
  const byDomain = Object.entries(domainMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, count]) => ({ domain, count }));

  const noScore = smes.filter(s => s.quality_score == null).length;
  const highQuality = smes.filter(s => s.quality_score != null && s.quality_score >= 80).length;
  const lowQuality = smes.filter(s => s.quality_score != null && s.quality_score < 60).length;

  let workspaceStats = null;
  if (workspace_id) {
    const { data: wsSmes } = await supabase
      .from('agents')
      .select('id, name, discipline, quality_score, usage_count, source, is_library_sme, status')
      .eq('workspace_id', workspace_id)
      .eq('is_library_sme', false);

    const promotionCandidates = (wsSmes || []).filter(
      s => s.usage_count >= 3 && s.quality_score != null && s.quality_score >= 75
    );

    workspaceStats = {
      total: (wsSmes || []).length,
      active: (wsSmes || []).filter(s => s.status === 'active').length,
      archived: (wsSmes || []).filter(s => s.status === 'archived').length,
      promotion_candidates: promotionCandidates.map(s => ({ id: s.id, name: s.name, quality_score: s.quality_score, usage_count: s.usage_count })),
    };
  }

  return {
    library: {
      total,
      avg_quality: avgQuality,
      no_quality_score: noScore,
      high_quality_count: highQuality,
      low_quality_count: lowQuality,
      by_domain: byDomain,
    },
    top_by_usage: (topRes.data || []).map(s => ({
      id: s.id,
      name: s.name,
      discipline: s.discipline,
      usage_count: s.usage_count,
      quality_score: s.quality_score,
      is_library_sme: s.is_library_sme,
    })),
    workspace: workspaceStats,
  };
}
