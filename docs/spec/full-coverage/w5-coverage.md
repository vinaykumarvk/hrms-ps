# W5 — BRD/prototype coverage evaluation

**Wave:** W5 (Exits / Separation / FnF) · **Evaluated:** 2026-07-26

## Verdict: 3 FS-grounded transactional tables; registry coverage is the wrong metric here

W5 is a **transactional and statutory** wave, not a configuration wave. Of its 12 screens only
`cfg-separation-checklist` and `cfg-exit-interview-form` are config; the rest are case-processing
surfaces or belong to another module. So counting "screens backed by a config registry" understates
what W5 needs, which is a transactional data model.

That model is what migration `0039_w5_separation.sql` delivers, grounded in the extracted
`FS_M03_Exits_Offboarding_v1.3` body:

| Table | FS source |
|---|---|
| `separation_records` | POST /api/v1/separations §4.1 request/response contract |
| `fnf_clearances` | the clearance-stage screens (IT/assets, facilities, attendance, leave) |
| `exit_interviews` | §4 exit-interview surface + template |

Constraints traced to the FS, not inferred:
- `ck_separation_state` — the §8.4 machine SUBMITTED → STAGE1 → STAGE2 → PENDING_LWD → RELIEVED
- `ck_separation_active_unique` — the documented **409 "active separation already exists per
  employee"**
- `proposed_last_working_day` stored server-computed (VAL-SEP-LWD), never client-supplied

## Screen disposition

| Screens | Status |
|---|---|
| `clearance-it-assets`, `clearance-facilities`, `clearance-attendance`, `clearance-leave` | transactional over `fnf_clearances` (table now exists; UI unbuilt) |
| `absconding`, `exit-interview` | transactional over `separation_records` / `exit_interviews` (tables now exist) |
| `cfg-separation-checklist` | administered by the W1 `separation-policies` registry (`cfg-separation-policy`); needs a second entry point, counted under W1 |
| `cfg-exit-interview-form` | needs an `exit_interview_templates` table — the FS references it (§) but 0039 does not add it; deferred to the exit-interview slice |
| `payroll-export`, `pf-uan`, `tds-tax`, `reimbursements` | **PS10 payroll territory.** Per ADR-006 D-COV-03 the PS10 engine is kept and corporate statutory extras are out of scope. These are not W5 config work. |

## Running totals

W1 22/27 · W2 11/20 · W3 6/24 · W4 3/13 · W5 (registry) 1/12 + 3 transactional tables.

The registry number (1/12) is technically accurate but misleading in isolation — W5's value is the
separation/FnF/exit data model, authored from the FS. This is exactly the case the coverage metric
handles badly, so it is called out rather than reported as a bare fraction.
