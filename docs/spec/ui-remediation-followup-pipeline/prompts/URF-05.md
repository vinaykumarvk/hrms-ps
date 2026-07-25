/goal
  objective: >
    Implement the ratified deployment security policy on server.mjs — the surface whose
    absence caused the original review to skip the infra domain entirely.
  context:
    - docs/spec/ui-remediation-followup/deployment-security-policy.md   # ratified in URF-01
    - docs/reviews/full-review-ui-remediation.md    # FR-10
    - server.mjs
    - Dockerfile
    - apps/web/vite.config.ts
    - ops/
  constraints:
    - Implement the ratified policy exactly, clause by clause. Do not improvise a header set.
    - The built SPA must still work. A CSP that breaks the app is a failed phase, not a
      "documented limitation".
    - Never echo a secret or environment value into a response header.
    - The health endpoint is not exempt by accident — decide and assert its header posture.
    - This phase may run concurrently with URF-02..URF-04, but both lanes touch server.mjs.
      Coordinate: keep this phase's edit confined to response-header composition and leave
      decodeActor to URF-03, or run in a separate worktree and merge deliberately.
  freedom:
    - Choose where header composition lives in server.mjs, as long as no response path can
      bypass it.
  work_loops:
    - name: Headers and proof
      max_iterations: 3
      repeat_until: The header test passes and the browser suite passes against a header-enabled server.
      steps:
        - write the header test first
        - implement header composition
        - run the browser suite against the header-enabled server to catch CSP breakage
        - write ops/security-headers-verification.sh for deployed-environment checking
  required_test_cases:
    - HTML responses carry CSP, Strict-Transport-Security, X-Content-Type-Options,
      Referrer-Policy, and Permissions-Policy
    - API responses carry the non-HTML subset of the policy
    - any unsafe-inline or unsafe-eval allowance appears in the test as an explicit,
      documented exception rather than passing silently
    - no response path returns without the header set
    - the built SPA loads and the critical journeys pass under the policy
  deliverables:
    - server.mjs
    - apps/api/test/security-headers.test.cjs
    - ops/security-headers-verification.sh
  evidence_required:
    - header test output
    - browser suite output against the header-enabled server
    - the exact header set as served, captured verbatim
  escalate_when:
    - The ratified CSP cannot be satisfied without unsafe-inline and the policy forbade it.
    - A header requirement conflicts with Cloud Run's own response handling.
