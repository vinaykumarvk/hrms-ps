-- PH-15F migration 0027: PS09 POSH/ICC route + personal hearings + SLA pause ledger, and
-- PS06 multi-stream rota-quota seniority construction — faithful subsets of
-- docs/data-model/09-PS09-disciplinary-punishment.sql (E9 inquiry_appointments ICC roles,
-- E29 personal_hearings, E28 sla_pause_events) and
-- docs/data-model/06-PS06-promotion-posting-progression.sql (§5.2.28 seniority_quota_rules,
-- §5.2.2 seniority-entry stream/slot fields).
-- NOTE: disciplinary cases and combined seniority lists are service-layer entities (same
--       convention as migrations 0012/0013), so case/list references are plain uuid columns
--       validated in the service layer.

-- SECTION 1 — ENUM TYPES (UPPER_SNAKE values, CONVENTIONS §4)
CREATE TYPE ps09_inquiry_route       AS ENUM ('ORDINARY_IO','ICC_POSH','DISPENSED');
CREATE TYPE ps09_icc_role            AS ENUM ('ICC_PRESIDING','ICC_MEMBER','ICC_EXTERNAL_MEMBER');
CREATE TYPE ps09_appointment_status  AS ENUM ('ACTIVE','RECUSED','REPLACED');
CREATE TYPE ps09_hearing_stage       AS ENUM ('SHOW_CAUSE','APPEAL');
CREATE TYPE ps09_hearing_status      AS ENUM ('REQUESTED','GRANTED','DENIED');
CREATE TYPE ps09_sla_pause_reason    AS ENUM ('STAY','REMIT','CONDONATION','CONSULTATION','CRIMINAL_STAY');
CREATE TYPE ps06_rotation_method     AS ENUM ('ROTA_QUOTA','RUNNING_ACCOUNT','SEPARATE_STREAM');
CREATE TYPE ps06_rotation_start_slot AS ENUM ('DR_FIRST','PROMOTEE_FIRST');
CREATE TYPE ps06_recruitment_stream  AS ENUM ('DIRECT','PROMOTEE','LDCE');

-- FR-PS09-024 AC-4: pause/resume land on the hash-chained case timeline.
ALTER TYPE ps09_timeline_event_type ADD VALUE IF NOT EXISTS 'SLA_PAUSE';
ALTER TYPE ps09_timeline_event_type ADD VALUE IF NOT EXISTS 'SLA_RESUME';

-- SECTION 2 — E9 inquiry_appointments ICC subset (FR-PS09-023: composition evidence).
-- The composition validator (presiding senior woman + >=1 external member + >=half women)
-- runs at constitution time; a breach throws ERR-PS09-ICC-PROCEDURE-REQUIRED and inserts nothing.
CREATE TABLE ps09_inquiry_appointments (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                uuid REFERENCES entities(id) ON DELETE RESTRICT,
    case_id                  uuid NOT NULL,
    role_type                ps09_icc_role NOT NULL,
    officer_id               uuid,                                 -- internal member
    external_name            varchar(160),                        -- external NGO/expert member
    is_external_member       boolean NOT NULL DEFAULT false,
    is_woman                 boolean NOT NULL DEFAULT false,
    is_senior_level          boolean NOT NULL DEFAULT false,
    appointed_by             uuid NOT NULL,
    appointed_date           date NOT NULL,
    status                   ps09_appointment_status NOT NULL DEFAULT 'ACTIVE',
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    updated_by               uuid,
    is_deleted               boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_ps09_icc_member CHECK (
        (officer_id IS NOT NULL AND external_name IS NULL)
        OR (officer_id IS NULL AND external_name IS NOT NULL)
    ),
    CONSTRAINT ck_ps09_icc_external CHECK (
        (is_external_member = true AND external_name IS NOT NULL)
        OR (is_external_member = false AND officer_id IS NOT NULL)
    )
);
CREATE INDEX ix_ps09_icc_appointments_tenant ON ps09_inquiry_appointments(tenant_id);
CREATE INDEX ix_ps09_icc_appointments_case   ON ps09_inquiry_appointments(case_id);
CREATE INDEX ix_ps09_icc_appointments_role   ON ps09_inquiry_appointments(role_type);

