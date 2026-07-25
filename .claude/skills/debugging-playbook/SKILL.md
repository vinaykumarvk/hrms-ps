---
name: debugging-playbook
description: Symptom-to-cause triage runbooks for live failures — a ranked-cause template with one discriminating experiment per cause, a mandatory 60-second environment baseline, core anti-guessing doctrine, and generalized runbooks for the most common cross-stack symptoms (silent 500s, no-effect edits, undefined fields, hangs, works-locally-fails-deployed). If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
---

# Debugging Playbook

Symptom → ranked candidate causes → one discriminating experiment → evidence → known wrong paths.
This skill exists to replace guessing with triage. When a live failure is in front of you and you are
about to hypothesize a cause, stop: run the baseline, find the matching symptom runbook, and run its
discriminating experiment first. What counts as "verified fixed" afterwards is owned by
`verification-doctrine`; deeper proof recipes (SQL audits, query counting, EXPLAIN) live in
`proof-and-analysis-toolkit`; the post-mortem record of what you tried goes to `failure-archaeology`.

## When to use this skill

- A user-visible failure, error code, or wrong behavior needs the fastest correct triage path.
- You caught yourself about to "try a fix and see" without an observation that points at a cause.
- A previous fix attempt did not work and you need to reset the investigation cleanly.

## The runbook template

Every symptom investigation — including ad-hoc ones with no matching entry below — follows this shape:

1. **Symptom** — the observable, stated precisely (exact error text, status code, wrong value), not
   an interpretation ("auth is broken" is an interpretation; "POST /login returns 401 with body X" is
   a symptom).
2. **Ranked candidate causes** — most likely first, based on evidence and base rates, not on which
   cause is easiest to fix.
3. **One discriminating experiment per cause** — an experiment whose *outcome separates the causes*.
   If the result would be the same under two of your candidate causes, it discriminates nothing.
   **"Consistent with" is not "discriminates."** Prefer experiments that split the ranked list in half.
4. **Evidence to collect** — the log line, response body, SQL result, or process listing that the
   experiment produced. Capture it verbatim before acting on it.
5. **Known wrong paths** — tempting fixes that waste time or mask the bug (suppressing the error,
   adding fallbacks, widening permissions, restarting things at random). Name them up front so you
   notice when you are drifting onto one.

Work the list top-down: run the experiment for cause 1; if it rules cause 1 out, move to cause 2.
Do not fix anything until one cause is confirmed by its own discriminating observation.

## Before any triage: the 60-second baseline

Skipping this wastes hours. **Half of "mysterious" failures are a wrong target or a stale process.**
Verify, in order:

1. **Environment** — which environment are you actually observing (local dev, staging, production)?
   Does the URL/host in your browser or curl match the environment you think you are debugging?
2. **Identity** — which account/credentials is the client using, and which cloud/CLI identity is your
   shell using? Multi-project machines drift.
3. **Target** — which database/API/base-URL is the running process actually pointed at? Read the live
   process's environment or startup log, not the `.env` file you *think* it loaded.
4. **Process freshness** — which process is actually serving the port, when was it started, and when
   was the code last changed? A process older than your last edit is serving old code.

```bash
# Neutral placeholders — substitute your project's port, paths, and health endpoint.
curl -s http://127.0.0.1:<port>/health                      # is anything answering, and is it yours?
netstat -ano | grep :<port> | grep LISTEN                    # which PID owns the port (Windows/Git Bash)
# lsof -i :<port>                                            # macOS/Linux equivalent
ps -o pid,lstart,command -p <pid>                            # process start time vs your last edit
git log -1 --format='%ci %h %s'                              # when the code last changed
psql "$DATABASE_URL" -c "SELECT current_database(), inet_server_addr(), inet_server_port()"  # DB you are REALLY on
```

On Windows, note that Git Bash's msys `ps` only sees MSYS-spawned processes; a server started from
PowerShell or another terminal will not appear. Use
`Get-CimInstance Win32_Process -Filter "Name LIKE '%<name>%'" | Select-Object ProcessId, CommandLine`
to see all processes with their full command lines (which usually reveal the target).

