# PH-25 (Remediation Tranche 12) — Human-Gate Verdict

**Date:** 2026-07-03
**Chains from:** `docs/spec/ph-24-verdict.md` (tranche 11)
**Baseline:** `docs/reviews/brd-coverage-delta-20260703.md`
**Branch:** ph02-rerun (merged to main per sub-phase)

## Suite evidence (oracle-recomputed)

- API `npm test`: **449 pass**, 0 fail, 1 skipped (DATABASE_URL-gated PH-06 persistence test).
- Web `npm run web:test`: **121 pass**, 0 fail.
- `npm run typecheck` / `npm run web:typecheck`: green.

All three PH-25A..C oracles were run **externally** by the driver and are GREEN; each carries a
fail-closed negative asserted via `error.code ===` in an executed `ph25*-*.test.cjs`. Built by hand —
subagents remain credit-exhausted until 2026-07-08.

> **GREEN here is necessary, not sufficient.** A GREEN oracle means the tranche's named behaviors are
> built and tested; it does NOT mean the BRDs are complete. This gate requires a human to review the
> residual gaps below before the pipeline advances.

## What tranche 12 closed (delta vs the 2026-07-03 baseline)

| Module | Closed in PH-25 | Evidence |
|---|---|---|
| **PS10** | GL→ERP posting export — gl_export_batches, idempotent post (repeat = no-op), ACK reconciliation (POSTED→ACKNOWLEDGED / MISMATCH), balance guard | `ph25a-ps10-gl-erp.test.cjs` |
| **PS02** | retro-impact downstream fan-out — retro_impact_events per target (PS10/PS11/PS06), idempotent dispatch (PENDING→SENT→ACKED), DEAD_LETTER on exhaustion | `ph25b-ps02-retro-impact.test.cjs` |
| **PS03** | punch anomaly review — impossible-travel detection (haversine speed), punch_anomaly_reviews FLAGGED→CONFIRMED_FRAUD/VALID, self-review SoD block | `ph25c-ps03-punch-anomaly.test.cjs` |

## Remaining gaps (still open — this is NOT a 100% claim)

Tranche 12 did not close, and these remain `NOT_FOUND` / open for a later tranche — the residual is
now dominated by UI surfaces, real-engine bindings, and deep analytics:

- **PS01**: dedup ML matcher depth, privacy/DPDP console UI.
- **PS02**: additional fraud/velocity detectors.
- **PS03**: backdated-leave team-calendar conflict threshold.
- **PS04**: CI port-conformance gate in the build pipeline.
- **PS05**: interactive counselling UI.
- **PS06**: sealed-cover full workflow UI.
- **PS07**: content/assessment-item bank.
- **PS08**: calibration analytics depth.
- **PS09**: POSH conciliation depth, evidence-vault UI listing.
- **PS10**: remaining TDS edge cases, Form-16 Part-A remittance matching depth.
- **PS13**: real AV/OCR engine binding.
- **PS14**: embedded BI, predictive+fairness, mobile briefing.
- **PS12**: real RFC-3161 TSA binding.

**Contract-op coverage caveat:** implemented routes still cover only a small fraction of the **1,306**
OpenAPI operations frozen in `docs/contracts/openapi/*.yaml`. "All oracles GREEN" reflects the tranche's
targeted behaviors, not full API coverage.

## Recommendation for the human reviewer

Approve PH-25D to record the tranche as reviewed, OR direct a further tranche (PH-26) scoped from the
remaining-gaps list above. Carried engineering debts (unchanged): the newest hand-built services
(PH-16F..PH-25) use in-memory repositories only; and the `ph06-persistence` migration-list assertion
froze at 0008 and should be refreshed when the persistence suite next runs against a live DB.
