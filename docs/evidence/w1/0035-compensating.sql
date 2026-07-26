-- Compensating (rollback) statement for 0035_w1_config_master_data.sql (W1 Gap A)
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only rule: an applied
-- migration is never edited; it is compensated by a later one.
--
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W1 Gap A).
--
-- These ten tables are new in 0035, so removing them returns the schema to its pre-0035 state
-- exactly. Be aware of what is lost: any configuration rows created through the W1 registry
-- screens go with them. Export first if the environment has been used.
--
-- Order matters only for devices, which references locations; the rest are independent.
--
-- To use, promote this into a numbered migration (e.g. 0036_revert_w1_config_master_data.sql)
-- rather than running it ad hoc — the db_change_guard blocks ad-hoc DDL by design.

DROP TABLE IF EXISTS separation_workflows;
DROP TABLE IF EXISTS separation_policies;
DROP TABLE IF EXISTS kb_articles;
DROP TABLE IF EXISTS service_catalog_items;
DROP TABLE IF EXISTS sso_providers;
DROP TABLE IF EXISTS integrations;
DROP TABLE IF EXISTS tenant_settings;
DROP TABLE IF EXISTS ip_allowlist;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS business_units;
