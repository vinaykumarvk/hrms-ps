/goal
  objective: >
    Add the login/session endpoints the specification currently lacks — contract first — and
    make 401/403 behavior conform to the platform error model.
  context:
    - docs/spec/ui-remediation-followup/auth-contract-amendment.md
    - docs/reviews/full-review-ui-remediation.md    # "the current specification explicitly contains no login endpoint"
    - docs/contracts/openapi/                       # PS01..PS14 for house style
    - docs/contracts/auth-matrix.yaml
    - docs/contracts/dependency-register.yaml
    - docs/contracts/error-taxonomy.yaml
    - apps/api/src/platform/authorization/
    - CLAUDE.md
  constraints:
    - Contract first. Write docs/contracts/openapi/AUTH.yaml before the routes, and keep the
      implementation matching it exactly.
    - Error model: platform 8-code table, {error:{code,message,field,details}}, X-Correlation-Id
      on every response including failures. Invent no codes.
    - Fail closed and generically. No user enumeration: an unknown employee ID and a wrong
      password produce the same response and the same timing class.
    - No endpoint returns permissions, roles, or field grants before verification succeeds.
    - Pagination rules are unchanged (cursor-only, limit default 25 / max 100) if any listing
      endpoint is added.
    - State the rate-limiting or lockout posture explicitly. "None, accepted for this release"
      is an acceptable answer; silence is not.
  freedom:
    - Choose route file organization inside the platform authorization module.
  work_loops:
    - name: Contract then endpoints
      max_iterations: 3
      repeat_until: The OpenAPI parses, endpoint tests pass, and npm run check is green.
      steps:
        - author docs/contracts/openapi/AUTH.yaml
        - write endpoint tests from the contract
        - implement the routes
        - amend auth-matrix.yaml and dependency-register.yaml
  required_test_cases:
    - valid credentials issue a token that the URF-03 verifier accepts
    - invalid credentials fail closed with a generic message and no enumeration signal
    - refresh honors the ratified lifetime
    - refresh of a revoked session is rejected
    - logout revokes server-side, not only client-side
    - every failure response carries X-Correlation-Id and a code from the 8-code table
  deliverables:
    - docs/contracts/openapi/AUTH.yaml
    - apps/api/src/platform/authorization/authRoutes.ts
    - docs/contracts/auth-matrix.yaml
    - docs/contracts/dependency-register.yaml
    - apps/api/test/auth-endpoints.test.cjs
  evidence_required:
    - OpenAPI parse output
    - endpoint test output
    - npm run check output
  escalate_when:
    - The contract cannot express a behavior the amendment requires.
    - An endpoint would need a new error code.
