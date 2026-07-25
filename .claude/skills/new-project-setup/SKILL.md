---
name: new-project-setup
description: "Guided onboarding that gets a repo ready for the v8 AI Dev Pipeline. Creates/updates adapter guidance, project.config.yaml, installs skills/hooks, verifies readiness, and stops at READY."
argument-hint: "[project-name or path] [new|existing]"
user_invocable: true
allowed-tools: Read Write Edit Grep Glob Bash Skill AskUserQuestion
---

# New Project Setup — v8 Readiness

Prepare a repository for agent-native AI development. This skill is interactive by design and ends at a READY checklist. It must not auto-launch `feature-life-cycle`.

## Exit criteria

A project is READY when all of these exist and verify for the target adapter:

1. Adapter guidance at repo root: `CLAUDE.md` for Claude Code, `AGENTS.md` for Codex, or both for dual-adapter repos.
2. `project.config.yaml` at repo root.
3. Architecture choice captured or detected.
4. User-facing skills installed.
5. Internal stage skills installed.
6. Hooks installed and wired in `.claude/settings.json` for Claude Code or `.codex/hooks.json` for Codex.
7. DB-change policy configured.
8. Sensitive resources configured.
9. Commands configured for dev/build/test/lint/typecheck where available.
10. Readiness report written to `docs/setup-readiness.md`.

## Step 0 — detect project type

Detect:

- `greenfield` — empty/scaffold-only repo, no architecture established;
- `existing` — real codebase with framework, dependencies, and conventions.

If ambiguous, ask once. Do not overwrite existing `CLAUDE.md`, `AGENTS.md`, `project.config.yaml`, settings, hooks, or skills without showing a diff and asking.

## Step 1 — capture project basics

Collect only what the repo cannot tell you:

- project name;
- one-line description;
- requirements location, default `docs/requirements/`;
- stack fields that cannot be inferred;
- DB-change policy;
- sensitive tables/resources;
- coordination channel for destructive changes, if any.

## Step 2 — architecture

For greenfield, offer common presets plus custom/doc-driven choice:

1. Next.js + Supabase.
2. Node API + React.
3. FastAPI + React.
4. T3/typesafe monolith.
5. Django + React.
6. Define your own.
7. Point to architecture doc.

For existing projects, infer first and ask the user to confirm/correct only uncertain fields.

## Step 3 — generate config/guidance

Detect the adapter first:

- Claude Code: `.claude/`, `CLAUDE.md`, `~/.claude/skills`.
- Codex: `.codex/`, `.agents/skills/`, `AGENTS.md`, and user-wide `~/.codex/skills` or `~/.agents/skills`.
- Dual adapter: write both guidance files and both hook configs when the user wants the repo to work in both tools.

Write:

- `CLAUDE.md` and/or `AGENTS.md` — project-specific golden rules and commands for the selected adapter(s);
- `project.config.yaml` — machine-readable config for lifecycle and hooks.

Minimum `project.config.yaml` blocks:

```yaml
project:
  name: <name>
  type: greenfield | existing
paths:
  requirements: docs/requirements/
  source: []
commands:
  dev: null
  build: null
  test: null
  test_smoke: null
  test_touched: null
  lint: null
  typecheck: null
test_hook:
  mode: touched
database:
  change_policy: migrations | schema-direct
  sensitive_tables: []
  migration_dirs: []
  forbidden_commands: []
coordination:
  announce_channel: null
escalation:
  gate_remediation_cycles: 3
```

Confirm the key fields with the user before installing hooks.

**Schema note (shared file — merge, never overwrite):** `project.config.yaml` is shared with the deployment skills. Two additive section families coexist in the one file: the pipeline-onboarding schema above (database policy, `ci_gates`, `commands`) and the deploy schema written by `project-config-init`/read by `deploy-app` (`services[]`, `gcloud.projects`, `app_groups`). A repo may contain both families. If the file already exists, MERGE your sections into it; never overwrite or delete sections written by the other skill.

## Step 4 — install skills/hooks

Install from `docs/skills.zip` and `docs/hooks.zip`, or from this repo snapshot when running inside the pipeline repo.

Safety rules:

- verify archive exists before extracting;
- inspect archive paths;
- reject absolute paths or `..` path traversal;
- stage extraction in a temp directory;
- never clobber existing local edits without diff/approval;
- merge `.claude/settings.json` for Claude Code, never blindly replace it;
- create or update `.codex/hooks.json` for Codex and keep hook wrapper paths valid.

## Expected user-facing skills

- `new-project-setup`
- `discovery-zone`
- `feature-life-cycle`
- `uiux-designer`
- `full-review`
- `cross-feature-learning`
- `local-deployment`
- `deploy-app`

## Expected internal skills

- `process-classifier`
- `requirements-capture`
- `brd-generator`
- `brd-data-modeler`
- `architecture-doc-generator`
- `guidelines-generator`
- `contracts-generator`
- `quality-gate-checker`
- `lld-generator`
- `test-case-generator`
- `phased-planner`
- `phase-executor`
- `brd-coverage`
- `cross-fr-review`
- `agent-insights-pass`
- `adversarial-idea-evaluator`

## Expected hooks

Blocking:

- `db_change_guard.py`
- `secrets_guard.py`

Advisory:

- `validate_sql.py`
- `lint_changed.py`
- `run_tests_if_changed.py`

## Step 5 — readiness report

Write `docs/setup-readiness.md`:

```text
SETUP READINESS
────────────────────────────────────────────
[ ] Adapter guidance present (CLAUDE.md / AGENTS.md as selected)
[ ] project.config.yaml present and parses
[ ] Architecture captured
[ ] User-facing skills installed
[ ] Internal skills installed
[ ] Hooks installed
[ ] Hooks referenced in adapter config (.claude/settings.json / .codex/hooks.json)
[ ] DB-change policy configured
[ ] Sensitive resources configured
[ ] Commands configured or explicitly absent
────────────────────────────────────────────
Verdict: READY / BLOCKED
Missing:
Next command:
```

If READY, stop with:

```text
Your project is READY. Place requirements in docs/requirements/ or pass a feature description, then run /feature-life-cycle "<feature or path>".
```

Do not auto-launch implementation.

## Hook philosophy

Hooks are the deterministic floor:

- blocking hooks protect secrets and destructive/sensitive DB changes;
- advisory hooks provide lint, SQL, and test feedback;
- hooks do not replace contracts, planning, or review.
