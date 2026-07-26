-- 0036_w2_leave_attendance_config.sql
--
-- W2 Gap A — leave/attendance configuration tables the M04/M05 admin screens administer.
--
-- Unlike W1's Gap A, these are NOT inferred from screenshots. Each column traces to a field in
-- the DwnB form-field exports that ship with the FS:
--   comp_off_rules    <- DwnB Form Fields/Attendance/Tenant_Leaves_Compoff_Export.csv
--   blackout_periods  <- DwnB Form Fields/Leaves/Leave-Policy-Block-Leave-Export.csv
--   decision_matrix   <- DwnB Form Fields/Leaves/Approvalflows-Export.csv
--
-- cfg-infraction is deliberately NOT included: no field export or FS section was found that
-- specifies it, and authoring it would repeat W1's inferred-schema problem. It stays in the W2
-- gap list until specified.
--
-- Platform conventions as in 0001-0035: tenant/entity scoping, per-tenant business key,
-- is_active for retirement, is_deleted for soft delete, audit columns.
--
-- Additive and forward-only: CREATE statements only.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W2 Gap A).
-- Compensating statement: docs/evidence/w2/0036-compensating.sql

CREATE TABLE comp_off_rules (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                uuid REFERENCES entities(id) ON DELETE RESTRICT,
    rule_code                text NOT NULL,                    -- CSV "Code" (e.g. OVPY_7)
    name                     text NOT NULL,                    -- CSV "Name"
    description              text,                             -- CSV "Description"
    overtime_policy_code     text,                             -- CSV "Set Overtime policy for"
    calculation_frequency    text NOT NULL DEFAULT 'DAILY',    -- CSV "Calculation Frequency"
    is_hourly_leave          boolean NOT NULL DEFAULT false,   -- CSV "Is Hourly Leave?"
    hourly_across_midnight   boolean NOT NULL DEFAULT false,   -- CSV "...Across Midnight"
    hours_in_day             numeric(4,2),                     -- CSV "No of hours in a day"
    multiples_of_minutes     integer,                          -- CSV "Allow Hourly Leave Only In Multiples Of"
    min_duration_minutes     integer,                          -- CSV "Min Leave duration in one application"
    restriction_condition    text NOT NULL DEFAULT 'OR',       -- CSV "Restriction condition - AND/OR"
    is_active                boolean NOT NULL DEFAULT true,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    updated_by               uuid,
    is_deleted               boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_comp_off_rules_code UNIQUE (tenant_id, rule_code)
);
CREATE INDEX ix_comp_off_rules_tenant ON comp_off_rules(tenant_id);

CREATE TABLE blackout_periods (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id             uuid REFERENCES entities(id) ON DELETE RESTRICT,
    blackout_code         text NOT NULL,
    name                  text NOT NULL,
    leave_type_code       text,                                -- CSV "Leave Code"
    sub_category_name     text,                                -- CSV "Sub Category Name"
    frequency             text,                                -- CSV "Frequency"
    allow_past_dates      boolean NOT NULL DEFAULT false,      -- CSV "Do not allow block Leave for past dates"
    starts_on             date,
    ends_on               date,
    is_active             boolean NOT NULL DEFAULT true,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    created_by            uuid,
    updated_by            uuid,
    is_deleted            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_blackout_periods_code UNIQUE (tenant_id, blackout_code),
    -- A window must not end before it starts; open-ended windows leave both null.
    CONSTRAINT ck_blackout_window CHECK (starts_on IS NULL OR ends_on IS NULL OR ends_on >= starts_on)
);
CREATE INDEX ix_blackout_periods_tenant ON blackout_periods(tenant_id);

CREATE TABLE decision_matrix (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id           uuid REFERENCES entities(id) ON DELETE RESTRICT,
    matrix_code         text NOT NULL,
    name                text NOT NULL,
    request_type        text NOT NULL,                         -- LEAVE | ATTENDANCE_REGULARISATION | OVERTIME
    -- Binds to a P01 workflow definition. Approval routing is NOT re-implemented here; this
    -- selects the definition and the tier, and P01 resolves assignees (CLAUDE.md: reuse the platform).
    p01_workflow_code   text NOT NULL,
    tier_order          smallint NOT NULL DEFAULT 1,
    approver_rule       text NOT NULL,                         -- REPORTING_CHAIN | POSITION_AUTHORITY | ROLE
    is_active           boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    created_by          uuid,
    updated_by          uuid,
    is_deleted          boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_decision_matrix_code UNIQUE (tenant_id, matrix_code),
    CONSTRAINT ck_decision_matrix_tier CHECK (tier_order >= 1)
);
CREATE INDEX ix_decision_matrix_tenant ON decision_matrix(tenant_id);
