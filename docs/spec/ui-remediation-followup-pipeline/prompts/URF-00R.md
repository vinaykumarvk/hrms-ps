/goal
  objective: >
    Make the baseline green so the rest of the pipeline can run against a truthful oracle: fix the
    useForm type failure and its downstream errors, triage every failing web test into stale
    assertion vs real defect, port the inherited checks off ripgrep, and make the e2e gate fail
    fast instead of hanging.
  context:
    - docs/spec/ui-remediation-followup/finding-state-matrix.yaml   # URF-00 baseline
    - docs/evidence/ui-remediation-followup/urf-00-command-log.md
    - docs/spec/ui-remediation-followup/urf-00r-triage.md           # this phase's own record
    - apps/web/src/lib/useForm.ts
    - docs/spec/ui-remediation-pipeline/checks/
    - CLAUDE.md
  constraints:
    - "A failing test is evidence until proven otherwise. Never edit an assertion to match the code
      without first verifying, independently, that the behaviour it guarded still exists. Record
      that verification in the triage document, per finding."
    - "Where a test and the code disagree, decide which is wrong on the merits. If the code lost a
      behaviour, fix the code. Only re-anchor the test when the behaviour survived under a
      different name or presentation."
    - Never suppress a type error with @ts-ignore, `as any`, or by loosening a shared type beyond
      what the defect requires. Fix the root cause.
    - Do not weaken an oracle to make a phase pass. If a check cannot run honestly, say so.
    - "Check for prior art first: `git log --all -S <symbol>` before re-authoring a fix. Another
      branch may already have solved it, and matching its public API keeps the branches convergent."
  freedom:
    - Choose the type-level fix, provided it removes the root cause rather than masking it.
    - Choose how to express re-anchored assertions, preferring the guarantee over the spelling.
  work_loops:
    - name: Typecheck to zero
      max_iterations: 4
      repeat_until: npm run web:typecheck reports 0 errors and npm run web:build succeeds.
      steps: [find the root cause, fix it, re-run, fix any call sites the root cause was masking]
    - name: Triage each failing test
      max_iterations: 6
      repeat_until: npm run web:test passes with every edit justified in the triage document.
      steps:
        - read the assertion and what it intended to guarantee
        - locate the behaviour in the current source, or establish that it is gone
        - fix the code if the behaviour is gone; re-anchor the assertion if it merely moved
        - record the finding, the evidence, and the classification
    - name: Repair the oracles
      max_iterations: 2
      repeat_until: The checks run correctly in a plain bash shell and negative assertions are non-vacuous.
      steps: [port off ripgrep, prove the negative scan catches a planted value, add the e2e preflight]
  deliverables:
    - apps/web/src/lib/useForm.ts
    - docs/spec/ui-remediation-followup/urf-00r-triage.md
    - docs/spec/ui-remediation-pipeline/checks/uir-01.sh
    - docs/spec/ui-remediation-pipeline/checks/uir-08.sh
    - tools/e2e-preflight.mjs
    - package.json
  evidence_required:
    - before/after counts for typecheck errors and test pass/fail
    - a per-finding classification with the verification that supports it
    - proof that the ported negative scan fails on a planted credential and on a missing bundle
    - the e2e preflight's output against an occupied port
  escalate_when:
    - A failing test guards a behaviour that is genuinely gone, and restoring it is larger than this phase.
    - Two tests contradict each other, so no source state can satisfy both.
    - The same fix already exists on another branch and merging it is a better answer than re-authoring it.
