-- 0044_separation_policy_detail.sql
--
-- 0035 re-derivation correction — separation_policies.
--
-- Re-deriving 0035's ten tables against the now-readable FS bodies found nine FS-consistent and
-- one under-modelled. separation_policies was authored flat (policy_code, name, notice_period_days,
-- applies_to_grade) before the FS was readable. FS_M03_Exits_Offboarding §4.8.1 / §370 specifies
-- it as a 5-step wizard with policy-detail toggles and TWO child entities:
--   §4.8.1a separation_policy_initiators   — who may initiate under this policy
--   §4.8.1b separation_policy_workflow_map — which P01 workflow each separation category maps to
--
-- This migration adds the missing columns and the two child tables. It is additive
-- (ALTER TABLE ADD COLUMN + CREATE TABLE); 0035 itself is not modified and remains unapplied.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26). Compensating:
-- docs/evidence/w1/0044-compensating.sql

-- §2 Policy Details toggles + §1 applicability (FS §370).
ALTER TABLE separation_policies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE separation_policies ADD COLUMN IF NOT EXISTS applicability text;               -- "Applicable To" UAG (§4.2)
ALTER TABLE separation_policies ADD COLUMN IF NOT EXISTS allow_past_dated_resignation boolean NOT NULL DEFAULT false;
ALTER TABLE separation_policies ADD COLUMN IF NOT EXISTS force_separate_on_lwd boolean NOT NULL DEFAULT false;

-- §4.8.1a — the principals permitted to initiate a separation under this policy.
CREATE TABLE separation_policy_initiators (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id              uuid REFERENCES entities(id) ON DELETE RESTRICT,
    separation_policy_id   uuid NOT NULL REFERENCES separation_policies(id) ON DELETE RESTRICT,
    -- EMPLOYEE_SELF | HR_ADMIN | HRBP | ADMIN_FORCE (the §6.4 initiator inventory)
    initiator_role         text NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    created_by             uuid,
    updated_by             uuid,
    is_deleted             boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_separation_policy_initiator UNIQUE (separation_policy_id, initiator_role)
);
CREATE INDEX ix_separation_policy_initiators_policy ON separation_policy_initiators(separation_policy_id);

-- §4.8.1b — maps a separation category under this policy to its P01 workflow definition.
CREATE TABLE separation_policy_workflow_map (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id              uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id              uuid REFERENCES entities(id) ON DELETE RESTRICT,
    separation_policy_id   uuid NOT NULL REFERENCES separation_policies(id) ON DELETE RESTRICT,
    separation_category    text NOT NULL,             -- RESIGNATION | TERMINATION | ABSCONDING | RETIREMENT
    -- Binds to a P01 workflow definition; separation does not define its own engine.
    p01_workflow_code      text NOT NULL,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now(),
    created_by             uuid,
    updated_by             uuid,
    is_deleted             boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_separation_policy_workflow UNIQUE (separation_policy_id, separation_category),
    CONSTRAINT ck_separation_policy_category CHECK (separation_category IN ('RESIGNATION', 'TERMINATION', 'ABSCONDING', 'RETIREMENT'))
);
CREATE INDEX ix_separation_policy_workflow_map_policy ON separation_policy_workflow_map(separation_policy_id);
