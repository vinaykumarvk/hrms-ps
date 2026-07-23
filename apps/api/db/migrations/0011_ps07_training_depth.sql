-- PH-08D migration 0011: PS07 training BRD-depth entities — faithful subset of
-- docs/data-model/07-PS07-training-skill-development.sql
-- Tables: ps07_skill_categories (5.2.1), ps07_skills (5.2.2), ps07_competencies (5.2.4),
--         ps07_competency_models (5.2.5), ps07_competency_model_items (5.2.6),
--         ps07_employee_skills (5.2.7), ps07_skill_gap_analyses (5.2.9), ps07_skill_gap_items (5.2.10),
--         ps07_gap_contracts (FR-PS07-024 / §10.6 Gap Contract v1 projection),
--         ps07_certifications (5.2.22: valid_until / is_mandatory / lapsed_mandatory),
--         ps07_training_campaigns (5.2.29), ps07_campaign_targets (5.2.31)
-- BRD: FR-PS07-002/003 (taxonomy + models), FR-PS07-007 (inventory), FR-PS07-008 (gap analysis),
--      FR-PS07-024 (versioned read-only Gap Contract for PS06/PS08),
--      FR-PS07-012 AC.6-8 (validity/renewal; JOB-PS07-CERTEXPIRY flips lapsed_mandatory),
--      FR-PS07-017 (campaign engine: waves + escalation_level).
-- NOTE: proficiency levels are held as ordinal integers (proficiency_levels master is a later
--       slice); training programs are addressed by program_code (sessions are service-layer).

-- SECTION 1 — ENUM TYPES (ps07_ prefix; UPPER_SNAKE values, CONVENTIONS §4)
CREATE TYPE ps07_master_status       AS ENUM ('DRAFT','PUBLISHED','RETIRED');
CREATE TYPE ps07_model_scope_type    AS ENUM ('ROLE','DESIGNATION','CADRE','ORG_UNIT','GENERIC');
CREATE TYPE ps07_competency_type     AS ENUM ('FUNCTIONAL','BEHAVIOURAL','LEADERSHIP','DIGITAL');
CREATE TYPE ps07_skill_source        AS ENUM ('SELF','MANAGER','ASSESSMENT','TRAINING','CREDENTIAL');
CREATE TYPE ps07_skill_status        AS ENUM ('DECLARED','VALIDATED','REJECTED');
CREATE TYPE ps07_freshness_status    AS ENUM ('FRESH','STALE');
CREATE TYPE ps07_scoring_mode        AS ENUM ('BINARY','WEIGHTED');
CREATE TYPE ps07_gap_analysis_status AS ENUM ('DRAFT','FINALIZED','SUPERSEDED');
CREATE TYPE ps07_gap_item_source     AS ENUM ('MODEL','APPRAISAL','MANDATORY');
CREATE TYPE ps07_gap_contract_status AS ENUM ('CURRENT','SUPERSEDED');
CREATE TYPE ps07_certification_status AS ENUM ('ACTIVE','EXPIRED','REVOKED');
CREATE TYPE ps07_campaign_status     AS ENUM ('DRAFT','LAUNCHED','COMPLETED','CANCELLED');
CREATE TYPE ps07_target_status       AS ENUM ('PENDING','NOMINATED','COMPLETED','EXEMPTED','OVERDUE');

-- SECTION 2 — 5.2.1 skill_categories
CREATE TABLE ps07_skill_categories (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    code               varchar(40) NOT NULL,
    name               varchar(150) NOT NULL,
    parent_category_id uuid REFERENCES ps07_skill_categories(id) ON DELETE RESTRICT,
    status             ps07_master_status NOT NULL DEFAULT 'PUBLISHED',
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_skill_categories_code UNIQUE (tenant_id, code)
);
CREATE INDEX ix_ps07_skill_categories_tenant ON ps07_skill_categories(tenant_id);
CREATE INDEX ix_ps07_skill_categories_parent ON ps07_skill_categories(parent_category_id);

