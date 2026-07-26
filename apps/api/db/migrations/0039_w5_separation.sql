-- 0039_w5_separation.sql
--
-- W5 — M03 Exits / Separation core entities.
--
-- GROUNDING: authored against the extracted FS body
-- docs/spec/full-coverage/fs-text/PrimeSoft_HRMS_FS_M03_Exits_Offboarding_v1.3.txt.
--   * entity set separation_records, fnf_clearances, exit_interviews (§4, §6.4)
--   * separation_records columns from the POST /api/v1/separations §4.1 request/response contract
--     (separation_policy_code, date_of_resignation, target_last_working_day, reason_code,
--     recovery_days, on_behalf_of_employee_id; response state, proposed_last_working_day)
--   * ck_separation_state from the §8.4 machine SUBMITTED -> STAGE1 -> STAGE2 -> PENDING_LWD ->
--     RELIEVED, plus REVOKED / CANCELLED terminals
--   * ck_separation_active_unique from "409 active separation_records already exists for employee"
--   * proposed_last_working_day is server-computed (VAL-SEP-LWD) — stored, not client-supplied
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W5).
-- Compensating statement: docs/evidence/w5/0039-compensating.sql

CREATE TABLE separation_records (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                 uuid REFERENCES entities(id) ON DELETE RESTRICT,
    employee_id               uuid NOT NULL,
    separation_policy_code    text,
    -- RESIGNATION | TERMINATION | ABSCONDING | RETIREMENT (category drives §8.4 routing)
    separation_category       text NOT NULL DEFAULT 'RESIGNATION',
    date_of_resignation       date NOT NULL,
    target_last_working_day   date,
    -- Server-computed per VAL-SEP-LWD; never taken from the client.
    proposed_last_working_day date,
    final_last_working_day    date,
    reason_code               text NOT NULL,
    reason_narrative          text,                     -- masked unless confidential (§4.8.1)
    recovery_days             integer NOT NULL DEFAULT 0,
    on_behalf_of_employee_id  uuid,                     -- set only on HR/Admin force-initiate
    -- §8.4 lifecycle.
    state                     text NOT NULL DEFAULT 'SUBMITTED',
    approval_flow_id          uuid,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    created_by                uuid,
    updated_by                uuid,
    is_deleted                boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_separation_category CHECK (separation_category IN ('RESIGNATION', 'TERMINATION', 'ABSCONDING', 'RETIREMENT')),
    CONSTRAINT ck_separation_state CHECK (state IN ('SUBMITTED', 'STAGE1', 'STAGE2', 'PENDING_LWD', 'RELIEVED', 'REVOKED', 'CANCELLED')),
    CONSTRAINT ck_separation_recovery_days CHECK (recovery_days >= 0)
);
CREATE INDEX ix_separation_records_tenant ON separation_records(tenant_id);
CREATE INDEX ix_separation_records_employee ON separation_records(employee_id);
-- 409: at most one ACTIVE separation per employee. Active = not a terminal state.
CREATE UNIQUE INDEX ck_separation_active_unique
    ON separation_records (tenant_id, employee_id)
    WHERE state IN ('SUBMITTED', 'STAGE1', 'STAGE2', 'PENDING_LWD') AND is_deleted = false;

CREATE TABLE fnf_clearances (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id             uuid REFERENCES entities(id) ON DELETE RESTRICT,
    separation_id         uuid NOT NULL REFERENCES separation_records(id) ON DELETE RESTRICT,
    -- The clearance stage: IT_ASSETS | FACILITIES | ATTENDANCE | LEAVE | COMPLIANCE (§ clearance stages)
    stage_code            text NOT NULL,
    stage_name            text NOT NULL,
    clearance_status      text NOT NULL DEFAULT 'PENDING',  -- PENDING | CLEARED | ESCALATED
    cleared_by_user_id    uuid,
    cleared_at            timestamptz,
    notes                 text,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    created_by            uuid,
    updated_by            uuid,
    is_deleted            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_fnf_clearance_stage UNIQUE (separation_id, stage_code),
    CONSTRAINT ck_fnf_clearance_status CHECK (clearance_status IN ('PENDING', 'CLEARED', 'ESCALATED'))
);
CREATE INDEX ix_fnf_clearances_separation ON fnf_clearances(separation_id);

CREATE TABLE exit_interviews (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    separation_id      uuid NOT NULL REFERENCES separation_records(id) ON DELETE RESTRICT,
    template_code      text,
    -- Responses are stored as JSON keyed by form field; the template defines the fields.
    responses          jsonb NOT NULL DEFAULT '{}'::jsonb,
    interview_status   text NOT NULL DEFAULT 'PENDING',    -- PENDING | SUBMITTED | WAIVED
    submitted_at       timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_exit_interviews_separation UNIQUE (separation_id),
    CONSTRAINT ck_exit_interview_status CHECK (interview_status IN ('PENDING', 'SUBMITTED', 'WAIVED'))
);
CREATE INDEX ix_exit_interviews_separation ON exit_interviews(separation_id);
