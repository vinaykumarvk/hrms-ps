# PH-29 (Remediation Tranche 16) — Human-Gate Verdict

**Date:** 2026-07-03
**Chains from:** `docs/spec/ph-28-verdict.md` (tranche 15)
**Baseline:** `docs/reviews/brd-coverage-delta-20260703.md`
**Branch:** ph02-rerun (merged to main per sub-phase)

## Suite evidence (oracle-recomputed)

- API `npm test`: **465 pass**, 0 fail, 1 skipped (DATABASE_URL-gated PH-06 persistence test).
- Web `npm run web:test`: **127 pass**, 0 fail.
- `npm run typecheck` / `npm run web:typecheck`: green.

All three PH-29A..C oracles were run **externally** by the driver and are GREEN — a second
**route-exposure pass**: each oracle asserts a real kernel route calling the backing service plus an
API test dispatching it through `createFoundationApi`. Built by hand — subagents credit-exhausted
until 2026-07-08.

> **GREEN here is necessary, not sufficient.** Human review required before advancing.

## What tranche 16 closed

Service-complete engines from the earlier tranches are now reachable over `/api/v1`:

| Module | Route(s) added | Backing service |
|---|---|---|
| **PS10** | `POST /api/v1/payroll/loans:sanction`, `POST /api/v1/payroll/gl-export` | `loanPerquisiteGl` (PH-16F), `glErpPosting` (PH-25A) |
| **PS11** | `POST /api/v1/pension/pdas`, `POST /api/v1/pension/death-reconcile` | `pensionTreasury` (PH-16F), `deathRecovery` (PH-24A) |
| **PS14** | `POST /api/v1/analytics/nl-query`, `POST /api/v1/analytics/attrition-score` | `nlQuery` (PH-22C), `predictiveAnalytics` (PH-26C) |

## Remaining gaps (still open — this is NOT a 100% claim)

- **Route exposure for the remaining in-memory services** still to wire: PS01 aadhaarVault/phoneticSearch/
  identityOps, PS02 retroImpact/changeEsignStepUp/changeRequestTemplate, PS03 leaveYearClose/attendanceException/
  leaveBlackoutMass/punchAnomaly, PS05 joiningSequence, PS06 careerSuccession/correctionCascade, PS07
  vendorEmpanelment/lmsIntegration, PS08 digitalSignature/feedback360/continuousFeedback, PS12 timestampAuthority/
  offlineVerification, PS13 certifiedCopy/ocrSearch.
- **Remaining UI surfaces:** PS01 privacy/DPDP console, PS06 sealed-cover UI, PS14 embedded BI/mobile.
- **Deep engine depth:** PS10 remaining TDS edge cases + Form-16 Part-A matching depth; PS09 POSH conciliation
  depth; PS04 CI port-conformance gate.

**Contract-op coverage caveat:** implemented routes still cover only a fraction of the **1,306** OpenAPI
operations; this route-exposure workstream is what moves that number tranche by tranche.

## Recommendation for the human reviewer

Approve PH-29D, OR direct a further tranche (PH-30). The two open workstreams remain route-exposure and
the remaining UI surfaces. Carried debt (unchanged): the newest hand-built services use in-memory
repositories; the `ph06-persistence` migration-list assertion froze at 0008.
