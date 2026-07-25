-- Compensating (rollback) statement for 0034_ps13_clearance_unique_active.sql
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only migration rule:
-- an applied migration is never edited; it is compensated by a later one.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26, CC-021).
--
-- Applying this restores the pre-0034 state exactly. It removes only the index; no clearance row
-- is touched, so nothing is lost. Be aware of what it re-enables: without this index, duplicate
-- ACTIVE clearances can accumulate again, and a revocation that updates one row can leave the
-- principal's access live through another.
--
-- To use, promote this into a numbered migration (e.g. 0035_revert_ck_clearance_unique_active.sql)
-- rather than running it ad hoc — the db_change_guard blocks ad-hoc DDL by design.

DROP INDEX IF EXISTS ck_clearance_unique_active;
