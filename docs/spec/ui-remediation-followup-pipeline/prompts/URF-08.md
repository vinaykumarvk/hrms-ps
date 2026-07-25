/goal
  objective: >
    Rebuild the closure record so it states what was proved, by which evidence, at what
    severity — replacing default-closed inheritance with explicit per-finding closure.
  context:
    - docs/reviews/full-review-ui-remediation.md    # FR-04, FR-09, FR-12, FR-16, "Traceability impact"
    - docs/spec/ui-remediation/finding-closure-ledger.yaml    # the ledger being superseded
    - docs/spec/ui-remediation-followup/finding-state-matrix.yaml
    - docs/evidence/ui-remediation-followup/
  constraints:
    - "The existing ledger sets closure_status: closed on its shared &defaults anchor, so every
      finding inherits closed unless individually overridden. That is the exact defect FR-09
      names. The new ledger must state every closure explicitly; anchor-inherited closure is
      forbidden and must be mechanically detectable."
    - Every closed finding names an evidence_id that resolves to a real file and a real
      executed result. An evidence_id pointing at a source check closes nothing.
    - Anything proved only by source inspection is recorded partial, never closed.
    - Claim wording matches executed scope exactly. Do not write "WCAG-AA compliant" when what
      ran was axe plus a keyboard journey — write what ran.
    - Do not edit the superseded ledger in place. It stays as the record of what was claimed on
      2026-07-11.
    - No placeholder text. The original final-command-log contained one; that was FR-04.
  freedom:
    - Choose the ledger schema, provided the integrity check below can verify it.
  work_loops:
    - name: Regenerate and verify
      max_iterations: 3
      repeat_until: The ledger integrity check passes and every evidence file is populated.
      steps:
        - write checks/ledger-integrity.sh first
        - regenerate the ledger from the finding-state matrix plus the phase evidence
        - populate every evidence document with executed results
        - run the integrity check
  ledger_integrity_check_must_fail_on:
    - a finding whose closure_status comes from a YAML anchor rather than an explicit key
    - a closed finding with no evidence_id
    - an evidence_id that does not resolve to an existing file
    - a placeholder string (TBD, TODO, pending, xxx) anywhere in the evidence set
  deliverables:
    - docs/spec/ui-remediation-followup/finding-closure-ledger.yaml
    - docs/spec/ui-remediation-followup-pipeline/checks/ledger-integrity.sh
    - docs/evidence/ui-remediation-followup/final-command-log.md
    - docs/evidence/ui-remediation-followup/accessibility-summary.md
    - docs/evidence/ui-remediation-followup/keyboard-traversal.md
    - docs/evidence/ui-remediation-followup/authorization-negative-results.md
    - docs/evidence/ui-remediation-followup/screenshot-matrix/
    - docs/release/ui-remediation-followup-readiness.md
  evidence_required:
    - the integrity check's passing output
    - a ledger entry for every finding touched anywhere in URF-00..URF-07
  escalate_when:
    - A finding's evidence is weaker than the state the plan expected, and downgrading it
      would change the release verdict.
