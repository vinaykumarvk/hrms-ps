-- Compensating (rollback) for 0041_w7_documents_assets.sql (W7 / M11 + M17)
-- Recorded before application; approved in .claude/approved-db-changes.txt (2026-07-26, W7).
-- Drop order follows FK chains: cmdb_cis->assets, asset_assignments->assets, assets->asset_categories,
-- tickets->ticket_categories, letters->letter_templates. kb_articles and service_catalog_items are
-- from 0035 and untouched here. In-flight letters/tickets/assignments are live state — export first.
DROP TABLE IF EXISTS cmdb_cis;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS ticket_categories;
DROP TABLE IF EXISTS asset_assignments;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_categories;
DROP TABLE IF EXISTS letters;
DROP TABLE IF EXISTS letter_templates;
