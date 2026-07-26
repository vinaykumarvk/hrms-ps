-- Compensating (rollback) for 0042_w8_dashboard_widgets.sql (W8)
-- Recorded before application; approved in .claude/approved-db-changes.txt (2026-07-26, W8).
-- dashboard_widgets is new in 0042; removing it restores the pre-0042 schema. Widget catalog
-- configuration is lost with it — export first if the environment has been used.
DROP TABLE IF EXISTS dashboard_widgets;
