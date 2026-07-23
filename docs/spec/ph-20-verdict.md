# PH-20 (Remediation Tranche 7) — Human-Gate Verdict

**Date:** 2026-07-03
**Chains from:** `docs/spec/ph-19-verdict.md` (tranche 6)
**Baseline:** `docs/reviews/brd-coverage-delta-20260703.md`
**Branch:** ph02-rerun (merged to main per sub-phase)

## Suite evidence (oracle-recomputed)

- API `npm test`: **415 pass**, 0 fail, 1 skipped (DATABASE_URL-gated PH-06 persistence test).
- Web `npm run web:test`: **121 pass**, 0 fail.
- `npm run typecheck` / `npm run web:typecheck`: green.

All three PH-20A..C oracles were run **externally** by the driver and are GREEN; each carries a
fail-closed negative asserted via `error.code ===` in an executed `ph20*-*.test.cjs`. Built by hand —
subagents remain credit-exhausted until 2026-07-08.

> **GREEN here is necessary, not sufficient.** A GREEN oracle means the tranche's named behaviors are
> built and tested; it does NOT mean the BRDs are complete. This gate requires a human to review the
> residual gaps below before the pipeline advances.

## What tranche 7 closed (delta vs the 2026-07-03 baseline)

| Module | Closed in PH-20 | Evidence |
|---|---|---|
| **PS07** | vendor_empanelments status machine (APPLIED→UNDER_REVIEW→EMPANELLED/REJECTED), requester≠approver SoD, contract/procurement refs | `ph20a-ps07-vendor-empanelment.test.cjs` |
| **PS13** | certified_copies — ACTIVE-source gate, visible watermark stamp + issuing authority, tamper-evident rendering digest | `ph20b-ps13-certified-copies.test.cjs` |
| **PS02** | change_request_templates — reusable fields, start-from-template pre-fill with a P02 field filter, deactivation gate | `ph20c-ps02-cr-templates.test.cjs` |

## Remaining gaps (still open — this is NOT a 100% claim)

Tranche 7 did not close, and these remain `NOT_FOUND` / open for a later tranche:

- **PS01**: phonetic/transliteration search, dedup ML matcher depth, privacy/DPDP console UI.
- **PS02**: extra fraud detectors, retro-impact fan-out.
- **PS03**: backdated-leave team-calendar conflict threshold, punch anomaly review depth.
- **PS04**: X.3 outbound framework (circuit-breaker/credentials), CI port-conformance gate.
- **PS05**: interactive counselling UI, proof-of-service deeming automation.
- **PS06**: sealed-cover full workflow, correction cascade recompute.
- **PS07**: LMS/xAPI integration, content/assessment-item bank.
- **PS08**: multi-source 360 aggregation, DSC/non-repudiation signing.
- **PS09**: POSH conciliation depth, jurisdiction transfer/retiree bar, evidence-vault UI.
- **PS10**: full TDS edge cases, Form-16 Part-A remittance matching depth, GL→ERP posting.
- **PS11**: treasury/PDA X.3 wire integration, DigiLocker/DBT delivery, death-detection recovery.
- **PS12/PS13/PS14**: offline-QR verification, real TSA; OCR/secure-sharing, real AV engine;
  NLQ, embedded BI, predictive+fairness, mobile briefing.

**Contract-op coverage caveat:** implemented routes still cover only a small fraction of the **1,306**
OpenAPI operations frozen in `docs/contracts/openapi/*.yaml`. "All oracles GREEN" reflects the tranche's
targeted behaviors, not full API coverage.

## Recommendation for the human reviewer

Approve PH-20D to record the tranche as reviewed, OR direct a further tranche (PH-21) scoped from the
remaining-gaps list above. Carried engineering debts (unchanged): the newest hand-built services
(PH-16F..PH-20) use in-memory repositories only; and the `ph06-persistence` migration-list assertion
froze at 0008 and should be refreshed when the persistence suite next runs against a live DB.
