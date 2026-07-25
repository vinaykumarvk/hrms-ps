---
name: code-cleanup
description: "Unified cleanup skill with three scopes — diff (recently changed code: duplication, dead code, complexity, consistency), feature (post-feature structure review and service-layer extraction), repo (periodic whole-repo sweep of junk files, dead code, and stale artifacts). Trigger on 'clean up the code', 'simplify this', 'restructure after the feature', 'sweep the codebase', and similar phrasings. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here."
argument-hint: "[diff|feature|repo] [path]"
user_invocable: true
allowed-tools: Read Grep Edit Write Bash Glob Agent
---

# Code Cleanup

One skill, three scopes. Pick the scope from the argument; if none is given, infer it from what the user said, defaulting to `diff`.

## Scope selection

| User said something like | Scope |
|---|---|
| "clean up the code", "simplify this", "deduplicate", "remove dead code", "polish before committing", "quick quality pass" | `diff` (default) |
| "restructure after the feature", "we just shipped X, clean up its structure", "extract a service layer", "the feature left scattered logic" | `feature` |
| "sweep the codebase", "the repo feels bloated", "remove junk files", "prune abandoned experiments", "declutter before release", periodic maintenance | `repo` |

An optional `[path]` narrows any scope to that file or directory. Never act outside the given path.

**This skill is quality-only — it does not hunt for bugs.** Use `code-review` for correctness review and `full-review` for security, accessibility, infrastructure, or BRD-compliance review. Cleanup here must never change external behaviour.

## Shared operating rules (all scopes)

1. **Surgical changes only.** Every edit or deletion must trace to a specific finding. Do not improve adjacent code, comments, formatting, or architecture that is messy but out of scope — mention it in the report, don't touch it.
2. **Never touch unrelated code.** Remove only imports/variables/functions that *this cleanup* made unused (in `diff`/`feature`) or that the sweep procedure explicitly approved (in `repo`).
3. **Dead-code detection, once for all scopes.** A symbol or file is a dead-code *candidate* when it has zero static references: no import/require, no call site, no export consumed elsewhere. Confirm with tooling (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, linters) plus a string search (`git grep -F`) for the name — including config files, YAML/JSON, env files, shell scripts, Dockerfiles, and CI workflows. A candidate is NOT dead if it is:
   - referenced dynamically (`importlib`, `require(variablePath)`, `__import__`, `eval`, string-keyed registries, decorator-based registration, config-file string references);
   - in a framework-dynamic directory (`migrations/`, `routes/`, `pages/`, `app/`, `controllers/`, `views/`, `middleware/`, `plugins/`, `hooks/`, `fixtures/`, `seeds/`, `locales/`, `public/`, `static/`, `templates/`);
   - an entry point (`package.json` `bin`/`scripts`/`main`/`exports`, `pyproject.toml` scripts, `Procfile`, `Dockerfile` `CMD`/`ENTRYPOINT`);
   - part of a library's public API (`__all__`, `index.ts` exports, package `main` field).
   Scope-specific nuances are noted in each scope section.
4. **Check the dead-weight register first.** Before deleting anything that merely *looks* dead, check `failure-archaeology`'s dead-weight register: things that are intentionally inert (kept-for-a-reason stubs, compat shims, load-bearing empty files) are recorded there and must not be removed. If the register doesn't exist, treat its absence as one less green light, not permission.
5. **Verify after fixing.** Build, type-check, and test after changes; per `verification-doctrine`, "tests still pass" is a claim that requires recorded evidence (the actual command and its result), not an assertion. If a check fails, revert the specific change that caused it and report it as deferred — do not power through.
6. **Report what was removed.** Every run ends with a summary: files reviewed/changed, what was removed or extracted and why, what was deferred and why, and verification results.
7. **Preserve behaviour.** Extractions and deletions must not change any functionality, API shape, or observable output.
8. **Match existing patterns.** Follow the project's service-layer convention, import ordering, naming, and error-handling style. Don't introduce new conventions.
9. **Minimum viable extraction.** Three similar lines are better than a premature abstraction. Inline single-consumer abstractions unless they add genuine clarity.

---

## Scope: `diff` — clean recently changed code

Fast, focused pass over recently changed code. Run after a coding session, before committing or running the full review suite. Cheaper than `full-review`; catches the patterns AI coding assistants most commonly introduce.

### Step 1: Identify changed files

```bash
# Default: all uncommitted changes
git diff --name-only HEAD -- '*.ts' '*.tsx' '*.py' '*.js' '*.jsx' | grep -v node_modules | grep -v '.test.' | grep -v '.spec.'
```

