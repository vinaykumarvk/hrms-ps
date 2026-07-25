/goal
  objective: >
    Make claim verification a real server-side boundary — verify signature, issuer, audience,
    and expiry, reject alg:none outright, and stop every path that reconstructs actor context
    from unverified claims or substitutes privilege defaults.
  context:
    - docs/spec/ui-remediation-followup/auth-contract-amendment.md
    - docs/reviews/full-review-ui-remediation.md            # FR-02
    - apps/api/src/platform/authorization/
    - server.mjs                                            # decodeActor, currently ~line 52
    - tools/local-api-server.mjs
    - docs/contracts/error-taxonomy.yaml
    - CLAUDE.md
  constraints:
    - Verification belongs in apps/api/src/platform/authorization. Do not create a
      module-local auth engine; reuse the platform.
    - server.mjs decodeActor currently base64-decodes unverified claims AND substitutes
      default tenantId/entityId when the claim is absent. Both behaviors must end. A missing
      tenant or entity claim is a 401, never a default.
    - tools/local-api-server.mjs stays test-only. It must refuse to start in production mode
      and must grant no roles, permissions, or field grants that the token did not carry.
      Assert this in a test; do not assume the existing guard is sufficient.
    - Errors use the platform 8-code table with {error:{code,message,field,details}} and an
      X-Correlation-Id header. Invent no codes.
    - Layering holds: DB access in *Repository.ts, logic in *Service.ts.
  freedom:
    - Choose the verification library or implement against the platform's existing crypto,
      as long as alg confusion and alg:none are structurally impossible.
  work_loops:
    - name: Verification service
      max_iterations: 3
      repeat_until: All negative cases below fail closed and npm run check is green.
      steps:
        - write the negative tests first
        - implement verification in the platform authorization module
        - route server.mjs and the local bridge through it
        - run focused tests, then npm run check
  required_test_cases:
    - an alg:none token is rejected
    - an invalid signature is rejected
    - an expired token is rejected
    - a wrong issuer is rejected
    - a wrong audience is rejected
    - a token missing tenant_id or entity_id yields 401 and never a substituted default
    - a valid token yields exactly its claimed permissions, with no widening
    - the local bridge refuses to start in production mode
  deliverables:
    - apps/api/src/platform/authorization/tokenVerification.ts
    - apps/api/src/platform/authorization/index.ts
    - server.mjs
    - tools/local-api-server.mjs
    - apps/api/test/auth-token-verification.test.cjs
  evidence_required:
    - test output showing each negative case failing closed
    - npm run check output
  escalate_when:
    - Verification cannot be implemented without changing the ratified token format.
    - An existing caller depends on the default tenant/entity substitution being removed.
