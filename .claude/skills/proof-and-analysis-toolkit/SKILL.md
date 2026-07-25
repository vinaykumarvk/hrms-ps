---
name: proof-and-analysis-toolkit
description: "SQL and first-principles proof recipes: prove a claim about data or code before acting on it. Use before joining on an unproven key, trusting a COALESCE/LEFT JOIN result, reporting a performance number, asserting a value is valid input, or claiming code is registered/called/unused. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here."
allowed-tools: Read Bash Glob Grep
---

# Proof and Analysis Toolkit

Prove it, don't just assert it. The worst data and integration bugs are claims without
verification: phantom columns, non-unique join keys, silent fallbacks that make absent data look
present, and "should be fast" queries that are N+1 in disguise. This skill is a recipe book for
turning a claim into a proof — or a refutation — with one command or one query, before any code,
migration, or report depends on it.

Related generic skills: `verification-doctrine` defines what evidence a change requires;
`research-methodology` wraps these recipes in a hypothesis→experiment→adoption loop;
`debugging-playbook` is for triaging a live symptom. This skill owns the individual proof moves.

## The four-part recipe contract

Every proof must have all four parts. Do not run a recipe without them:

1. **Goal** — the exact claim being tested, stated falsifiably ("key K is unique in T", not
   "the join should be fine").
2. **Command/SQL** — copy-pasteable. If it cannot be re-run by someone else, it is not a proof.
3. **Expected output shape** — what the result looks like when the claim HOLDS and what it looks
   like when it FAILS. If you cannot describe the failure shape, you have not designed a test.
4. **Decision rule** — what you do next in each case. Never "looks fine, moving on".

A query that "returned rows" proves nothing by itself; only a query whose failure shape you
declared in advance can confirm or refute a claim.

## Predict-before-run discipline

Before executing any analytical query, batch job, import, or measurement, write the expected
number down. A prediction made after seeing the output is not a prediction.

| Field | Example |
|---|---|
| Claim under test | "orphaned order rows are rare — a handful of manual deletes" |
| Predicted number | < 50 |
| Command | `SELECT COUNT(*) FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE c.id IS NULL;` |
| Actual number | 4,812 |
| Reconciliation | ~100× miss → not manual deletes; systemic (an import path skips the FK) → fix the mechanism, then repair in one reviewed batch, not spot fixes |

The reconciliation row is the point. A large miss does not just correct the number — it changes
the **repair strategy**: a handful of anomalies get spot fixes; thousands sharing one mechanism
get one mechanical, reviewable repair. If actual ≈ predicted, you have earned limited trust in
your model of the data. If not, stop and explain the gap before acting on anything.

---

## Recipe 1 — Prove a join key is unique before joining on it

**Goal.** Falsify: "key K is unique in table T, so joining on K cannot fan out rows."

**SQL (portable):**

```sql
SELECT customer_id, region, COUNT(*) AS n
FROM customer_regions
GROUP BY customer_id, region
HAVING COUNT(*) > 1
ORDER BY n DESC;
```

Substitute your table and candidate key columns. Optionally aggregate the colliding values
(`string_agg` in Postgres, `GROUP_CONCAT` in MySQL/SQLite) to see what the duplicates are.

**Expected output shape.** Zero rows = the key is unique in current data. One or more rows =
each row is a fan-out group and `n` is the multiplication factor a join on that key would
produce (join two tables where the key repeats 6 times and one logical row becomes 6).

**The critical distinction: data-unique vs schema-guaranteed.** Zero rows only proves the key
*happens* to be unique today. Check whether a constraint *enforces* it — `\d <table>` in psql,
`SHOW INDEX FROM t` in MySQL, or the portable form:

```sql
SELECT * FROM information_schema.table_constraints
WHERE table_name = 'customer_regions'
  AND constraint_type IN ('PRIMARY KEY', 'UNIQUE');
```

**Decision rule.**
- 0 duplicate rows AND a unique constraint/index covers the key → join is safe; cite the
  constraint in your writeup.
- 0 duplicate rows but NO constraint → safe today, unguaranteed tomorrow. Say so explicitly;
  consider deduplicating defensively or proposing the missing constraint.
- ≥ 1 row → do NOT join raw. Either add the missing discriminator column to the join, or
  pre-deduplicate one side in a CTE with an explicit, deterministic winner rule
  (`DISTINCT ON (...) ... ORDER BY ...` in Postgres; `ROW_NUMBER() OVER (PARTITION BY ...)`
  portably).

---

## Recipe 2 — COALESCE / LEFT JOIN masking audit

**Goal.** Measure how often a query's fallback branch fires — because when it fires, missing
data is being silently synthesized. `COALESCE(a, b)` and `LEFT JOIN` make absence structurally
invisible: the query returns plausible rows either way.