If a path argument was given, scan only that target. If no changed files are found, fall back to files modified in the last 3 commits (`git diff --name-only HEAD~3 ...`).

Options: `--dry-run` — report issues without fixing; `--staged` — scan only staged changes.

### Step 2: Review each file

**A. Duplication**
- Functions that do the same thing as an existing function elsewhere (`rg` for similar names/patterns)
- Copy-pasted blocks with minor variations that should be parameterised
- Repeated error-handling patterns that belong in shared middleware
- API call wrappers that duplicate existing service functions

```bash
rg "export (async )?function " --glob '*.ts' --glob '!*.test.*' -n | sort
rg "await (fetch|db\.|pool\.)" --glob '*.ts' -l | head -10
```

**B. Dead code** (shared rules apply; diff nuance: only within the changed files)
- Unused imports, variables assigned but never read, uncalled functions, unreachable branches
- Commented-out code blocks (> 3 lines and old → remove; git history preserves it)

**C. Unnecessary complexity**
- Nested ternaries beyond 2 levels
- Functions over 50 lines doing multiple unrelated things
- Abstractions with only one consumer (premature generalisation)
- Complex logic expressible as a lookup table or enum
- Over-engineered error types for simple cases

**D. Performance**
- Obvious N+1 patterns (queries inside loops over user data)
- Missing early returns; redundant computations inside loops (hoist invariants)
- Unnecessary `async/await` on functions that don't need it

**E. Consistency**
- Error handling, naming, and async style match the project's existing patterns
- Imports ordered consistently with adjacent files
- Variable names consistent with the domain vocabulary used elsewhere

### Step 3: Classify and act

| Issue | Action |
|-------|--------|
| Duplication with clear extraction target | Extract and replace all call sites |
| Dead import | Remove |
| Commented-out code > 3 lines old | Remove |
| N+1 with a clear batching solution | Fix |
| Over-50-line function doing two distinct things | Split if both halves are independently testable |
| Single-consumer abstraction | Inline unless it adds genuine clarity |
| Style inconsistency | Fix to match the dominant project pattern |

**Do NOT fix:** architecture problems, naming across files not changed, refactors touching more than 3 files, anything that changes external behaviour.

### Step 4: Apply fixes in order

Dead code first (reduces noise), then duplication, then complexity. For each extraction: pick the home the project convention dictates (`services/`, utils, shared package), name it clearly, replace all call sites, then verify none were missed (`rg "old-pattern"`).

### Step 5: Verify and report

Run build, tests, and type-check (record output per shared rule 5). Then:

```
Cleanup Summary (diff)
======================
Files reviewed: N   Issues found: X   Fixed: Y   Deferred: Z (with reasons)
Changes made: <file — what and why, one line each>
Build: PASS  Tests: PASS  TypeScript: PASS
```

Save a full report to `docs/reviews/simplify-{YYYY-MM-DD}.md` if any changes were made.

---

## Scope: `feature` — post-feature structure review

After a feature ships, scan its footprint for duplicated logic, scattered patterns, and inline code that should be extracted into reusable service modules — then restructure. Goal: repeated runtime mechanics move behind structured, reusable modules while route handlers and components stay responsible only for domain policy.

### Phase 1: Identify the feature surface

Use the path argument if given (e.g. `feature apps/api`); otherwise recently changed files via `git diff --name-only HEAD~3` (same filters as `diff` scope). If no recent changes, fall back to a full scan of `apps/` and `packages/`.

### Phase 2: Duplication detection (structure-level)

For each changed file *and its neighbouring modules*:

**A. Repeated function patterns** — same job in different files (two streaming handlers, two upload processors, two notification senders); copy-pasted API wrappers differing only in URL/params; repeated try/catch-with-same-logging blocks; repeated query patterns (same joins/filters, different table).

**B. Inline logic that should be a service** — route handlers doing business logic directly (>20 lines before the response); components with embedded API calls, data transformations, or business rules; repeated validation/transformation chains across files.

**C. Scattered configuration** — same constants defined in multiple files; repeated type definitions that belong in shared packages; the same environment variable read in multiple places.

### Phase 3: Service-layer analysis

For each duplication, determine:

1. **What's the shared mechanic?** ("stream an AI response", "upload and validate a file", "send a notification")
2. **Where should it live?** Cross-app → `packages/shared/src/`; API-specific → `apps/api/src/services/`; frontend-specific → `apps/{app}/src/hooks/` or `apps/{app}/src/utils/`. Defer to the project's own convention if it differs.
3. **What's the interface?** Define the signature all callers would use.
4. **What varies between callers?** Those become parameters, not separate implementations.

