---
name: verification-doctrine
description: Authoring-time evidence discipline for any agent writing code, specs, reports, reviews, or summaries — how to ground every claim (measured vs. assumed, executed test counts, live schema reads, decaying line references, provenance footers) before the artifact leaves your hands. Load it whenever you are about to claim something is done, tested, deployed, registered, or valid, or before writing a durable document that cites facts about a codebase. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
---

# Verification Doctrine

Claims-without-verification is the dominant failure mode in AI-assisted pipelines: spec writers naming columns that do not exist, coding agents assuming a join key is unique, reports declaring "tests green" when every test silently skipped. This skill is the authoring-time discipline — the rules a writer applies to their own claims *before* an artifact ships, so that every statement in it is either backed by evidence produced in-session or explicitly labeled as an assumption. It is not a review pass: `quality-review` and `sanity-check` audit finished work; this skill governs how you produce work that survives them.

## When to use this skill

- You are about to write "done", "tested", "passing", "deployed", "fixed", or "verified" anywhere.
- You are writing a spec, LLD, report, review, or summary that states facts about code, schema, config, or behaviour.
- You are writing a durable document (skill, runbook, architecture note) that cites file paths, line numbers, counts, or thresholds.
- A test run finished suspiciously fast, or you are interpreting any "green" result.
- You are about to cite a number (latency, size, count, coverage) anywhere.

Related skills: `quality-review` and `sanity-check` (review-time audits that consume the evidence this skill produces); `claims-discipline` (phrasing and labeling of claims); `proof-and-analysis-toolkit` (recipes for proving specific claims); `research-methodology` (experiment-grade rigor); `debugging-playbook` (hypothesis discipline during triage); `failure-archaeology` (recording incidents with verified citations).

## Rule 1 — Measured vs. assumed: label every claim

Every factual statement in an artifact must let the reader tell which of these it is:

| Class | Meaning | How to mark it |
|---|---|---|
| **Measured** | You ran a command in this session and are quoting its output | State the command and quote the output |
| **Verified** | You read the live source of truth (file, schema, config) in this session | Name what you read and when |
| **Inferred** | You concluded it from measured/verified facts | Say "inferred from X" |
| **Assumed** | You believe it but did not check | Label it `ASSUMED` or `UNVERIFIED` — never phrase it as fact |

Decision rule: if you cannot name the command or the read that backs a sentence, the sentence gets an `ASSUMED`/`UNVERIFIED` tag or gets deleted. A report where everything reads as fact but half was assumed is worse than a shorter report with honest labels — the reader cannot re-derive which half to trust.

## Rule 2 — Green ≠ ran: report executed counts, never exit codes

A process exiting 0 proves the process exited 0. It does not prove tests executed.

- **Always quote the runner's summary line**: `Tests: 312 passed | 41 skipped (353)`. The counts are the evidence; "tests green" is not.
- **Silent-skip suites**: DB-backed or environment-gated suites commonly probe their dependency in setup and skip every test when it is unreachable — the run still exits 0. A fast green run with `skipped > 0` on a suite that needs a database usually means "the database was never reached", not "intentionally skipped". Explain every nonzero skip count.
- **Fail-hard flag pattern**: give every environment-gated suite a flag (e.g. `RUN_DB_TESTS=true`) that converts "dependency unreachable → skip" into "dependency unreachable → fail". When a green run must *prove* the DB-backed tests executed, run with the flag set and quote the counts. If the project lacks such a flag, propose one — it is a one-line change in the setup probe.

```bash
# Evidence is the printed counts, with every skip explained:
RUN_DB_TESTS=true npm test 2>&1 | grep -E "Tests|Test Files"
```

- Distinguish what a suite can prove: a unit suite running in a node environment proves logic, not rendering; a typecheck proves types, not behaviour; a bundler build proves bundling, not types (esbuild strips types unchecked). Say which property your green result actually establishes.

## Rule 3 — Schema claims need a live read

Any statement of the form "table X has column Y", "the constraint allows Z", "the index covers (a, b)" requires reading the live schema in the same session:

```bash
psql "$DATABASE_URL" -c "\d orders"
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'"
psql "$DATABASE_URL" -c "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'chk_order_status'"
```

(Use the equivalent for your database: `SHOW CREATE TABLE`, `.schema`, migration state tooling.)

- Data-model docs, migration files, and ORM definitions are maps, not territory — they drift. They are fine for orientation; they are not evidence for a claim you write into a spec, LLD, or report.
- Memory is never evidence. A table name recalled from an earlier session is a hypothesis.
- If the database is unreachable, write `UNVERIFIED — schema not reachable for orders` instead of the claim. Never guess and phrase it as fact: phantom columns and wrong table names cost whole implementation cycles when a downstream agent builds on them.
- The same rule applies to schema-like registries: error-code lists, role tables, feature-flag catalogs, route inventories. Read the registry, don't recall it.