**Method.** Split every load-bearing fallback into counted branches instead of trusting the
merged output. Postgres:

```sql
SELECT COUNT(*) FILTER (WHERE t.assignee_id IS NOT NULL)                          AS via_direct,
       COUNT(*) FILTER (WHERE t.assignee_id IS NULL AND g.default_assignee_id IS NOT NULL) AS via_group_default,
       COUNT(*) FILTER (WHERE t.assignee_id IS NULL AND g.default_assignee_id IS NULL)     AS neither
FROM tasks t
LEFT JOIN task_groups g ON g.id = t.group_id;
```

Portable equivalent of `COUNT(*) FILTER (WHERE p)` is `SUM(CASE WHEN p THEN 1 ELSE 0 END)`.
For LEFT JOINs generally: `COUNT(*) FILTER (WHERE right_side.pk IS NULL)` per joined table
counts the rows the join failed to match.

**Expected output shape.** One count per branch, including the hidden **`neither` bucket** —
the rows where every fallback missed. The merged `COALESCE(t.assignee_id,
g.default_assignee_id)` query shows only the blended result and hides that bucket entirely.

**Decision rule.**
- `neither` = 0 and fallback rate is small → the fallback is genuinely defensive; note the
  measured rate and move on.
- `neither` > 0 → every one of those rows is a data-absence event the query hides. Enumerate
  them, classify by mechanism (Recipe: predict-before-run), and decide deliberately: repair the
  data through your change-control path, make the fallback explicit and logged, or convert to
  INNER JOIN so absence fails loudly.
- High fallback-hit rate (branch 2 dominating) → the "fallback" is really the primary path;
  the schema or write path is lying about intent. Report it; do not paper over it.

---

## Recipe 3 — N+1 detection by query count, not profiling

**Goal.** Falsify: "this action issues a bounded number of queries." Judge plans with EXPLAIN;
judge chattiness by query COUNT. A loop of 10,000 tiny queries is dominated by 10,000 round
trips and is minutes-slow even when every individual EXPLAIN looks instant — per-query
profiling cannot see it.

**Method.**
1. Predict the query count for one user action (predict-before-run: a well-batched list
   endpoint is O(1)–O(5) statements regardless of row count).
2. Turn on statement logging for the window of one action. Options, most portable first:
   - your app's query-logging flag, if the DB layer has one (most ORMs and pool wrappers do);
   - Postgres: `SET log_statement = 'all'` for the session, or `log_min_duration_statement = 0`
     locally, then read the server log;
   - MySQL: `SET GLOBAL general_log = 'ON'` locally.
3. Exercise the action exactly once, then count:

```bash
grep -c "executed query" app.log        # or the marker your logger emits
```

**Expected output shape.** Claim holds: a small constant number of statements, unchanged when
the underlying row count grows. Claim fails: query count scales with row count — 1 action over
1,000 rows produces ~1,000 near-identical statements differing only in an id.

**Decision rule.** Count scales with rows = N+1. Fix by batching: a single query with
`IN (...)`/join, a bulk insert, or `COPY`/bulk-load for imports. Then re-run the count and
report both numbers. Constant count ≈ prediction → record it and move on.

---

## Recipe 4 — Prove index use and measure sizes before claiming "fast"

**Goal.** Replace "should be fast" and "the index covers it" with a read plan and a measured
number.

**Command.** `EXPLAIN` is standard-ish across engines; `EXPLAIN ANALYZE` (which actually runs
the query and reports real timings and row counts) is Postgres/MySQL-8+ syntax:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 42 AND status = 'OPEN';
```

Postgres extras: `EXPLAIN (ANALYZE, BUFFERS)` adds I/O counts. Caveat: server-side plan timings
are trustworthy, but end-to-end latency also includes client/proxy round trips — that is why
N+1 (Recipe 3) is judged by count, not by plans.

**Expected output shape.** Claim holds: an index scan node naming the index you expected, and
`actual rows` close to the planner's estimate. Claim fails: a sequential/full scan, a different
index than assumed, or `actual rows` orders of magnitude off the estimate (stale statistics or
a wrong mental model of the data).

**Also measure, never assume, result sizes:**

```sql
SELECT COUNT(*) FROM orders WHERE status = 'OPEN';   -- before "SELECT *" it into memory
```

Predict the count first. "The result set is small" is a claim; a rowcount is a proof.

**Decision rule.**
- Expected index used, timings acceptable at realistic data volume → record the plan output
  (or its artifact path) alongside the claim.
- Full scan or wrong index → do not ship the "it's fast" claim. Fix the query/index, or state
  the measured cost honestly.
- Estimates wildly off actuals → refresh statistics (`ANALYZE` in Postgres) and re-plan before
  trusting any conclusion; a plan built on stale stats proves nothing.

---

## Recipe 5 — Prove a value is valid input before feeding it to a system

**Goal.** Falsify: "value X is a valid input for system Y." Applies to status strings, state
IDs, enum members, foreign keys, routing keys — anything a downstream constraint can reject at
runtime after your code has already claimed success.

**Method.** Two steps, in order: **find the constraint, then test the value against it
directly.** Never validate against memory or documentation alone — read the live definition.

Step 1 — locate the actual gatekeeper. It is one of:
- a `CHECK` constraint or enum type: `SELECT pg_get_constraintdef(oid) FROM pg_constraint
  WHERE conname = 'chk_task_status';` (Postgres) or
  `information_schema.check_constraints` (portable);
- a foreign key: does the value exist in the referenced table? `SELECT 1 FROM statuses WHERE
  id = 'ARCHIVED';`
- validation code: grep the codebase for the field's validator/schema (zod, joi, serializer,
  `ALLOWED_STATUSES` list) and read the accepted set.

Step 2 — test the candidate value read-only, without writing anything. For a CHECK-style rule,
evaluate the same predicate as a SELECT:

```sql
SELECT 'ARCHIVED' IN ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED')
       OR 'ARCHIVED' LIKE 'WAITING_%' AS valid;
