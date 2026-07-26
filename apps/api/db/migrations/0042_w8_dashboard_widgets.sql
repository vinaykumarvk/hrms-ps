-- 0042_w8_dashboard_widgets.sql
--
-- W8 — the dashboard widget catalog.
--
-- GROUNDING: FS_Dashboard v1.0. That FS explicitly "adds the build layer — widget data-binding,
-- refresh/cache, drill-down, per-role composition, the aggregation API" over existing module data.
-- The only persistent entity it defines is the widget catalog: each widget is "specified once and
-- composed per persona" (§2.3; §4 GET /dashboard returns a widget manifest for
-- {role holdings x active workspace x has-reportees}). The widget's DATA is aggregated from
-- existing sources (PS14 analytics, P01 tasks, the W1-W7 module summaries) — so this is the only
-- table W8 needs. W8 is a composition wave, not a schema wave.
--
-- Additive and forward-only. Approved in .claude/approved-db-changes.txt (2026-07-26, W8).

CREATE TABLE dashboard_widgets (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_id       uuid REFERENCES entities(id) ON DELETE RESTRICT,
    widget_code     text NOT NULL,
    name            text NOT NULL,
    -- The aggregation source this widget binds to (§ per-widget data binding): e.g.
    -- ANALYTICS_KPI | WORKFLOW_TASKS | LEAVE_BALANCE | MODULE_SUMMARY.
    data_source     text NOT NULL,
    -- Which workspace (Me / My Team / Admin) the widget belongs to.
    workspace       text NOT NULL,
    -- Personas offered this widget; composition intersects this with the caller's role holdings.
    personas        text[] NOT NULL DEFAULT '{}',
    -- Refresh cadence in seconds (§10.4 data freshness & caching).
    refresh_seconds integer NOT NULL DEFAULT 300,
    display_order   integer NOT NULL DEFAULT 0,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    created_by      uuid,
    updated_by      uuid,
    is_deleted      boolean NOT NULL DEFAULT false,
    CONSTRAINT uq_dashboard_widgets_code UNIQUE (tenant_id, widget_code),
    CONSTRAINT ck_dashboard_widget_workspace CHECK (workspace IN ('me', 'team', 'admin'))
);
CREATE INDEX ix_dashboard_widgets_tenant ON dashboard_widgets(tenant_id);
