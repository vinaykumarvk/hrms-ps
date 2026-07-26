-- Compensating (rollback) for 0043_w9_migration_runs.sql (W9)
-- Recorded before application; approved in .claude/approved-db-changes.txt (2026-07-26, W9).
-- migration_runs is new in 0043; removing it restores the pre-0043 schema. Migration-run history
-- is an audit trail of data loads — export before dropping if any run has been recorded.
DROP TABLE IF EXISTS migration_runs;