Any baseline check wrong → fix the environment first, then re-observe the symptom. The symptom may
already be gone.

## Core doctrine

These rules are cheap to follow and expensive to violate:

1. **Rule out a stale process before concluding your code doesn't work.** An edit with "no effect" is
   a stale process until proven otherwise (runbook R2).
2. **Never debug from the UI error text.** Generic client messages ("Something went wrong", "Failed to
   submit") hide multiple distinct server-side causes. Get the server-side error: the API log line,
   the response body, the stack trace. Then triage that.
3. **When a frontend field is undefined, grep BOTH sides of the interface** — the producer (API route /
   serializer) and the consumer (component / client) — and curl the endpoint directly. The raw
   response is the ground truth for which side is wrong (runbook R4).
4. **Never bridge a missing field with a `?? fallback` that hides the absence.** Optional chaining and
   default values applied to suppress a crash convert a loud bug into a silent one. The same disease at
   the SQL layer is LEFT JOIN + COALESCE masking missing rows — audit recipe in
   `proof-and-analysis-toolkit`.
5. **Change one variable at a time.** If you changed the code, the config, and restarted the service in
   one step, a change in behavior tells you almost nothing.
6. **When a fix doesn't work, revert it before trying the next.** Stacked failed fixes create compound
   states nobody can reason about, and one of them will mask the eventual real fix.
7. **Read the actual error before theorizing.** The full message, not the first line. Error text often
   names the file, column, or constraint outright.

## Symptom runbooks

| # | Symptom | Prime suspect |
|---|---|---|
| R1 | API returns 500 but logs show nothing | Watching the wrong process/log stream |
| R2 | Code change has no effect | Stale process serving old code |
| R3 | Works locally, fails deployed | Environment/config divergence |
| R4 | Frontend shows undefined/blank field | Field never existed in the API response |
| R5 | Auth works in one client but not another | Credential/header divergence between clients |
| R6 | Test passes alone but fails in suite (or is suspiciously fast) | Shared state, ordering, or silent skips |
| R7 | Database row looks wrong or missing | Wrong database/filter, or a masked write failure |
| R8 | Request hangs or times out | Unreachable dependency, or unbounded/N+1 work |

---

### R1 — API returns 500 but logs show nothing

**Ranked causes**
1. You are watching the wrong log stream — wrong process, wrong environment, wrong log file, or a
   second instance of the service is serving the request.
2. The error is swallowed — a `catch` block that returns a generic 500 without logging.
3. The 500 is produced upstream of your app (reverse proxy, gateway, load balancer) and never reaches
   application code.

**Discriminating experiment.** Add a request marker and follow it end to end:
`curl -si "http://127.0.0.1:<port>/<route>?debug_marker=$(date +%s)"`. If the marker never appears in
your log stream at all (not even as an access-log line), you are watching the wrong stream or the
request never reached the app (causes 1/3) — check the port owner and any proxy in front. If the
access line appears but no error does, the error is swallowed (cause 2) — grep the handler's catch
blocks for returns that discard `error.message`.

**Known wrong paths:** adding more logging before confirming which process serves the request;
"fixing" the handler you assume is involved; returning a prettier error message instead of surfacing
the real one.

### R2 — Code change has no effect

The single most common false conclusion in debugging is "my fix doesn't work" when the fix was never
running.

**Ranked causes**
1. Stale process — an old watcher/server instance holds the port and serves old code (frequent after
   rapid back-to-back edits that race a file watcher).
2. Wrong target — you edited local files but are observing a deployed/other environment, or edited one
   copy of a duplicated file.
3. Build/transpile step didn't run — the running artifact predates your source edit.
4. The code path is genuinely not executed (dead branch, feature flag off, cached response).

**Discriminating experiment.** Insert an unmissable probe at the top of the code path (a distinctive
log line or a changed response header/field), restart cleanly, hit the endpoint once. Probe absent →
causes 1–3: check which PID owns the port, kill *all* stale instances, restart once, retry. Probe
present but behavior unchanged → cause 4: the bug is not on this path; trace where the request
actually goes.

**Known wrong paths:** rewriting the fix repeatedly; concluding the framework/library is broken;
editing more places "to be sure" (violates change-one-variable).

### R3 — Works locally, fails deployed

**Ranked causes**
1. Config/environment divergence — env var missing or different in the deployed environment (URLs,
   secrets, feature flags, NODE_ENV-conditional behavior).
2. Data divergence — the deployed database lacks a migration, row, or seed the code assumes.
3. Build divergence — deployed artifact built from a different commit/branch, or with different build
   flags; case-sensitive filesystems breaking imports that worked on Windows/macOS.
4. Infrastructure in the path — proxy, TLS, CORS, or gateway behavior that does not exist locally.

**Discriminating experiment.** Diff the two environments on the axis the error suggests, starting with
"which commit is actually deployed" (deployment version endpoint or artifact metadata vs `git log -1`)
and "which env vars differ" (deployed config listing vs local `.env`, names only — never print secret
values). Same commit + same relevant config → move to data (run the failing query against the deployed
DB read-only) → then infrastructure (compare a raw curl from inside vs outside the deployed network).

**Known wrong paths:** debugging by redeploying variations ("deploy and pray"); patching code to
tolerate the divergence instead of fixing the divergence; copying the production database locally as a
first move.

### R4 — Frontend shows undefined/blank field

**Ranked causes**
1. The field never existed in the API response — the most common cross-layer bug. Frontend was written
   against an assumed shape, never verified.
2. Field exists but under a different name/casing/nesting than the consumer reads.
3. Field exists but is null/empty because the underlying data is missing (an R7 problem surfacing here).

**Discriminating experiment.** Grep both sides, then curl the endpoint:

```bash
grep -rn "fieldName" <api-src-dir>/          # producer: is it ever written?
grep -rn "fieldName" <client-src-dir>/       # consumer: what shape is expected?
curl -s http://127.0.0.1:<port>/<endpoint> -H "Authorization: Bearer <token>" | python -m json.tool
```

The curl output is the ground truth. Field absent from the response → cause 1 or 2: fix the producer or
the consumer's expectation, whichever violates the contract. Field present but null → cause 3: go to R7.

**Known wrong paths:** adding optional chaining or `?? ''` to suppress the crash without determining
which side is wrong (doctrine rule 4); "fixing" the type definition to make the compiler quiet while
the runtime shape is still wrong.

### R5 — Auth works in one client but not another

Two clients (browser vs curl, web vs mobile, two services) hit the same endpoint; one is authorized,
the other is rejected.

**Ranked causes**
1. The clients are not sending the same credential — different token, expired token, cookie present in
   one and not the other, or the header is dropped/renamed by a proxy on one path.
2. The clients authenticate as different principals with genuinely different permissions — a
   permission-model fact, not a bug.
3. The rejecting path enforces something the other doesn't (middleware applied to one route
   registration, CORS preflight failing before auth runs, case-sensitive header handling).
