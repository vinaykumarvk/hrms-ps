-- Compensating (rollback) statement for 0038_w4_onboarding.sql (W4 / M02 Onboarding)
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only rule.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W4).
--
-- Drop order follows the FK chain: form responses and tasks reference instances, instances
-- reference processes. All five tables are new in 0038, so removing them restores the pre-0038
-- schema exactly — along with any onboarding instance, task or draft form response created
-- through the W4 screens. Export first if the environment has been used; in-flight onboarding
-- instances are live business state, not disposable configuration.
--
-- Promote into a numbered migration rather than running ad hoc; db_change_guard blocks ad-hoc DDL.

DROP TABLE IF EXISTS onboarding_form_responses;
DROP TABLE IF EXISTS onboarding_tasks;
DROP TABLE IF EXISTS onboarding_instances;
DROP TABLE IF EXISTS document_clusters;
DROP TABLE IF EXISTS onboarding_processes;