```

For an FK, the existence query above IS the test. For code-side validation, run the validator
in a REPL/one-liner or find its unit tests.

**Expected output shape.** `valid = true/false`, or the FK row exists / does not. Beware
near-misses: case differences, whitespace, and prefix rules (`PENDING_X` valid, bare `X` not)
are the classic failure shapes.

**Decision rule.**
- Valid → cite the constraint definition you read (with the command), not "I checked".
- Invalid → fix the value at its source. Do NOT loosen the constraint to admit the value —
  the constraint is usually encoding an invariant other code relies on. If the invalid value
  is already persisted upstream (config, queue, import), that is a data-repair work item, not
  an inline patch.
- Multiple gatekeepers disagree (validator accepts what the DB rejects) → that mismatch is
  itself a defect; report both definitions side by side.

---

## Recipe 6 — Grep-proofs: proving claims about code

**Goal.** The same contract applied to code instead of data. Typical claims: "handler X is
registered", "function F is unused", "both sides of this interface agree on the field name".
Each gets a falsifiable search whose empty and non-empty result shapes both mean something.

**"X is registered / actually called."** Search for the registration site AND the call site
separately; finding the definition alone proves nothing:

```bash
grep -rn "registerHandler(.*OrderCreated" src/     # registration
grep -rn "emit(.*OrderCreated" src/                 # producer side
```

Expected shape: at least one hit on each side. Decision rule: definition present but zero
registrations/callers → the claim "it runs" is refuted; the code is dead or wiring is missing.

**"F is unused" (before deleting).** Count call sites, excluding the definition:

```bash
grep -rn "formatLegacyId" src/ tests/ | grep -v "function formatLegacyId"
```

Expected shape: zero hits supports deletion — but only after also checking dynamic access
patterns (string-built names, reflection, DI containers, route tables, serialized configs) that
grep cannot see; name them explicitly in the proof. Any hit → not unused; the claim is refuted
by that line, cite it.

**"Both sides of the interface agree."** Extract the field name from each side and compare —
do not eyeball two files:

```bash
grep -n "customerId\|customer_id" src/api/orders-controller.ts src/client/orders-api.ts
```

Expected shape: both sides use the same spelling/casing for the same wire field. Failure shape:
one side reads `customer_id`, the other writes `customerId` — a bug that type checks and unit
tests on each side individually will not catch. Decision rule: any mismatch is a live defect;
trace which side matches the actual wire format (contract file, recorded payload) before fixing.

**General rules for grep-proofs.**
- A negative grep is only evidence if the pattern is proven able to match: first run it against
  a known occurrence, then against the target scope.
- State the search scope (directories, file globs) in the proof; "grepped the repo" with an
  unstated scope that skipped `packages/` is how false "unused" claims happen.
- Counting matters: "called from 47 sites" vs "called from 1 site" changes whether you refactor
  in place or behind a wrapper.

---

## Evidence standards

A claim produced by this skill counts as proven only when it ships with ALL of:

- [ ] The exact command/SQL, copy-pasteable.
- [ ] The database/dataset/codebase state it ran against (which env, which commit) and the date.
- [ ] The raw output or an artifact path — not a paraphrase.
- [ ] The prediction made before running, and the reconciliation.
- [ ] The decision rule applied and the branch taken.
- [ ] For schema claims: a live constraint/index read in the same session — "I remember the
      schema" is not a read.

"The query returned rows so the join is fine", "EXPLAIN looked OK", and "it worked on my data"
all fail this bar. Recipes here are read-only by design: anything a proof reveals gets fixed
through the project's normal change-control path, never patched inline from an analysis session.
