-- 0041_w7_documents_assets.sql
--
-- W7 — M11 Documents/Letters + M17 Assets/Service-desk core entities.
--
-- GROUNDING: extracted FS bodies.
--   M11 (§4.11): letter_templates, employee-document generation ("letters"), merge fields, bulk.
--   M17: assets, asset_assignments, cmdb_cis, ci_relationships; asset field list from §2 screen
--        specs (asset_tag, category, make/model, condition, assigned_at, acknowledgement).
--
-- REUSE: kb_articles and service_catalog_items already exist (0035_w1_config_master_data.sql) and
-- are NOT re-created here. document_categories exists under PS13.
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W7).
-- Compensating statement: docs/evidence/w7/0041-compensating.sql

-- ---- M11 letters ----------------------------------------------------------------------------

CREATE TABLE letter_templates (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    template_code text NOT NULL,                       -- LTR_OFFER … LTR_TRLOC (§ inventory)
    name          text NOT NULL,
    body          text,                                -- template with {{merge_field}} bindings
    merge_fields  text[] NOT NULL DEFAULT '{}',
    version       integer NOT NULL DEFAULT 1,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_letter_templates_code UNIQUE (tenant_id, template_code)
);
CREATE INDEX ix_letter_templates_tenant ON letter_templates(tenant_id);

-- A generated letter instance (the queue + sign-off tracker surface).
CREATE TABLE letters (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id          uuid REFERENCES entities(id) ON DELETE RESTRICT,
    template_id        uuid NOT NULL REFERENCES letter_templates(id) ON DELETE RESTRICT,
    employee_id        uuid NOT NULL,
    -- QUEUED | GENERATED | PENDING_SIGNOFF | SIGNED | ISSUED | CANCELLED
    letter_status      text NOT NULL DEFAULT 'QUEUED',
    merge_values       jsonb NOT NULL DEFAULT '{}'::jsonb,
    document_id        uuid,                            -- PS13 vault document once generated
    -- Bulk runs share a batch id so the queue can group them.
    batch_id           uuid,
    signed_off_by      uuid,
    signed_off_at      timestamptz,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    created_by         uuid,
    updated_by         uuid,
    is_deleted         boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_letter_status CHECK (letter_status IN ('QUEUED', 'GENERATED', 'PENDING_SIGNOFF', 'SIGNED', 'ISSUED', 'CANCELLED'))
);
CREATE INDEX ix_letters_tenant ON letters(tenant_id);
CREATE INDEX ix_letters_batch ON letters(batch_id);
CREATE INDEX ix_letters_employee ON letters(employee_id);

-- ---- M17 assets -----------------------------------------------------------------------------

CREATE TABLE asset_categories (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    category_code text NOT NULL,
    name          text NOT NULL,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_asset_categories_code UNIQUE (tenant_id, category_code)
);
CREATE INDEX ix_asset_categories_tenant ON asset_categories(tenant_id);

CREATE TABLE assets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id       uuid REFERENCES entities(id) ON DELETE RESTRICT,
    asset_tag       text NOT NULL,                     -- §2 screen key field
    category_id     uuid REFERENCES asset_categories(id) ON DELETE RESTRICT,
    make            text,
    model           text,
    serial_number   text,
    condition       text,                              -- §2 acknowledgement field
    -- IN_STOCK | ASSIGNED | IN_REPAIR | RETIRED | DISPOSED | LOST
    asset_status    text NOT NULL DEFAULT 'IN_STOCK',
    location_id     uuid REFERENCES locations(id) ON DELETE RESTRICT,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_assets_tag UNIQUE (tenant_id, asset_tag),
    CONSTRAINT ck_asset_status CHECK (asset_status IN ('IN_STOCK', 'ASSIGNED', 'IN_REPAIR', 'RETIRED', 'DISPOSED', 'LOST'))
);
CREATE INDEX ix_assets_tenant ON assets(tenant_id);
CREATE INDEX ix_assets_category ON assets(category_id);

CREATE TABLE asset_assignments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id       uuid REFERENCES entities(id) ON DELETE RESTRICT,
    asset_id        uuid NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    employee_id     uuid NOT NULL,
    assigned_at     timestamptz NOT NULL DEFAULT now(),
    returned_at     timestamptz,
    -- PENDING_ACK | ACKNOWLEDGED | RETURNED (asset_acknowledgements in the FS)
    ack_status      text NOT NULL DEFAULT 'PENDING_ACK',
    acknowledged_at timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean NOT NULL DEFAULT false,
    CONSTRAINT ck_asset_ack_status CHECK (ack_status IN ('PENDING_ACK', 'ACKNOWLEDGED', 'RETURNED'))
);
CREATE INDEX ix_asset_assignments_asset ON asset_assignments(asset_id);
CREATE INDEX ix_asset_assignments_employee ON asset_assignments(employee_id);
-- One active (un-returned) assignment per asset.
CREATE UNIQUE INDEX ck_asset_active_assignment
    ON asset_assignments (asset_id)
    WHERE returned_at IS NULL AND is_deleted = false;

-- ---- M17 service desk -----------------------------------------------------------------------

CREATE TABLE ticket_categories (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    category_code text NOT NULL,
    name          text NOT NULL,
    sla_hours     integer,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_ticket_categories_code UNIQUE (tenant_id, category_code)
);
CREATE INDEX ix_ticket_categories_tenant ON ticket_categories(tenant_id);

CREATE TABLE tickets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id       uuid REFERENCES entities(id) ON DELETE RESTRICT,
    ticket_no       text NOT NULL,
    category_id     uuid REFERENCES ticket_categories(id) ON DELETE RESTRICT,
    catalog_item_id uuid REFERENCES service_catalog_items(id) ON DELETE SET NULL,
    raised_by       uuid NOT NULL,
    assigned_to     uuid,
    subject         text NOT NULL,
    description     text,
    -- OPEN | IN_PROGRESS | ON_HOLD | RESOLVED | CLOSED | ESCALATED | CANCELLED
    ticket_status   text NOT NULL DEFAULT 'OPEN',
    priority        text NOT NULL DEFAULT 'NORMAL',
    resolved_at     timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_tickets_no UNIQUE (tenant_id, ticket_no),
    CONSTRAINT ck_ticket_status CHECK (ticket_status IN ('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED', 'ESCALATED', 'CANCELLED'))
);
CREATE INDEX ix_tickets_tenant ON tickets(tenant_id);
CREATE INDEX ix_tickets_assigned ON tickets(assigned_to);

-- CMDB configuration items (§ it-cmdb).
CREATE TABLE cmdb_cis (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id     uuid REFERENCES entities(id) ON DELETE RESTRICT,
    ci_code       text NOT NULL,
    name          text NOT NULL,
    ci_type       text NOT NULL,                       -- HARDWARE | SOFTWARE | SERVICE | NETWORK
    asset_id      uuid REFERENCES assets(id) ON DELETE SET NULL,
    ci_status     text NOT NULL DEFAULT 'ACTIVE',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    created_by    uuid,
    updated_by    uuid,
    is_deleted    boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_cmdb_cis_code UNIQUE (tenant_id, ci_code)
);
CREATE INDEX ix_cmdb_cis_tenant ON cmdb_cis(tenant_id);