4. The allowlist/role mapping references a role or permission that no longer exists, so *no* principal
   on that path can ever pass (a data-integrity bug that presents as an auth bug).

**Discriminating experiment.** Capture the exact failing request from the failing client (devtools
"copy as cURL" or a proxy dump) and replay it verbatim from the working context. Replay fails
identically → the request itself is insufficient (causes 2–4): decode the token/session and compare
principal + claims against what the endpoint requires; if the required role matches nothing that can
exist, it is cause 4. Replay succeeds → the failing client is mutating or dropping the credential in
transit (cause 1): diff the two raw requests header by header.

**Known wrong paths:** granting the failing principal extra roles to make the error go away; disabling
the auth check "temporarily"; editing role mappings directly in the database instead of through the
change-controlled path.

### R6 — Test passes alone but fails in suite (or the suite is suspiciously fast)

**Ranked causes**
1. Shared mutable state — a previous test leaves database rows, module-level singletons, environment
   variables, or mocks behind.
2. Ordering/parallelism — the test implicitly depends on another test running first, or two tests race
   on the same resource.
3. Silent skips (the "suspiciously fast" variant) — setup probes a dependency (DB, service), finds it
   unreachable, and skips the suite; the run is green but proves nothing.

**Discriminating experiment.** For flakiness: run the failing test alone, then run only the minimal
pair (suspected polluter + victim) in suite order — if the pair reproduces, you have the polluter;
bisect the preceding tests if not. For suspicious speed: read the runner's summary line for
skipped/todo counts — a green run with a large skipped count is the finding; confirm the dependency is
reachable and re-run, then compare executed counts. `verification-doctrine` owns what executed-count
evidence a "tests pass" claim requires.

