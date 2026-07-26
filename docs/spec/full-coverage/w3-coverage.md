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
`PrimeSoft_HRMS_FS_M08_Recruitment_v1.3.docx` — a binary this session could not read.

Authoring those tables from screen names alone would repeat W1's inferred-schema problem at
much larger scale: an ATS core is roughly a dozen interlocking tables with status machines,
and getting them wrong is expensive to unwind once data exists.

**So they stay uncovered, deliberately.** Reading the FS_M08 body is the unblocking step —
not more building.

## Pattern across W1–W3

| Wave | Covered | What determined it |
|---|---|---|
| W1 | 22/27 | Ten tables **inferred** from prototype screens; FS-gap list was incomplete |
| W2 | 11/20 | Fully specified by DwnB exports; nothing inferred; `cfg-infraction` correctly excluded |
| W3 | 6/24 | Configuration specified by exports; transactional core needs the FS body |

The determinant is never effort. It is whether the specification exists in a form that can be
read. Where it does, coverage lands cleanly and cheaply; where it does not, the honest move is to
stop and say so rather than manufacture schema.
