# Developer Guide — Using the Skills Across the Development Lifecycle

**Audience:** developers using the AI Dev Pipeline (Claude Code or Codex) to build features.
**The one thing to internalize:** you do not drive 45 skills — you drive **10 entry verbs**, and three conductors (`feature-life-cycle`, `full-review`, `new-project-setup`) dispatch every other skill at the right stage with the right context. If you remember nothing else, remember `/feature-life-cycle`.

---

## 1. The 10 verbs you type

| When you want to… | Type | What it drives for you |
|---|---|---|
| Prepare a repo for the pipeline | `/new-project-setup` | Guidance files, `project.config.yaml`, skills, hooks, readiness report |
| Explore a fuzzy product idea | `/discovery-zone <topic>` | Structured exploration; only promoted items become requirements |
| **Build anything** (feature, fix, module) | `/feature-life-cycle <request>` | Classification → spec → design → build → gates → review → done report |
| Design or redesign screens | `/uiux-designer <scope>` | Screen specs, tokens, validated developer handoff |
| Review code without touching it | `/full-review <target> no-fix` | Dispatches UI / quality / security / infra reviews; report first, repair opt-in |
| Prove it runs before saying "done" | `/local-deployment` | Servers up, auth + DB verified, feature endpoints exercised |
| Rehearse a client demo | `/demo-readiness-evaluation` | Deal-readiness verdict with gaps |
| Ship it | `/deploy-app` | Readiness audit → build → deploy → runtime verification |
| Clean up code | `/code-cleanup [diff\|feature\|repo]` | Simplification at the scope you choose |
| Improve the process itself | `/cross-feature-learning` | Turns recurring findings into reviewable skill/contract amendments |

Everything below explains what happens *underneath* these verbs, so you can follow along, intervene intelligently, or invoke a stage skill directly when you know exactly what you need.

---

## 2. Stage 0 — Repo onboarding (once per repo)

```
/new-project-setup
```

| Skill | Role | Invoked by |
|---|---|---|
| `new-project-setup` | Creates/updates adapter guidance, installs skills + hooks, verifies readiness, stops at READY | **You** |
| `project-config-init` | Scaffolds `project.config.yaml` (commands, DB policy, source globs) — the file the hooks and deploy/verify skills read | setup, or you directly |

Do not skip `project.config.yaml`: the deterministic guard hooks (DB-change, secrets, SQL, tests, lint) and `local-deployment`/`deploy-app` are configured by it.

---

## 3. Stage 1 — Classify before anything else

Every `/feature-life-cycle` run starts with `process-classifier`, which picks one of four paths and writes the autonomy envelope (objective, constraints, freedom, evidence required, escalation triggers). The path decides how much ceremony you owe:

| Path | Use when | Ceremony |
|---|---|---|
| **Discovery** | Product bet / requirements unstable | Explore first; specify later |
| **Light** | Small bug/fix/enhancement on stable contracts | Focused test + implementation + focused review. **No** BRD, no data model, no phased plan |
| **Standard** | Several FRs on an existing system | Lean requirements slice + touched-contract amendments + LLD/tests where needed |
| **Full** | Greenfield, major module, regulated / money / data-sensitive | Full specification zone with Gates A/B/C |

**Anti-pattern to avoid:** forcing full-path ceremony onto a one-file fix, or sneaking a module-sized change through the light path. If mid-work the job turns out bigger, update the classification — don't silently inflate the artefacts.

---

## 4. The four playbooks

### 4a. Discovery path — "we don't know what to build yet"

| Step | Skill | Invoked by |
|---|---|---|
| Explore the idea space | `discovery-zone` | You or lifecycle |
| Stress-test a risky direction | `adversarial-idea-evaluator` (5-advisor council) | You, when stakes justify it |
| Promote selected candidates | promotion gate → `requirements-capture` / `brd-generator` | Lifecycle |

Raw discovery notes never become the BRD directly — only promoted items enter specification.

### 4b. Light path — "small change, stable contracts"

| Step | Skill | Invoked by |
|---|---|---|
| Confirm objective + touched area | (classifier output) | Lifecycle |
| Focused test / reproduction case | — | Executor |
| Implement by goal | `phase-executor` | Lifecycle |
| Sized visual pass *if the change is visual* | `uiux-designer` (Level 1–2) | Lifecycle |
| Fast anti-pattern scan | `vibe-coding-guardrails` | You or lifecycle, pre-review |
| Focused review (if risk justifies) | `full-review <target> no-fix` | Lifecycle |
| Traceability note + done report | — | Lifecycle |

