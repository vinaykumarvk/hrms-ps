# AI-Assisted Development Pipeline — v8 Agent-Native Overlay

This document updates the v7 pipeline for a more efficient AI-driven development process.

v7 remains the traceability-first core. v8 changes how the process is operated: native planning and goal execution come first; strict stage sequencing is selected only when risk justifies it.

For the operator's view — which skill to use at which stage, the 10 entry verbs, and per-path playbooks — see `docs/developer-guide.md`. This document defines the method; the guide maps it to daily use.

## 1. Founding principle

```text
Prescribe the boundaries. Let the agent discover the path. Verify with evidence.
```

The pipeline should be strict about:

- security boundaries;
- data-change policy;
- accepted contracts;
- non-functional thresholds;
- requirement-to-test-to-code traceability;
- evidence required to declare done;
- escalation conditions.

The pipeline should not be unnecessarily strict about:

- exact implementation route before the repo is inspected;
- creating every artefact for every small change;
- forcing a full stage sequence when existing contracts already cover the change;
- suppressing the agent's ability to suggest better patterns.

## 2. Native plan/goal operating model

Every non-trivial task starts with a planning pass.

### Codex

Use `/plan` first:

```text
/plan Inspect this repo and feature request. Decide whether this should use the discovery, light, standard, or full path. Identify the minimum artefacts needed, the highest-risk unknowns, contracts that must change, tests required, and the shortest safe implementation route. Do not edit files.
```

After the plan is approved or accepted, use `/goal` for execution:

```text
/goal Implement the approved plan. Obey project guidance, contracts, hooks, and the escalation contract. Do not edit requirements, contracts, or acceptance tests in repair mode. Run required verification and finish with changed files, tests run, evidence, traceability, and remaining risks.
```

### Claude Code

Use Plan mode for the same classification step. Then invoke `/feature-life-cycle` or the relevant internal skill based on the plan.

## 3. Autonomy envelope

Every run has an autonomy envelope.

```yaml
objective: the outcome to achieve
context: files, docs, tickets, fixtures, and contracts to inspect
constraints: what must not be violated
freedom: decisions the agent may make without asking
evidence_required: tests, diffs, traces, logs, screenshots, reports
escalate_when: the hard-stop conditions
```

This is the main replacement for over-prescriptive stage-by-stage prompting. It gives the agent room to solve the problem while keeping consequential decisions controlled.

## 4. Process classifier

The first planning pass classifies the work.

| Path | Trigger | What runs |
|---|---|---|
| Discovery | Product bet or requirements are unstable | `discovery-zone`, promotion gate, then requirements capture |
| Light | Small change or bug fix in stable area | focused plan, touched tests, focused implementation, review, traceability note |
| Standard | Several FRs on an existing system | requirements slice, gap analysis, contract amendments, LLDs, acceptance tests, phased execution |
| Full | New system, major module, regulated/money/data-sensitive area | v7 specification zone, gates A/B/C, both test oracles, integration review |

Default is **light**. Escalate to standard/full only when the risk or coordination cost requires it.

## 5. Revised lifecycle

```text
0. Bootstrap
1. Discover / Plan
2. Contract only what matters
2.5 Design the user-facing surface (only when there is one)
3. Goal-driven execution
4. Verification
5. Repair
6. Release and learning
```

### 0. Bootstrap

Use `new-project-setup`. It prepares adapter guidance (`CLAUDE.md` and/or `AGENTS.md`), `project.config.yaml`, skills, hooks, and readiness checks. It must not auto-launch implementation.

### 1. Discover / Plan

Use native `/plan` or Claude Plan mode. If the idea is not yet stable, use `discovery-zone` first.

The planning output must include:

- selected path: discovery/light/standard/full;
- rationale for the path;
- minimum artefacts needed;
- contracts to reuse or amend;
- tests to write/run;
- risks and open questions;
- autonomy envelope;
- proposed success criteria.

### 2. Contract only what matters

Generate or amend only contracts that downstream code/tests consume.

Keep as strict contracts:

- API/OpenAPI;
- auth matrix;
- state machines;
- error taxonomy;
- environment contract;
- dependency register;
- NFR thresholds;
- test/fixture coverage requirements.

Do not generate full data/architecture/guidelines packages for a small change unless the plan explains why.

### 2.5 Design the user-facing surface

Run `uiux-designer` only when the work introduces or materially changes a user-facing surface; skip it for backend-only, API-only, or non-visual changes. It produces screen specs, an aesthetic direction, a design-token system, and a validated developer handoff. The tokens and screen states become the **design↔code contract** the executor consumes — the mechanism that turns "no skeleton UI" from a review rule into a build-time input.

