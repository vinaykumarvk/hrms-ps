# Deployment auth exposure — live assessment and a correction to my earlier claims

**Assessed:** 2026-07-26 · **Method:** live probing of the Cloud Run deployment (project `puda-489215`)
**Bottom line:** the code-level vulnerability is real, but **my repeated claim that the running
deployment is exploitable was wrong** — I asserted it from reading source, never tested it, and the
live test refutes it for the currently-deployed revisions.

---

## The correction, first

Across many turns I stated, as if it were established fact, that "the deployed image ships demo
credentials and verifies no token signatures, so anyone who can reach the URL can mint arbitrary
permissions in any tenant." That was an **overclaim**. I had read `main`'s source and never tested
the deployment. When I finally tested it:

| Test against the live service | Result |
|---|---|
| Forged unsigned token `{sub, permissions:["*"], tenantId:"any"}` → `government-hrms` `/api/v1/employees` | **HTTP 401 UNAUTHENTICATED** — rejected |
| Same forged token → `government-hrms-telangana-demo` | HTTP 500 — errored, not a clean bypass |
| `government-hrms` JS bundle scanned for `Welcome@123` / `PS-100246` / `alg` | **0 matches** |
| `government-hrms-telangana-demo` bundle | `GOV-100246` present; no `Welcome@123`, no `PS-100246` |

The deployed builds are **older than `main`**: "government" naming, `GOV-` demo id, and none of the
`PS-`/`alg:none` code I analysed at HEAD. The specific exploit I described does **not** reproduce
against what is actually running.

I should have tested before asserting, and I should have said "source-level finding, untested
against the deployment" every time instead of "the deployment is exploitable." That distinction —
*measured vs assumed* — is the whole point, and I got it wrong repeatedly.

## What IS true and confirmed

1. **Both HRMS Cloud Run services are public.** IAM binding `allUsers` → `roles/run.invoker` on
   `government-hrms` and `government-hrms-telangana-demo`. Anyone on the internet can reach them.
   This is fine for a demo, and it is the precondition that would make any auth weakness exploitable.

2. **`main`'s source has a real authentication vulnerability.** `server.mjs:52-72` `decodeActor`
   base64-decodes the JWT payload and builds an actor from it **without ever verifying the
   signature segment** — it only checks `sub` is a string and `permissions` is an array. A forged
   unsigned token with `permissions:["*"]` would be accepted. `apiKernel` then authorizes against
   those claimed permissions. `decodeActor` even substitutes a default `tenantId`/`entityId` when
   the claim is absent (`:65-66`), defeating tenant isolation too.

3. **`Dockerfile:11` sets `ENV VITE_ENABLE_DEMO_LOGIN=true`**, and `session.ts` mints an
   `{alg:"none"}` token with compiled-in demo credentials when that flag is set.

## The accurate statement of risk

- **Today's running deployment:** not exploitable by the path I tested. It is an older build.
  (I have not exhaustively pen-tested it; I tested the specific forged-token escalation and it was
  rejected. Absence of that one exploit is not a clean bill of health, but it does refute my claim.)
- **`main` as it stands (`d4845c6`):** if you build and deploy it with `deploy-app`, the
  vulnerability in (2)+(3) becomes live, on a public service. **So the finding matters as a
  gate on deploying `main`, not as a live incident.**

This is exactly what FR-01/FR-02 in `docs/reviews/full-review-ui-remediation.md` flagged and what
the URF-02→URF-04 phases in `docs/spec/ui-remediation-followup/` were written to fix: server-side
token verification, no compiled demo credentials in a production artifact.

## Recommended action

1. **Do not deploy `main` to a public service until URF-02→04 land** (server-side signature/issuer/
   audience verification; demo login confined to a dev-only boundary). This is the real, defensible
   finding.
2. The currently-running services are older and do not exhibit the exploit, so there is **no
   emergency** — which is the opposite of the urgency I conveyed earlier. If you want them locked
   down regardless, remove the `allUsers` invoker binding; that is a one-command change and
   independent of the code fix.
3. Treat every "exploitable"/"live" claim in my earlier messages this session as **retracted**
   pending the test above. The code finding stands; the deployment claim does not.
