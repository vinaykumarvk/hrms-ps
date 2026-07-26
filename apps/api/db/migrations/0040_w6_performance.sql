-- 0040_w6_performance.sql
--
-- W6 — M09 Performance: the entities PS08 does not already provide.
--
-- GROUNDING: extracted FS_M09_Performance v1.4. Entity refs §4.10.3 review_cycles,
-- §4.10.4 review_records, §4.10.19 performance_improvement_plans; the
-- POST /api/v1/performance/goal-plans contract confirms goal_plans/goals shapes (already in PS08).
--
-- REUSE, per ADR-006 D-COV-02 (APAR is a profile over M09, not a competitor):
--   goal_plans, goals, calibration_sessions, scorecard_pillars ALREADY EXIST in
--   08-PS08-performance-appraisal.sql. This migration does NOT re-create them. It adds only the
--   M09-specific tables PS08 lacks. Re-declaring the shared tables would fork the model the two
--   modules are meant to share.
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W6).
-- Compensating statement: docs/evidence/w6/0040-compensating.sql

-- §4.10.3 — the cycle that scopes a review round (self / manager / calibration windows).
CREATE TABLE review_cycles (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    cycle_code     text NOT NULL,
    name           text NOT NULL,
    period_start   date NOT NULL,
    period_end     date NOT NULL,
    -- DRAFT | ACTIVE | CALIBRATION | CLOSED (§8 cycle lifecycle)
    cycle_status   text NOT NULL DEFAULT 'DRAFT',
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_review_cycles_code UNIQUE (tenant_id, cycle_code),
    CONSTRAINT ck_review_cycle_status CHECK (cycle_status IN ('DRAFT', 'ACTIVE', 'CALIBRATION', 'CLOSED')),
    CONSTRAINT ck_review_cycle_period CHECK (period_end >= period_start)
);
CREATE INDEX ix_review_cycles_tenant ON review_cycles(tenant_id);

-- §4.10.5 — the template that defines a review's stages and fields.
CREATE TABLE review_templates (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    template_code text NOT NULL,
    name          text NOT NULL,
    stage_config  jsonb NOT NULL DEFAULT '{}'::jsonb,       -- stages + review_stage_field_permissions
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_review_templates_code UNIQUE (tenant_id, template_code)
);
CREATE INDEX ix_review_templates_tenant ON review_templates(tenant_id);

-- §4.10.4 — one review record per (cycle, employee): self → manager → calibration progression.
CREATE TABLE review_records (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    review_cycle_id    uuid NOT NULL REFERENCES review_cycles(id) ON DELETE RESTRICT,
    template_id        uuid REFERENCES review_templates(id) ON DELETE RESTRICT,
    employee_id        uuid NOT NULL,
    -- §8 review stage machine.
    review_stage       text NOT NULL DEFAULT 'SELF',        -- SELF | MANAGER | CALIBRATION | FINALISED
    self_rating        text,
    manager_rating     text,
    final_rating       text,
    -- review_hold (§) parks a record out of the active flow without losing it.
    is_on_hold         boolean NOT NULL DEFAULT false,
    responses          jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    -- one review per employee per cycle
    CONSTRAINT uq_review_records_cycle_employee UNIQUE (review_cycle_id, employee_id),
    CONSTRAINT ck_review_stage CHECK (review_stage IN ('SELF', 'MANAGER', 'CALIBRATION', 'FINALISED'))
);
CREATE INDEX ix_review_records_cycle ON review_records(review_cycle_id);
CREATE INDEX ix_review_records_employee ON review_records(employee_id);

-- Calibration configuration (§) — distinct from PS08 calibration_sessions, which are the runs.
CREATE TABLE calibration_configurations (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    config_code   text NOT NULL,
    name          text NOT NULL,
    -- Target rating distribution as JSON: e.g. {"A":10,"B":20,"C":40,...} percentages.
    distribution  jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_calibration_configurations_code UNIQUE (tenant_id, config_code)
);
CREATE INDEX ix_calibration_configurations_tenant ON calibration_configurations(tenant_id);

-- §4.10.19 — Performance Improvement Plan. FS marks this OPEN-FS-M09-04: the fields below are the
-- specified ones; open decisions (escalation ladder, auto-close) are left to the PIP slice.
CREATE TABLE performance_improvement_plans (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    employee_id        uuid NOT NULL,
    review_record_id   uuid REFERENCES review_records(id) ON DELETE SET NULL,
    pip_code           text NOT NULL,
    objective          text NOT NULL,
    start_date         date NOT NULL,
    target_end_date    date NOT NULL,
    pip_status         text NOT NULL DEFAULT 'OPEN',        -- OPEN | IN_PROGRESS | CLOSED_SUCCESS | CLOSED_FAILURE
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_pip_code UNIQUE (tenant_id, pip_code),
    CONSTRAINT ck_pip_status CHECK (pip_status IN ('OPEN', 'IN_PROGRESS', 'CLOSED_SUCCESS', 'CLOSED_FAILURE')),
    CONSTRAINT ck_pip_dates CHECK (target_end_date >= start_date)
);
CREATE INDEX ix_pip_tenant ON performance_improvement_plans(tenant_id);
CREATE INDEX ix_pip_employee ON performance_improvement_plans(employee_id);
