-- Compensating (rollback) statement for 0039_w5_separation.sql (W5 / M03 Exits)
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only rule.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W5).
--
-- Drop order follows the FK chain: exit_interviews and fnf_clearances reference
-- separation_records. All three are new in 0039, so removing them restores the pre-0039 schema
-- exactly — along with any in-flight separation case, clearance or exit interview. A separation in
-- progress is live business state, not disposable configuration; export first if the environment
-- has been used.
--
-- Promote into a numbered migration rather than running ad hoc; db_change_guard blocks ad-hoc DDL.

DROP TABLE IF EXISTS exit_interviews;
DROP TABLE IF EXISTS fnf_clearances;
DROP TABLE IF EXISTS separation_records;