### 4c. Standard path — "several FRs on an existing system"

Run in this order (the lifecycle does this for you):

1. `requirements-capture` — lean requirements slice (FRs, acceptance criteria, verb-to-surface map)
2. `gap-analysis` / `brd-coverage` — classify each requirement against existing code: EXISTS / PARTIAL / MISSING / CONFLICT
3. `contracts-generator` — amend only the touched contracts (API, auth matrix, error taxonomy, state machines)
4. `uiux-designer` — only if a user-facing surface is new or materially changed; produces the handoff the LLD references
5. `lld-generator` — implementation-grade spec for changed FRs that need it
6. `test-case-generator` — acceptance cases and executable tests
7. `phased-planner` — only if dependency ordering matters (then optionally `plan-to-pipeline` for a gated, resumable harness)
8. `phase-executor` — one goal per phase, inside the autonomy envelope
9. `quality-gate-checker` — fresh-context gate on changed formal artefacts
10. `brd-coverage` + `full-review no-fix` + `cross-fr-review` — verification

### 4d. Full path — "greenfield / major / regulated"

The v7-style specification zone, in order, with fresh-context gates:

| # | Stage | Skill | Gate |
|---|---|---|---|
| 1 | Requirements / BRD | `brd-generator` (+ `brd-data-modeler` for schema) | **Gate A** |
| 2 | Data model | `brd-data-modeler` | **Gate B** |
| 3 | Architecture | `architecture-doc-generator` | |
| 4 | Guidelines | `guidelines-generator` | |
| 5 | Contracts | `contracts-generator` | **Gate C** |
| 6 | Gap analysis (brownfield) | `gap-analysis` | |
| 7 | UX/UI design + handoff | `uiux-designer` (Level 3–5) | handoff validation |
| 8 | LLD + white-box test specs | `lld-generator` | |
| 9 | Acceptance cases | `acceptance-test-generator`, `test-case-generator` | |
| 10 | Phased plan | `phased-planner` (+ `plan-to-pipeline` for long runs) | |
| 11 | Implementation | `phase-executor` per phase | |
| 12 | Reviews | `full-review`, `cross-fr-review` | |
| 13 | Traceability + completion | `brd-coverage`, done report | |

All gates run through `quality-gate-checker` **as a fresh-context subagent** — the producer of an artefact never grades its own work. `PASS` → proceed; `CONDITIONAL` → proceed with recorded caveat; `BLOCKED` → route back to the producing skill, retry within budget, then escalate.

Throughout specification, `agent-insights-pass` runs on the **advisory track**: it surfaces world knowledge ("industry typically adds…", "common edge case is…") into a ledger. It never edits the spec; accepted insights enter via amendment.

---

## 5. Build stage — what runs while code is being written

| Skill | Role | Invoked by |
|---|---|---|
| `phase-executor` | Implements one approved goal inside the envelope; may choose the route, may not touch requirements/contracts/acceptance tests | Lifecycle |
| `pipeline-orchestrator` | Internal state machine (manifest, gates, traceability) | Internal — never invoke directly |
| `vibe-coding-guardrails` | <60-second static scan for AI-coding anti-patterns (hardcoded strings, `any`, secrets, swallowed errors, missing states) | You, after a coding burst |
| `debugging-playbook` | When something breaks: 60-second environment baseline, then symptom → ranked causes → one discriminating experiment | You / executor, on failure |
| Deterministic hooks | DB-change guard, secrets guard, SQL validation, touched tests, lint — run automatically on every edit | Harness |

**Guard-override etiquette** (enforced doctrine): when a hook blocks you, surface it and wait for the user; only the user approves an override; prefer a diffable allowlist file over an env var; never override the secrets guard.

---

## 6. Verify & review stage

| Skill | What it checks | Invoked by |
|---|---|---|
| `full-review` | Conductor: report-only by default, repair is explicitly opt-in | **You** |
| `ui-review` | Accessibility, responsive, dark mode, empty/loading/error states, against the UX handoff | full-review / sanity-check |
| `quality-review` | Requirements mapping, API contracts, schema/migrations, error handling, test coverage (executed counts, not "green") | full-review / sanity-check |
| `security-review` | Auth coverage, authorization/IDOR, injection, secrets, OWASP | full-review / sanity-check |
| `infra-review` | Boundaries, performance, reliability, Docker/CI/CD, deploy readiness | full-review / sanity-check |
| `cross-fr-review` | Conflicts *between* FRs: shared tables, transaction boundaries, drift | Lifecycle, after all FRs pass individually |
| `brd-coverage` | Every requirement line-item → code + test; gap list, traceability verdict | Lifecycle / you |
| `sanity-check` | After remediation: builds, tests, regression re-verification of critical findings | You, post-fix |
| `local-deployment` | The app actually runs: step-gated bring-up, full-dependency-path probe | **You**, before "done" |

