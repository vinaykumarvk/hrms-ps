# HRMS Consolidated Data Model (PostgreSQL)

Holistic, normalized PostgreSQL schema generated from the platform-grounded **v3** BRDs
(`docs/brd/v3/`) and the platform contract (`docs/brd/PLATFORM_FOUNDATION.md`).

## Build order (load in this exact sequence)

| # | File | Owns / adds | Tables | Validated |
|---|---|---|---|---|
| 00 | `00-platform-core.sql` | Shared core: tenancy, RBAC, employee master, P01 workflow, P05 audit, PS12 SR ledger core, PS13 documents core, notifications/jobs/migration | 35 | ✅ PG16 |
| 01 | `01-PS01-employee-profile.sql` | Employee-master satellites (aliases, Aadhaar vault, attribute/position history, certificates, privacy/consent, governed change, outbox, break-glass) | 32 | ✅ PG |
| 02 | `02-PS02-personal-details-workflow.sql` | Change-request maker-checker (on P01); not an SR writer | 18 | ✅ PG16 |
| 03 | `03-PS03-attendance-leave.sql` | Leave types/policies/balances/ledger/applications, attendance/punches/shifts/rosters | 31 | ✅ PG14 (full-load) |
| 04 | `04-PS04-leave-sr-integration.sql` | Leave→SR outbox/relay/reconciliation/DLQ (SR writer) | 14 | ✅ PG14 |
| 05 | `05-PS05-transfer-relieving-joining.sql` | Transfer orders/clearance/handover/joining + sr_outbox (SR writer) | 21 | ✅ PG |
| 06 | `06-PS06-promotion-posting-progression.sql` | Seniority/DPC/MACP/sanctioned-posts/qualifying-service (SR writer) | 32 | ✅ PG16 |
| 07 | `07-PS07-training-skill-development.sql` | Competency/skills/training/LMS/certifications (SR writer) | 37 | ✅ PG16 |
| 08 | `08-PS08-performance-appraisal.sql` | Appraisal/APAR/goals/calibration/representation/PIP (SR writer) | 23 | ✅ PG |
| 09 | `09-PS09-disciplinary-punishment.sql` | Due-process: case/charge/inquiry/penalty/appeal (SR writer; reference impl) | 30 | ✅ PG14 |
| 10 | `10-PS10-payroll-benefits.sql` | Salary/payroll-run/deductions/loans/benefits/FnF (SR writer; Phase-2) | 27 | ✅ PG |
| 11 | `11-PS11-retirement-pension.sql` | Separation/pension/gratuity/PPO/pensioner + rule tables (SR writer) | 35 | ✅ PG17 |
| 12 | `12-PS12-digital-service-register.sql` | SR supporting: event-type catalog, status sub-ledger, anchors, gap register, attestations, corrigenda, LTV (ledger itself is core) | 18 | ✅ PG14 (full-load) |
| 13 | `13-PS13-document-management.sql` | Vault: types/folders/ACLs/retention/legal-hold/signatures/clearance/DLP (documents core) | 24 | ✅ PG14 (full-load) |
| 14 | `14-PS14-dashboard-analytics.sql` | Dashboards/KPIs/reports/marts/scope-policy/prediction/embed (RLS = P02) | 26 (24 owned) | ✅ PG14 (full-load) |

**Total: 447 tables · 1,907 FK constraints · 443 RLS-enabled tables · 700 enum types.** (403→431 CSV recon →447 prototype recon — see `reconciliation/`.)
✅ **All 15 files load clean end-to-end** (validated by loading 00→14 in order into a throwaway
PostgreSQL 14 cluster with `ON_ERROR_STOP=1`, all seed data inserting). Conventions in `CONVENTIONS.md`.

### Cross-module collisions found by the full-load test and fixed
- `retention_policies` & `legal_holds` tables existed in both PS01 and PS13 → PS13's renamed to
  `document_retention_policies` / `document_legal_holds`.
- Duplicate index names: PS02↔PS03 `ix_delegations_*` (→ `ix_appr_delegations_*` in PS03);
  PS04↔PS12 `ix_sr_corr_*` (→ `ix_ps12_sr_corr_*` in PS12).
- PS12 seed INSERTs into core `documents` used a non-existent `document_type` column → corrected.

## Load command
```bash
for f in $(ls /Users/n15318/hrms/docs/data-model/[0-9]*.sql | sort); do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || { echo "FAILED: $f"; break; }
done
```

## Conventions (see CONVENTIONS.md)
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`; business keys are separate unique columns.
- Every business table: `tenant_id` (NOT NULL) + `entity_id` (where scoped), audit columns, `is_deleted` (except append-only ledgers).
- Enums: platform-wide closed sets as `CREATE TYPE ... AS ENUM` (module-prefixed, e.g. `ps09_*`); tenant-configurable sets as master tables.
- **RLS** enabled on every business table (the P02 data-scope substrate); unscoped query returns no rows.
- FKs to core tables only by `id`; core tables are never redefined by module schemas.

