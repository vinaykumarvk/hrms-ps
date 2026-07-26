-- 0043_w9_migration_runs.sql
--
-- W9 — the Migration Toolkit run ledger. This is the ONLY W9 entity with a real specification.
--
-- GROUNDING: Platform_Specification v1.6, P06 Migration Toolkit — §4.14.9 migration_runs,
-- FR-P06-001. The ETL+V framework (Extract -> Validate -> Transform -> Load -> Verify) is
-- scripted idempotently: "re-running yields the same result". Migration waves reference Appendix E.
--
-- SCOPE, deliberate and documented in docs/spec/full-coverage/w9-coverage.md: the rest of W9 is
-- NOT authored, because it is not specified —
--   * psa-feature-flags, psa-licenses: no feature_flags / license entity exists in any FS. The
--     source plan marks the PSA screens 🟡 ("services speced, screens have no FS"). Authoring
--     these would be inference, which W1's Gap A showed is the wrong move.
--   * psa-monitoring, psa-releases, psa-environments, psa-security: Cloud Run operational surfaces.
--     They read platform infrastructure APIs, not application tables — no app schema to add.
--   * leadership-ai-chat: 🔴 no FS at all, only a Product_Vision roadmap bullet. Not buildable to
--     a specification that does not exist. (The Platform_Spec AI guardrail — backend-only calls,
--     PII stripped server-side, key never client-side — is a security constraint recorded in the
--     coverage doc, not a screen spec.)
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W9).

CREATE TABLE migration_runs (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    run_code       text NOT NULL,
    -- Migration wave (Appendix E): WAVE_1 employee master/org/leave, WAVE_2 payroll, etc.
    wave           text NOT NULL,
    -- The ETL+V stage the run is currently in / completed (FR-P06-001).
    stage          text NOT NULL DEFAULT 'EXTRACT',
    -- Overall run status; idempotent re-run leaves a COMPLETED run COMPLETED.
    run_status     text NOT NULL DEFAULT 'PENDING',
    source_ref     text,                              -- the source system / dataset identifier
    rows_extracted integer NOT NULL DEFAULT 0,
    rows_loaded    integer NOT NULL DEFAULT 0,
    rows_failed    integer NOT NULL DEFAULT 0,
    verify_report  jsonb,                             -- the Verify-stage reconciliation output
    started_at     timestamptz,
    finished_at    timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_migration_runs_code UNIQUE (tenant_id, run_code),
    CONSTRAINT ck_migration_stage CHECK (stage IN ('EXTRACT', 'VALIDATE', 'TRANSFORM', 'LOAD', 'VERIFY', 'DONE')),
    CONSTRAINT ck_migration_status CHECK (run_status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK'))
);
CREATE INDEX ix_migration_runs_tenant ON migration_runs(tenant_id);
