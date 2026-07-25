# URF-00 — Scope delta since the full review

**Phase:** URF-00 (baseline re-verification) · **Executed:** 2026-07-25 · **HEAD:** `cfd8576`
**Source review:** `docs/reviews/full-review-ui-remediation.md` (dated 2026-07-11, verdict CONDITIONAL)

This document records what changed between the review's world and the repository's actual state,
so that no downstream phase repairs code that no longer exists or plans against a false premise.

---

## 1. Distance travelled since the review

Twenty-five commits landed between the review and this phase. The ones that move the review's
premises:

| Commit | Change | Consequence for the review |
|---|---|---|
| `2dd433f` | design token system v2 | Every raw CSS value in `styles.css` became a token. **Broke a web unit test** that asserted a literal `min-height: 2.75rem`. |
| `1f1a845`, `3c77d25`, `074789a`, `5bf0e8e`, `e6d2b3a` | DataTable + `useForm` migration across G01–G13 | Drove FR-16's raw-control count from 126 down to 20 — and **introduced 80 TypeScript errors** now blocking `web:typecheck`. |
| `1d68603` | dark mode + AppShell mobile polish | Dark theme is **no longer deferred**. The review's "Required amendments" still lists it as deferred to a recorded owner; that line is now false. |
| `ad02ea5` | PrimeSoft rebrand + **Cloud Run deployment with Cloud SQL** | Creates the production deployment surface. See §2 — this is the most consequential delta. |
| `83857d3`, `cfd8576` | AI Dev Pipeline v8 install, full-coverage remediation plan | Adds `db_change_guard`/`secrets_guard` hooks that constrain how URF-02 may make schema changes. |

## 2. A production deployment surface now exists

The review skipped the infra domain outright, recording:

> | Infra review | no | skipped | no production deployment, CI, migration, or container files are in this target |

**That premise is now false.** The repository contains, at HEAD:

- `Dockerfile` — container build
- `server.mjs` — the production HTTP server (167 lines) that serves both the built SPA and the API
- `ops/` — eight operational scripts (readiness checks, cutover rehearsal, backup/restore drill, release-candidate seal verification)
- Cloud Run + Cloud SQL deployment, per commit `ad02ea5`

Two direct consequences:

1. **FR-10 changes from amendment-blocked to actionable.** The review classified it "no,
   amendment/deployment required" because the deployment surface was undefined. It is now
   defined. `server.mjs` sets no CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, or
   `Permissions-Policy` on any response path (verified: zero matches for
   `Content-Security-Policy` in `server.mjs`). This is implementable work, not a pending decision.
2. **The infra domain must be reviewed, not skipped.** No infra pass has ever run against this
   surface. That gap is outside URF's scope but is recorded here so it is not mistaken for
   coverage.

## 3. The demo-login boundary widened

FR-01 was reported resolved on the strength of a production-bundle negative scan. The mechanism
that scan tested has since changed shape: `apps/web/src/app/session.ts:124` now admits the demo
path in **any** build that sets `VITE_ENABLE_DEMO_LOGIN=true`, described in-code as "used by the
standalone demo deployment."

The credential defaults are still compiled into source:

```
125:  const demoEmployeeId = import.meta.env.VITE_DEMO_EMPLOYEE_ID ?? "PS-100246";
126:  const demoEmployeePassword = import.meta.env.VITE_DEMO_EMPLOYEE_PASSWORD ?? "Welcome@123";
129:  const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({
```

The inherited oracle `docs/spec/ui-remediation-pipeline/checks/uir-08.sh:9` scans the built
bundle only in the default (flag-off) configuration. The flag-on artifact — the one actually
deployed for demos — has never been scanned. This is why URF-06's oracle builds and scans **both**
configurations.

## 4. The oracle itself does not run correctly outside a Claude shell

`uir-08.sh` and every check under `docs/spec/ui-remediation-pipeline/checks/` use `rg`
(ripgrep). **No ripgrep binary is installed on this machine.** In an interactive Claude Code
shell `rg` resolves to a shell function, so the checks appear to work; the pipeline driver runs
checks in a plain bash environment where the command does not exist.

The failure mode is silent and inverted: `! rg "Welcome@123" dist/apps/web` **succeeds** when
`rg` is missing, so the production-credential negative scan — the evidence behind FR-01's
closure — reports pass without examining anything.

This was found by dry-running the follow-up pipeline, whose `checks/lib.sh` was consequently
rewritten on `grep` with a `require_tool` guard and non-vacuous negative assertions. The
inherited `uir-08.sh` has **not** been changed (URF-00 repairs nothing) and still carries the
defect. It is recorded as an open item for URF-08/URF-09.

## 5. Deferred-item register, corrected

| Item | Review status | Actual status at HEAD |
|---|---|---|
| Dark theme | deferred to recorded owner | **Delivered** (`1d68603`) — correct the record |
| Localization | deferred to recorded owner | Still deferred — unchanged |
| Password recovery | deferred to recorded owner | Still deferred — unchanged |

## 6. What this means for the plan

- URF-01 must ratify **FR-10 as implementable work**, not as a pending architectural question.
- URF-05 has a concrete target (`server.mjs`) rather than a hypothetical one.
- URF-06 must scan the flag-on artifact, which no prior scan covered.
- URF-08/URF-09 must repair or replace the `rg`-based inherited oracle before any GREEN from it
  is treated as evidence.
- The 106 regressions in §Baseline (see `finding-state-matrix.yaml` and
  `docs/evidence/ui-remediation-followup/urf-00-command-log.md`) are **new work not contemplated
  by the review**, and are the reason the plan's own gate A cannot be reached without a repair
  phase. See the escalation at the end of the matrix.
