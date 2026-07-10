// Shared grouping model for the Threat Map.
//
// Threats and agents are joined through domain_id. A threat with no (or a
// dangling) domain_id is NOT matched to every agent — it lands in a single
// "Unassigned" group so counts stay honest.

export const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const SEV_COLORS = { CRITICAL: '#C0392B', HIGH: '#D68910', MEDIUM: '#2E86AB', LOW: '#27AE60' };
export const SEV_WEIGHT = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
export const UNASSIGNED_ID = '__unassigned__';

export function riskBand(score) {
  if (score >= 30) return { label: 'CRITICAL', color: '#C0392B', bg: 'rgba(192,57,43,0.15)' };
  if (score >= 15) return { label: 'HIGH',     color: '#E67E22', bg: 'rgba(230,126,34,0.15)' };
  if (score >= 5)  return { label: 'MEDIUM',   color: '#2E86AB', bg: 'rgba(46,134,171,0.15)' };
  return           { label: 'LOW',      color: '#27AE60', bg: 'rgba(39,174,96,0.15)' };
}

function summarize(threats) {
  const counts = Object.fromEntries(SEV_ORDER.map(s => [s, 0]));
  threats.forEach(t => { counts[t.severity || 'MEDIUM'] = (counts[t.severity || 'MEDIUM'] || 0) + 1; });
  const score = SEV_ORDER.reduce((s, k) => s + counts[k] * SEV_WEIGHT[k], 0);
  return { counts, score };
}

/**
 * Build map groups for a given axis.
 * @param axis 'domain' | 'discipline'
 * @returns { groups, unassignedThreats }
 *   group: { id, name, color, isUnassigned, agents[], threats[], counts, score, total }
 * Groups are sorted by score desc; the Unassigned group (if any threats) is last.
 */
export function buildGroups({ axis, agents, domains, threats }) {
  const domainById = new Map(domains.map(d => [d.id, d]));
  const validDomainIds = new Set(domains.map(d => d.id));

  const assigned = threats.filter(t => t.domain_id && validDomainIds.has(t.domain_id));
  const unassignedThreats = threats.filter(t => !t.domain_id || !validDomainIds.has(t.domain_id));

  let groups = [];

  if (axis === 'domain') {
    // One group per domain that has agents or threats
    const usedIds = new Set([
      ...agents.map(a => a.domain_id).filter(id => validDomainIds.has(id)),
      ...assigned.map(t => t.domain_id),
    ]);
    groups = [...usedIds].map(id => {
      const d = domainById.get(id);
      const gAgents = agents.filter(a => a.domain_id === id);
      const gThreats = assigned.filter(t => t.domain_id === id);
      const { counts, score } = summarize(gThreats);
      return { id, name: d?.name || 'Unknown', color: d?.color, isUnassigned: false, agents: gAgents, threats: gThreats, counts, score, total: gThreats.length };
    });
  } else {
    // One group per discipline; a discipline's threats are those whose
    // domain_id matches any of its agents' domains
    const discs = [...new Set(agents.map(a => a.discipline).filter(Boolean))];
    groups = discs.map(disc => {
      const gAgents = agents.filter(a => a.discipline === disc);
      const domainIds = new Set(gAgents.map(a => a.domain_id).filter(Boolean));
      const gThreats = assigned.filter(t => domainIds.has(t.domain_id));
      const { counts, score } = summarize(gThreats);
      return { id: disc, name: disc, color: null, isUnassigned: false, agents: gAgents, threats: gThreats, counts, score, total: gThreats.length };
    });
  }

  groups.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  if (unassignedThreats.length > 0) {
    const { counts, score } = summarize(unassignedThreats);
    groups.push({
      id: UNASSIGNED_ID,
      name: 'Unassigned',
      color: '#546E7A',
      isUnassigned: true,
      agents: axis === 'domain' ? agents.filter(a => !a.domain_id || !validDomainIds.has(a.domain_id)) : [],
      threats: unassignedThreats,
      counts, score,
      total: unassignedThreats.length,
    });
  }

  return { groups, unassignedThreats };
}

export function categoriesOf(threats) {
  return [...new Set(threats.map(t => t.category || 'Uncategorized'))].sort();
}

/** Near-duplicate category detection: same after lowercase/trim/strip trailing 's'. */
export function findCategoryDuplicates(threats) {
  const norm = c => c.toLowerCase().trim().replace(/s$/, '');
  const byNorm = new Map();
  threats.forEach(t => {
    if (!t.category) return;
    const k = norm(t.category);
    if (!byNorm.has(k)) byNorm.set(k, new Map());
    const variants = byNorm.get(k);
    variants.set(t.category, (variants.get(t.category) || 0) + 1);
  });
  const dups = [];
  byNorm.forEach(variants => {
    if (variants.size > 1) {
      const sorted = [...variants.entries()].sort((a, b) => b[1] - a[1]);
      dups.push({ keep: sorted[0][0], merge: sorted.slice(1).map(([name, count]) => ({ name, count })) });
    }
  });
  return dups;
}
