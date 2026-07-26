-- Compensating (rollback) statement for 0037_w3_recruitment_config.sql (W3 Gap A)
--
-- Recorded BEFORE the forward migration was applied, per the repo's forward-only rule.
-- Approved in .claude/approved-db-changes.txt (2026-07-26, W3 Gap A).
--
-- All nine tables are new in 0037, so removing them restores the pre-0037 schema exactly. Any
-- recruiter, portal, interview-type, guide, duplicity, hiring-lead, source or decision-reason
-- configuration created through the W3 screens is lost with them — export first if the
-- environment has been used.
--
-- Promote into a numbered migration rather than running ad hoc; db_change_guard blocks ad-hoc DDL.

DROP TABLE IF EXISTS candidate_decision_reasons;
DROP TABLE IF EXISTS recruitment_sources;
DROP TABLE IF EXISTS hiring_leads;
DROP TABLE IF EXISTS duplicity_check_settings;
DROP TABLE IF EXISTS interview_guides;
DROP TABLE IF EXISTS interview_types;
DROP TABLE IF EXISTS job_portals;
DROP TABLE IF EXISTS external_recruiter_groups;
DROP TABLE IF EXISTS external_recruiters;
