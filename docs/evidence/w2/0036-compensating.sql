-- Compensating (rollback) statement for 0036_w2_leave_attendance_config.sql (W2 Gap A)
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only rule: an applied
-- migration is never edited; it is compensated by a later one.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W2 Gap A).
--
-- All three tables are new in 0036, so removing them restores the pre-0036 schema exactly. Any
-- comp-off, blackout or approval-routing configuration created through the W2 screens is lost
-- with them — export first if the environment has been used.
--
-- Promote into a numbered migration rather than running ad hoc; db_change_guard blocks ad-hoc DDL.

DROP TABLE IF EXISTS decision_matrix;
DROP TABLE IF EXISTS blackout_periods;
DROP TABLE IF EXISTS comp_off_rules;
