# PH-09 Payroll and Pension Wave Plan

PH-09 builds the PS10 Payroll and Benefits and PS11 Retirement and Pension wave after PH-08 made upstream employee, leave, transfer, promotion, disciplinary, Service Register, and document facts stable enough for deterministic money calculations.

The implementation remains inside the HRMS modular monolith. PH-09 does not introduce a separate payroll service, a separate pension service, or live bank/treasury integrations. It adds deterministic in-memory module services with fixed-point money arithmetic, provenance completeness checks, rule-version snapshots, and X.3 sandbox export markers. Persistence hardening and live integrations remain later enterprise hardening work.

| Step | Gate | Scope | External oracle |
|---|---:|---|---|
| PH-09A | auto | Freeze PH-09 detailed plan, prompts, executable checks, pipeline wiring, and PS10/PS11 OpenAPI binding markers. | `bash docs/spec/pipeline/checks/ph-09a.sh` |
| PH-09B | auto | Implement PS10 salary structures, locked payroll runs, deterministic payroll calculation traces, adjustment feeds, last-pay-drawn output, and X.3 bank sandbox export. | `bash docs/spec/pipeline/checks/ph-09b.sh` |
| PH-09C | auto | Implement PS11 service-verification gate, qualifying service calculation, pension/gratuity/commutation trace, PPO issue, and PS12 SR posting. | `bash docs/spec/pipeline/checks/ph-09c.sh` |
| PH-09D | auto | Prove cross-module controls: PS03 LOP and PS09 penalty impacts, PS10 last-pay-drawn feeds PS11, maker-checker SoD, and provenance completeness. | `bash docs/spec/pipeline/checks/ph-09d.sh` |
| PH-09E | auto | Add UI proof, PH-09 verdict, manifest evidence, and full API/web regression coverage. | `bash docs/spec/pipeline/checks/ph-09e.sh` |

## Scope Rules

- All money amounts are stored and tested as integer minor units. UI display may render formatted rupees, but calculations must remain fixed-point and reproducible.
- No payroll or pension calculation may proceed unless its input provenance is complete and recorded in the calculation trace.
- Every PS10 payroll run snapshots its rule version and input set before calculation. Recomputing with the same snapshot must produce the same totals.
- Payroll approval and pension sanction use maker-checker separation. The same actor who creates the run/case may not approve or sanction it.
- Financial exports use X.3 sandbox stubs only. PH-09 must not hardcode bank, treasury, PDA, identity, or pension disbursement endpoints.
- PS11 must not issue a PPO until Service Register/service facts are certified and locked.
- PS11 writes separation and PPO events through the PS12 SR ingest port. It must not mutate SR ledger state directly.
- PH-09 remains an executable proof wave. Full statutory edge coverage for every PS10/PS11 BRD case is deferred to the hardening backlog after deterministic controls are proven.

## Evidence

- `apps/api/test/ph09-ps10-payroll.test.cjs`
- `apps/api/test/ph09-ps11-pension.test.cjs`
- `apps/api/test/ph09-compensation-integration.test.cjs`
- `apps/web/test/ph09-compensation-wave.test.cjs`
- `docs/spec/ph-09-verdict.md`

## Exit Position

PH-09 is complete when PS10 and PS11 expose protected API surfaces, deterministic calculation traces, SoD enforcement, X.3 sandbox export markers, UI proof panels, manifest evidence, and full API/web checks. PH-10 can then consume locked payroll/pension facts for analytics, performance validation, security review, release evidence, and deployment hardening.