### Phase 4: Restructure

Extract the shared logic, replace all duplicate call sites, preserve behaviour exactly, and keep route handlers thin (parse/validate request → call service → format response).

Extraction rules:
- One function per mechanic — not a god-service with 20 methods
- Pure where possible; side effects (DB writes, API calls, file ops) explicit in the signature
- Error handling stays in the caller unless it's truly shared error logic
- Don't over-abstract: for 2 call sites a simple shared function is fine; no factories, dependency injection, or abstract base classes unless there are 4+ consumers

Feature-scope dead-code nuance: removing duplicates may orphan helpers that only the duplicates used — remove those too (they fall under shared rule 2), but nothing else.

### Phase 5: Verify and report

Type-check, tests, build (record output), then re-run the Phase 2 duplication scan to confirm the cleanup introduced no new duplication. Report as a table:

| File | Action | What changed |
|------|--------|--------------|
| `apps/api/src/services/notify.ts` | Created | Extracted notification logic from 3 route handlers |

Include: duplications found vs fixed, new service functions and locations, duplications intentionally left (with reason), and files worth a future pass.

---

## Scope: `repo` — periodic whole-repo sweep

A disciplined, conservative cleanup of accumulated cruft — especially in repos with heavy AI-assisted development, which piles up intermediate files, abandoned experiments, and stale planning docs.

**Core philosophy: removing the wrong file costs more than leaving the right one.** Default to *surfacing* candidates, not deleting. Human review is the final gate on anything below HIGH confidence. Git history is the safety net, but treat deletions as irreversible in practice. Junk is also wasted context: every stale file adds noise for humans and agents searching the repo.

Shapes AI-assisted dev leaves behind (signals to investigate, never auto-deletes): version-suffixed files (`_v2`, `_old`, `_final`, `_fixed`, `_copy`, `(1)`); date-stamped files outside `logs/`; agent-named files (`claude_*.md`, `gpt_*.py`, `ai_notes.md`); one-off executables past their usefulness (`run_once.sh`, `fix_db.py`); ever-growing `utils.py`/`helpers.py` with unused exports; overlapping top-level markdown (`PLAN.md`, `NOTES.md`, `TODO.md`, `IDEAS.md`, ...).