-- SECTION 3 — E29 personal_hearings (FR-PS09-025/DI-29: request -> grant/deny(reason) -> minutes).
CREATE TABLE ps09_personal_hearings (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                uuid REFERENCES entities(id) ON DELETE RESTRICT,
    case_id                  uuid NOT NULL,
    stage                    ps09_hearing_stage NOT NULL,
    requested                boolean NOT NULL DEFAULT false,
    requested_on             date NOT NULL,
    status                   ps09_hearing_status NOT NULL DEFAULT 'REQUESTED',
    granted                  boolean NOT NULL DEFAULT false,
    denial_reason            text,                                 -- DI-29: mandatory when denied
    scheduled_date           timestamptz,
    held_date                timestamptz,
    presided_by              uuid,
    minutes_text             text,                                 -- BR-2: immutable once finalised
    show_cause_notice_id     uuid REFERENCES ps09_show_cause_notices(id) ON DELETE SET NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    updated_by               uuid,
    is_deleted               boolean NOT NULL DEFAULT false,
    -- DI-29 in the schema itself: a DENIED hearing must carry a recorded denial_reason.
    CONSTRAINT ck_ps09_hearing_denial_reason CHECK (status <> 'DENIED' OR denial_reason IS NOT NULL)
);
CREATE INDEX ix_ps09_personal_hearings_tenant ON ps09_personal_hearings(tenant_id);
CREATE INDEX ix_ps09_personal_hearings_case   ON ps09_personal_hearings(case_id);
CREATE INDEX ix_ps09_personal_hearings_stage  ON ps09_personal_hearings(stage);

-- FR-PS09-025 AC-4: the referencing show-cause carries personal_hearing_id.
ALTER TABLE ps09_show_cause_notices
    ADD COLUMN personal_hearing_id uuid REFERENCES ps09_personal_hearings(id) ON DELETE SET NULL;

-- SECTION 4 — E28 sla_pause_events (FR-PS09-024/DI-18): APPEND-ONLY pause/resume ledger.
-- CONVENTIONS §3 / BR-2: only created_at/created_by lineage; the resume is a one-shot
-- resumed_at field write on the open row — rows are never updated otherwise nor deleted.
CREATE TABLE ps09_sla_pause_events (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                uuid REFERENCES entities(id) ON DELETE RESTRICT,
    case_id                  uuid NOT NULL,
    stage                    varchar(40) NOT NULL,
    reason                   ps09_sla_pause_reason NOT NULL,
    paused_from              timestamptz NOT NULL,
    resumed_at               timestamptz,                          -- null while paused (set once)
    paused_by                uuid,
    source_ref_id            uuid,                                 -- originating stay/remit/consultation/criminal ref
    recompute_applied        boolean NOT NULL DEFAULT false,       -- AC-3: set true when targets recomputed
    created_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    CONSTRAINT ck_ps09_sla_pause_window CHECK (resumed_at IS NULL OR resumed_at >= paused_from)
);
CREATE INDEX ix_ps09_sla_pause_events_tenant ON ps09_sla_pause_events(tenant_id);
CREATE INDEX ix_ps09_sla_pause_events_case   ON ps09_sla_pause_events(case_id);
CREATE INDEX ix_ps09_sla_pause_events_reason ON ps09_sla_pause_events(reason);
-- At most ONE open pause per case+stage (resume targets exactly the open row).
CREATE UNIQUE INDEX uq_ps09_sla_pause_open ON ps09_sla_pause_events(tenant_id, case_id, stage) WHERE resumed_at IS NULL;

