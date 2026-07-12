-- Optimal SME: the human-matching reasoning dimensions.
-- Additive only. Reuses domain_expertise / analytical_framework / source_preferences
-- (added in 010) — those need population + prompt injection, not new columns.

ALTER TABLE public.agents
  -- Competence map (block 3): declared boundaries so the SME stays in its lane
  ADD COLUMN IF NOT EXISTS expertise_boundaries jsonb   DEFAULT '{}',   -- { strong[], moderate[], weak[], defer_to[], forbidden_overreach }
  -- Analytic tradecraft (block 5): what it looks for, what fools it, how it errs
  ADD COLUMN IF NOT EXISTS tradecraft           jsonb   DEFAULT '{}',   -- { common_indicators[], common_false_positives[], failure_modes[] }
  -- Risk posture (block 7): the FP/FN asymmetry that makes calibrated reasoning
  ADD COLUMN IF NOT EXISTS risk_posture         jsonb   DEFAULT '{}',   -- { risk_sensitivity, false_negative_tolerance, false_positive_tolerance, escalation_bias }
  -- Debate behavior + belief-update rules (block 8): real Round 2 movement
  ADD COLUMN IF NOT EXISTS debate_behavior      jsonb   DEFAULT '{}',   -- { debate_role, rebuttal_style, what_changes_mind }
  ADD COLUMN IF NOT EXISTS update_triggers      jsonb   DEFAULT '{}',   -- { fast_when, slow_when, resistant_when }
  -- Identity + bias model (blocks 1, 6)
  ADD COLUMN IF NOT EXISTS role_type            text    DEFAULT 'sme',  -- sme | red-team | devil's-advocate | facilitator
  ADD COLUMN IF NOT EXISTS debiasing_instruction text,
  -- Track record / calibration (block 10)
  ADD COLUMN IF NOT EXISTS historical_strengths  jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS historical_weaknesses jsonb  DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS weighting_adjustment  numeric(4,2) DEFAULT 1.0;
