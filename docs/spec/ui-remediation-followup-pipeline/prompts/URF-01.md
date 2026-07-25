/goal
  objective: >
    Resolve the two architectural conflicts the review could not resolve, as ratified
    written amendments: production authentication with server-side token verification,
    and a deployment security policy. Produce documents and decisions, not code.
  context:
    - docs/reviews/full-review-ui-remediation.md            # section "Required amendments"
    - docs/spec/ui-remediation-followup/finding-state-matrix.yaml   # from URF-00
    - docs/spec/ui-remediation-followup/phased-plan.yaml    # phase URF-01, decisions_required
    - docs/contracts/auth-matrix.yaml
    - docs/contracts/error-taxonomy.yaml
    - docs/architecture.md
    - Dockerfile
    - server.mjs
    - CLAUDE.md
  constraints:
    - Write no application code in this phase. Amendments only.
    - No amendment may weaken RBAC, tenant isolation, or the rule that the API is the
      authoritative authorization boundary. Client route guards are UX and data
      minimization; they are never authorization.
    - Do not invent error codes. The platform 8-code table stands.
    - Deferred items stay deferred and are recorded as such — localization and password
      recovery. Dark theme is no longer deferred; it shipped in commit 1d68603 and must be
      re-recorded as delivered rather than left in the deferred list.
    - Every decision needs a named owner. "TBD" is a failed phase.
  decisions_required:
    - D-AUTH-01: External IdP (OIDC) or a server-issued session token minted by apps/api?
    - D-AUTH-02: Token transport — HttpOnly cookie or Authorization bearer from sessionStorage?
                 Same-origin serving via server.mjs behind Cloud Run permits the cookie option
                 the review preferred.
    - D-AUTH-03: Does a demo login survive in any deployed artifact, and behind what boundary?
                 Today VITE_ENABLE_DEMO_LOGIN lets a production build mint an alg:none
                 privileged token with credential defaults compiled in.
    - D-SEC-01:  CSP posture — strict nonce-based, or hash/allowlist with documented
                 unsafe-inline exceptions?
  freedom:
    - Choose the auth architecture. Justify it against the existing platform, not in the abstract.
    - Choose document structure.
  work_loops:
    - name: Draft, challenge, ratify
      max_iterations: 3
      repeat_until: All four decisions are answered, owned, and internally consistent.
      steps:
        - draft each amendment against the current code and deployment surface
        - state the concrete implementation consequence of each decision for URF-02..URF-06
        - record rejected alternatives and why
  deliverables:
    - docs/spec/ui-remediation-followup/auth-contract-amendment.md
    - docs/spec/ui-remediation-followup/deployment-security-policy.md
    - docs/spec/ui-remediation-followup/threat-model.md
    - docs/spec/ui-remediation-followup/scope-conflict-register.yaml
  amendment_must_specify:
    - exact endpoints, request/response shapes, and error codes for sign-in, refresh, logout
    - token format, signing algorithm, issuer, audience, and lifetimes
    - where verification happens and what it rejects
    - the exact header set for the deployment policy, header by header
    - token/cookie storage decision with its XSS and CSRF consequences stated
  evidence_required:
    - a decision record per decision id, with owner and date
    - a traceability line from each downstream phase (URF-02..URF-06) to a clause here
  escalate_when:
    - A decision would weaken an existing security boundary.
    - The chosen architecture cannot be implemented without changing the P02/RLS authority model.
