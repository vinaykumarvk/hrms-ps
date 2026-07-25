/goal
  objective: >
    Run the complete oracle end to end and put a release decision in front of a human with the
    evidence attached. This phase presents; it does not decide.
  context:
    - docs/reviews/full-review-ui-remediation.md    # "Verification commands", "Remaining risks"
    - docs/spec/ui-remediation-followup/finding-closure-ledger.yaml
    - docs/spec/ui-remediation-followup/phased-plan.yaml    # gate_e_release_decision
    - docs/release/ui-remediation-followup-readiness.md
  constraints:
    - Paste every command's exact result. Do not summarize, do not paraphrase, do not round.
    - Report the verdict you actually reached. If it is CONDITIONAL, write CONDITIONAL.
    - Do not close a finding in this phase. If something is open, it is open.
    - You may not approve the release. The gate is a human's; produce the packet and park.
    - "Production release is unblocked only if FR-01, FR-02, FR-04, and FR-10 are all closed
      with executed evidence. State each one's status by name."
  freedom:
    - Choose the readiness packet's structure.
  work_loops:
    - name: Full oracle
      max_iterations: 2
      repeat_until: Every command below has run once and its verbatim output is captured.
      steps:
        - npm run check
        - npm run web:check
        - npm run web:test:e2e
        - npm audit --audit-level=low
        - bash docs/spec/pipeline/checks/ph-05e.sh
        - bash docs/spec/ui-remediation-pipeline/checks/uir-08.sh
        - bash ops/security-headers-verification.sh
        - production build negative scan for demo credentials and alg:none
  deliverables:
    - docs/release/ui-remediation-followup-readiness.md
    - docs/evidence/ui-remediation-followup/urf-09-final-log.md
  readiness_packet_must_state:
    - the status of each of the 17 original findings, by id
    - which of FR-01, FR-02, FR-04, FR-10 are closed and which are not
    - the remaining risks, restated against current status
    - what a human is being asked to approve, in one sentence
  evidence_required:
    - verbatim output of all eight checks
    - the ledger's closure summary
  escalate_when:
    - Any command is red. Park and report; do not repair in this phase.
