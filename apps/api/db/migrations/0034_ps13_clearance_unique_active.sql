-- 0034_ps13_clearance_unique_active.sql
--
-- CC-021 — at most one ACTIVE security clearance per principal and level.
--
-- security_clearances (0020_ps13_security_hardening.sql) declares ck_clearance_sod for the
-- maker/checker rule, but nothing prevented several ACTIVE rows for the same principal at the
-- same level. Only the seed wrapper pre-checked, so any retried request or replayed job could
-- accumulate duplicates.
--
-- The consequence is a security one rather than a tidiness one: revocation updates a single row,
-- so duplicates left the principal's access intact after an apparently successful revocation.
--
-- Enforced as a PARTIAL UNIQUE INDEX because the rule is cross-row and scoped to live rows; a
-- CHECK constraint can express neither. The name keeps the ck_ prefix used by the CC-021 finding
-- and by docs/spec/adr-005-retire-feature-dev.md so the identifier stays traceable, even though
-- the object created is an index.
--
-- Additive and forward-only. No table, column or type is modified and no data is rewritten.
-- The compensating statement was recorded before application, in
-- docs/evidence/cc-021/0034-compensating.sql.
--
-- PENDING_APPROVAL, REVOKED and soft-deleted rows are deliberately left unconstrained: clearance
-- history is retained, and only one clearance may be live at any moment.
--
-- Pre-flight: this index cannot build if duplicate ACTIVE rows already exist. Run
-- docs/evidence/cc-021/duplicate-active-clearance-precheck.sql against the target database first.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26).

CREATE UNIQUE INDEX IF NOT EXISTS ck_clearance_unique_active
    ON security_clearances (tenant_id, principal_type, principal_ref, clearance_level)
    WHERE status = 'ACTIVE' AND is_deleted = false;

COMMENT ON INDEX ck_clearance_unique_active IS
    'CC-021: at most one ACTIVE, non-deleted clearance per (tenant, principal, level).';
