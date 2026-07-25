# AGENTS.md — Codex Global Guidance for AI Dev Pipeline

These instructions are for OpenAI Codex. They mirror the Claude `CLAUDE.md` guidance but use Codex-native conventions: `AGENTS.md`, `.agents/skills`, `.codex/hooks.json`, `/plan`, and `/goal`.

## Operating principle

```text
Prescribe the boundaries. Let the agent discover the path. Verify with evidence.
```

## Start every non-trivial task with planning

Use `/plan` before editing when the route is not obvious.

The plan must classify the work as one of:

- `discovery` — product bet or requirements are unstable;
- `light` — small bug/fix/enhancement on stable contracts;
- `standard` — several FRs on an existing system;
- `full` — new system, major module, regulated/money/data-sensitive work.

Default to `light` unless risk justifies `standard` or `full`.

## Use `/goal` for execution

After the plan is approved or accepted, convert the plan into a `/goal` with:

```yaml
objective: what outcome is required
context: files, docs, fixtures, tickets, and contracts to inspect
constraints: what must not be violated
freedom: where Codex may choose the route
evidence_required: tests, diffs, logs, reports, screenshots, traceability
escalate_when: hard-stop conditions
```

Inside the autonomy envelope, Codex may choose the implementation path. Outside it, stop or amend the plan.

## Process paths

| Path | Use when | What to do |
|---|---|---|
| Discovery | Product bet or requirements are unstable | Use `$discovery-zone`; promote only selected candidates into requirements. |
| Light | Small bug/fix/enhancement on stable contracts | Focused plan, touched tests, focused implementation, review, traceability note. |
| Standard | Several FRs on an existing system | Requirements slice, gap analysis, touched contract amendments, LLD/tests where needed, phased execution. |
| Full | New system, major module, regulated/money/data-sensitive feature | Full specification zone and Gates A/B/C. |

## Skill usage

Codex discovers skills from `.agents/skills` and `$HOME/.agents/skills`. Prefer explicit skill mentions with `$skill-name` when a workflow is important.

For which skill to use at which lifecycle stage, read `docs/developer-guide.md` (repo) or `$HOME/.codex/docs/developer-guide.md` (user-wide mirror) — it maps the 10 entry verbs, the four process paths, and the per-stage dispatch order.

User-facing skills:

- `$process-classifier`
- `$requirements-capture`
- `$discovery-zone`
- `$feature-life-cycle`
- `$uiux-designer`
- `$full-review`
- `$cross-feature-learning`
- `$local-deployment`
- `$demo-readiness-evaluation`
- `$deploy-app`
- `$code-cleanup`

Internal stage skills:

- `$brd-generator`
- `$brd-data-modeler`
- `$architecture-doc-generator`
- `$guidelines-generator`
- `$contracts-generator`
- `$quality-gate-checker`
- `$lld-generator`
- `$test-case-generator`
- `$phased-planner`
- `$phase-executor`
- `$brd-coverage`
- `$cross-fr-review`
- `$agent-insights-pass`
- `$adversarial-idea-evaluator`

Cross-cutting doctrine skills (apply on any path; repo-scoped `<project>-*` skills override them):

- `$verification-doctrine`
- `$proof-and-analysis-toolkit`
- `$debugging-playbook`
- `$research-methodology`
- `$failure-archaeology`
- `$claims-discipline`

## Repair discipline

Review and repair are separate.

Allowed in implementation repair:

- fix code;
- add implementation tests that validate existing acceptance criteria;
- update traceability evidence.

Forbidden without amendment workflow:

- changing requirements;
- weakening acceptance tests;
- changing API/auth/state/error/dependency contracts;
- inventing error codes;
- adding production dependencies;
- changing DB policy.

## Non-negotiable rules

### Security

- Every API endpoint is explicitly public or protected by the project auth middleware.
- Parameterized queries only.
- Secrets only via environment variables.
- Never commit `.env` files with real values.
- Never log passwords, tokens, or PII values.
- Never expose stack traces, internal paths, or secret IDs in API responses.

### Data integrity

- Multi-step writes use transactions.
- Destructive or irreversible DB operations require approval.
- List queries need bounded pagination/limits.
- Foreign keys and constraints must be respected.
- Schema changes must follow `project.config.yaml`.

### Code quality

- No TypeScript `any` or `as any` unless an approved exception is recorded.
- No swallowed errors.
- No production `console.log`; use the project logger.
- No hardcoded localhost URLs in production paths.
- No skeleton UI components.

## Escalation contract

Stop or quarantine the affected requirement only when:

1. A destructive/irreversible DB operation or sensitive resource change is needed.
2. A genuine ambiguity remains after one attempt to resolve it from existing artefacts.
3. A formal gate remains BLOCKED after configured remediation cycles.
4. A greenfield project has no architecture/config and needs foundational choices.
5. A user-visible verb maps to multiple plausible UI surfaces with equal evidence.

A single blocked FR should not freeze unrelated work. Quarantine it, record the state, and continue where safe.

## Done definition

A task is done only when:

- the approved objective is satisfied;
- required tests/checks ran and results are recorded;
- changed files are listed;
- traceability is updated where applicable;
- open caveats are resolved, accepted, or deferred with owner/date;
- remaining risks are stated clearly.
