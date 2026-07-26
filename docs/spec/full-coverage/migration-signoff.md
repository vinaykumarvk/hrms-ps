# Migration stack sign-off — 0035–0044

**Status:** Schema APPROVED by repository owner, 2026-07-26 ("take item one as approved").
**FS authoring (item 2): explicitly SKIPPED** — W3 ATS transactional core and W9 PSA/AI console
remain unspecified by owner decision; they are not to be inferred.

## What "approved" covers

The 20 tables across migrations 0035–0044 are signed off as schema:

| Migration | Tables | Grounding |
|---|---|---|
| 0035 | 10 config-master tables | FS-consistent (see 0035-rederivation.md); separation_policies corrected by 0044 |
| 0036 | comp_off_rules, blackout_periods, decision_matrix | DwnB exports |
| 0037 | 9 recruitment config tables | DwnB/Recruitment exports |
| 0038 | 5 onboarding tables | extracted FS_M02 |
| 0039 | separation_records, fnf_clearances, exit_interviews | extracted FS_M03 |
| 0040 | 5 performance tables | extracted FS_M09 (+ PS08 reuse) |
| 0041 | 8 documents/assets tables | extracted FS_M11/M17 |
| 0042 | dashboard_widgets | FS_Dashboard |
| 0043 | migration_runs | Platform_Spec P06 |
| 0044 | separation policy detail + 2 child tables | extracted FS_M03 §4.8.1 |

## What sign-off does NOT do

It does not apply the DDL to any database. Applying to the live Cloud SQL (`puda-489215`) is a
separate, deliberate deployment step, run by a human with DB access (or via the app's
migrate-on-boot on a controlled deploy). Every migration is additive and each has a compensating
statement recorded under docs/evidence/. One pre-apply reconcile is outstanding: 0035's
`separation_workflows` overlaps 0044's FS-named `separation_policy_workflow_map` — retire/merge
before apply (see 0035-rederivation.md).
