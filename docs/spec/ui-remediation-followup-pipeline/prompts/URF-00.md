/goal
  objective: >
    Establish what is actually true at HEAD for all 17 findings in
    docs/reviews/full-review-ui-remediation.md, and record it as a machine-readable
    finding-state matrix backed by executed command output.
  context:
    - docs/reviews/full-review-ui-remediation.md
    - docs/spec/ui-remediation-followup/phased-plan.yaml    # see meta.authoring_time_state_probe
    - docs/spec/ui-remediation/finding-closure-ledger.yaml
    - docs/spec/ui-remediation-pipeline/checks/uir-08.sh
    - CLAUDE.md
  constraints:
    - The review is dated 2026-07-11; roughly 25 commits have landed since (design tokens,
      DataTable/useForm migration, dark mode, PrimeSoft rebrand, Cloud Run + Cloud SQL).
      Every file:line anchor in the review is presumed stale until you re-anchor it.
    - Repair nothing in this phase. This is measurement only. If a finding still reproduces,
      record it; do not fix it.
    - A finding may only be recorded resolved if a named executed test or command output
      proves it. Source inspection alone yields partial, never resolved.
    - Record failing commands as failing. A red command is data, not a reason to stop.
    - The authoring_time_state_probe in the phased plan is a hint written from source reading.
      Verify it; do not copy it.
  freedom:
    - Choose how to structure the evidence log, as long as each command appears with its
      verbatim result.
    - Choose whether to re-anchor by symbol name or line number where lines have shifted.
  work_loops:
    - name: Execute the review's verification commands
      max_iterations: 2
      repeat_until: All six commands have been run once and their output is captured verbatim.
      steps:
        - npm run check
        - npm run web:check
        - npm run web:test:e2e -- --project=chromium
        - npm audit --audit-level=low
        - bash docs/spec/pipeline/checks/ph-05e.sh
        - bash docs/spec/ui-remediation-pipeline/checks/uir-08.sh
    - name: Re-anchor and classify
      max_iterations: 3
      repeat_until: All 17 findings (FR-01..FR-17) have state, current anchor, and evidence_id.
      steps:
        - locate the current code for each finding
        - classify as resolved | partial | open | regressed | amendment_required
        - cite the test name or command output that supports the classification
  deliverables:
    - docs/spec/ui-remediation-followup/finding-state-matrix.yaml
    - docs/evidence/ui-remediation-followup/urf-00-command-log.md
    - docs/spec/ui-remediation-followup/scope-delta.md
  matrix_schema:
    - id                # FR-01..FR-17
    - severity          # as stated in the review
    - domain
    - review_anchor     # the file:line the review named
    - current_anchor    # where it lives now, or "no longer present"
    - state             # resolved | partial | open | regressed | amendment_required
    - evidence_id       # points into the command log or a test name
    - notes
  evidence_required:
    - verbatim output of every command, including failures
    - a matrix entry for each of the 17 findings
    - "an explicit note in scope-delta.md that a production deployment surface now exists
      (Dockerfile, server.mjs, ops/, Cloud Run + Cloud SQL), which falsifies the review's
      reason for skipping the infra domain"
  escalate_when:
    - A finding cannot be located and it is unclear whether it was fixed or the code was deleted.
    - A verification command cannot run at all in this environment.