Do NOT use this scope for one-off deletion of a named file (just `rm` it) or for restructuring/renaming (that's `feature` scope or a refactor).

### Phase 0 — Safety net (mandatory, in order)

1. Confirm a git repo (`git rev-parse --is-inside-work-tree`) and a clean tree (`git status --porcelain`); if dirty, stop and ask the user to commit or stash.
2. Create a dedicated branch: `chore/codebase-sweep-YYYY-MM-DD`. Never sweep on the default branch.
3. Identify the test suite (package.json scripts, Makefile, pyproject.toml, CI workflows, README) and confirm it passes *before* any change. If tests are already broken, stop and report — do not sweep a broken codebase.
4. Note frameworks with runtime-dynamic loading (Django, Rails, Next.js, Spring, ...) — they change what "unused" means.
5. Read `.gitignore`/`.dockerignore`; anything already ignored is out of scope.

### Phase 1 — Inventory

Map without judging: `git ls-files`; untracked-but-not-ignored files; last-modified dates (batch via `git log --name-only --format='%H %cI'`, not per-file); entry points; config files, migrations, fixtures, and public-API surfaces.

### Phase 2 — Candidates in confidence tiers

**HIGH — safe to remove on the user's one-word consent (strict, unambiguous patterns only):** tracked build/cache artifacts (`__pycache__/`, `*.pyc`, `dist/`, `build/`, `.next/`, `coverage/`, `.DS_Store`, ...); editor scratch (`*.swp`, `*~`, `*.bak`, `*.orig`, `*.old`); explicit scratch naming (`scratch.*`, `temp.*`, `test123.*`, `asdf.*`); zero-byte files with no purpose (never `__init__.py`, `.gitkeep`, `py.typed`, `.nojekyll`); duplicate versioned files where the canonical exists and the variant is imported nowhere (`auth_v2.py` alongside `auth.py`).

**MEDIUM — explicit per-item approval:** unreferenced one-shot top-level docs (`PLAN.md`, `NOTES.md`, `claude_*.md` — propose moving to `docs/archive/` rather than deleting); unreferenced debug/experiment scripts (`debug_*`, `try_*`, `sandbox_*`); dead modules and dead exports (per shared rule 3, and for libraries only if outside the public API); commented-out blocks older than ~90 days (`git blame`); TODOs/FIXMEs older than 180 days (configurable); overlapping README-like docs (surface together for reconciliation).

**LOW — report only, never auto-remove:** framework-dynamic directories and runtime-loaded code (shared rule 3's exclusion lists); tests for removed code (sometimes tests document intent — user decides); anything unclear. **When in doubt, this is the tier.**

### Phase 3 — Cross-check every HIGH/MEDIUM candidate

Demote a tier (or drop) on any hit:

1. `git grep -F` for the filename (without extension) and every exported symbol — including config, YAML, JSON, env files, shell scripts, Dockerfiles, CI YAML.
2. Entry-point check (shared rule 3).
3. Touched in the last 30 days → demote one tier (someone may be working on it).
4. Referenced in any test file → demote one tier.
5. Referenced in `README.md`, `CHANGELOG.md`, or `docs/` → demote one tier.
6. Lives in a dynamic-loading directory → force LOW.
7. Listed in `failure-archaeology`'s dead-weight register as intentionally inert → drop entirely.

### Phase 4 — Report, then STOP

Write `docs/cleanup-YYYY-MM-DD.md` and print a summary. Must contain: summary table (counts and bytes per tier); HIGH list with reason codes; MEDIUM items with *why* medium, proposed action (delete / archive / inline), and a one-line reversal command; LOW as information only; a **Not-touched section** listing files that matched a junk pattern but were preserved because a cross-check hit — the paper trail proving the sweep wasn't reckless; next steps. Dry-run is the default: no deletion happens without explicit user consent.

### Phase 5 — Execute with test gating (only after approval)

1. Remove in small batches (≤ 10 files per batch), grouped by category.
2. After each batch: run tests, linter/type-checker, `git status` (record results per shared rule 5).
3. On any failure: revert the batch and report which batch failed. Do not continue.
4. Commit each batch separately: `chore(sweep): remove <N> <category> files`.
5. Push the branch; do not merge. The user reviews the diff and merges manually.

Final message after a sweep, roughly:

```
Sweep complete on branch chore/codebase-sweep-2026-07-09.
Removed: 47 files (2.3 MB) across 6 commits. Tests green after each commit.
Preserved despite matching patterns: 12 files (see report section "Not-touched").
Report: docs/cleanup-2026-07-09.md
Branch pushed. Please review the diff and merge when happy.
```

### Absolute do-not-touch list

Never remove, regardless of what any check says:

- `LICENSE`, `LICENSE.*`, `COPYING`, `NOTICE`, `AUTHORS`, `CONTRIBUTORS`
- `README.md` at the root (may consolidate others INTO it, but never delete the root)
- `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`
- `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.python-version`, `.tool-versions`
- Lockfiles: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `poetry.lock`, `uv.lock`, `Gemfile.lock`, `Cargo.lock`, `go.sum`
- Manifests: `package.json`, `pyproject.toml`, `setup.py`, `setup.cfg`, `Cargo.toml`, `go.mod`, `Gemfile`, `pom.xml`, `build.gradle`
- CI/CD: `.github/`, `.gitlab-ci.yml`, `.circleci/`, `azure-pipelines.yml`, `Jenkinsfile`, `.pre-commit-config.yaml`
- Container/deploy: `Dockerfile`, `docker-compose*.yml`, `Procfile`, `fly.toml`, `vercel.json`, `netlify.toml`, `railway.toml`, `.dockerignore`
- Envs and examples: `.env.example`, `.env.sample`, `.env.template` (never `.env` — but never delete it either; surface it for user review)
- Migrations — always LOW, default keep
- Test fixtures unless the test file they support is also being removed
- `.gitkeep`, `.nojekyll`, `py.typed`, `__init__.py` — load-bearing despite being small or empty
- Anything under a path the user hasn't explicitly included in scope

### Repo-scope anti-scope-creep rule

This scope is for *removal only*. If you notice code that should be renamed, extracted, split, or typed — surface it in the report as a refactor suggestion (candidate for `feature` scope) but do not perform it. Keep the diff boringly deletion-only so the reviewer's job is easy.

---

## Cross-references

- `failure-archaeology` — dead-weight register; consult before any deletion of apparently dead things (shared rule 4).
- `verification-doctrine` — evidence standard for "build/tests still pass" claims (shared rule 5).
- `code-review` / `full-review` — bug hunting and security/accessibility/infra/BRD review; out of scope here.
