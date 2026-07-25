/goal
  objective: >
    Close the partial UI findings with behavioral proof rather than source assertions, and
    finish the primitive migration that FR-16 measured as incomplete.
  context:
    - docs/reviews/full-review-ui-remediation.md    # FR-06, FR-08, FR-13, FR-16, FR-17
    - docs/spec/ui-remediation-followup/finding-state-matrix.yaml    # from URF-00
    - apps/web/src/app/ErrorBoundary.tsx
    - apps/web/src/components/ui/
    - apps/web/test/e2e/
  constraints:
    - Every assertion added here is behavioral. A source-regex assertion does not close a
      finding — that is precisely what FR-04 and FR-09 objected to.
    - The error reporting sink receives sanitized data only. No token, no PII, no stack trace,
      and nothing about the error is shown to the user.
    - Report the raw form-control count as a measured number before and after. At plan time
      it was 20 raw input/select/textarea elements across 16 .tsx files, down from the 126 the
      review measured. Measure it again; do not trust either number.
    - Migrate critical-journey surfaces first. A full sweep of every remaining control is not
      required if the ledger records the remainder honestly as partial.
    - Deferred items stay deferred: no localization, no password recovery.
    - Touch no auth surface. This phase runs concurrently with the auth chain.
  freedom:
    - Choose the reporting sink's shape and injection point.
    - Choose which surfaces qualify as critical-journey.
  work_loops:
    - name: Behavioral closure
      max_iterations: 4
      repeat_until: Each targeted finding has a passing behavioral test.
      steps:
        - write the failing behavioral test
        - implement
        - run web tests and the e2e a11y spec
  required_test_cases:
    - a forced child throw renders the fallback, calls the reporting sink, and exposes no error detail
    - the sink receives sanitized data only
    - hint and error text are programmatically associated with the control, asserted through
      the accessibility tree rather than by attribute regex
    - safe-area insets hold at 360x800 with long content
    - recovery from the fallback restores a usable shell and moves focus predictably
  deliverables:
    - apps/web/src/app/ErrorBoundary.tsx
    - apps/web/src/app/errorReporting.ts
    - apps/web/src/components/ui/Field.tsx
    - apps/web/test/error-boundary.test.cjs
    - apps/web/test/e2e/a11y-residual.spec.ts
    - docs/evidence/ui-remediation-followup/urf-07-primitive-adoption.md
  evidence_required:
    - npm run web:check output
    - e2e output
    - measured raw-control count before and after, with the command used
  escalate_when:
    - Closing a finding behaviorally would require changing an approved design-system decision.
    - A finding cannot be tested behaviorally in this harness — say so and record it partial.