-- SECTION 5 — §5.2.28 ps06_seniority_quota_rules (FR-PPP-020 AC-1: ratios + rotation config).
CREATE TABLE ps06_seniority_quota_rules (
    id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    rule_code                    varchar(40) NOT NULL,
    cadre_id                     uuid NOT NULL,
    grade_designation_id         uuid NOT NULL,
    dr_quota_ratio               integer NOT NULL,
    promotee_quota_ratio         integer NOT NULL,
    ldce_quota_ratio             integer NOT NULL DEFAULT 0,
    rotation_method              ps06_rotation_method NOT NULL,
    rotation_start_slot          ps06_rotation_start_slot NOT NULL DEFAULT 'DR_FIRST',
    unfilled_quota_carry_forward boolean NOT NULL DEFAULT true,
    policy_reference             varchar(120),
    is_active                    boolean NOT NULL DEFAULT true,
    created_at                   timestamptz NOT NULL DEFAULT now(),
    updated_at                   timestamptz NOT NULL DEFAULT now(),
    created_by                   uuid,
    updated_by                   uuid,
    is_deleted                   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps06_sqr_code UNIQUE (tenant_id, rule_code),
    -- QUOTA_RULE_INVALID guard restated in the schema: non-negative ratios, at least one positive.
    CONSTRAINT ck_ps06_sqr_ratios CHECK (
        dr_quota_ratio >= 0 AND promotee_quota_ratio >= 0 AND ldce_quota_ratio >= 0
        AND dr_quota_ratio + promotee_quota_ratio + ldce_quota_ratio >= 1
    )
);
CREATE INDEX ix_ps06_sqr_tenant ON ps06_seniority_quota_rules(tenant_id);
CREATE INDEX ix_ps06_sqr_cadre  ON ps06_seniority_quota_rules(cadre_id);
CREATE INDEX ix_ps06_sqr_grade  ON ps06_seniority_quota_rules(grade_designation_id);

-- SECTION 6 — combined construction run + entries (quota_slot_label, rotation_cycle_no) + trace.
CREATE TABLE ps06_combined_seniority_constructions (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                uuid REFERENCES entities(id) ON DELETE RESTRICT,
    quota_rule_id            uuid NOT NULL REFERENCES ps06_seniority_quota_rules(id) ON DELETE RESTRICT,
    cadre_id                 uuid NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    updated_by               uuid,
    is_deleted               boolean NOT NULL DEFAULT false
);
CREATE INDEX ix_ps06_csc_tenant ON ps06_combined_seniority_constructions(tenant_id);
CREATE INDEX ix_ps06_csc_rule   ON ps06_combined_seniority_constructions(quota_rule_id);

-- §5.2.2 stream/slot fields: each entry records recruitment_stream, quota_slot_label, rotation_cycle_no.
CREATE TABLE ps06_combined_seniority_entries (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    construction_id          uuid NOT NULL REFERENCES ps06_combined_seniority_constructions(id) ON DELETE RESTRICT,
    employee_id              uuid NOT NULL,
    rank_position            integer NOT NULL,
    -- STREAM_TAG_MISSING guard: the stream tag is NOT NULL by construction.
    recruitment_stream       ps06_recruitment_stream NOT NULL,
    quota_slot_label         varchar(20) NOT NULL,
    rotation_cycle_no        integer NOT NULL,
    created_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    CONSTRAINT uq_ps06_cse_rank UNIQUE (construction_id, rank_position),
    CONSTRAINT uq_ps06_cse_slot UNIQUE (construction_id, quota_slot_label)
);
CREATE INDEX ix_ps06_cse_tenant       ON ps06_combined_seniority_entries(tenant_id);
CREATE INDEX ix_ps06_cse_construction ON ps06_combined_seniority_entries(construction_id);

-- Rotation trace: which slot each cycle issued, and carry-forward of unfilled slots (AC-3: no silent loss).
CREATE TABLE ps06_rotation_trace_slots (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    construction_id          uuid NOT NULL REFERENCES ps06_combined_seniority_constructions(id) ON DELETE RESTRICT,
    cycle_no                 integer NOT NULL,
    slot_label               varchar(20) NOT NULL,
    recruitment_stream       ps06_recruitment_stream NOT NULL,
    filled_by_employee_id    uuid,
    carried_forward          boolean NOT NULL DEFAULT false,
    created_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    CONSTRAINT uq_ps06_rts_slot UNIQUE (construction_id, slot_label)
);
CREATE INDEX ix_ps06_rts_tenant       ON ps06_rotation_trace_slots(tenant_id);
CREATE INDEX ix_ps06_rts_construction ON ps06_rotation_trace_slots(construction_id);
