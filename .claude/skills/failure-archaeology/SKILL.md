---
name: failure-archaeology
description: Maintain a durable per-repo failure record — incident entries (symptom, wrong paths tried first, mechanism-level root cause, verified evidence, status, what not to repeat), a dead-weight register of intentionally inert or known-broken artifacts, and named meta-patterns when a failure class recurs. Load it when a costly bug closes, when a wrong fix shipped, before deleting or resurrecting anything old, or at the start of debugging to check whether a symptom has been seen before. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
---

# Failure Archaeology

Repositories accumulate two kinds of expensive amnesia: incidents whose hard-won root causes evaporate when the session ends, and "dead" artifacts whose reason-for-existing nobody remembers until deleting them causes a regression. This skill is the practice of keeping a durable, per-repo failure record that fixes both — full incident entries with the wrong paths preserved, and a register of everything that looks deletable but isn't. It records history; it does not change process. `cross-feature-learning` turns merged-feature evidence into reviewable process amendments; this record is the raw material such learning draws from, and the place a named recurring pattern lives until someone builds a mechanical guard for it.

## When to use this skill

- A bug just cost more than ~30 minutes of investigation — write the entry while the wrong paths are still fresh.
- A wrong-path fix shipped (the fix was later reverted, superseded, or found to mask the real cause).
- A regression appeared — something that worked stopped working after an unrelated-looking change.
- An environment or tooling failure recurred (flaky setup, drifted config, a build that only fails on one OS).
- You are about to delete, "clean up", or resurrect old code, tests, branches, or scripts — check the dead-weight register first.
- You are starting to debug a symptom — check whether it has been seen before, *before* forming hypotheses (`debugging-playbook` covers the triage itself).
- The same failure class has now appeared twice — name it as a meta-pattern.

## Where the record lives

Detect the existing location before creating one. In order:

1. A repository-scoped project skill (e.g. `<project>-failure-archaeology` in `.claude/skills/`) — if present, it is the record; extend it, do not start a parallel file.
2. An existing `docs/failure-archaeology.md`, `docs/incidents.md`, `docs/process-learnings/`, or similar — grep for "root cause", "incident", "post-mortem" under `docs/` before assuming none exists.
3. Otherwise create `docs/failure-archaeology.md` with three sections: **Incident index**, **Incident entries**, **Dead-weight register** (meta-patterns are incident entries with a `Meta-pattern:` prefix).

One record per repo. Long evidence (query outputs, review docs) belongs in `docs/reviews/` or the project's evidence location; the entry cites it by path.

Keep an index table at the top of the record so a debugger can scan it in seconds; the full entries follow below it:

```markdown
| # | Name | Date | Anchor | Status |
|---|---|---|---|---|
| 1 | Export job silently produced empty CSVs | 2026-03-14 | a1b2c3d | fixed |
| 2 | Meta-pattern: claims without verification | ongoing | — | open |
```

## What does not need an entry

Recording everything devalues the record. Skip the entry when:

- The bug cost under ~30 minutes, taught nothing transferable, and left no artifact behind (no benched code, no guard, no residue). A typo fixed in one pass is not an incident.
- The failure is already covered by an existing entry — link the recurrence to that entry (and consider whether two-plus instances now name a meta-pattern) instead of duplicating it.
- The lesson is purely process-level with no repo-specific story — that is `cross-feature-learning` material, not archaeology.

When in doubt, the tiebreaker is: *would the next debugger, hitting this symptom cold, save real time by finding this entry?* If yes, write it.

## Incident entry template

```markdown
### <ID>. <Short name> (<date>, <anchor commit if any>)
- **Symptom:** what was actually observed — the user-visible or operator-visible behaviour, not the diagnosis.
- **Attempted fixes:** the wrong paths taken FIRST, in order, with why each looked plausible.
  These are the most valuable lines in the entry — they are what the next person will try.
- **Root cause:** the verified MECHANISM ("the effect cleanup cancelled the in-flight request"),
  never a correlation ("it broke after the refactor") or a vibe ("the framework was flaky").
- **Evidence:** commands run and their key output, file paths, `file:line` or symbol anchors,
  commit hashes, evidence-doc paths — each re-verified in-session before being written here.
- **Status:** fixed @ <commit> / mitigated (<how, what residue remains>) / open.
- **What not to repeat:** one or two imperative sentences.
```

Rules for a good entry:

- **Wrong paths first.** An entry that records only the final fix teaches almost nothing; the attempted fixes are the map of where the next debugger will waste time. If the first plausible story turned out wrong, say so explicitly.
- **Mechanism, not correlation.** If you cannot state the causal chain, the status is `open` and the root-cause line says what is still unproven. "Restarting fixed it" is a symptom of an open entry, not a root cause.
- **Evidence is re-verified, not remembered.** Before a hash, path, or count goes into the entry, check it in the current session (`git log --oneline -1 <hash>`, `ls <path>`, re-run the grep). `verification-doctrine` defines the full discipline; entries here must meet it, because future sessions will cite them as fact.
- **"Fixed" names the fix artifact** (commit, migration, hook, guard) *and* how it was validated (test, detector run, review doc). A fix nobody validated is `mitigated` at best.

## Worked example (invented — neutral names)

