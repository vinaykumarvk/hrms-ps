-- 0037_w3_recruitment_config.sql
--
-- W3 Gap A — recruitment CONFIGURATION tables.
--
-- Grounding, as for 0036: every column traces to a named field in the DwnB form-field exports
-- shipped with FS_M08_Recruitment. The source file is named above each table.
--
-- SCOPE LIMIT, deliberate and important:
--   This migration covers recruitment CONFIGURATION only. The transactional ATS core —
--   requisitions, candidates, applications, interviews, offers, the hiring pipeline — is NOT
--   here. The field exports specify configuration registries; they do not specify the
--   transactional model, which lives in the FS_M08_Recruitment body (.docx, unreadable this
--   session). Authoring those tables from screen names alone would repeat exactly the
--   inferred-schema problem that W1's Gap A created, at larger scale.
--
--   Consequence: W3's transactional screens (requisitions, candidates, interviews, offer-letters,
--   hiring-pipeline, generate-offer) stay uncovered until the FS body is read. That is the
--   correct outcome.
--
-- Platform conventions as in 0001-0036. Additive and forward-only.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W3 Gap A).
-- Compensating statement: docs/evidence/w3/0037-compensating.sql

-- <- External_Recruiters_Export.csv
CREATE TABLE external_recruiters (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id            uuid REFERENCES entities(id) ON DELETE RESTRICT,
    recruiter_code       text NOT NULL,
    name                 text NOT NULL,                        -- "External Recruiter Name*"
    email                text NOT NULL,                        -- "External Recruiter Email*"
    contact_number_code  text,                                 -- "Contact Number Code"
    contact_number       text,                                 -- "Contact Number"
    contract_from        date,                                 -- "Contract Period From"
    contract_to          date,                                 -- "Contract Period To"
    recruiter_status     text NOT NULL DEFAULT 'ACTIVE',       -- "External Recruiter Status*"
    is_active            boolean NOT NULL DEFAULT true,
    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now(),
    created_by           uuid,
    updated_by           uuid,
    is_deleted           boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_external_recruiters_code UNIQUE (tenant_id, recruiter_code),
    CONSTRAINT ck_external_recruiter_contract CHECK (contract_from IS NULL OR contract_to IS NULL OR contract_to >= contract_from)
);
CREATE INDEX ix_external_recruiters_tenant ON external_recruiters(tenant_id);

-- <- External_Recruiter_Groups_Export.csv
CREATE TABLE external_recruiter_groups (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id   uuid REFERENCES entities(id) ON DELETE RESTRICT,
    group_code  text NOT NULL,
    name        text NOT NULL,                                 -- "External Recruiter Group Name*"
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    updated_by  uuid,
    is_deleted  boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_external_recruiter_groups_code UNIQUE (tenant_id, group_code)
);
CREATE INDEX ix_external_recruiter_groups_tenant ON external_recruiter_groups(tenant_id);

-- <- Job_Portals_Export.csv
CREATE TABLE job_portals (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id   uuid REFERENCES entities(id) ON DELETE RESTRICT,
    portal_code text NOT NULL,
    name        text NOT NULL,                                 -- "Job Portal Name*"
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    updated_by  uuid,
    is_deleted  boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_job_portals_code UNIQUE (tenant_id, portal_code)
);
CREATE INDEX ix_job_portals_tenant ON job_portals(tenant_id);

-- <- Interview_Types_Export.csv
CREATE TABLE interview_types (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    interview_code text NOT NULL,
    name           text NOT NULL,                              -- "Enter Interview Type *"
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_interview_types_code UNIQUE (tenant_id, interview_code)
);
CREATE INDEX ix_interview_types_tenant ON interview_types(tenant_id);

-- <- Interview_Guides_Export.csv
CREATE TABLE interview_guides (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id   uuid REFERENCES entities(id) ON DELETE RESTRICT,
    guide_code  text NOT NULL,
    name        text NOT NULL,                                 -- "Interview Guide Name *"
    guidelines  text,                                          -- "Interview Guidelines *"
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    updated_by  uuid,
    is_deleted  boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_interview_guides_code UNIQUE (tenant_id, guide_code)
);
CREATE INDEX ix_interview_guides_tenant ON interview_guides(tenant_id);

-- <- Duplicity_Check_Settings_Export.csv
-- The export declares up to five comparison fields; they are stored as an ordered text array
-- rather than five columns so adding a sixth is data, not a migration.
CREATE TABLE duplicity_check_settings (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    setting_code   text NOT NULL,
    name           text NOT NULL,                              -- "Duplicity Check Settings Name *"
    compare_fields text[] NOT NULL DEFAULT '{}',               -- "Duplicity Check - Field 1..5"
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_duplicity_check_settings_code UNIQUE (tenant_id, setting_code)
);
CREATE INDEX ix_duplicity_check_settings_tenant ON duplicity_check_settings(tenant_id);

-- <- Hiring_Leads_Export.csv
CREATE TABLE hiring_leads (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id         uuid REFERENCES entities(id) ON DELETE RESTRICT,
    configuration_code text NOT NULL,
    name              text NOT NULL,                           -- "Hiring Lead Configuration Name*"
    hiring_lead_ref   text,                                    -- "Select Hiring lead"
    recruiter_ref     text,                                    -- "Select Recruiter"
    assignment_type   text NOT NULL,                           -- "Assignment type*"
    applicable_to     text,                                    -- "Applicable to*"
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    created_by        uuid,
    updated_by        uuid,
    is_deleted        boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_hiring_leads_code UNIQUE (tenant_id, configuration_code)
);
CREATE INDEX ix_hiring_leads_tenant ON hiring_leads(tenant_id);

-- <- Custom_Source_Export.csv + Custom_Source_Type_Export.csv
CREATE TABLE recruitment_sources (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    source_code  text NOT NULL,
    name         text NOT NULL,                                -- "Custom Source Name*"
    source_type  text NOT NULL,                                -- "Custom Source Type*"
    description  text,                                         -- "Add Description"
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid,
    updated_by   uuid,
    is_deleted   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_recruitment_sources_code UNIQUE (tenant_id, source_code)
);
CREATE INDEX ix_recruitment_sources_tenant ON recruitment_sources(tenant_id);

-- <- Candidate_Decision___Archival_Reasons_Export.csv
CREATE TABLE candidate_decision_reasons (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id   uuid REFERENCES entities(id) ON DELETE RESTRICT,
    reason_code text NOT NULL,
    name        text NOT NULL,                                 -- "Reason*"
    event_type  text NOT NULL,                                 -- "Event type*"
    description text,                                          -- "Reason Description"
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    created_by  uuid,
    updated_by  uuid,
    is_deleted  boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_candidate_decision_reasons_code UNIQUE (tenant_id, reason_code)
);
CREATE INDEX ix_candidate_decision_reasons_tenant ON candidate_decision_reasons(tenant_id);