This is the clearest place the founding principle shows up: the boundary is prescribed (every screen traces to a requirement; all states covered; WCAG AA; consume the project's guidelines and design system; emit a validated handoff), and the route is free (aesthetic, information architecture, flow, components, motion are the skill's to imagine). Scale it to the path — a sized pass on light work, a handoff for the changed screens on standard, a full handoff (and built frontend in the current coding agent when requested) on full. Surplus product ideas go to the advisory track, not into silent scope.

### 3. Goal-driven execution

Execution is goal-based, not stage-recitation based.

The agent may choose the implementation route inside the autonomy envelope. It must not change specs, contracts, or acceptance tests to make the implementation pass unless the amendment workflow is explicitly invoked.

### 4. Verification

Verification is evidence-first. What counts as evidence is defined by the doctrine layer (section 6.5): tests are reported as executed counts (`N passed | M skipped`), never bare exit codes; schema claims come from a live schema read; performance/size numbers are measured, not estimated; every claim is either measured or labeled assumed.

Use:

- configured unit/integration/E2E tests;
- contract tests;
- `quality-gate-checker` for Gates A/B/C when those artefacts changed;
- `brd-coverage` for requirement-to-code/test traceability;
- `full-review` for report-first multi-domain review;
- `cross-fr-review` for standard/full features;
- `sanity-check` after remediation, to re-verify critical findings across all review domains;
- `local-deployment` before declaring done — a green dev-server banner is not evidence; a full-dependency-path probe is.

### 5. Repair

Repair is separate from review.

Classify each issue before fixing:

```text
implementation bug → repair code
test failure caused by wrong implementation → repair code
spec ambiguity → stop and amend spec/LLD/contract
test/oracle defect → amendment workflow, not silent edit
contract mismatch → amend contract and re-run gate
```

Do not move the goalposts by editing acceptance tests, contracts, or requirements during implementation repair.

When the failure is not understood yet, triage with `debugging-playbook` (60-second environment baseline, then one discriminating experiment per ranked cause) and check `failure-archaeology` for prior sightings before re-deriving a diagnosis.

### 6. Release and learning

Release remains human-owned. The agent prepares evidence.

Use:

- `local-deployment` before declaring done;
- `release-readiness` to assemble the human approval package;
- `demo-readiness-evaluation` before client-facing demos;
- `claims-discipline` before anything leaves the repo — every external claim graded on the evidence ladder (built → demonstrated → certified → proven in production);
- `deploy-app` only after approval — a green build proves nothing about runtime; deployment evidence is version identity, liveness and readiness 200s, an error-log scan, and migration/traffic verification;
- `code-cleanup diff` after merge to simplify what just changed; `code-cleanup repo` periodically before major releases;
- `failure-archaeology` to record incidents (wrong paths first, mechanism-level root cause);
- `cross-feature-learning` after merge;
- `agent-insights-pass 10_production` when production feedback appears.

## 6. Skill roles

### User-facing skills

| Skill | Role |
|---|---|
| `new-project-setup` | Bootstrap and readiness |
| `discovery-zone` | Open-loop product exploration |
| `feature-life-cycle` | Main agent-native conductor |
| `uiux-designer` | Design the user-facing surface and emit the developer handoff; conditional and path-scaled |
| `full-review` | Evidence report and optional repair |
| `cross-feature-learning` | Reviewable process amendments |
| `local-deployment` | Local runtime proof |
| `demo-readiness-evaluation` | Deal-readiness dry run before client demos |
| `deploy-app` | Deployment after approval |
| `code-cleanup` | Cleanup at diff, feature, or repo scope |

### Internal stage skills

| Skill | Role |
|---|---|
| `process-classifier` | Classify discovery/light/standard/full and create autonomy envelope |
| `requirements-capture` | Lean requirements slice for light/standard work |
| `brd-generator` | Full BRD only when the full path is justified |
| `brd-data-modeler` | Data model creation/amendment only when data changes |
| `architecture-doc-generator` | Architecture definition for greenfield or architecture changes |
| `guidelines-generator` | Standards setup or amendment |
| `contracts-generator` | Machine-readable contract package/amendment |
| `lld-generator` | Per-FR implementation spec where needed |
| `test-case-generator` | Acceptance cases and executable tests |
| `phased-planner` | Dependency ordering for standard/full work |
| `phase-executor` | Goal-driven per-FR implementation |
| `plan-to-pipeline` | Compile a phased plan into a gated, resumable execution harness (manifest + per-phase `/goal` prompts + external exit-criteria oracles + driver). Automate sequencing, never judgment. |
| `quality-gate-checker` | Fresh-context independent gates |
| `brd-coverage` | Evidence-first traceability |
| `cross-fr-review` | Integration review |
| `gap-analysis` | Brownfield EXISTS/PARTIAL/MISSING/CONFLICT map before LLD |
| `acceptance-test-generator` | Requirement-derived oracle tests, real-fixture bound |
| `sanity-check` | Post-remediation regression re-verification |