-- SECTION 3 — 5.2.2 skills
CREATE TABLE ps07_skills (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id               uuid REFERENCES entities(id) ON DELETE RESTRICT,
    skill_category_id       uuid NOT NULL REFERENCES ps07_skill_categories(id) ON DELETE RESTRICT,
    code                    varchar(40) NOT NULL,
    name                    varchar(150) NOT NULL,
    is_compliance_skill     boolean NOT NULL DEFAULT false,
    default_validity_months integer,
    status                  ps07_master_status NOT NULL DEFAULT 'PUBLISHED',
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    created_by              uuid,
    updated_by              uuid,
    is_deleted              boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_skills_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_ps07_skills_validity CHECK (default_validity_months IS NULL OR default_validity_months >= 1),
    CONSTRAINT ck_ps07_skills_compliance_validity CHECK (NOT is_compliance_skill OR default_validity_months IS NOT NULL)
);
CREATE INDEX ix_ps07_skills_tenant   ON ps07_skills(tenant_id);
CREATE INDEX ix_ps07_skills_category ON ps07_skills(skill_category_id);

-- SECTION 4 — 5.2.4 competencies (composes 0..N skills)
CREATE TABLE ps07_competencies (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id        uuid REFERENCES entities(id) ON DELETE RESTRICT,
    code             varchar(40) NOT NULL,
    name             varchar(150) NOT NULL,
    competency_type  ps07_competency_type NOT NULL,
    linked_skill_ids uuid[] NOT NULL DEFAULT '{}',
    status           ps07_master_status NOT NULL DEFAULT 'PUBLISHED',
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    created_by       uuid,
    updated_by       uuid,
    is_deleted       boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_competencies_code UNIQUE (tenant_id, code)
);
CREATE INDEX ix_ps07_competencies_tenant ON ps07_competencies(tenant_id);
CREATE INDEX ix_ps07_competencies_type   ON ps07_competencies(competency_type);

-- SECTION 5 — 5.2.5 competency_models (role competency models; VAL-PS07-SCOPEKEY)
CREATE TABLE ps07_competency_models (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id       uuid REFERENCES entities(id) ON DELETE RESTRICT,
    code            varchar(40) NOT NULL,
    name            varchar(150) NOT NULL,
    scope_type      ps07_model_scope_type NOT NULL,
    scope_ref       varchar(64),
    owner_id        uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    review_due_date date NOT NULL,
    version         integer NOT NULL DEFAULT 1,
    status          ps07_master_status NOT NULL DEFAULT 'PUBLISHED',
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_competency_models_code UNIQUE (tenant_id, code, version),
    CONSTRAINT ck_ps07_competency_models_scopekey CHECK (scope_type = 'GENERIC' OR scope_ref IS NOT NULL)
);
CREATE INDEX ix_ps07_competency_models_tenant ON ps07_competency_models(tenant_id);
CREATE INDEX ix_ps07_competency_models_owner  ON ps07_competency_models(owner_id);
CREATE INDEX ix_ps07_competency_models_review ON ps07_competency_models(review_due_date);

-- SECTION 6 — 5.2.6 competency_model_items (target level per competency)
CREATE TABLE ps07_competency_model_items (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    competency_model_id      uuid NOT NULL REFERENCES ps07_competency_models(id) ON DELETE RESTRICT,
    competency_id            uuid NOT NULL REFERENCES ps07_competencies(id) ON DELETE RESTRICT,
    target_proficiency_level integer NOT NULL,
    is_critical              boolean NOT NULL DEFAULT false,
    sequence_no              integer NOT NULL DEFAULT 1,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    created_by               uuid,
    updated_by               uuid,
    is_deleted               boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_cmi UNIQUE (competency_model_id, competency_id),
    CONSTRAINT ck_ps07_cmi_target CHECK (target_proficiency_level >= 1)
);
CREATE INDEX ix_ps07_cmi_tenant ON ps07_competency_model_items(tenant_id);
CREATE INDEX ix_ps07_cmi_model  ON ps07_competency_model_items(competency_model_id);

-- SECTION 7 — 5.2.7 employee_skills (one current row per employee x skill)
CREATE TABLE ps07_employee_skills (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                 uuid REFERENCES entities(id) ON DELETE RESTRICT,
    employee_id               uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    skill_id                  uuid NOT NULL REFERENCES ps07_skills(id) ON DELETE RESTRICT,
    current_proficiency_level integer NOT NULL DEFAULT 0,
    source                    ps07_skill_source NOT NULL DEFAULT 'SELF',
    validated_by              uuid REFERENCES employees(id) ON DELETE SET NULL,
    validated_at              timestamptz,
    freshness_status          ps07_freshness_status NOT NULL DEFAULT 'FRESH',
    status                    ps07_skill_status NOT NULL DEFAULT 'DECLARED',
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    created_by                uuid,
    updated_by                uuid,
    is_deleted                boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_employee_skills UNIQUE (tenant_id, employee_id, skill_id),
    CONSTRAINT ck_ps07_employee_skills_level CHECK (current_proficiency_level >= 0)
);
CREATE INDEX ix_ps07_employee_skills_tenant   ON ps07_employee_skills(tenant_id);
CREATE INDEX ix_ps07_employee_skills_employee ON ps07_employee_skills(employee_id);
CREATE INDEX ix_ps07_employee_skills_skill    ON ps07_employee_skills(skill_id);

