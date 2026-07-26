# W3 — BRD/prototype coverage evaluation

**Wave:** W3 (Recruitment / ATS) · **Evaluated:** 2026-07-26

## Verdict: 6/24 screens backed

W3 arrived with essentially no data model: of the whole recruitment domain, only
`vendor_empanelments` existed in `docs/data-model/` or `apps/api/db/migrations/`.

Migration `0037_w3_recruitment_config.sql` adds the nine **configuration** tables the
DwnB/Recruitment field exports specify, and six descriptors follow. Every column traces to a
named CSV field; the source file is cited above each table.

| Screen | Table | Source export |
|---|---|---|
| `ra-external-recruiters` | `external_recruiters` | External_Recruiters_Export.csv |
| `ra-portals` | `job_portals` | Job_Portals_Export.csv |
| `ra-recruiters` | `interview_types` | Interview_Types_Export.csv |
| `ra-schedule-interview` | `interview_guides` | Interview_Guides_Export.csv |
| `ra-duplicity` | `duplicity_check_settings` | Duplicity_Check_Settings_Export.csv |
| `ra-recruiter-assignment` | `hiring_leads` | Hiring_Leads_Export.csv |

## The 18 uncovered screens — and why they stay uncovered

The transactional ATS core is **not** modelled: requisitions, candidates, applications,
interviews, offers, the hiring pipeline. The DwnB exports specify recruitment *configuration*;
they do not specify the transactional model. That lives in the body of
`PrimeSoft_HRMS_FS_M08_Recruitment_v1.3.docx`, which at the time of this evaluation was treated
as an unreadable binary.

**CORRECTION (same session):** that was wrong. A `.docx` is a ZIP holding `word/document.xml`,
and `tools/extract-fs-docx.mjs` now extracts all 22 FS/BRD documents to
`docs/spec/full-coverage/fs-text/`. The M08 body names the transactional entities explicitly —
`positions`, `jobs`, `job_hiring_team`, `job_hiring_stages`, `job_postings`,
`job_application_field_config`, `candidates`, `applications`, `interviews`, `offers` — and points
to BRD §4.9.1–4.9.18 for their per-entity fields. Both are now readable text.

W3's 18 transactional screens are therefore **no longer blocked on missing specification**; they
are simply not built yet. That is a materially better position and the reason the extractor is
committed rather than run ad hoc.

Authoring those tables from screen names alone would repeat W1's inferred-schema problem at
much larger scale: an ATS core is roughly a dozen interlocking tables with status machines,
and getting them wrong is expensive to unwind once data exists.

**They stay uncovered in this pass**, but the blocker is removed: the FS body and the BRD entity
sections are extracted and readable, so the next pass builds against the specification rather
than inferring from screen names.

## Pattern across W1–W3

| Wave | Covered | What determined it |
|---|---|---|
| W1 | 22/27 | Ten tables **inferred** from prototype screens; FS-gap list was incomplete |
| W2 | 11/20 | Fully specified by DwnB exports; nothing inferred; `cfg-infraction` correctly excluded |
| W3 | 6/24 | Configuration specified by exports; transactional core deferred — FS body now extracted and readable |

The determinant is never effort. It is whether the specification exists in a form that can be
read — and the second half of that sentence turned out to be the actionable part. Three waves ran
while 22 FS documents sat unread because they were assumed to be opaque binaries. Extracting them
took one small tool. W1's ten inferred tables would very likely not have been necessary.

**Lesson worth carrying: check whether the specification is readable before concluding it is
missing.**
