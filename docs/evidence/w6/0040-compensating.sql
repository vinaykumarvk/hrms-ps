-- Compensating (rollback) for 0040_w6_performance.sql (W6 / M09 Performance)
-- Recorded before application; approved in .claude/approved-db-changes.txt (2026-07-26, W6).
-- Drop order follows the FK chain. All five tables are new in 0040; the shared PS08 tables
-- (goal_plans, goals, calibration_sessions, scorecard_pillars) are untouched by this migration
-- and so unaffected by this rollback. In-flight reviews/PIPs are live state — export first.
DROP TABLE IF EXISTS performance_improvement_plans;
DROP TABLE IF EXISTS review_records;
DROP TABLE IF EXISTS review_templates;
DROP TABLE IF EXISTS calibration_configurations;
DROP TABLE IF EXISTS review_cycles;
