/goal
  objective: >
    Add the schema required by the ratified auth amendment — session records, signing-key or
    IdP configuration, and revocation — as a forward-only migration under the repo's
    migrations-only DB-change policy.
  context:
    - docs/spec/ui-remediation-followup/auth-contract-amendment.md   # ratified in URF-01
    - docs/data-model/00-platform-core.sql
    - apps/api/db/migrations/            # highest existing is 0033
    - project.config.yaml                # db_change_guard configuration
    - CLAUDE.md
  constraints:
    - DB-change policy is `migrations`. No ad-hoc DDL. To approve intentionally, add a line to
      .claude/approved-db-changes.txt and announce it. Never bypass the secrets guard.
    - Multi-tenancy is mandatory. Every new table carries tenant_id and entity_id, with an
      index that supports scoped reads. Reject any unscoped access path.
    - Forward-only and additive. No destructive DDL, no column drops, no data rewrites.
    - Store no plaintext token or secret. Hashes or key references only.
    - Implement only what the ratified amendment requires. If the amendment chose an external
      IdP with no server session store, say so and keep the migration minimal — do not build
      a session table nobody asked for.
  freedom:
    - Choose table and column names consistent with docs/data-model/00-platform-core.sql conventions.
    - Choose index strategy.
  work_loops:
    - name: Migration and schema test
      max_iterations: 3
      repeat_until: The migration loads cleanly and the schema test passes.
      steps:
        - write the compensating (rollback) SQL first and record it in the phase evidence
        - write the forward migration
        - amend docs/data-model/00-platform-core.sql to match
        - write and run the schema test
  deliverables:
    - apps/api/db/migrations/0034_platform_identity_sessions.sql
    - docs/data-model/00-platform-core.sql
    - .claude/approved-db-changes.txt
    - apps/api/test/platform-identity-schema.test.cjs
    - docs/evidence/ui-remediation-followup/urf-02-compensating-migration.sql
  evidence_required:
    - schema load log
    - the compensating migration, written before the forward one was applied
    - the approved-db-changes line, announced in the phase summary
  escalate_when:
    - The amendment implies a destructive or irreversible change.
    - A required table cannot be tenant-scoped without contradicting the platform core model.