-- SECTION 8 — 5.2.9 skill_gap_analyses + 5.2.10 skill_gap_items
CREATE TABLE ps07_skill_gap_analyses (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id           uuid REFERENCES entities(id) ON DELETE RESTRICT,
    employee_id         uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    competency_model_id uuid NOT NULL REFERENCES ps07_competency_models(id) ON DELETE RESTRICT,
    scoring_mode        ps07_scoring_mode NOT NULL DEFAULT 'BINARY',
    model_stale_flag    boolean NOT NULL DEFAULT false,
    critical_gap_count  integer NOT NULL DEFAULT 0,
    generated_on        date NOT NULL,
    status              ps07_gap_analysis_status NOT NULL DEFAULT 'DRAFT',
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    created_by          uuid,
    updated_by          uuid,
    is_deleted          boolean NOT NULL DEFAULT false
);
CREATE INDEX ix_ps07_sga_tenant   ON ps07_skill_gap_analyses(tenant_id);
CREATE INDEX ix_ps07_sga_employee ON ps07_skill_gap_analyses(employee_id);
CREATE INDEX ix_ps07_sga_model    ON ps07_skill_gap_analyses(competency_model_id);

CREATE TABLE ps07_skill_gap_items (
    id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                 uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    skill_gap_analysis_id     uuid NOT NULL REFERENCES ps07_skill_gap_analyses(id) ON DELETE RESTRICT,
    competency_id             uuid NOT NULL REFERENCES ps07_competencies(id) ON DELETE RESTRICT,
    target_proficiency_level  integer NOT NULL,
    current_proficiency_level integer,
    gap_size                  integer NOT NULL DEFAULT 0,
    is_critical               boolean NOT NULL DEFAULT false,
    discounted_for_staleness  boolean NOT NULL DEFAULT false,
    source                    ps07_gap_item_source NOT NULL,
    created_at                timestamptz NOT NULL DEFAULT now(),
    updated_at                timestamptz NOT NULL DEFAULT now(),
    created_by                uuid,
    updated_by                uuid,
    is_deleted                boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_ps07_sgi_size CHECK (gap_size >= 0)  -- VAL-PS07-GAPSIZE
);
CREATE INDEX ix_ps07_sgi_tenant   ON ps07_skill_gap_items(tenant_id);
CREATE INDEX ix_ps07_sgi_analysis ON ps07_skill_gap_items(skill_gap_analysis_id);

-- SECTION 9 — FR-PS07-024 gap_contracts: versioned, read-only projection for PS06/PS08
CREATE TABLE ps07_gap_contracts (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id             uuid REFERENCES entities(id) ON DELETE RESTRICT,
    contract_version      integer NOT NULL,
    employee_id           uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    competency_model_id   uuid NOT NULL REFERENCES ps07_competency_models(id) ON DELETE RESTRICT,
    skill_gap_analysis_id uuid NOT NULL REFERENCES ps07_skill_gap_analyses(id) ON DELETE RESTRICT,
    generated_on          date NOT NULL,
    scoring_mode          ps07_scoring_mode NOT NULL DEFAULT 'BINARY',
    model_stale_flag      boolean NOT NULL DEFAULT false,
    items                 jsonb NOT NULL,  -- §10.6: [{competencyId,isCritical,gapSize,discountedForStaleness}]
    status                ps07_gap_contract_status NOT NULL DEFAULT 'CURRENT',
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now(),
    created_by            uuid,
    updated_by            uuid,
    is_deleted            boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_gap_contracts UNIQUE (tenant_id, employee_id, competency_model_id, contract_version)
);
CREATE INDEX ix_ps07_gap_contracts_tenant   ON ps07_gap_contracts(tenant_id);
CREATE INDEX ix_ps07_gap_contracts_employee ON ps07_gap_contracts(employee_id);
CREATE UNIQUE INDEX uq_ps07_gap_contracts_current
    ON ps07_gap_contracts(tenant_id, employee_id, competency_model_id)
    WHERE status = 'CURRENT' AND is_deleted = false;

