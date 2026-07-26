# W6 — BRD/prototype coverage evaluation

**Wave:** W6 (Corporate Performance + APAR harmonisation) · **Evaluated:** 2026-07-26

## Verdict: 2/16 config screens, plus 5 FS-grounded transactional tables — and a D-COV-02 reuse win

Like W5, W6 is a transactional wave; the config-registry count (2/16) understates it. The value is
the M09 review/PIP data model, from extracted `FS_M09_Performance v1.4`.

## The reuse that D-COV-02 predicted

The single most useful finding: **half of M09's entities already exist under PS08.** `goal_plans`,
`goals`, `calibration_sessions`, `scorecard_pillars` are in `08-PS08-performance-appraisal.sql`.
ADR-006 D-COV-02 said APAR is a *profile over M09*, and the schema bears that out — so `0040` adds
only the five tables PS08 lacks and **does not re-declare the shared ones**. Re-creating them would
have forked the model the two modules are meant to share.

| New in 0040 | FS source |
|---|---|
| `review_cycles` | §4.10.3 |
| `review_records` | §4.10.4 |
| `review_templates` | §4.10.5 |
| `calibration_configurations` | § calibration config (distinct from PS08's `calibration_sessions` runs) |
| `performance_improvement_plans` | §4.10.19 (FS marks the PIP entity OPEN-FS-M09-04; specified fields only) |

## A mistake I made and corrected, recorded here

I first wrote three descriptors against screen ids I **invented** (`cfg-review-cycles`,
`cfg-scorecard`, `cfg-normalization`) instead of reading the W6 backlog. None existed, so coverage
measured 0/16. This is the same "assert instead of verify" failure as the security overclaim
earlier this session. Corrected: two descriptors repointed to real backlog screens
(`cfg-review-templates`, `cfg-calibration`); the `review-cycles` registry was removed because no
config screen backs it — the table stays as transactional infrastructure. **Always read the
backlog ids; never guess them.**

## Screen disposition

- `pa-*` screens (cycle-create, goal-plans, calibration, scorecard-pillars, pip, normalization,
  metrics, assign-plan, exclusions) — transactional review surfaces over the tables above and the
  reused PS08 tables. Unbuilt UI, not blocked work.
- `cfg-goal-templates`, `cfg-rating`, `cfg-pip` — config screens needing `goal_plan_templates`,
  `rating_scales`, PIP-config tables the FS references but 0040 does not add; each belongs with its
  slice.

## Running totals

W1 22/27 · W2 11/20 · W3 6/24 · W4 3/13 · W5 0/12 (+3 tables) · W6 2/16 (+5 tables).
44/112 registry, plus 8 transactional tables across W5–W6, all FS-grounded.
