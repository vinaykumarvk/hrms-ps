/goal
  objective: PH-07E — employee wave UI and conformance (gate:human). Deliver the interactive employee-wave
    surfaces the audit (docs/reviews/brd-coverage-audit-20260702.md) found missing ("every module's web
    surface is a read-only metric/summary card"), run the full suites, and produce the honest PH-07
    coverage-delta verdict for the human gate.
  audit_gaps_closed:
    - PS01 profile editing: real forms to add/edit contacts and dependents (inputs + onSubmit + client call
      to the PH-07A satellite routes), with loading/empty/error states.
    - PS02 change-request editor: form to create/edit a change request, an approver queue listing pending
      requests, approve/reject/send-back actions (reject/send-back require a reason — surface ERR-REASON-REQ),
      and a diff view rendering the field-level old/new comparison from GET /change-requests/{id}/diff
      (masked values shown masked).
    - PS03 self-service summary: an employee-facing SelfServiceSummary component (name it exactly that)
      fetching leave balances and recent applications/attendance from the API (not precomputed slice props).
    - Wave conformance: all four suites green, targeted re-greps of the PH-07A..D closures, and
      docs/spec/ph-07-verdict.md with a coverage-delta table vs the audit baseline.
  context:
    - apps/web/src/modules/ps01/** , apps/web/src/modules/ps02/** , apps/web/src/modules/ps03/**
    - apps/web/src/api/hrmsClient.ts , apps/web/src/App.tsx
    - apps/api/src/routes/ps01.routes.ts , ps02.routes.ts , ps03.routes.ts   # real shapes to consume
    - docs/reviews/brd-coverage-audit-20260702.md                          # baseline: PS01 ~12/180, PS02 14/118, PS03 9/118
    - docs/spec/pipeline/checks/ph-07a.sh .. ph-07d.sh                     # upstream oracles (must be GREEN)
  constraints:
    - All API access via the shared hrmsClient; controlled inputs with real onSubmit handlers; no skeleton
      components; render error envelopes (incl. ERR-PS02-SOD / ERR-REASON-REQ) to the user.
    - The diff view must respect P02 masking exactly as the API returns it — never reconstruct masked values.
    - Evidence-first verdict: every "closed" row in docs/spec/ph-07-verdict.md cites file:line and its test;
      remaining NOT_FOUND counts per module stay visible — do NOT claim BRD completeness.
    - Do not repair API defects here; record them in the verdict and leave the owning phase RED.
    - No production console.log; no hardcoded hosts.
    - Do NOT weaken or edit any oracle under docs/spec/pipeline/checks/; do NOT touch docs/spec/pipeline/.state/ or approvals/; no phases.yaml edits.
  work_loops:
    - name: PS01 + PS02 + PS03 surfaces
      max_iterations: 6
      repeat_until: ps01 contacts/dependents edit forms, ps02 change-request editor + approver queue with
        approve/reject/send-back and diff view, and ps03 self-service summary all fetch through hrmsClient
        with loading/empty/error states; `npm run web:typecheck` passes.
      steps: [ps01 forms, ps02 editor + queue + diff view, ps03 summary, states]
    - name: web tests
      max_iterations: 4
      repeat_until: apps/web/test asserts the new surfaces have onSubmit handlers, approver actions, diff
        rendering, and canonical states; `npm run web:test` green.
      steps: [extend web tests, run, fix]
    - name: conformance + verdict
      max_iterations: 3
      repeat_until: `npm run typecheck`, `npm test`, `npm run web:typecheck`, `npm run web:test` all green;
        ph-07a..d oracles GREEN; docs/spec/ph-07-verdict.md contains the per-module (PS01/PS02/PS03/PS04)
        coverage-delta table vs brd-coverage-audit-20260702 with file:line evidence and remaining-gap
        accounting; `bash docs/spec/pipeline/checks/ph-07e.sh` GREEN.
      steps: [run all suites + upstream oracles, tabulate delta, write verdict, run oracle]
  freedom:
    - Component decomposition, layout, and shell navigation for the three surfaces are yours; extend
      hrmsClient with typed methods as needed.
    - Verdict layout beyond the required elements (per-module delta table incl. PS01/PS02/PS03/PS04, file:line
      evidence, remaining-gap accounting, recommendation) is yours.
  evidence_required:
    - apps/web/src/modules/ps01|ps02|ps03/** interactive surfaces + apps/web/test coverage
    - docs/spec/ph-07-verdict.md (honest coverage-delta vs the audit)
    - all four npm suites green; ph-07e.sh GREEN; park for human approval
  escalate_when:
    - A required API shape is missing upstream (record in verdict; do not fake data in the UI).
    - Any PH-07A..D oracle is RED (quarantine, report, do not paper over).
