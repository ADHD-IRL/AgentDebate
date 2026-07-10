// Quantified risk model: likelihood × impact on 1-5 ordinal bands.
// Severity remains the categorical headline; this adds a defensible score.

export const LIKELIHOOD_BANDS = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

export const IMPACT_BANDS = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Severe',
};

// Risk score = likelihood × impact, 1..25
export function riskScore(likelihood, impact) {
  if (!likelihood || !impact) return null;
  return likelihood * impact;
}

// Map a 1..25 score to a severity band + color (standard 5×5 risk-matrix zones)
export function riskBandFromScore(score) {
  if (score == null) return { label: null, color: 'var(--wr-text-muted)' };
  if (score >= 15) return { label: 'CRITICAL', color: '#C0392B' };
  if (score >= 9)  return { label: 'HIGH',     color: '#D68910' };
  if (score >= 4)  return { label: 'MEDIUM',   color: '#2E86AB' };
  return             { label: 'LOW',      color: '#27AE60' };
}

// Confidence-weighted expected exposure: score scaled by how sure the agent is.
// Lets you sort "high-consequence AND likely AND confident" above hedged claims.
export function expectedExposure(likelihood, impact, confidence) {
  const s = riskScore(likelihood, impact);
  if (s == null) return null;
  const c = confidence == null ? 0.6 : Math.min(100, Math.max(0, confidence)) / 100;
  return Math.round(s * c * 10) / 10;
}

export function likelihoodLabel(v) { return LIKELIHOOD_BANDS[v] || '—'; }
export function impactLabel(v)     { return IMPACT_BANDS[v] || '—'; }

// Cell color for a 5×5 matrix position
export function matrixCellColor(likelihood, impact) {
  return riskBandFromScore(riskScore(likelihood, impact)).color;
}