-- SECTION 10 — 5.2.22 certifications (validity/renewal; lapsed_mandatory consumed by PS06)
CREATE TABLE ps07_certifications (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id                   uuid REFERENCES entities(id) ON DELETE RESTRICT,
    employee_id                 uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    certificate_no              varchar(50) NOT NULL,
    program_code                varchar(60),
    issue_date                  date NOT NULL,
    valid_until                 date,                          -- NULL = lifetime
    is_mandatory                boolean NOT NULL DEFAULT false,
    lapsed_mandatory            boolean NOT NULL DEFAULT false, -- set ONLY by JOB-PS07-CERTEXPIRY; consumed by PS06
    renewed_by_certification_id uuid REFERENCES ps07_certifications(id) ON DELETE SET NULL,
    renewal_of_certification_id uuid REFERENCES ps07_certifications(id) ON DELETE SET NULL,
    certificate_document_id     uuid REFERENCES documents(id) ON DELETE SET NULL,
    service_register_event_id   uuid REFERENCES service_register_events(id) ON DELETE SET NULL,
    status                      ps07_certification_status NOT NULL DEFAULT 'ACTIVE',
    created_at                  timestamptz NOT NULL DEFAULT now(),
    updated_at                  timestamptz NOT NULL DEFAULT now(),
    created_by                  uuid,
    updated_by                  uuid,
    is_deleted                  boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_certifications_cert_no UNIQUE (tenant_id, certificate_no),
    CONSTRAINT ck_ps07_certifications_validity CHECK (valid_until IS NULL OR valid_until > issue_date)
);
CREATE INDEX ix_ps07_certifications_tenant      ON ps07_certifications(tenant_id);
CREATE INDEX ix_ps07_certifications_employee    ON ps07_certifications(employee_id);
CREATE INDEX ix_ps07_certifications_valid_until ON ps07_certifications(valid_until);
CREATE INDEX ix_ps07_certifications_lapsed      ON ps07_certifications(lapsed_mandatory) WHERE lapsed_mandatory = true;

-- SECTION 11 — 5.2.29 training_campaigns + 5.2.31 campaign_targets (waves + escalation)
CREATE TABLE ps07_training_campaigns (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    code         varchar(40) NOT NULL,
    name         varchar(200) NOT NULL,
    program_code varchar(60) NOT NULL,
    window_start date NOT NULL,
    window_end   date NOT NULL,
    auto_wave    boolean NOT NULL DEFAULT true,
    wave_size    integer,
    status       ps07_campaign_status NOT NULL DEFAULT 'DRAFT',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid,
    updated_by   uuid,
    is_deleted   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_training_campaigns_code UNIQUE (tenant_id, code),
    CONSTRAINT ck_ps07_training_campaigns_window CHECK (window_end >= window_start),
    CONSTRAINT ck_ps07_training_campaigns_wave CHECK (wave_size IS NULL OR wave_size >= 1)
);
CREATE INDEX ix_ps07_campaigns_tenant ON ps07_training_campaigns(tenant_id);
CREATE INDEX ix_ps07_campaigns_status ON ps07_training_campaigns(status);

CREATE TABLE ps07_campaign_targets (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    training_campaign_id    uuid NOT NULL REFERENCES ps07_training_campaigns(id) ON DELETE RESTRICT,
    employee_id             uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    wave_no                 integer,
    training_nomination_id  uuid,
    target_status           ps07_target_status NOT NULL DEFAULT 'PENDING',
    due_date                date NOT NULL,
    escalation_level        integer NOT NULL DEFAULT 0,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),
    created_by              uuid,
    updated_by              uuid,
    is_deleted              boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ps07_campaign_targets UNIQUE (tenant_id, training_campaign_id, employee_id),
    CONSTRAINT ck_ps07_campaign_targets_escalation CHECK (escalation_level >= 0)
);
CREATE INDEX ix_ps07_campaign_targets_tenant   ON ps07_campaign_targets(tenant_id);
CREATE INDEX ix_ps07_campaign_targets_campaign ON ps07_campaign_targets(training_campaign_id);
CREATE INDEX ix_ps07_campaign_targets_employee ON ps07_campaign_targets(employee_id);
CREATE INDEX ix_ps07_campaign_targets_status   ON ps07_campaign_targets(target_status);