**Review discipline:** report first, repair separately. Repair fixes implementation bugs only — specs, contracts, and acceptance tests change through the amendment workflow, never to make a failing implementation pass.

---

## 7. Ship stage

| Step | Skill | Invoked by |
|---|---|---|
| Assemble the human approval package (release notes, traceability, CI + scan results, rollback plan) | `release-readiness` | You / lifecycle |
| Rehearse the demo | `demo-readiness-evaluation` | **You** |
| Deploy + runtime verification (green build ≠ deployed: version identity, liveness + readiness 200s, error-log scan, migration status, traffic distribution) | `deploy-app` | **You**, only after human release approval |
| Check what you may claim externally (README, pitch, status update) | `claims-discipline` | You, before publishing anything |

---

## 8. Maintain & learn stage

| Trigger | Skill |
|---|---|
| After a feature merges: simplify what just changed | `code-cleanup diff` |
| Feature footprint needs restructuring (duplication, missing service layer) | `code-cleanup feature` |
| Before a major release: sweep junk, dead code, abandoned experiments | `code-cleanup repo` |
| Docs drifted from reality | `update-docs` |
| A bug cost >30 min, or a wrong fix shipped | `failure-archaeology` (record the incident, wrong paths first) |
| The same finding keeps appearing across features | `cross-feature-learning` (propose a skill/contract amendment) |

---

## 9. Cross-cutting doctrine — always on, never "remembered"

These load contextually alongside whatever stage is active. You don't schedule them; they define *how* every other skill behaves:

| Skill | Doctrine |
|---|---|
| `verification-doctrine` | Every claim is measured or labeled assumed; "tests green" must be executed counts; schema claims need a live read; line references are re-verified before citing |
| `proof-and-analysis-toolkit` | Prove before acting: falsifiable goal → command → expected shape both ways → decision rule |
| `research-methodology` | A hunch becomes a result only via pre-registered prediction + adversarial refutation; experiment flags resolve to ADOPT or RETIRE |
| `debugging-playbook` | Never guess-debug; discriminating experiments only |
| `claims-discipline` | Claims graded on the evidence ladder: built → demonstrated → certified → proven in production |
| `failure-archaeology` | Consult the incident record before debugging and before deleting anything old |

---

## 10. Scenario cheat sheet

**"Fix this bug"**
`/feature-life-cycle <bug>` → light path → focused test → fix → touched tests → done report. If it's mysterious first: `debugging-playbook` baseline, and check `failure-archaeology` for prior sightings.

**"Add these three features to our app"**
`/feature-life-cycle <request>` → standard path (§4c). Answer the classifier's one question if it asks; otherwise it runs end-to-end and finishes with a done report under `docs/reviews/`.

**"Build a new system"**
`/new-project-setup` (if repo is fresh) → `/feature-life-cycle <system> --path full` (§4d). Expect Gates A/B/C; you'll be asked to approve at genuine escalation points only.

**"Is this safe to ship?"**
`/full-review no-fix` → fix what's found → `/sanity-check` → `/local-deployment` → `/release-readiness` → human approval → `/deploy-app`.

**"The idea is risky — challenge it"**
`/adversarial-idea-evaluator <idea>` before committing spec effort.

**"Clean this repo up"**
`/code-cleanup repo` (dry-run by default; nothing deleted without the confidence-tier consent rules).

**"Production incident happened"**
`debugging-playbook` to triage → fix via light path → `failure-archaeology` entry → `agent-insights-pass 10_production` if the spec missed something → `cross-feature-learning` if it's a recurring class.

---

## 11. What "done" means (every path)

A task is complete only when: the approved objective is satisfied; required tests/checks **ran** and results are recorded (executed counts, not exit codes); changed files are listed; traceability is updated; caveats are resolved, accepted, or deferred with an owner; and remaining risks are stated. The lifecycle writes this as a done report under `docs/reviews/` — if there's no report, it isn't done.
