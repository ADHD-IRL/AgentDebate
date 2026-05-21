ALTER TABLE agents ADD COLUMN IF NOT EXISTS epistemic_style          text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS institutional_background  text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS conflict_triggers         text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS decision_style            text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS adversary_model           text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS institutional_incentives  text;
