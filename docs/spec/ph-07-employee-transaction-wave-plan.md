# PH-07 Employee Transaction Wave Plan

PH-07 builds the employee-facing transaction base after PH-06 proved the workflow platform with PS03 and PS05 vertical slices.

| Step | Gate | Scope | External oracle |
|---|---:|---|---|
| PH-07A | auto | Freeze PH-07 detailed plan, pipeline prompts/checks, and OpenAPI binding markers for PS02/PS03/PS04. | `bash docs/spec/pipeline/checks/ph-07a.sh` |
| PH-07B | auto | Build PS04 as the leave-to-Service-Register relay with idempotent relay, reconciliation, DLQ replay/discard, and audit evidence. | `bash docs/spec/pipeline/checks/ph-07b.sh` |
| PH-07C | auto | Build PS02 personal details workflow with sensitivity routing, evidence documents, approve/commit/reverse, and PS01-owned SR posting. | `bash docs/spec/pipeline/checks/ph-07c.sh` |
| PH-07D | auto | Extend PS03 with accrual, cancellation, attendance capture, regularisation recompute, overtime, anomaly state, and `READY_FOR_PS10` payroll signals. | `bash docs/spec/pipeline/checks/ph-07d.sh` |
| PH-07E | auto | Add UI proof, conformance verdict, manifest evidence, full API/web regression. | `bash docs/spec/pipeline/checks/ph-07e.sh` |

## Scope Rules

- PS02 must not write identity SR events directly. It commits and reverses display-name changes through PS01-owned `governedIdentityChange`, so the SR source module remains `PS01`.
- PS04 is the reference writer for leave-to-SR integration. PS03 creates leave facts; PS04 relays them to PS12 with idempotency and DLQ handling.
- PS03 payroll outputs are contract-ready signals only. PS10 remains the payroll computation owner.
- The PH-07 implementation remains in-memory, consistent with PH-03 through PH-06, until persistence hardening is scheduled.

## Evidence

- `apps/api/test/ph07-ps02-personal-details.test.cjs`
- `apps/api/test/ph07-ps03-attendance-payroll.test.cjs`
- `apps/api/test/ph07-ps04-relay.test.cjs`
- `apps/web/test/ph07-employee-wave.test.cjs`
- `docs/spec/ph-07-verdict.md`