The domain reviews (`ui-review`, `quality-review`, `security-review`, `infra-review`) are dispatched by `full-review` and `sanity-check`; `uiux-designer`, `adversarial-idea-evaluator`, and the setup skills round out the library. The complete stage-by-stage map lives in `docs/developer-guide.md`.

### 6.5 Cross-cutting doctrine layer

v8 prescribes boundaries and demands evidence; the doctrine layer defines **what counts**. These skills are not stages — they load contextually alongside whatever stage is active and govern how every other skill grounds its claims. Repo-scoped `<project>-*` skills override their generic guidance.

| Skill | Doctrine |
|---|---|
| `verification-doctrine` | Authoring-time evidence standards: measured vs. assumed labeling, green ≠ ran (executed counts), live schema reads, decaying line references re-verified before citing, provenance footers on durable artefacts |
| `proof-and-analysis-toolkit` | Prove a claim about data or code before acting on it: falsifiable goal → copy-pasteable command → expected shape in both outcomes → decision rule |
| `debugging-playbook` | Anti-guessing triage: environment baseline first, discriminating experiments over "consistent with" reasoning |
| `research-methodology` | A hunch becomes a result only via pre-registered predictions and adversarial refutation; experiment flags resolve to ADOPT or RETIRE; failures become mechanical enforcement (a hook or check), not a memo |
| `claims-discipline` | External claims graded on the evidence ladder with a four-part reproducibility standard (command, dataset, threshold, artifact) |
| `failure-archaeology` | Durable incident record and dead-weight register; consulted at the start of debugging and before deleting anything old |

This layer is the v8 answer to the failure mode that motivated it: claims without verification. The founding principle's third clause — *verify with evidence* — is only as strong as the evidence standard, and that standard is now versioned, per-skill, and enforceable in review.

## 7. Agent advisory track

`agent-insights-pass` is the safety valve against over-prescription.

It is invoked:

- after planning/classification;
- before Gate A for full/standard work;
- after LLD generation;
- alongside Stage 8 review;
- on production feedback.

It may propose better approaches or missing edge cases, but it must not edit the spec directly. Accepted insights enter via amendment workflow.

## 8. Hooks

Hooks are deterministic enforcement only.

Blocking hooks:

- `db_change_guard.py` — destructive DB actions, sensitive tables, forbidden commands;
- `secrets_guard.py` — hardcoded secrets and `.env` commits.

Advisory hooks:

- `validate_sql.py` — SQL format/lint/parse feedback where tools are available;
- `lint_changed.py` — lint/type-check feedback with caching;
- `run_tests_if_changed.py` — configurable smoke/touched/full test feedback.

Hooks must not become a replacement for contracts or review. Hooks catch binary violations; they do not judge product correctness.

## 9. Done definition

A run is done only when:

- the objective is satisfied;
- all required tests have passed or residual failures are explicitly accepted;
- contract/gate checks pass where relevant;
- traceability is updated;
- open caveats are resolved, accepted, or deferred with owner/date;
- the final report lists changed files, commands run, evidence, and remaining risks.

## 10. Anti-patterns

Avoid:

- running the full ten-stage pipeline for a one-file fix;
- creating documents that no tool/test/hook consumes;
- asking the agent to follow a strict implementation route before it inspects the repo;
- letting the same skill generate, review, and repair without fresh context;
- editing tests/contracts in repair mode to make code pass;
- deleting a failing test to go green, or skipping a flake without a tracked issue reference;
- reporting "tests green" without executed counts — a suite that silently skipped its DB cases exits 0;
- treating hook warnings as proof of quality;
- building a user-facing surface with no UX handoff, leaving the interface, states, and visual system improvised at code time;
- forcing a UX design pass onto backend-only or non-visual work just to follow the motions;
- suppressing agent suggestions instead of capturing them in the advisory ledger;
- encoding every phase into one master `/goal` that loops over a subgoal file unattended — it exhausts context across phases, structurally fights the human review gates (a Stop hook *prevents* halting; a gate *requires* it), and lets the agent self-certify "done"; use `plan-to-pipeline` (external driver, real exit-criteria oracles, hard gates) so sequencing is automated but judgment never is.
