-- Compensating (rollback) for 0044_separation_policy_detail.sql
-- Recorded before application; approved in .claude/approved-db-changes.txt (2026-07-26).
--
-- Reverses the 0044 correction: removes the two child tables and the four added columns, returning
-- separation_policies to its 0035 (flat) shape. The added columns are additive with defaults, so
-- dropping them loses only data entered through the 5-step wizard's Policy Details step and the
-- initiator/workflow-map child rows. Export first if used.

DROP TABLE IF EXISTS separation_policy_workflow_map;
DROP TABLE IF EXISTS separation_policy_initiators;
ALTER TABLE separation_policies DROP COLUMN IF EXISTS force_separate_on_lwd;
ALTER TABLE separation_policies DROP COLUMN IF EXISTS allow_past_dated_resignation;
ALTER TABLE separation_policies DROP COLUMN IF EXISTS applicability;
ALTER TABLE separation_policies DROP COLUMN IF EXISTS description;