```markdown
### 7. Export job silently produced empty CSVs (2026-03-14, fixed @ a1b2c3d)
- **Symptom:** nightly `report-export` job completed "successfully" but the uploaded CSVs
  contained only headers. Noticed by a consumer team three days later.
- **Attempted fixes:** (1) suspected the upload step and re-ran it — same result, so upload was
  exonerated; (2) suspected a permissions change on the reporting DB user — `\du` showed grants
  intact; both paths looked plausible because the job's own log said "export OK, 0 errors".
- **Root cause:** the query builder in `services/export/query.ts` began joining on
  `accounts.region_id` after a schema rename; the column no longer existed, the driver's
  per-row error was caught by a broad `catch` that logged at debug level and yielded an empty
  result set. Mechanism: swallowed per-row error + success defined as "no uncaught exception".
- **Evidence:** `git log --oneline -1 a1b2c3d` (verified this session);
  `services/export/query.ts` (`buildRegionJoin`, ~line 88 as of this writing);
  debug log excerpt in docs/reviews/export-empty-csv-2026-03-14.md.
- **Status:** fixed @ a1b2c3d — join corrected, catch narrowed, and the job now fails when
  row count is zero for a non-empty source table (validated by the regression test in
  services/export/query.test.ts).
- **What not to repeat:** never define job success as "no exception thrown"; assert on output
  shape. Never log-and-continue on per-row driver errors.
```

## Dead-weight register

A catalog of artifacts that exist in the repo but are intentionally inert, known-broken, or deprecated-but-present: skipped test suites, disabled hooks, stale branches, scripts that no longer run, config keys nothing reads, feature-flagged code for a cancelled feature. Each row records **why it is still there** and **what must be read before deleting or resurrecting it**.

```markdown
| Item | Location | State (verified <date>) | Why it's still here | Before touching, read |
|---|---|---|---|---|
| Skipped legacy suite | services/billing/legacy.test.ts | wholly `describe.skip` | asserts deprecated API shapes; kept as migration reference | incident #4; the v2 migration note |
| Stale branch | origin/feat/bulk-import | last commit <date> | contains an unmerged schema experiment | its final commit message; incident #9 |
```

**Rule: before any cleanup that touches a registered item, read its entry.** Deleting unregistered old code still requires normal care (search for references, check history), but deleting a *registered* item without reading its row is a process violation — the row exists precisely because someone already learned why naive deletion is unsafe. The inverse holds too: do not resurrect a skipped suite or dead script without reading why it was benched; several of the most expensive regressions come from re-enabling something that was disabled for a reason.

When you deliberately bench something (skip a suite, park a branch, disable a hook), register it in the same change. An unregistered corpse is a trap for the next cleaner.

## Meta-pattern tracking

When the same failure *class* appears in two or more incidents, promote it: add a `Meta-pattern:` entry that names the pattern and links the instances.

```markdown
### Meta-pattern: claims without verification (ongoing)
- **Pattern:** artifacts assert that a column/helper/route/config key exists without reading
  the live source of truth; the failure surfaces downstream, far from the false claim.
- **Instances:** incident #3 (phantom column in spec), #7 (join on renamed column),
  #11 (route path recalled from memory).
- **Status:** open — behavioural; mitigated by per-claim verification, not yet enforced.
- **Candidate enforcement:** pre-write schema-read check; see hand-off below.
```

Naming matters: a named pattern ("stale process debugging", "green ≠ ran", "claims without verification") is searchable, citable in reviews, and — critically — a candidate for **mechanical enforcement**. This record only *names and links*; building the guard is someone else's job:

- Hand process-level fixes (a new checklist item, an amended skill, a gate change) to `cross-feature-learning`, which drafts them as reviewable amendments with the incidents as evidence.
- Hand "is this pattern real and what mechanism would catch it" investigations to `research-methodology`-grade analysis before proposing a hook — a guard built on a misdiagnosed pattern blocks legitimate work.
- A meta-pattern with a shipped guard gets its status updated to `mitigated (<guard>)`, not deleted — the history explains why the guard exists.

## Retrieval discipline

The record is only worth its maintenance cost if it is consulted at the two moments it pays off:

1. **At the start of debugging.** Before forming hypotheses, search the record for the symptom, the error string, and the subsystem. A match converts hours of rediscovery into minutes of re-verification. If `debugging-playbook` triage is in play, this lookup is its step zero.
2. **Before deleting anything old.** Branches, skipped tests, unused-looking scripts, "dead" code: check the dead-weight register first, then repo history. Absence from the register is not proof of safety — it is merely absence of a known trap.

Secondary retrieval moments: writing a review or post-mortem that cites a past incident (cite the entry, with its evidence re-verified), and onboarding into an unfamiliar subsystem (its incidents are the fastest map of where it bites).

## Hygiene

- **Append-mostly.** New incidents and register rows are appended. Do not reorder, renumber, or prune old entries to tidy the file — stable IDs are what reviews and other skills cite.
- **Corrections annotate, never rewrite.** When a recorded fact goes stale ("4 tests failing" later passes), add a dated correction line to the entry ("verified <date>: now passes 18/18 — earlier claim is stale") rather than editing history. The original claim plus its correction teaches more than a silently-updated truth.
- **Every entry and every register row is dated**, and status changes carry their own dates. An undated fact cannot be judged for staleness.
- **Evidence decays.** Line numbers drift, branches get deleted, files move. Before citing any evidence path, hash, or count *from* this record in new work, re-verify it in the current session — never propagate a citation you did not re-check; copying a stale reference launders it into a fresh-looking one (`verification-doctrine`, Rule 4).
- **Keep entries proportionate.** A 10-line entry that names the mechanism beats a 100-line narrative. Long analysis belongs in a dated evidence doc; the entry links to it.

## Relationship to sibling skills

| Skill | Division of labour |
|---|---|
| `cross-feature-learning` | Consumes this record's incidents and meta-patterns as evidence; produces process amendments. This skill never edits process itself. |
| `debugging-playbook` | Live triage discipline; consults this record at step zero and feeds closed investigations back as entries. |
| `verification-doctrine` | Defines the evidence bar every entry must meet before its citations count as fact. |
| `research-methodology` | Experiment-grade rigor for validating a suspected meta-pattern before proposing mechanical enforcement. |
