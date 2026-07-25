# URF-00 — Command log

**Phase:** URF-00 (baseline re-verification) · **Executed:** 2026-07-25
**HEAD:** `cfd8576` · **Branch:** `chore/install-ai-dev-pipeline`
**Working tree:** not clean — untracked docs under `docs/HRMS Deliverables to Development Phase/`,
one deleted prototype HTML, plus this phase's own new files. No source file was modified by this phase.

Every command named in the source review's "Verification commands" section was executed here.
Results are recorded as they occurred. URF-00 repairs nothing.

---

## EV-00-01 — `npm run check`

    result: GREEN
    status: pass
    exit code: 0

```
> primesoft-hrms@0.1.0 check
> npm run typecheck && npm test

ℹ tests 582
ℹ suites 0
ℹ pass 581
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
ℹ todo 0
ℹ duration_ms 3244.189
```

The API gate is healthy. Includes the UIR-03 and UIR-04 contract tests from the prior
remediation, all passing.

---

## EV-00-02 — `npm run web:check`

    result: RED
    status: fail
    exit code: 2

```
> primesoft-hrms@0.1.0 web:check
> npm run web:typecheck && npm run web:build && npm run web:test

> npx tsc -p apps/web/tsconfig.json --noEmit
```

**80 TypeScript errors.** The chain stops at `web:typecheck`, so `web:build` and `web:test`
never executed under this command.

Errors by file:

| Count | File |
|---|---|
| 37 | `apps/web/src/modules/ps08/AparTierForms.tsx` |
| 13 | `apps/web/src/modules/ps07/TrainingNominationForm.tsx` |
| 12 | `apps/web/src/modules/ps02/ChangeRequestEditor.tsx` |
| 11 | `apps/web/src/modules/ps05/TransferInitiateForm.tsx` |
| 6  | `apps/web/src/modules/ps01/EmployeeDependentsPanel.tsx` |
| 1  | `apps/web/src/lib/useForm.ts` |

Probable root cause — a single generic-inference failure in the shared hook, from which the
other 79 errors follow as `never`-typed field access in its consumers:

```
apps/web/src/lib/useForm.ts(113,39): error TS2345: Argument of type
'T[string] extends FieldConfig<infer V> ? V : never' is not assignable to parameter of type 'string'.
```

Representative consumer errors:

```
apps/web/src/modules/ps08/AparTierForms.tsx(173,36): error TS2339: Property 'kind' does not exist on type 'never'.
apps/web/src/modules/ps08/AparTierForms.tsx(202,65): error TS2345: Argument of type 'string' is not assignable to parameter of type 'never'.
apps/web/src/modules/ps08/AparTierForms.tsx(234,42): error TS2339: Property 'errorCode' does not exist on type 'never'.
```

This is a **regression since the review**, which recorded "Web unit/static tests | yes | 153/153 pass".
Attributed to the `useForm` migration commits (`3c77d25`, `074789a`, `5bf0e8e`, `e6d2b3a`).

---

## EV-00-03 — `npm run web:test` (run standalone, because `web:check` blocked it)

    result: RED
    status: fail
    exit code: 1

```
ℹ tests 153
ℹ pass 127
ℹ fail 26
ℹ skipped 0
```

The review recorded **153/153 pass**. Twenty-six now fail. Failing tests:

```
✖ PH-05D document view exposes retention and hold states
✖ PH-05D vault lists GET /api/v1/documents results with legal-hold, retention, and versions
✖ PH-06D PS03 leave-apply form is a real controlled form submitting through the client
✖ PH-06D PS05 initiate-transfer form posts /api/v1/transfers/orders through the client
✖ PH-06D interactive surfaces render canonical loading/error/empty states
✖ PH-07 workspace renders PS02, PS03, and PS04 wave panels
✖ PH-07E PS01 contact and dependent panels are real controlled forms with submit handlers
✖ PH-07E PS02 change-request editor submits through the client and surfaces error envelopes
✖ PH-07E PS02 approver queue wires approve/reject/send-back with a mandatory comment
✖ PH-08 workspace renders PS06, PS07, PS08, and PS09 statutory panels
✖ PH-08F PS07 nomination form renders capacity/eligibility feedback from the server
✖ PH-08F PS08 tier forms render only the tiers the actor holds (SoD in the UI)
✖ PH-09 workspace renders PS10 and PS11 compensation panels
✖ PH-10E static marker card is gone and the workspace fetches live KPI/freshness data
✖ PH-10E dashboard load binds ACTIVE KPIs to live aggregates and refresh logs to freshness
✖ PH-10E staleness rule follows the 60-minute SLA and fails closed on non-success runs
✖ PH-10E dashboard renders live KPI values and the freshness panel from refresh logs
✖ PH-10E NEGATIVE: a suppressed cohort renders suppressed and the raw small count is absent
✖ PH-10E drill-down offers only cohort-grain dimensions the scope policy allows
✖ PH-10E dashboard load maps FORBIDDEN to no-permission and NOT_FOUND to empty
  (… 6 further failures)
```

One failure is a **stale assertion rather than a code defect** — the design-token migration
(`2dd433f`) replaced literal CSS values with custom properties, but the test still asserts the
literal:

```
    expected: /button,[\s\S]*min-height: 2\.75rem/
    actual:   'button, input, select, textarea, a[href] { min-height: var(--min-touch); }'
    operator: 'match'
    code: 'ERR_ASSERTION'
```

