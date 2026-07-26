# W9 — BRD/prototype coverage evaluation

**Wave:** W9 (Platform Super Admin + AI assistants) · **Evaluated:** 2026-07-26

## Verdict: 1 of 13 screens is specified enough to build; naming the boundary IS the deliverable

W9 is the wave the source plan marks 🔴/🟡 — and after reading the extracted Platform_Specification,
that assessment holds, with one refinement. Exactly one W9 entity has a real spec. The other twelve
screens are unspecified, infrastructure-only, or roadmap-only, and building them would be inventing
requirements — the failure mode this whole session has been correcting.

## The one buildable piece — done

`migration_runs` (0043). Platform_Spec P06 Migration Toolkit specifies it: §4.14.9 `migration_runs`,
FR-P06-001, the ETL+V framework (Extract→Validate→Transform→Load→Verify) run idempotently. The
`ck_migration_stage` and `ck_migration_status` constraints and the wave concept trace to that
section. This backs `psa-migration`, `psa-migration-detail` and `psa-master-data`.

## The twelve that are NOT buildable to spec — and precisely why

| Screens | Category | Why not authored |
|---|---|---|
| `psa-feature-flags`, `psa-licenses` | 🟡 screen, no entity | Platform_Spec speces the platform *services* (P04/P06) but no `feature_flags` or `license` entity exists in any FS. The plan flagged this exactly: "services speced; screens have no FS." Authoring them = inference (W1 Gap A). |
| `psa-tenants`, `psa-tenant-detail`, `psa-provisioning` | composition | The provisioning lifecycle (P04) writes to `tenants`/`entities`, which **already exist**. These are operational read/compose surfaces over that substrate, not new schema. |
| `psa-monitoring`, `psa-releases`, `psa-environments`, `psa-security` | infrastructure ops | These read Cloud Run / platform infrastructure APIs (revisions, monitoring, IAM), not application tables. There is no app schema to add — the data lives in GCP, not Postgres. |
| `leadership-ai-chat` | 🔴 no FS | No functional spec exists — only a Product_Vision roadmap bullet. Unbuildable to a specification that was never written. |

## The AI guardrail — recorded, because it is real and it is a constraint

Platform_Spec does say one concrete thing about the AI assistants, and it is a **security
constraint**, not a screen spec: *"All AI calls are backend-only; the API key never reaches the
client. PII is stripped server-side before any model call."* When `leadership-ai-chat` and the other
AI assistants are eventually specified and built, that guardrail is binding — the key must never be
in the browser bundle (the same class of mistake as FR-01's demo credential), and PII must be
stripped before any model call. Recorded here so it is not lost when the FS is finally authored.

## What W9 actually needs — and it is not code

The source plan's W0 already identified this: **the FS for the PSA operational console and the three
AI assistants has to be authored.** That is upstream product/spec work, not something the executor
can conjure. Until it exists, W9 is one grounded table (`migration_runs`) plus an honest map of
what is missing. Manufacturing tenant-license or AI-chat schema from screen names would be the exact
inference error W1 made — larger, and against a live database.

## Running totals — final

| Wave | Registry | Grounding |
|---|---|---|
| W1 | 22/27 | 10 tables inferred (weakest — re-derive against FS) |
| W2 | 11/20 | DwnB field exports |
| W3 | 6/24 | DwnB field exports (config) |
| W4 | 3/13 | extracted FS_M02 |
| W5 | 0/12 (+3 tables) | extracted FS_M03 |
| W6 | 2/16 (+5 tables) | extracted FS_M09 (+ PS08 reuse) |
| W7 | 3/27 (+8 tables) | extracted FS_M11/M17 |
| W8 | composition (+1 table) | FS_Dashboard — read surfaces |
| W9 | 1/13 (+1 table) | Platform_Spec P06 (migration only); rest unspecified |

**47/139 registry-covered, plus 19 FS/spec-grounded tables (0035–0043).** All nine waves have now
been through the loop. The honest headline: the programme's remaining critical path is
**specification** — re-deriving W1's inferred tables from the now-readable FS bodies, authoring the
missing FS for W3's ATS core / W9's PSA+AI, and then the large per-persona UI composition of W8 —
not more schema authored from screens.
