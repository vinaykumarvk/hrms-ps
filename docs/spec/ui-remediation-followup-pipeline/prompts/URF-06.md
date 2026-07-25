/goal
  objective: >
    Route sign-in through the verified API, remove compiled-in credential defaults and the
    alg:none minting path from the shipped bundle, and reduce browser-held claims to
    presentation-only.
  context:
    - docs/spec/ui-remediation-followup/auth-contract-amendment.md     # D-AUTH-02, D-AUTH-03
    - docs/contracts/openapi/AUTH.yaml
    - docs/reviews/full-review-ui-remediation.md    # FR-01, FR-02 browser portion
    - apps/web/src/app/session.ts
    - apps/web/src/app/LoginPanel.tsx
    - apps/web/src/App.tsx
    - apps/web/src/api/hrmsClient.ts
  constraints:
    - "apps/web/src/app/session.ts still compiles in credential defaults
      (VITE_DEMO_EMPLOYEE_ID ?? \"PS-100246\", VITE_DEMO_EMPLOYEE_PASSWORD ?? \"Welcome@123\")
      and still mints an {alg:\"none\"} token. Both must be absent from any production-mode
      artifact regardless of the demo flag's value."
    - Browser-side claims are presentation-only. The UI must never grant a permission the
      server did not return, and must never treat a route guard as an authorization boundary.
    - Do not regress the fixes already in place: FR-03 (expiry timer plus 401 termination),
      FR-05 (composed abort signals), FR-07 (replaceState in an effect), FR-14 (busy state
      always cleared), FR-15 (both credential controls associated with the error). Each needs
      a regression guard test in this phase.
    - Honor D-AUTH-02 exactly. If the ratified decision is HttpOnly cookies, the sessionStorage
      bearer path is removed, not merely supplemented.
    - Deferred items stay deferred: no localization, no password recovery.
  freedom:
    - Choose how the dev-only demo path is isolated, provided the production negative scan proves it gone.
  work_loops:
    - name: Integrate and prove absence
      max_iterations: 3
      repeat_until: Web tests, the auth e2e spec, and the production-artifact negative scan all pass.
      steps:
        - write the negative scan and the regression guards first
        - replace the demo exchange with the API sign-in path
        - build in production mode and scan dist/apps/web
  required_test_cases:
    - a production-mode build contains no demo credential literal and no alg:none minting,
      with the demo flag both unset and set
    - a rejected sign-in clears busy state and shows a generic error
    - session expiry terminates the protected session
    - a 401 from any endpoint terminates the protected session
    - the UI renders no permission the server did not return
  deliverables:
    - apps/web/src/app/session.ts
    - apps/web/src/app/LoginPanel.tsx
    - apps/web/src/App.tsx
    - apps/web/src/api/hrmsClient.ts
    - apps/web/test/session-auth.test.cjs
    - apps/web/test/e2e/auth.spec.ts
  evidence_required:
    - npm run web:check output
    - e2e output for the auth spec
    - the production negative scan, run against dist/apps/web, with its verbatim result
  escalate_when:
    - The ratified transport decision cannot be implemented without changing the API contract.
    - Removing the demo path breaks a deployed demo commitment that has not been re-decided.