---

## EV-00-04 — `npm audit --audit-level=low`

    result: RED
    status: fail
    exit code: 1

```
# npm audit report

postcss  <=8.5.17
Severity: high
PostCSS: Path Traversal in Previous Source Map Auto-Loading (sourceMappingURL) leads to
Arbitrary .map File Disclosure - https://github.com/advisories/GHSA-r28c-9q8g-f849
fix available via `npm audit fix --force`
Will install postcss@8.5.23, which is outside the stated dependency range
node_modules/postcss

tar  <=7.5.20
Severity: moderate
node-tar: Uncontrolled recursion in mapHas/filesFilter allows uncatchable stack-overflow DoS
via crafted long-path tar with member selection - https://github.com/advisories/GHSA-r292-9mhp-454m
fix available via `npm audit fix`
node_modules/tar

2 vulnerabilities (1 moderate, 1 high)
```

The review recorded "Dependency audit | yes | **0 known vulnerabilities**". Two have appeared
since. The postcss fix is flagged as outside the stated dependency range, so it is not a
no-thought upgrade.

---

## EV-00-05 — `bash docs/spec/pipeline/checks/ph-05e.sh`

    result: RED
    status: fail
    exit code: 1

```
  ok   UI conformance test present: apps/web/test/ph05-ui-conformance.test.cjs
  ok   conformance test asserts canonical states
  ok   npm typecheck passes
  ok   npm test passes (API suite)
  RED  npm web:typecheck failed
  RED  npm web:test failed
== RED — PH-05E not complete ==
```

The review recorded PH-05E as GREEN. It is RED, for the reasons in EV-00-02 and EV-00-03.

---

## EV-00-06 — `bash docs/spec/ui-remediation-pipeline/checks/uir-08.sh`

    result: BLOCKED
    status: could not complete
    exit code: n/a — terminated after exceeding 10 minutes

The inherited release oracle re-runs the full e2e suite internally and inherits the blocker in
EV-00-07. It cannot reach a verdict in this environment. Two independent defects were identified
in it regardless:

1. **It cannot fail on the checks it claims to run.** `uir-08.sh` uses `rg` for its
   production-artifact negative scan (`! rg -F "Welcome@123" dist/apps/web`). No ripgrep binary
   is installed on this machine; `rg` exists only as a shell function inside an interactive
   Claude Code session. In the plain bash environment the driver uses, the command is not found,
   the negation succeeds, and the scan **passes without examining anything**. The evidence
   behind FR-01's closure is therefore vacuous.

   ```
   $ command -v rg          # in a plain shell
   (not found)
   $ ! rg -F "Welcome@123" dist/apps/web ; echo $?
   0                        # reports success — nothing was scanned
   ```

2. Its first two steps (`npm run check`, `npm run web:check`) include a command that is RED at
   HEAD, so even if it ran to completion it could not currently pass.

---

## EV-00-07 — `npm run web:test:e2e -- --project=chromium`

    result: BLOCKED
    status: could not run
    exit code: n/a — no test output produced; terminated after ~8 minutes in webServer startup

```
> playwright test --config apps/web/playwright.config.ts --project=chromium
(node:94028) [DEP0205] DeprecationWarning: `module.register()` is deprecated.
```

No test ever started. Diagnosis: `apps/web/playwright.config.ts` declares two webServers, both
with `reuseExistingServer: false` (lines 22 and 29) — the FR-11 repair. Port 5173 was already
held by a pre-existing development server at the time of this run:

```
$ lsof -nP -iTCP:5173 -sTCP:LISTEN
Code\x20H 86625 vinaykumar 49u IPv4 TCP 127.0.0.1:5173 (LISTEN)
$ ps -o lstart=,pid= -p 87266
Sat Jul 25 14:31:50 2026  87266   # vite, started before this phase
```

The API bridge webServer bound 8787 successfully; the web webServer could not take 5173 and the
run never progressed. **The FR-11 repair traded one defect for another:** disabling server reuse
removed the stale-server risk the review identified, but makes the gate unrunnable whenever a
developer has the app running locally — with no diagnostic, just a silent hang until timeout.

This phase did not kill the pre-existing server, as it belongs to the developer's session and
terminating it is not URF-00's business. Re-run this command with no dev server on 5173 to
obtain a real result. **This finding is new and is not in the source review.**

---

## Summary

| ID | Command | Result |
|---|---|---|
| EV-00-01 | `npm run check` | GREEN — 581/582 pass, 1 skipped |
| EV-00-02 | `npm run web:check` | **RED** — 80 TypeScript errors |
| EV-00-03 | `npm run web:test` | **RED** — 127/153 pass, 26 fail |
| EV-00-04 | `npm audit --audit-level=low` | **RED** — 1 high, 1 moderate |
| EV-00-05 | `bash docs/spec/pipeline/checks/ph-05e.sh` | **RED** |
| EV-00-06 | `bash docs/spec/ui-remediation-pipeline/checks/uir-08.sh` | **BLOCKED** + oracle is vacuous |
| EV-00-07 | `npm run web:test:e2e -- --project=chromium` | **BLOCKED** — port 5173 held; `reuseExistingServer:false` |

Of the review's seven verification commands, **one passes, four are red, and two cannot run.**
