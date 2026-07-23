# HRMS Acceptance & E2E Test Suites

Black-box acceptance and end-to-end test cases for all 14 modules, traced to the v3 BRD functional
requirements and asserted against the contracts (`docs/contracts/`): OpenAPI endpoints/status codes,
`error-taxonomy.yaml` (exact `ERR-*` code per negative case), `state-machines.yaml` (valid + invalid
transitions), and `auth-matrix.yaml` (allowed vs forbidden role, PII masking, SoD).

| Module | Suite | Cases | FR coverage |
|---|---|---|---|
| PS01 | `PS01-employee-profile-tests.md` | 148 | 25/25 · 0 gaps |
| PS02 | `PS02-personal-details-workflow-tests.md` | 96 | 23/23 · 0 gaps |
| PS03 | `PS03-attendance-leave-tests.md` | 157 | 23/23 · 0 gaps |
| PS04 | `PS04-leave-sr-integration-tests.md` | 76 | 18/18 · 0 gaps |
| PS05 | `PS05-transfer-relieving-joining-tests.md` | 95 | 22/22 · 0 gaps |
| PS06 | `PS06-promotion-posting-progression-tests.md` | 104 | 20/20 · 0 gaps |
| PS07 | `PS07-training-skill-development-tests.md` | 93 | 24/24 · 0 gaps |
| PS08 | `PS08-performance-appraisal-tests.md` | 138 | 22/22 · 0 gaps |
| PS09 | `PS09-disciplinary-punishment-tests.md` | 110 | 28/28 · 0 gaps |
| PS10 | `PS10-payroll-benefits-tests.md` | 102 | 23/23 · 0 gaps |
| PS11 | `PS11-retirement-pension-tests.md` | 142 | 24/24 · 0 gaps |
| PS12 | `PS12-digital-service-register-tests.md` | 106 | 21/21 · 0 gaps |
| PS13 | `PS13-document-management-tests.md` | 122 | 21/21 · 0 gaps |
| PS14 | `PS14-dashboard-analytics-tests.md` | 108 | 23/23 · 0 gaps |
| **Total** | | **1,597** | **all FRs · 0 gaps** |

## Test-case structure
Each case has: `TC-PS##-NNN` id, **Traces-to** (FR/AC), **Type** (Functional / Boundary / Negative /
Authorization / State-Transition / Data-Integrity / API-Contract / E2E-Flow — plus module-specific types
like PII-Masking, Financial-Integrity, Natural-Justice, Reconciliation, Privacy-Suppression), preconditions,
test data, numbered steps, expected result (negatives assert the exact error code + HTTP status), priority.
Each suite ends with an FR→TC traceability matrix and a coverage summary.

## Coverage emphasis by module (the high-risk guarantees each suite pins down)
- **PS04/PS12** — SR exactly-once effect, dedup tuple + `fact_key`, append-only immutability, hash-chain integrity, reversal-not-delete.
- **PS09** — due-process / natural-justice (disclose-before-penalty, DA≠IO/PO SoD), statutory-timeline SLA pause.
- **PS10** — 3-way SoD (maker≠approver≠disburser), double-payment prevention, reconciliation tie-out, exact-paisa calc.
- **PS11** — qualifying-service from leave data, pension/commutation/gratuity/family-pension exact-rupee calc.
- **PS14** — P02 row-level security (no PS09/PS10/PS11 cross-scope leak), complementary suppression, bitemporal KPI reproducibility.
- **PS01/PS02/PS13** — PII masking by tier, IDOR/access-control, tenant isolation, effective-dated integrity.