## Rule 4 — Line references decay: re-grep before citing

A `file:line` reference is a snapshot that silently rots as the file is edited. Before writing any `src/api/app.ts:337`-style citation into a durable artifact (spec, review, skill, runbook):

```bash
grep -n "registerAuthMiddleware" src/api/app.ts   # confirm the symbol is still at that line
```

- Re-verify in the *current* session, even if you verified it last week.
- Prefer symbol-anchored citations over bare line numbers: "`registerAuthMiddleware` call in `src/api/app.ts` (line 757 as of this writing)" survives drift better and tells the next reader how to re-find it.
- The same decay applies to commit hashes (`git log --oneline -1 <hash>`), file paths (`ls <path>`), and counts ("49 route modules") — anything that a future edit can invalidate. If a fact is volatile, either re-verify it now or route it through the volatile-facts table (Rule 7).
- Never propagate a citation you did not re-check, even if it comes from an otherwise trustworthy document — copying a stale reference launders it into a fresh-looking one.

## Rule 5 — The insufficient-evidence list

Never accept these — from yourself or from another agent — as proof:

- **"It compiles" / "the build passed"** — bundler builds do not type-check; compilation proves syntax, not behaviour.
- **"Tests are green"** without the `N passed | M skipped` summary line — see Rule 2.
- **"Typecheck passed"** presented as proof of runtime behaviour — it proves types only.
- **Any number** (latency, throughput, size, coverage, count) not measured in this session with the command shown.
- **Any schema claim** without a live read — see Rule 3.
- **"Should work"** for a flow that was never exercised — either walk it with real data and say what you observed, or state explicitly that it could not be exercised and why.
- **A green check run under a bypass flag** (`--allow-diff`, loosened budget env var, skipped gate) without the flag disclosed alongside the result.
- **Unit tests in a non-DOM environment** presented as proof of rendering or UX behaviour.
- **A doc, comment, or earlier report** cited as proof of current state — those are claims, not evidence.

When you receive one of these from an upstream agent, treat it as `UNVERIFIED` and either re-derive the evidence or carry the label forward.

## Rule 6 — Evidence vocabulary: define words so weaker evidence can't satisfy them

Status words in reports drift toward optimism unless each is pinned to a minimum evidence bar. Use these definitions (and add project-specific ones in the same style):

| Word | Means, exactly | Minimum evidence |
|---|---|---|
| **registered** | the wiring call exists and is reachable | grep the registration site (e.g. `grep -n "registerOrderRoutes" src/api/app.ts`), not "the file exists" |
| **valid** | passes the enforcing constraint/validator | the constraint definition read live + the value checked against it, not "the editor/UI accepted it" |
| **deployed** | serving in the target runtime | a runtime probe of the deployed instance (health endpoint, version endpoint, live request), not "the pipeline succeeded" |
| **tested** | executed tests exercised the change | summary counts quoted, skips explained (Rule 2) |
| **fixed** | mechanism repaired and validated | the fix artifact named (commit/migration/config) plus the validation that proved it |
| **migrated** | applied to the target database | migration-runner output or a live schema read showing the new state |
| **covered** | measured by a coverage tool | the coverage report figure with the threshold it met |
| **verified** | you checked it yourself, this session | the command or read, named |

Decision rule: if a sentence uses one of these words and the artifact does not contain (or link) the matching evidence, downgrade the word — "written but registration not confirmed", "publishes but validity not constraint-checked".

## Rule 7 — Provenance + volatile-facts footer for durable documents

Any durable artifact that states facts about a codebase — a skill, runbook, architecture note, long-lived design doc — must carry a footer that lets a future reader judge freshness and re-verify cheaply:

