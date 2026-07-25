-- Pre-flight check for 0034_ps13_clearance_unique_active.sql (CC-021)
--
-- CREATE UNIQUE INDEX fails if the data already violates the rule. Because nothing enforced
-- one-ACTIVE-clearance-per-principal before 0034, a database that has been running for any length
-- of time may already hold duplicates — so run this FIRST against each target database.
--
-- Empty result  => 0034 will build cleanly.
-- Any rows      => resolve them before applying 0034. Do not resolve by deleting clearance rows:
--                  supersede the extras (set status to REVOKED with a justification) so the audit
--                  history and the P05 trail stay intact.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26, CC-021). Read-only.

SELECT
    tenant_id,
    principal_type,
    principal_ref,
    clearance_level,
    count(*)                     AS active_rows,
    min(valid_from)              AS earliest_granted,
    max(valid_from)              AS latest_granted,
    array_agg(id ORDER BY valid_from) AS clearance_ids
FROM security_clearances
WHERE status = 'ACTIVE'
  AND is_deleted = false
GROUP BY tenant_id, principal_type, principal_ref, clearance_level
HAVING count(*) > 1
ORDER BY count(*) DESC, tenant_id, principal_ref;