**Known wrong paths:** adding retries or sleeps; marking the test `.skip` to unblock; reordering tests
so the failure hides; citing "tests green" without executed counts.

### R7 — Database row looks wrong or missing

**Ranked causes**
1. You are querying the wrong database or the wrong environment's database (baseline check 3 — verify
   with `SELECT current_database(), inet_server_addr()` before anything else).
2. Your query's filter is wrong — wrong key, wrong casing, an implicit type coercion, or a JOIN that
   drops/duplicates rows.
3. The write failed silently — swallowed error, rolled-back transaction, or a conditional
   INSERT/UPDATE that matched zero rows and nobody checked the affected-row count.
4. Something else mutated or deleted the row after the write (a second writer, a cleanup job).

**Discriminating experiment.** Re-verify the target (cause 1), then query by the broadest possible key
(primary key only, no JOINs, no extra filters). Row present under the broad query but missing under
your original → cause 2: tighten filters back one at a time. Row genuinely absent → cause 3 or 4:
reproduce the write while watching logs and check the reported affected-row count; if the write
succeeds now, hunt the earlier failure or the second writer (created/updated timestamps and audit
tables discriminate 3 from 4). Live schema first: run the DB's describe-table command before making
any claim about columns or constraints — do not trust migration files or models alone.

**Known wrong paths:** "fixing" data by hand-editing rows before the cause is known (destroys the
evidence and violates the DB-change approval path); adding a COALESCE/default to make the symptom
invisible; re-running an import/migration on top of unknown state.

### R8 — Request hangs or times out

**Ranked causes**
1. A downstream dependency (database, cache, third-party API) is unreachable or slow, and the caller
   has no/long timeout — the request is waiting, not working.
2. Unbounded work — an unpaginated query, an N+1 query loop (each round-trip pays connection latency;
   10K rows × 1 query each = minutes), or an accidental full scan.
3. Resource exhaustion — connection-pool starvation or a deadlock; the first N requests work, later
   ones queue forever.

**Discriminating experiment.** Establish *where* time goes before touching code: hit the dependency
directly and independently (e.g. `psql ... -c "SELECT 1"`, curl the third-party API) — slow/failing →
cause 1. Dependency fast → enable query/request logging and reproduce once: one query per row in the
log is N+1, one huge slow query is unbounded work (cause 2); requests that hang only after several
succeed, with the pool at max, is cause 3. Query counting and EXPLAIN discipline:
`proof-and-analysis-toolkit`.

**Known wrong paths:** raising the timeout as the fix; adding indexes before confirming the problem is
per-query cost rather than query count; restarting the service (clears pool starvation temporarily and
destroys the evidence).

---

## Evidence capture

Diagnosis without a record is not reusable — and half-remembered attempts contaminate the next session.

1. **Before touching anything**, record the failing command and its full output verbatim (copy the
   real text, do not paraphrase). This is the reproduction you will re-run to prove the fix.
2. **Keep a short hypothesis log** as you go: cause tried → experiment run → observed result → verdict
   (confirmed / ruled out / inconclusive). Three lines per attempt is enough.
3. When a fix attempt fails, log it and **revert it** (doctrine rule 6) before the next attempt.
4. On resolution, the hypothesis log plus the discriminating observation feed `failure-archaeology` —
   that is where the incident story, wrong paths taken, and prevention notes are written up so the
   next debugger starts from this runbook instead of from zero.

A diagnosis is established only when you hold the discriminating observation itself — the log line,
SQL result, or response body that separates your cause from the alternatives. A fix is verified only
when the original recorded reproduction now behaves correctly end to end — the full bar lives in
`verification-doctrine`.
