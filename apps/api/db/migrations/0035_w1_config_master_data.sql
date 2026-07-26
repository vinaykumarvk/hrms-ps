-- 0035_w1_config_master_data.sql
--
-- W1 Gap A — the ten configuration tables the Org-Admin screens administer but which had no
-- definition in docs/data-model/ or apps/api/db/migrations/.
--
-- Identified by docs/spec/full-coverage/w1-coverage.md: each of these backs a prototype screen
-- that is registry-shaped, so the W1 substrate can serve it as soon as a table exists. Without
-- them a descriptor would be pointing at nothing, which is inventing schema by another name.
--
-- Every table follows the platform conventions already used across 0001-0034:
--   tenant_id / entity_id scoping (multi-tenancy is mandatory)
--   a business key unique per tenant
--   is_active for retirement, is_deleted for soft delete — configuration is never hard-deleted
--   created_at / updated_at / created_by / updated_by audit columns
--
-- Additive and forward-only: only CREATE statements, no existing object is modified.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W1 Gap A).
--
-- ASSUMPTIONS, recorded because these tables were derived from prototype screens rather than
-- from a signed FS (the source plan's W0 FS-gap list did not include them):
--   * columns cover what the prototype screen displays and edits, not a full enterprise model
--   * secrets (SSO client secrets, integration credentials) are NOT stored here — only a
--     reference; the vault holds the material
--   * business_units is modelled as its own table rather than a flavour of org_units because the
--     prototype treats BU and Department as separate registries with separate screens

-- Org structure ------------------------------------------------------------------------------

CREATE TABLE business_units (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    business_unit_code text NOT NULL,
    name               text NOT NULL,
    head_employee_id   uuid,
    cost_centre_code   text,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_business_units_code UNIQUE (tenant_id, business_unit_code)
);
CREATE INDEX ix_business_units_tenant ON business_units(tenant_id);

-- IAM and security ---------------------------------------------------------------------------

CREATE TABLE devices (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    device_code   text NOT NULL,                    -- biometric / access terminal identifier
    name          text NOT NULL,
    device_type   text NOT NULL,                    -- BIOMETRIC | ACCESS_CONTROL | KIOSK
    location_id   uuid REFERENCES locations(id) ON DELETE RESTRICT,
    serial_number text,
    last_seen_at  timestamptz,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_devices_code UNIQUE (tenant_id, device_code)
);
CREATE INDEX ix_devices_tenant ON devices(tenant_id);

CREATE TABLE ip_allowlist (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id    uuid REFERENCES entities(id) ON DELETE RESTRICT,
    entry_code   text NOT NULL,
    name         text NOT NULL,
    cidr_block   text NOT NULL,                     -- stored as text; validated at the service edge
    applies_to   text NOT NULL DEFAULT 'ALL',       -- ALL | ADMIN | PUNCH
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    created_by   uuid,
    updated_by   uuid,
    is_deleted   boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ip_allowlist_code UNIQUE (tenant_id, entry_code)
);
CREATE INDEX ix_ip_allowlist_tenant ON ip_allowlist(tenant_id);

-- Tenant and integrations --------------------------------------------------------------------

CREATE TABLE tenant_settings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    setting_key   text NOT NULL,
    name          text NOT NULL,
    setting_value text,
    value_type    text NOT NULL DEFAULT 'TEXT',     -- TEXT | NUMBER | BOOLEAN | JSON
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_tenant_settings_key UNIQUE (tenant_id, setting_key)
);
CREATE INDEX ix_tenant_settings_tenant ON tenant_settings(tenant_id);

CREATE TABLE integrations (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id        uuid REFERENCES entities(id) ON DELETE RESTRICT,
    integration_code text NOT NULL,
    name             text NOT NULL,
    provider         text NOT NULL,                 -- e.g. PAYROLL_BANK, SMS, EMAIL, HRIS
    endpoint_url     text,
    -- Credential material is NEVER stored here; this references the vault entry that holds it.
    credential_ref   text,
    is_active        boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    created_by       uuid,
    updated_by       uuid,
    is_deleted       boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_integrations_code UNIQUE (tenant_id, integration_code)
);
CREATE INDEX ix_integrations_tenant ON integrations(tenant_id);

CREATE TABLE sso_providers (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    provider_code  text NOT NULL,
    name           text NOT NULL,
    protocol       text NOT NULL,                   -- OIDC | SAML2
    issuer_url     text,
    -- As above: the client secret lives in the vault, referenced not embedded.
    credential_ref text,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_sso_providers_code UNIQUE (tenant_id, provider_code)
);
CREATE INDEX ix_sso_providers_tenant ON sso_providers(tenant_id);

-- Service desk (M17) -------------------------------------------------------------------------

CREATE TABLE service_catalog_items (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id      uuid REFERENCES entities(id) ON DELETE RESTRICT,
    catalog_code   text NOT NULL,
    name           text NOT NULL,
    category       text NOT NULL,
    sla_hours      integer,
    owner_group    text,
    is_active      boolean NOT NULL DEFAULT true,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now(),
    created_by     uuid,
    updated_by     uuid,
    is_deleted     boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_service_catalog_items_code UNIQUE (tenant_id, catalog_code)
);
CREATE INDEX ix_service_catalog_items_tenant ON service_catalog_items(tenant_id);

CREATE TABLE kb_articles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    article_code  text NOT NULL,
    name          text NOT NULL,                    -- title
    category      text,
    body          text,
    review_status text NOT NULL DEFAULT 'DRAFT',    -- DRAFT | PUBLISHED | RETIRED
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_kb_articles_code UNIQUE (tenant_id, article_code)
);
CREATE INDEX ix_kb_articles_tenant ON kb_articles(tenant_id);

-- Separation (M03) config --------------------------------------------------------------------

CREATE TABLE separation_policies (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    policy_code        text NOT NULL,
    name               text NOT NULL,
    notice_period_days integer NOT NULL DEFAULT 0,
    applies_to_grade   text,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_separation_policies_code UNIQUE (tenant_id, policy_code)
);
CREATE INDEX ix_separation_policies_tenant ON separation_policies(tenant_id);

CREATE TABLE separation_workflows (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    workflow_code text NOT NULL,
    name          text NOT NULL,
    -- The P01 workflow definition this configuration binds to. Separation does not get its own
    -- workflow engine; it selects a P01 definition (CLAUDE.md: reuse the platform).
    p01_workflow_code text NOT NULL,
    separation_type   text NOT NULL,                -- RESIGNATION | TERMINATION | ABSCONDING | RETIREMENT
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_separation_workflows_code UNIQUE (tenant_id, workflow_code)
);
CREATE INDEX ix_separation_workflows_tenant ON separation_workflows(tenant_id);
