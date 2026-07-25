# Skills and Hooks Fit — v8 Process

This file maps the existing skill/hook bundle into the v8 agent-native lifecycle.

## Revised lifecycle

```text
0. Bootstrap
1. Discover / Plan
2. Contract only what matters
3. Goal-driven execution
4. Verification
5. Repair
6. Release and learning
```

## 0. Bootstrap

| Component | Fit | Action |
|---|---|---|
| `new-project-setup` | User-facing setup skill | Keep. Ends at READY checklist. Does not auto-launch implementation. |
| `CLAUDE.md` | Always-on guidance | Updated to v8 plan/goal model. |
| `project.config.yaml` | Machine-readable project policy | Required for hooks and lifecycle. |
| hooks install | Deterministic guardrail layer | Install only after config exists. |

## 1. Discover / Plan

| Component | Fit | Action |
|---|---|---|
| Codex `/plan` | Native planning surface | Use before any non-trivial implementation. |
| Claude Plan mode | Native planning surface | Use before strict pipeline routing. |
| `process-classifier` | Internal classifier | New skill. Produces path + autonomy envelope. |
| `discovery-zone` | Open-loop exploration | Use only when requirements/product bet are unstable. |
| `adversarial-idea-evaluator` | Challenge high-risk ideas | Optional, targeted use. |
| `agent-insights-pass` | Advisory channel | Invoke after plan/classification and at existing checkpoints. |

## 2. Contract only what matters

| Component | Fit | Action |
|---|---|---|
| `requirements-capture` | Lean requirements slice | New default for light/standard work. |
| `brd-generator` | Full BRD generator | Reserve for full path or major feature discovery output. |
| `brd-data-modeler` | Data model/schema | Use only when data model changes. |
| `architecture-doc-generator` | Architecture | Use for greenfield or architecture-changing work. |
| `guidelines-generator` | Standards | Mostly setup-time or standards-amendment use. |
| `contracts-generator` | Machine-readable contracts | Hard center for standard/full work; amend only touched contracts in light path. |
| `quality-gate-checker` | Independent gates | Run fresh-context for Gates A/B/C when those artefacts changed. |

## 3. Goal-driven execution

| Component | Fit | Action |
|---|---|---|
| Codex `/goal` | Native execution loop | Preferred long-running execution controller in Codex. |
| `feature-life-cycle` | User-facing conductor | Updated to classify first and dispatch goal-style execution. |
| `pipeline-orchestrator` | Runtime/state wrapper | Internal only: manifest, gates, trace, validate commands. |
| `phase-executor` | Per-FR implementation worker | Runs inside an approved goal/autonomy envelope. |
| `plan-to-pipeline` | Plan -> execution harness | Compiles a phased plan into a manifest + per-phase prompts + external exit-criteria oracles + driver. Gates enforced OUTSIDE the model. |
| `phased-planner` | Build ordering | Use for standard/full work; skip for simple light tasks. |

## 4. Verification

| Component | Fit | Action |
|---|---|---|
| `test-case-generator` | Acceptance oracle | Prefer executable YAML/spec files and E2E tests; docx is optional. |
| `brd-coverage` | Evidence-first traceability | Keep. Especially valuable for brownfield work and anti-skeleton checks. |
| `full-review` | Multi-domain review | Report-first by default. Repair is explicit opt-in. |
| `cross-fr-review` | Integration review | Standard/full path only. |
| `quality-gate-checker` | Gate verification | Fresh-context only. Never self-evaluate. |

## 5. Repair

| Component | Fit | Action |
|---|---|---|
| `phase-executor` | Code repair | Repair implementation bugs only. |
| `full-review --fix` | Guided repair | Opt-in after report exists. |
| `quality-gate-checker` | Re-check amended artefacts | Use after contract/spec amendments. |
| `brd-coverage` | Traceability verification | Re-run on affected scope after repair. |

Repair must never silently edit requirements, contracts, or acceptance tests. If those are wrong, use the amendment workflow.

## 6. Release and learning

| Component | Fit | Action |
|---|---|---|
| `local-deployment` | Local runtime proof | Use before declaring feature done. |
| `deploy-app` | Deployment | Only after human release approval. |
| `cross-feature-learning` | Process improvement | Keep as one-finding-per-PR amendment proposer. |
| `agent-insights-pass 10_production` | Production feedback analysis | Use when real incidents/feedback arrive. |
| `code-cleanup diff` | Post-feature simplification | Use after passing verification, before release. |
| `code-cleanup repo` | Periodic cleanup | Use before major releases, not every feature. |

## Hooks

| Hook | Type | Fit | Recommendation |
|---|---|---|---|
| `db_change_guard.py` | Blocking PreToolUse | DB safety | Keep as hard guard. Regex is first line; strengthen with parser/tooling where available. |
| `secrets_guard.py` | Blocking PreToolUse | Secret safety | Keep. Expanded for OpenAI, Anthropic, Supabase, DB URLs, JWT/private key patterns. |
| `validate_sql.py` | Advisory PostToolUse | SQL feedback | Keep. Strengthened to use `pg_format`, `sqlfluff`, or `psql` parse checks when available. |
| `lint_changed.py` | Advisory Stop | Lint/type-check feedback | Keep. Add cache to avoid repeating identical lint work. |
| `run_tests_if_changed.py` | Advisory PostToolUse | Test feedback | Keep. Add `smoke/touched/full` mode from config. |

## Minimal command flow examples

### Light path

```text
/plan classify the change and produce the autonomy envelope
/goal implement the approved light-path plan and verify touched tests
/full-review <target> no-fix
/goal repair high/critical implementation findings only
```

### Standard path

```text
/plan classify and identify contract amendments
/feature-life-cycle <feature> --path standard
/full-review <target> no-fix
/goal repair high/critical findings
```

### Full path

```text
/discovery-zone <idea>       # only if unclear
/feature-life-cycle <feature> --path full
/full-review <target> no-fix
/local-deployment
```