```markdown
## Provenance and maintenance

Based on direct inspection of the repo at commit `<hash>` (<branch>) on <date>.
Primary evidence: <the files read, commands run, and live reads performed —
e.g. src/api/app.ts, package.json scripts, `\d orders` against the dev DB>.
Corrections made to earlier notes: <anything you found stale and fixed>.

### Volatile facts — re-verify before relying on them

| Fact (as of <date>) | Re-verify with |
|---|---|
| 49 route modules in src/api/routes/ | `ls src/api/routes/*.routes.ts \| wc -l` |
| `registerAuthMiddleware` called at src/api/app.ts:757 | `grep -n "registerAuthMiddleware" src/api/app.ts` |
| Coverage thresholds 60/65/60/55 | `grep -A 6 "thresholds" vitest.config.ts` |
| `orders.status` CHECK constraint definition | `psql "$DATABASE_URL" -c "\d orders"` |

Facts verified: <date>
```

Rules for the table:

- Every count, line number, threshold value, "file X is absent", and "flag defaults to Y" belongs in it — anything one commit could invalidate.
- Each row pairs the fact with a **single runnable command** that re-verifies it. If you cannot write the command, the fact is not verifiable enough to state.
- When updating the document, re-run the table, correct what drifted, and note corrections in the provenance paragraph — stale claims you silently keep are claims you just made.

## Rule 8 — Measure, don't eyeball; budgets ≠ benchmarks

- Never claim a performance, size, or health property you did not measure with a tool in this session. "Feels fast", "looks small", "seems fine" are not findings. Paste the measured output (the load-harness JSON, the bundle-report lines, the `EXPLAIN ANALYZE` output) with the command and the environment knobs used.
- **A threshold is not a result.** "The p95 budget is 350 ms" says nothing about your change; "p95 measured 212 ms against a 350 ms budget" is a result. Always report the measured value *and* the budget it was compared to.
- **A pass under a loosened budget is not a pass.** If any threshold was overridden via env var, CLI flag, or config edit, disclose the override next to the result and treat the outcome as provisional. Raising a budget to go green is a change to the contract, not evidence about the code — route it through whatever change-approval path the project has.
- Watch for defaults diverging between environments (a local floor looser than CI's): a local pass near the boundary predicts a CI failure. Report which environment's thresholds you measured against.
- Round-trip latency through proxies/tunnels inflates wall-clock feel; use server-side measurements (`EXPLAIN ANALYZE`, in-process harnesses, slow-query logs), not your perception of responsiveness.

## Quick reference — claim type → minimum evidence

| You want to claim… | Minimum evidence to produce first |
|---|---|
| "The tests pass" | Runner summary counts quoted; skips explained; fail-hard flag if the suite is environment-gated |
| "Table `orders` has column `status`" | Live `\d orders` / `information_schema` read in this session |
| "The route/handler/hook is registered" | grep of the registration site, output shown |
| "The config value is X" | Read of the live config file (or env) in this session, not a doc |
| "The endpoint returns shape Y" | An actual request against a running instance, response quoted — or the handler + schema read live, labeled *inferred* |
| "The flow works end-to-end" | You walked it with real data and state what you observed at each step |
| "p95 is under budget" | Measured value + budget value + environment + any overrides |
| "The bundle is within budget" | Report lines from a fresh build, not a stale `dist/` |
| "The bug is fixed" | The fix artifact named + a reproduction that failed before and passes now |
| "The migration applied" | Runner output or a live schema read showing the new state |
| "Code X is dead / unused" | grep for every caller/importer, zero matches shown — absence claims need exhaustive search, say what you searched |

## Report evidence block — the shape of a grounded claim

When writing results into a report or summary, use this shape rather than prose assertions:

```markdown
### Claim: authz suite executed and passed
- Command: `RUN_DB_TESTS=true npm --workspace api run test:authz`
- Result: `Tests  84 passed | 0 skipped (84)` (this session)
- Compared against: 0 failures required; 0 skips expected with DB reachable
- Artifact: terminal output above; coverage at `coverage/index.html`

### Claim: `orders.status` accepts the new `ON_HOLD` value — ASSUMED
- Basis: migration file `012_add_on_hold.sql` exists in the branch
- Not verified: migration not yet applied to a live DB in this session
- To verify: `psql "$DATABASE_URL" -c "\d orders"` after `npm run migrate`
```

The second entry is the important one: assumptions are allowed in a report — unlabeled assumptions are not. Giving the reader the verification command converts an assumption into a one-command check instead of an ambush.

## Pre-ship checklist

Before any artifact (report, spec, summary, review, skill) leaves your hands:

- [ ] Every claim is measured, verified, inferred-with-source, or explicitly labeled `ASSUMED`/`UNVERIFIED` (Rule 1).
- [ ] Every test result quotes executed counts; every nonzero skip count is explained; fail-hard flags used where a green run must prove execution (Rule 2).
- [ ] Every schema/registry claim traces to a live read in this session (Rule 3).
- [ ] Every `file:line`, hash, path, and count was re-verified in this session (Rule 4).
- [ ] Nothing on the insufficient-evidence list is presented — or relied on — as proof (Rule 5).
- [ ] Status words (registered/valid/deployed/tested/fixed) meet their evidence bar or are downgraded (Rule 6).
- [ ] Durable documents carry a provenance footer and volatile-facts table with re-verification commands (Rule 7).
- [ ] Every number is a measurement with its command; every budget comparison reports value + threshold + any override (Rule 8).
- [ ] Anything that could not be verified says so, with the reason and the command a reader could run to close the gap.

A claim in this skill's area counts as proven when it names (a) the exact command or read, (b) the output or counts from *this* session, (c) the threshold or expectation it was compared against, and (d) where a reader can look to re-check. Anything less is an assumption — label it as one.
