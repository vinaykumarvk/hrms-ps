-- 0038_w4_onboarding.sql
--
-- W4 — M02 Onboarding core entities.
--
-- GROUNDING: this is the first migration in the full-coverage programme authored against an
-- extracted FS body rather than field exports or screen names. Sources, all in
-- docs/spec/full-coverage/fs-text/PrimeSoft_HRMS_FS_M02_Onboarding_v1.4.txt:
--   * entity refs onboarding_processes §4.7.1, onboarding_instances §4.7.2, document_clusters
--   * the POST /api/v1/onboarding/instances request/response contract (source_mode, process_id,
--     target_date_of_joining, joining_location_id, bgv_package_id, portal_access_timing,
--     buddy_mode, ...)
--   * the §8.5 state machine INITIATED -> ADMIN_REVIEW -> COMPLETED
--   * MSG-ERR-DUP-INSTANCE: at most one OPEN instance per candidate
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W4).
-- Compensating statement: docs/evidence/w4/0038-compensating.sql

CREATE TABLE onboarding_processes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    process_code text NOT NULL,
    name         text NOT NULL,
    -- Auto-initiation basis (DO25); AD_HOC processes are initiated manually only.
    auto_initiate_basis text,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid,
    updated_by   uuid,
    is_deleted   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_onboarding_processes_code UNIQUE (tenant_id, process_code)
);
CREATE INDEX ix_onboarding_processes_tenant ON onboarding_processes(tenant_id);

CREATE TABLE document_clusters (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    cluster_code text NOT NULL,
    name         text NOT NULL,
    is_mandatory boolean NOT NULL DEFAULT false,
    applies_to   text,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid,
    updated_by   uuid,
    is_deleted   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_document_clusters_code UNIQUE (tenant_id, cluster_code)
);
CREATE INDEX ix_document_clusters_tenant ON document_clusters(tenant_id);

CREATE TABLE onboarding_instances (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id              uuid REFERENCES entities(id) ON DELETE RESTRICT,
    process_id             uuid NOT NULL REFERENCES onboarding_processes(id) ON DELETE RESTRICT,
    -- COUNTERSIGNED | CROSS_ENTITY | AD_HOC. candidate_id is required unless AD_HOC; employee_id
    -- carries the rehire/transfer link for CROSS_ENTITY.
    source_mode            text NOT NULL,
    candidate_id           uuid,
    employee_id            uuid,
    target_date_of_joining date NOT NULL,                    -- VAL-DATE-FUTURE at the service edge
    joining_location_id    uuid REFERENCES locations(id) ON DELETE RESTRICT,
    bgv_package_id         uuid,
    bgv_initiation_timing  text,
    bgv_case_id            uuid,
    welcome_page_template_id uuid,
    portal_access_timing   text NOT NULL DEFAULT 'ON_INITIATION',
    portal_access_at       timestamptz,
    buddy_mode             text NOT NULL DEFAULT 'NONE',     -- AUTO | MANUAL | NONE
    -- §8.5 lifecycle. Terminal states are COMPLETED and CANCELLED.
    state                  text NOT NULL DEFAULT 'INITIATED',
    initiated_by_user_id   uuid,
    completed_at           timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    created_by             uuid,
    updated_by             uuid,
    is_deleted             boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_onboarding_source_mode CHECK (source_mode IN ('COUNTERSIGNED', 'CROSS_ENTITY', 'AD_HOC')),
    CONSTRAINT ck_onboarding_state CHECK (state IN ('INITIATED', 'ADMIN_REVIEW', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ck_onboarding_buddy_mode CHECK (buddy_mode IN ('AUTO', 'MANUAL', 'NONE')),
    -- "candidate_id required unless AD_HOC" from the request contract.
    CONSTRAINT ck_onboarding_candidate_required CHECK (source_mode = 'AD_HOC' OR candidate_id IS NOT NULL)
);
CREATE INDEX ix_onboarding_instances_tenant ON onboarding_instances(tenant_id);
CREATE INDEX ix_onboarding_instances_process ON onboarding_instances(process_id);
-- MSG-ERR-DUP-INSTANCE (409): at most one OPEN instance per candidate. Enforced as a partial
-- unique index because the rule is cross-row and scoped to live states.
CREATE UNIQUE INDEX ck_onboarding_open_instance_unique
    ON onboarding_instances (tenant_id, candidate_id)
    WHERE candidate_id IS NOT NULL AND state IN ('INITIATED', 'ADMIN_REVIEW') AND is_deleted = false;

CREATE TABLE onboarding_tasks (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id              uuid REFERENCES entities(id) ON DELETE RESTRICT,
    onboarding_instance_id uuid NOT NULL REFERENCES onboarding_instances(id) ON DELETE RESTRICT,
    task_code              text NOT NULL,
    name                   text NOT NULL,
    is_mandatory           boolean NOT NULL DEFAULT false,
    assignee_user_id       uuid,
    task_status            text NOT NULL DEFAULT 'PENDING',  -- PENDING | COMPLETED | WAIVED
    completed_at           timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    created_by             uuid,
    updated_by             uuid,
    is_deleted             boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_onboarding_tasks_code UNIQUE (onboarding_instance_id, task_code),
    CONSTRAINT ck_onboarding_task_status CHECK (task_status IN ('PENDING', 'COMPLETED', 'WAIVED'))
);
CREATE INDEX ix_onboarding_tasks_instance ON onboarding_tasks(onboarding_instance_id);

-- FR-M02-002 / DO19 autosave: upserted at field_status=DRAFT; a save NEVER blocks on validation,
-- so there is no NOT NULL on field_value and no validation constraint here — errors are returned
-- inline by the service while the draft still persists.
CREATE TABLE onboarding_form_responses (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id              uuid REFERENCES entities(id) ON DELETE RESTRICT,
    onboarding_instance_id uuid NOT NULL REFERENCES onboarding_instances(id) ON DELETE RESTRICT,
    field_name             text NOT NULL,
    field_value            text,
    field_status           text NOT NULL DEFAULT 'DRAFT',    -- DRAFT | SUBMITTED
    save_reason            text,                             -- AUTOSAVE | MANUAL
    saved_at               timestamptz NOT NULL DEFAULT now(),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    created_by             uuid,
    updated_by             uuid,
    is_deleted             boolean NOT NULL DEFAULT false,
    -- Autosave upserts on this key rather than appending a row per keystroke.
    CONSTRAINT uq_onboarding_form_responses_field UNIQUE (onboarding_instance_id, field_name),
    CONSTRAINT ck_onboarding_field_status CHECK (field_status IN ('DRAFT', 'SUBMITTED'))
);
CREATE INDEX ix_onboarding_form_responses_instance ON onboarding_form_responses(onboarding_instance_id);
