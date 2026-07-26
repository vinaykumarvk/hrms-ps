# W4 — BRD/prototype coverage evaluation

**Wave:** W4 (Onboarding + probation) · **Evaluated:** 2026-07-26

## Verdict: 3/13 screens backed by a registry descriptor

Migration `0038_w4_onboarding.sql` adds the five M02 core entities —
`onboarding_processes`, `document_clusters`, `onboarding_instances`, `onboarding_tasks`,
`onboarding_form_responses` — and three descriptors follow (`onboarding-config`,
`document-clusters`, `cfg-sources`).

## What is different about this migration

It is the first in the programme authored against an **extracted FS body** rather than field
exports or screen names. Every construct traces to
`docs/spec/full-coverage/fs-text/PrimeSoft_HRMS_FS_M02_Onboarding_v1.4.txt`:

| Construct | FS source |
|---|---|
| entity set | refs §4.7.1 `onboarding_processes`, §4.7.2 `onboarding_instances`, `document_clusters` |
| `onboarding_instances` columns | the `POST /api/v1/onboarding/instances` request contract |
| `ck_onboarding_state` | the §8.5 state machine INITIATED → ADMIN_REVIEW → COMPLETED |
| `ck_onboarding_candidate_required` | "candidate_id required unless AD_HOC" |
| `ck_onboarding_open_instance_unique` | MSG-ERR-DUP-INSTANCE (409) — one open instance per candidate |
| nullable `field_value`, no validation constraint | FR-M02-002/DO19 — autosave never blocks on validation |

That last row is the clearest example of the difference extraction makes. A schema inferred from
the screen would plausibly have made `field_value` NOT NULL; the FS says autosave must persist a
draft **even when validation fails**, so a NOT NULL there would have broken the specified
behaviour and only surfaced in production.

## The 10 uncovered screens

`document-upload`, `offer-letter`, `onboarding-form`, `pre-joining`, `bank-entry`, `national-id`
are transactional or employee-facing surfaces over `onboarding_instances` — the tables now exist,
so these are unbuilt UI rather than blocked work.

`cfg-bgv-checklist`, `cfg-duplicity`, `cfg-external-rec`, `cfg-hiring-leads` are W3 registries
surfaced again under a second section. `cfg-duplicity`, `cfg-external-rec` and `cfg-hiring-leads`
are already administered by the W3 descriptors (`ra-duplicity`, `ra-external-recruiters`,
`ra-recruiter-assignment`); they need a second entry point, not a second registry. Counted as
uncovered because their own surface does not exist.

`cfg-bgv-checklist` needs a `bgv_packages` table, which M02 references (§4.7) but this migration
does not add — BGV has its own vendor-webhook contract and disposition workflow, and belongs with
that slice rather than bolted onto the config pass.

## Running totals

| Wave | Covered | Grounding |
|---|---|---|
| W1 | 22/27 | ten tables **inferred** from screens |
| W2 | 11/20 | DwnB field exports |
| W3 | 6/24 | DwnB field exports (config only) |
| W4 | 3/13 | **extracted FS body** — strongest grounding so far |

42/84 across the four executed waves.
