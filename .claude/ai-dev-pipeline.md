**The AI-Assisted Development Pipeline — v7**

A methodology and executable adapter architecture for traceable, autonomous, AI-driven software development

*Project-agnostic core. Tool-specific adapters for Claude Code and Codex.*

**Contents**

# **1\. Purpose and Founding Principle**

This document defines a methodology for building software with AI coding agents that is **traceable to requirements**, **coherent across many parallel agents**, and **autonomous by default** — running from a feature description to reviewed, integrated code with the least human intervention that still guarantees quality.

The founding observation is simple. An AI coding agent is not a senior engineer. It does not fill gaps in a specification with seasoned judgement — it fills them with its own defaults. Every decision left unspecified is a point of divergence, and divergence **compounds** when many agents work in parallel across different parts of a system, until the integration surface becomes incoherent. The primary failure mode of AI-built software is not poor code in any one file; it is this accumulation of locally reasonable, globally inconsistent choices.

The method therefore front-loads decisions: it makes the architectural, data, interface, security, and behavioural decisions **explicit and reviewable before code is generated**, then proves through tests and review that every line of code traces back to a stated requirement. The investment moves to specification; the payoff is a codebase that does not need a later coherence-recovery phase, and a paper trail that shows it does what was asked.

| An honest statement of the goal The aim is to reduce unspecified decisions, not to claim a mythical zero. Implementation always surfaces some ambiguity; the method's job is to make the \*consequential\* decisions explicit, made at the right fidelity by the right agent, and to surface the rest as a flagged question rather than a silent default. Traceability proves consistency — that requirement, design, test, and code agree. It does not by itself prove correctness: if the specification is wrong, consistent code is confidently wrong. Correctness comes from the quality of the specification (a human responsibility), the two independent test oracles, and the effectiveness metrics in §10. Hold both ideas at once. |
| :---- |

# **2\. When to Use This Pipeline**

The full method earns its overhead when **coherence and traceability are worth paying for**. It is over-engineered for a one-off script. Match the process weight to the work.

| Use the full pipeline when… | Use the light path (§13) when… | Don't use it when… |
| :---- | :---- | :---- |
| Multiple functional requirements built in parallel, where interface coherence matters. | A single, well-bounded change to an existing system. | A throwaway script, spike, or exploratory prototype where the goal is learning, not a durable artefact. |
| Traceability is a requirement — regulated, audited, safety- or money-adjacent software. | A bug fix or small enhancement with a clear, local blast radius. | Requirements are genuinely unknown and will be discovered only by building — specify after, not before. |
| A new system or major feature where the data model and contracts set the foundation. | Work that touches one or two files behind an existing, stable contract. | A team with no one able to own and review the specification (see §4). |

The method is **tiered, not all-or-nothing**. Even on a full build, per-requirement design depth is calibrated to risk (Tier 1/2/3 — see Stage 6), and small changes route through the light path in §13. The expensive, genuinely necessary core on any build is the **contract layer** — the shared interface decisions that parallel agents cannot coordinate among themselves. Per-requirement depth scales down from there.

# **3\. Getting Started**

The pipeline is driven by one orchestrator that sequences specialist sub-skills, verifies each result, threads requirement IDs through every artefact, and keeps run state in a **manifest** file. The normal interaction is a single instruction naming the feature or pointing at a requirements document; the run then proceeds on its own, addressing a human only when the Escalation Contract (§5) requires it.

### **Initiating a new project**

A guided setup routine prepares a repository so the pipeline can run. It detects whether the project is **new** (no established architecture) or **existing** (adopting the method into a codebase), then:

1. Captures the **architecture** — choose a common stack preset, define your own, or point to an architecture document you have already written. This is the one foundational decision a human confirms up front.

2. Generates a tailored project guidance file (see the model below) and a machine-readable **project configuration** that the orchestrator and the enforcement hooks read.

3. Installs the skill chain and the enforcement hooks, then verifies readiness.

4. Stops at a **READY** checklist. The operator places the requirement documents and starts the run.

**Order matters:** the project configuration is written \*before\* the enforcement hooks are installed, because the hooks read it at runtime for the project's database-change policy and its list of sensitive resources. The configuration and the project guidance file are what make the method portable — project specifics live there, never hardcoded in the skills.

### **A model project guidance file**

This file is loaded into the agent's context on every session, so it is the cheapest always-on layer of guidance. The setup routine generates it from a template; the skeleton (placeholders in angle brackets):

\# Project guidance   (loaded every session)\#\# Golden rules1. Database change policy: \<migrations | direct-to-database\>. \<one-line policy\>2. Data access lives in \<data layer\>; business logic in \<service layer\>.3. Use the agreed import/path conventions, not deep relative paths.4. Secrets only via environment variables; never hardcode, never commit secret files.5. Announce destructive or sensitive data changes in \<channel\> before running them.6. Every change traces to a requirement; no requirement without a test.\#\# StackRuntime / API · Frontend · Data store · Auth · Deployment\#\# Commandsdev · build · test · type-check\#\# Database change policy — \<policy\>Schema source of truth: \<location\>; verify with \<command\>.Sensitive resources (extra approval): \<list\>.   Forbidden commands: \<list\>.

The setup routine performs the install with safety checks — it refuses archives whose entries contain absolute or parent-directory paths, and never overwrites a hand-edited guidance file, settings, or an existing skill without showing a difference first.

# **4\. Roles and Ownership**

The method's quality ceiling is set by the people who own the specification. Name these roles before the first run; do not assume they emerge from the team organically.

| Role | Owns | Why it matters |
| :---- | :---- | :---- |
| Specification owner (architect) | The Specification Zone (Stages 1–5), and sign-off authority at the quality gates. | The data model and contracts demand someone who knows the system's security posture, expected load, and integration topology. Rushed here, agents fill gaps in the spec — carrying false confidence downstream. |
| Decision owner | Resolving the four Escalation Contract conditions promptly. | Autonomy assumes a decisive human at the escalation point. A blocked, un-owned decision freezes downstream work. |
| Operator | Running the pipeline, monitoring the manifest, triaging escalations. | Keeps the autonomous run moving and routes exceptions to the right owner. |

**The bottleneck to watch:** downstream parallelism is bounded by upstream sign-off throughput. If many requirements need design and review but only one person can approve the contracts, the pipeline quietly compresses back into a sequential process with extra documentation. Staff the specification-owner role deliberately, and tier design depth (Stage 6\) so that low-risk requirements need little of that scarce attention.

# **5\. The Escalation Contract**

Autonomy is bounded by a short, explicit contract. The run stops and surfaces to a human in **exactly four** situations; in every other case it proceeds automatically. These four are the definition of “a human is genuinely required.”

| \# | Hard-stop condition | Why it must stop |
| :---- | :---- | :---- |
| 1 | **Destructive or irreversible data operation** — schema drops, column-dropping changes, large updates/deletes, or any change touching a configured sensitive resource. | Data loss is not recoverable by re-running the pipeline. Enforced deterministically by a hook (§6). |
| 2 | **Unresolved specification ambiguity** — an agent flags a genuine ambiguity that one automatic resolution from existing artefacts cannot settle. | A silent default here is exactly the divergence the method exists to prevent. |
| 3 | **A quality gate that stays BLOCKED** after the configured number of automatic remediation cycles. | The producing skill could not self-correct; proceeding would build on a known-incomplete specification. |
| 4 | **Foundational architecture selection** on a new project with no configuration. | Runtime, deployment, auth, and API-style choices are expensive to reverse and deserve one human confirmation. |

| Graceful degradation — an escalation must not freeze the whole run When a single requirement escalates (an ambiguity that cannot be resolved, or a gate stuck after its remediation budget), quarantine that requirement and continue the others. One blocked item must not halt the parallel build. Time-box the escalation and route it to the named decision owner (§4). If it cannot be resolved in the window, the requirement is deferred to a follow-up cycle with its state recorded — not left to block indefinitely. A CONDITIONAL gate verdict is not an escalation: the run proceeds, and the caveat is tracked in the ledger (§8) to be closed before handoff. |
| :---- |

### **Build-time stops vs. ship-time gates**

The four conditions above are **build-time** stops — they govern producing the code. Shipping it has its own mandatory human gates, which automation should prepare but never assume. Keep these distinct from the Escalation Contract:

| Ship-time human gate | What the human owns (the agent prepares the evidence) |
| :---- | :---- |
| Release approval | The decision to deploy — the agent assembles the release notes, the traceability matrix, and the test/scan results; a human approves the go. |
| Final UX judgement | Whether the experience feels right. Baseline interaction quality is enforced automatically (§13/Part II); taste stays human. |
| Security / risk acceptance | Accepting any residual risk a scan or review surfaced but could not auto-resolve. |
| Regulatory / compliance interpretation | Whether the implementation satisfies a regulation — a judgement the agent can inform but not make. |

# **6\. The Complete Pipeline**

Ten stages in five zones. Specification (Stages 1–5) is produced once per project and reused across all requirements. The Planning Bridge turns the specification into a gap-aware build plan. Generation is per-requirement and parallel. Verification proves each requirement and then the whole. A feedback loop keeps the artefacts alive.

| Stage | Produces | Gate |
| :---- | :---- | :---- |
| Zone A — Specification |  |  |
| 1  Requirements (BRD) | Roles, workflows, functional requirements, NFR thresholds | ◈ A |
| 2  Data Model | Entities, relationships, constraints, access rules | ◈ B |
| 3  Architecture | Runtime, deployment, auth, API style, structure | — |
| 4  Guidelines | Coding · UI · Security · Performance standards | — |
| 5  Contracts | The ten-item interface/behaviour contract package | ◈ C |
| Zone B — Planning Bridge |  |  |
| 5.5  Gap Analysis | EXISTS / PARTIAL / MISSING / CONFLICT per requirement | — |
| 6  LLD \+ Test Spec | Tiered design \+ white-box test oracle per requirement | — |
| 6a  Acceptance Cases | Black-box acceptance / E2E suite from the requirements | — |
| 6b  Phased Plan | Dependency-ordered build order | — |
| 6c  UX/UI Design \+ Handoff | Screen specs, aesthetic direction, design tokens, validated developer handoff — *user-facing requirements only* | — |
| Zone C — Generation |  |  |
| 7  Code \+ Tests | Implementation \+ tests, one agent per requirement, parallel | — |
| Zone D — Verification |  |  |
| 8  Individual Review | Per-requirement review \+ code-health pass | — |
| 9  Integration Review | Cross-requirement conflicts \+ end-to-end acceptance run | — |
| Zone E — Feedback |  |  |
| 10  Feedback Loop | Production observations → artefacts (ongoing) | — |

Three formal quality gates remain — after Requirements (A), the Data Model (B), and the Contracts package (C) — because those artefacts set the quality ceiling for everything downstream. They are **executed by a checker skill, not a person**: it evaluates the checklist, records the verdict, and the run proceeds on PASS or CONDITIONAL. A human is pulled in only when a gate stays BLOCKED after its remediation budget (Escalation \#3). A passing gate needs no keystroke, but the checklist still runs and is still recorded — automating the keystroke is not skipping the check.

## **Enforcement layers — prevention, detection, enforcement**

Beyond the gates, quality is held by three layers, in priority order. Being explicit about which mechanism does which job prevents the common error of leaning on review — or hoping a hook will help — for work that belongs at build time.

| Layer | Mechanism | What it catches |
| :---- | :---- | :---- |
| 1 · Prevention (build-time) | Guidelines \+ Contracts \+ design in the agent's context; the project guidance file reloaded every turn; a self-check before each change is proposed | Most adherence — the agent writes to standard because the standard is in front of it |
| 2 · Detection (review) | Stage 8 review skills | Judgment-based residue: right pattern? accessible? authorisation correct? |
| 3 · Enforcement (hooks) | Deterministic event-driven hooks | Mechanical, binary rules only: lint, syntax, secrets, destructive data ops, change-policy |

Push adherence **left**. The Guidelines Package is a build-time input — one source feeding both the design generator (so each design names the exact pattern to use) and the reviewers (so they check the same standard) — which means the agent follows the guidelines while coding and review stays a thin safety net. Hooks are not a substitute: a hook fires after an action and can only warn or block; it cannot judge quality or make the agent write better code. Hooks enforce the binary floor — advisory lint/syntax/test feedback during generation, and blocking guards for the binding rules (destructive data operations, change-policy violations, hardcoded secrets), each block-with-override and logged. They are config-driven, so they enforce each project's own policy.

# **7\. Stage-by-Stage Detail**

## **Zone A — Specification (produced once, reused by every requirement)**

### **Stage 1 — Requirements**

Capture the **what** and **why** with no implementation detail: the business problem and success criteria, every user role, the core workflows with a happy path and at least one failure case, uniquely identified functional requirements, non-functional requirements with concrete thresholds (not “fast” — a number), explicit out-of-scope boundaries, and a glossary of domain terms. Every gap here propagates downstream, so Gate A is strict. **Gate A** confirms: every role named; every workflow has a happy and a failure path; every requirement has a unique ID and references only defined entities and roles; NFRs carry numbers; out-of-scope is explicit; no duplicate requirements; every external system is named.

### **Stage 2 — Data Model**

Convert the requirements' vocabulary into concrete structures: entities and relationships with cardinality, a status enumeration for every stateful entity, referential constraints with deletion behaviour, indexes, and access rules. Document decisions, assumptions, and an explicit gap list; link each element to the requirements it serves. The **database-change policy is read from the project configuration**: most projects use standard migration files; some pre-launch projects deliberately apply changes directly to the database and update the schema source by hand — either way, the policy is enforced by a hook, and any destructive change or change to a sensitive resource is Escalation \#1. **Gate B** confirms every entity, relationship, status, and constraint from the requirements is represented, assumptions are documented, and the schema is valid.

### **Stage 3 — Architecture**

Define where code runs and how components connect: runtime and framework, deployment target, authentication approach and session model, API style and versioning, module structure with example paths, service boundaries, background-job and storage strategy, caching, and a named observability stack. On an **existing** project this stage \*describes\* the established architecture; on a **new** project it \*decides\* it, from the choices confirmed at the bootstrap gate (Escalation \#4). Either way the output is the single reference every downstream design names by name, so coding agents make the same structural choices because they are no longer choices.

### **Stage 4 — Guidelines**

Four standards documents — Coding, UI, Security, Performance — that answer “how should this be written?” The same files feed both the design generator (so agents build correctly) and the review skills (so reviewers check identical standards): one source, two consumers. They cover naming, error-handling and logging contracts, async patterns, the component library and design tokens, accessibility, the mandatory security checks, and the performance rules (pagination, query bounds, index usage, response-time targets).

### **Stage 5 — Contracts**

Where guidelines say \*how\* to write code, contracts say \*what\* the code must do. Ten machine-readable items, each carrying dependency metadata, each neutralising a specific class of multi-agent incoherence:

* **API contract** — endpoints, request/response shapes, status codes, the pagination envelope, the error format.

* **Authorisation matrix** — role × resource × operation, plus which endpoints are public or service-to-service.

* **State machines** — valid states and transitions for every stateful entity, who may trigger each, and side effects.

* **Integration map** — every external service, its wrapper, failure handling, and test-double strategy.

* **Error taxonomy** — named error types, which are user-visible vs. logged, which trigger alerts.

* **Testing contract** — required test types per tier, coverage expectations, the definition of “passing” before merge.

* **Environment contract** — every configuration variable, required vs. optional, and how it is accessed.

* **Shared-utilities inventory** — the utilities, validators, middleware, and components agents must reuse, not re-create.

* **Dependency register** — approved libraries per concern, prohibited libraries with reasons, version constraints.

* **NFR thresholds** — the actual numbers: response-time targets, page sizes, upload limits, retention, accessibility standard.

**Gate C** confirms every requirement has an API entry; every role and resource appears in the auth matrix; every stateful entity has a state machine; every external service has a test-double strategy; every error type has a handling strategy; the environment is complete; and — a pre-check for Stage 9 — no two requirements share a transition with incompatible side effects.

## **Zone B — Planning Bridge**

### **Stage 5.5 — Gap Analysis**

On an existing codebase, map the signed-off specification onto what already exists before designing anything: classify every requirement as **EXISTS** (implemented, with file references), **PARTIAL** (needs modification), **MISSING** (new work), or **CONFLICT** (existing code contradicts the spec). This is what stops the pipeline re-implementing working code: EXISTS items are excluded from design and the build plan; CONFLICT items get an early migration phase; positioned after contracts are frozen but before designs proliferate, it is the cheapest point to prevent two agents reinventing the same utility with incompatible interfaces.

### **Stage 6 — Low-Level Design \+ Test Specification**

For each gap requirement, produce a **tiered** design precise enough that the coding agent implements by following instructions, not by making decisions — naming exact entities, endpoint conventions, authorisation rows, error types, components, and **the exact guideline pattern to apply** for each piece, so the agent follows the guidelines by following the design. Depth scales with risk:

* **Tier 1 (simple):** endpoint signature, specific data operations, happy path.

* **Tier 2 (moderate):** full endpoint spec, named-field queries, all taxonomy error cases, component tree, authorisation check.

* **Tier 3 (complex):** adds a state-machine diagram, transaction boundaries, external-service sequence, performance notes with index references, and a full test-scenario table.

Alongside each design the generator emits a **Test Specification** — a structured table of (scenario, design element validated, input, expected outcome). This is the **white-box test oracle**: tests derived from the design. The code generator receives both, so review verifies test passage rather than comparing code to design by eye. An ambiguity the artefacts cannot resolve triggers Escalation \#2.

### **Stage 6a — Acceptance & Functional Test Cases**

The pipeline runs **two test oracles with different sources**, by design, because a single oracle derived from the design has a blind spot the project cannot afford.

| Oracle | Derived from | Proves | Blind spot it removes |
| :---- | :---- | :---- | :---- |
| White-box (Stage 6\) | The design | The code does what the design says | If the design is wrong, code and tests are wrong together and agree. |
| Black-box (Stage 6a) | The requirements | The code does what was asked | Independent of the design — catches requirement-vs-implementation divergence. |

Generated from the requirements (with the contracts as context), the acceptance suite is traceable per requirement and covers every happy path, every named failure, boundary and data-integrity invariants, full authorisation coverage, and cross-requirement end-to-end workflows; UI flows are emitted as runnable end-to-end specs. It runs at acceptance (Stage 9). If a case cannot be derived because an acceptance criterion is vague, that is flagged back as a requirements gap rather than invented.

### **Stage 6b — Phased Plan**

Order the gap work into dependency-ordered phases: CONFLICT/migration first, then PARTIAL modifications, then MISSING new work in data → service → API → UI order, tests co-located in each phase. This gives the executor an explicit topological order.

### **Stage 6c — UX/UI Design \+ Developer Handoff** *(conditional — user-facing requirements only)*

Runs only for requirements with a real user-facing surface; backend-only, API-only, and non-visual requirements skip it entirely. Where it applies, it produces — before the UI is generated — the **screen-by-screen specification, a chosen aesthetic direction, a design-token system, and a structured developer handoff** (validated by the skill's handoff validator). The project's design-token system and aesthetic direction are decided once and reused (the deeper realisation of the design tokens named in the Stage 4 UI guidelines); the screen specs are per-requirement. A user-facing LLD (Stage 6\) references this handoff rather than re-deriving the interface, and the executor (Stage 7\) builds against the tokens and states rather than improvising them.

This stage is the build-time answer to the no-skeleton-UI rule: real fields, data rendering, every state (empty, loading, error, success, permission, offline), accessibility behaviour, and the visual system are **decided here, as inputs**, not discovered during code review. The handoff is the **design↔code contract** — the executor consumes it the way it consumes the API and auth contracts, and Stage 8/9 review and the acceptance suite verify against it.

It is also where the pipeline's founding principle is most visible. The boundary is prescribed and non-negotiable — every screen traces to a requirement or user goal, every required state is covered, WCAG AA contrast and keyboard/focus behaviour hold, and the existing guidelines, design system, and contracts are honoured — but the route is deliberately left free: the aesthetic direction, information architecture, flow, components, and motion are the design skill's to imagine. Surplus product ideas it surfaces go to the Advisory Track (§35.7), never into silently widened scope. Like every other Zone B output, weight scales with the work (§13): a sized pass on light changes, a handoff for the changed screens on standard work, and a full handoff — and, when requested, a built frontend against the tokens in the current coding agent — on full work.

## **Zone C — Generation**

### **Stage 7 — Code and Test Generation**

Dispatch one coding agent per requirement, each in an isolated workspace, each receiving the **full specification package** — design, test spec, the requirement's slice of the acceptance cases, guidelines, contracts, data model, architecture. Because every decision is pre-resolved, parallel agents make no conflicting choices. Each pull request is gated through a reviewer sub-agent and merged in dependency order; integration tests run after each merge; failures roll back and retry before escalating.

**Build-time adherence self-check (before each pull request).** Because prevention beats detection, each agent verifies its output against the relevant guideline sections and its design's named patterns before opening the request — correct component/loading/error patterns, authorisation matching the matrix, only taxonomy error types, structured logging, paginated and indexed queries, no hardcoded secrets. Violations are fixed by the author, making the author the first reviewer and shrinking what review and hooks must catch.

| Spec-version pinning — the rule that makes parallel generation safe under change Each agent pins the version of every specification artefact it built against, recorded in the manifest. Parallel agents must not silently work from different snapshots. When an artefact is amended mid-flight (§9), the orchestrator computes which in-progress requirements depend on the changed element and re-dispatches only those against the new version; unaffected agents continue. Integration review (Stage 9\) checks spec-version consistency across all merged requirements. A requirement built against a superseded contract is treated as a stale edge (§8) and rebuilt — this is the defence against the “two subtly different worlds” failure of parallel development under evolving requirements. |
| :---- |

## **Zone D — Verification**

### **Stage 8 — Individual Review**

Each pull request already passes the executor's reviewer (tests pass, coverage matches the test spec, lint clean). After all requirements merge, a full review runs the deeper semi-automated pass: guidelines honoured by category, every authorisation row correctly implemented, only taxonomy error types used, each design element cross-referenced to its implementation, and — for Tier 3 — state-machine implementation matching the diagram. It also confirms the requirement's slice of the acceptance cases passes — the independent-oracle check. A **code-health pass** then strips duplication, dead code, and over-engineering and enforces layering; it does not restructure correctness, it keeps the generated code clean for the next cycle.

### **Stage 9 — Integration Review**

Runs only after every requirement passes Stage 8, because it needs the complete codebase. It catches what individual review cannot: shared-resource conflicts (incompatible transaction boundaries, missing locks, inconsistent soft-delete), state-machine races and conflicting side effects, external-service rate-limit and error-handling conflicts, and contract drift (response shapes, error codes, auth patterns introduced during generation). It is **a remediation loop, not a one-shot checkpoint**: a detected conflict routes back to the responsible requirement via the amendment workflow (§9 below) and re-enters Stage 8 for that requirement alone. This is also where the **cross-requirement acceptance and end-to-end cases** run against the integrated, running system — the workflows no per-requirement test can exercise.

# **8\. Requirement Traceability**

Traceability is the acceptance bar, so it gets its own stage. After integration review, a **traceability matrix** links, for every requirement, the full chain from requirement to code and back. A run is not complete until the matrix has no broken edges in either direction — no requirement without code, and no code without a requirement.

| Column | Answers | Source |
| :---- | :---- | :---- |
| Requirement ID | Which requirement is this row? | Requirements (Stage 1\) |
| Data model | Which entities serve it? | Data Model (Stage 2\) |
| API \+ auth | Which endpoint and authorisation row? | Contracts (Stage 5\) |
| Design | Which design specifies it? | LLD (Stage 6\) |
| White-box tests | Do the design-derived tests pass? | Test Spec (Stage 6\) |
| Acceptance cases | Is it verified independently of the design? | Acceptance suite (Stage 6a) |
| Code | Which files implement it? | Generated code (Stage 7\) |
| Verdict | Did it pass review and acceptance? | Stages 8–9 |

| The matrix proves consistency, not correctness — and a stale edge is worse than a missing one A green matrix proves the chain is \*consistent\*. It does not prove the requirement was \*right\*. Correctness is a human and test-oracle responsibility (§1, §10); the matrix is necessary, not sufficient. A broken edge is honest: a requirement with no code is unbuilt work; code with no requirement is unrequested scope. Both block handoff. A stale edge — a link that still \*looks\* intact but points at a superseded artefact version — is the dangerous case. Because every specification element carries a version and every implementation records the version it built against, the matrix flags any edge whose endpoints disagree on version as stale, and the requirement is rebuilt. Never trust an edge's existence alone; trust its versions. |
| :---- |

The handoff stage also closes the **caveat ledger**: every caveat raised by a CONDITIONAL gate is registered with status open → resolved/accepted, and the run may not be certified “done” while any caveat is still open. A caveat is closed by a later stage discharging it (and the gate re-checking), by a verification-time check, or by an explicit human acceptance with a rationale — deferred to the cheapest moment, never silently dropped.

# **9\. The Amendment Workflow**

When a later stage — or a production observation — reveals a defect in an earlier artefact, the fix is **targeted surgery, not a full re-run**:

5. **Identify the changed element precisely** (e.g. “add a refunded state to the order-status enumeration”).

6. **Walk the dependency graph** from that element: a data-model change cascades to API entries, authorisation rows, state machines, and affected designs; a role change to the auth matrix and access rules; a guidelines change to the affected-tier designs; an NFR change to designs with performance specs.

7. **Regenerate only the affected elements**, bump their version, re-enter the pipeline at their stage, and re-run the relevant gate. In-flight agents depending on a changed element are re-dispatched against the new version (Stage 7); the rest continue.

8. **Update dependency metadata** so future cascades from this element are correct.

| Dependency tracking is best-effort — the gates and the version check are the backstop Cascade detection depends on dependency metadata being tagged completely, and AI systems tag it imperfectly. Partial tracking catches the majority of cascades and reduces manual effort, but it is not a guarantee. Never skip a gate or the stale-edge version check because the dependency graph reports nothing downstream. The graph reduces work; the gates and the version-consistency check in the traceability matrix are what catch what the graph misses. |
| :---- |

# **10\. Measuring Effectiveness**

A methodology that asserts rigour without measuring it risks the worst outcome: a **veneer of rigour** — coherent-looking, traceable artefacts around quietly flawed software. Instrument the pipeline so the team can tell whether it is actually paying off, and where the specification is weak. Track these per run and as trends.

| Metric | What it tells you | Healthy direction |
| :---- | :---- | :---- |
| First-pass test rate | Share of requirements whose generated code passes its tests with no rework | High and rising — the specification is doing its job |
| Agent clarification rate | How often agents flag ambiguity during generation | Low — high means the contracts/designs are under-specified |
| Rework rate | Requirements re-entering Stage 8 after a failed review or integration conflict | Low and falling |
| Escalation frequency | Human stops per run, by Escalation type | Low and stable; spikes point at a weak upstream stage |
| Gate remediation cycles | Auto-fix attempts before a gate passes | Low — the producing skill is getting the artefact right |
| Traceability completeness | Share of requirements fully linked, no broken or stale edges | 100% required at handoff |
| Caveat-ledger age | How long caveats stay open | Short — long-lived caveats are hidden debt |
| Escaped defects | Production bugs traced back to a stage that should have caught them | Low — and each one updates that stage (Stage 10\) |

| Validation is deferred until code exists — so validate the specification deliberately The method's central honest weakness: you cannot fully confirm the specification is \*right\* until code exists and is reviewed. Do not pretend otherwise — instrument around it. Mandatory first step before trusting the pipeline: run one real functional requirement end to end — requirements → a contracts slice → design → generated code \+ both test oracles → review — in a single sitting. If the design is specific enough that a coding agent produces passing tests with zero clarifying questions, the contracts are eliminating ambiguity. If the agent asks questions or produces structurally wrong code, you have learned exactly which contract items are under-specified — the cheapest possible validation of the whole premise, and the metrics above are the ongoing version of it. |
| :---- |

# **11\. Artefact Types and Metadata**

The pipeline produces two kinds of artefact, and the distinction drives dependency tracking, version pinning, and traceability.

**Document artefacts** are human-readable files for review and sign-off — the data-model document, the architecture document, the guidelines. They are checked at quality gates.

**Specification artefacts** are structured files consumed directly by downstream skills and coding agents — the schema, the API contract, the authorisation matrix, each design, each test spec. They carry dependency metadata linking every element to the upstream elements it depends on, plus a version, which is what makes amendment cascades, version pinning, and stale-edge detection computable rather than manual:

\# metadatasource\_requirement: \[R-012, R-018\]   \# which requirements this element servesdepends\_on: \[data\_model.orders,       \# upstream elements this references             auth\_matrix.member.orders.create\]version: 3last\_updated: \<date\>

Every significant element of a specification artefact emits this block. Document artefacts need only standard front-matter.

# **12\. How Skills and Hooks Integrate into the Lifecycle**

The lifecycle is not a document a team follows by hand — it is operated by composable **skills** (each performing one stage) and enforced by deterministic **hooks** (firing on tool events). One orchestrator sequences the skills and keeps state in the manifest; the hooks run underneath, independent of the orchestrator. Three layers of skill operate together:

* **Generators** — one per specification and design artefact (requirements, data model, architecture, guidelines, contracts, gap analysis, design \+ test spec, acceptance cases, plan).

* **Executors and reviewers** — the multi-agent code generator, the per-requirement reviewer and full review, the integration review, the code-health and traceability passes, the end-to-end runner.

* **Gate and support skills** — the quality-gate checker, the project-setup routine (the `project-setup` skill was superseded by `new-project-setup`, 2026-07-08), and the orchestrator that ties it all together.

### **Each stage is performed by a skill**

| Lifecycle stage | Performed by (skill role) | Output it hands downstream |
| :---- | :---- | :---- |
| 1 Requirements | Requirements generator | The requirements set \+ gate-A check |
| 2 Data Model | Data-model generator | Schema \+ gate-B check |
| 3–5 Architecture / Guidelines / Contracts | Architecture, guidelines, contracts generators | The specification package \+ gate-C check |
| 5.5 Gap Analysis | Coverage / gap skill | EXISTS / PARTIAL / MISSING / CONFLICT classification |
| 6 / 6a / 6b Design, Acceptance, Plan | Design generator, acceptance-test generator, planner | Per-requirement designs, both test oracles, build order |
| 6c UX/UI Design (user-facing only) | UX/UI designer | Screen specs, design tokens, validated developer handoff |
| 7 Generation | Multi-agent executor (one agent per requirement) | Implementation \+ tests, merged in dependency order |
| 8 / 9 Verification | Reviewer, full review, code-health, integration review, E2E runner | Per-requirement and cross-requirement verdicts |
| Traceability \+ 10 Feedback | Coverage skill; amendment workflow | The matrix; artefact updates over time |
| Gates A/B/C | Quality-gate checker | PASS / CONDITIONAL / BLOCKED, recorded in the manifest |
| Bootstrap | Project-setup routine | Config, guidance file, installed chain — a READY project |

### **Hooks fire on tool events — underneath the skills**

Hooks are wired to the agent's tool lifecycle, not to pipeline stages, so they apply continuously during generation regardless of which skill is running. This is the enforcement layer (§6, layer 3).

| Tool event | Hook | Action |
| :---- | :---- | :---- |
| Before a file write/edit | Change-policy guard | Block migration-file writes under a direct-to-DB policy, and writes to sensitive resources — block-with-override |
| Before a file write/edit | Secrets guard | Block hardcoded secrets and secret-file commits — block-with-override |
| Before a shell command | Change-policy guard | Block destructive data operations and forbidden commands — block-with-override |
| After a file write/edit | Syntax check (advisory) | Warn on schema/query syntax problems |
| After a shell command | Test runner (advisory) | Run the test suite when source changed |
| End of a turn | Linter (advisory) | Lint changed files; append to a report |

### **How they are installed and wired in**

The project-setup routine (today: the `new-project-setup` skill) performs the integration once, in a deliberate order, and the wiring then runs automatically on every pipeline run:

9. Capture the architecture and write the **project configuration** and **project guidance file** (the config carries the database-change policy, sensitive resources, commands, and escalation thresholds).

10. Install the **skill chain** into the agent's skills location.

11. Install the **hooks** and register them with the agent's settings against the tool events above — **after** the configuration exists, because the guard hooks read it at runtime.

12. Verify readiness. From then on, the orchestrator reads the configuration and the manifest on each run and sequences the skills; the hooks fire on tool events without being invoked. Project specifics live in the configuration and guidance file — the skills and hooks themselves stay generic and portable.

**Build-and-pilot discipline:** validate any new or changed skill on one real requirement before trusting it across a full run — each pilot reveals format requirements that abstract descriptions miss.

# **13\. Scaling by Project Size — the light path**

The principle is invariant — decisions must be explicit before code generation — but process weight scales with the work. Detect complexity from the requirements (count of requirements, entities, roles, integrations) and produce proportionate artefacts. Forcing a small change through the full ten stages is exactly the over-engineering the method must avoid.

| Project size | What runs |
| :---- | :---- |
| **Light** — a single small change or bug fix to an existing system | Gap analysis → a Tier-1 design against the \*existing\* contracts (no new spec zone) → a sized UX pass on the touched screens if the change is user-facing (reusing the existing design tokens) → generate \+ both oracles for the touched requirement → individual review → traceability update. Hours, not days. |
| **Standard** — a feature of several requirements on an existing system | Full pipeline, but most designs Tier 1–2, contracts amended rather than written from scratch, gap analysis doing heavy lifting. |
| **Full** — a new system or major feature | The complete specification zone produced once, the full tiering, both oracles, integration review across all requirements. |

On every size, the **contract layer is the part you do not skip** — the shared interface decisions that parallel agents cannot coordinate among themselves. The light path reuses the \*existing\* contracts rather than writing new ones; it does not abandon them.

# **14\. Known Limitations**

Stated openly; they define the conditions under which the method must be operated carefully.

* **Quality is bounded by the specification owner's competence.** The method amplifies good and poor architectural thinking equally. An incomplete requirements set yields coherent-looking but quietly flawed code. The gates make the competence requirement explicit; they do not substitute for it.

* **Validation is deferred until code exists.** The specification's correctness cannot be fully certified before generation. The single-requirement pilot and the effectiveness metrics (§10) are the mitigation; the traceability matrix is not — it proves consistency, not correctness.

* **Artefacts decay.** Guidelines, contracts, and the data model are correct at creation; libraries, threats, and requirements change. A stale guideline is worse than none because it implies coverage that is absent. The feedback loop (Stage 10\) is the mitigation and requires discipline.

* **Dependency tracking is best-effort.** Partial tagging catches most cascades, not all. The gates and the version-consistency check are the backstop, never an alternative.

* **Coherence cost grows with size.** Keeping many artefacts mutually consistent under change is real work; the amendment workflow, version pinning, and the light path keep it bounded, but on a large evolving system it is an ongoing cost, not a one-time one.

* **Calibrated to current model capability.** Specification depth and expected generation quality assume models at roughly today's level. A markedly more capable model would need less pre-specification and shift more value to lightweight checkpoints; re-calibrate tiers and gate criteria as capability moves.

# **15\. Conditions for Success and Failure**

| Most likely to succeed when… | Most likely to fail when… |
| :---- | :---- |
| A specification owner with architecture experience is staffed before the first run. | The requirements are rushed to reach code generation faster. |
| Gates are treated as genuine checks — automating the keystroke is not skipping the check. | Gates are rubber-stamped, or skipped to save time. |
| A single-requirement pilot validates the contracts before scaling up. | The whole project is the first thing ever run through the pipeline. |
| Effectiveness metrics are tracked and acted on. | No one measures whether the method is paying off — rigour becomes a veneer. |
| Escalations are answered promptly by a named owner and logged as design updates. | Ambiguities are left to silent defaults, or escalations freeze the run. |
| Feedback (Stage 10\) is scheduled alongside planning. | Production feedback is never fed back after the first release. |

# **16\. Glossary**

Plain definitions, so the document stands alone for any reader.

| Term | Meaning |
| :---- | :---- |
| Requirement / functional requirement | A single, uniquely identified thing the system must do. The unit the pipeline plans, builds, tests, and traces. |
| BRD | Business Requirements Document — the Stage 1 capture of what the system must do and why, with no implementation detail. |
| Data model | The entities, relationships, constraints, and states that the requirements imply, expressed as concrete database structures. |
| Contracts | The ten machine-readable interface/behaviour agreements every requirement must honour (API, authorisation, state machines, errors, and so on). |
| Authorisation matrix | A table of who (role) may do what (operation) to which resource. |
| State machine | The allowed states of an entity and the permitted transitions between them, with side effects. |
| Error taxonomy | The named, agreed set of error types and how each is handled (shown, logged, alerted). |
| NFR / NFR thresholds | Non-functional requirements — qualities like performance, security, accessibility — expressed as concrete numbers. |
| LLD (design) | Low-Level Design — a per-requirement specification precise enough that a coding agent implements by following it, not by deciding. |
| Test oracle | The source of truth a test checks against. White-box \= derived from the design; black-box \= derived from the requirements. |
| Traceability matrix | The end-to-end map linking each requirement to its data model, contract, design, tests, code, and review verdict. |
| Quality gate | An automated checklist after a key artefact (Requirements, Data Model, Contracts). Verdicts: PASS, CONDITIONAL, BLOCKED. |
| Escalation Contract | The four — and only four — conditions under which the autonomous run stops for a human. |
| Caveat ledger | The tracked list of caveats raised by CONDITIONAL gates, each open until discharged, accepted, or carried as a logged risk. |
| Hook | A deterministic script that fires on a tool event and can warn or block — the mechanical, binary enforcement layer. |
| Manifest | The single state file that records stage status, gate verdicts, requirement statuses, versions, and escalations for a run. |
| Spec package | The complete set of artefacts a coding agent receives for one requirement: design, test spec, acceptance slice, guidelines, contracts, data model, architecture. |
| Stale edge | A traceability link that still exists but connects artefacts at disagreeing versions — detected and rebuilt, because it looks intact but is not. |

# **17\. The Right Order, and Why**

The sequencing is not bureaucratic. It is the dependency graph of the decisions themselves. A data model cannot be specified before the requirements it serves; a design cannot reference exact entities, endpoints, authorisation checks, and error types before those exist; cross-requirement conflicts cannot be seen before the requirements are built. The method makes this dependency graph explicit, enforces it during specification, runs it autonomously by default, and stops for a human only at the four points where a stop is genuinely required — measuring, all the while, whether the rigour is real.

**Part II**

Making It Executable — the Runtime, Generators, and Reliability Layer

Part I is the methodology. Part II is what turns it from a methodology a team follows by hand into a system that **enforces itself**. The principle throughout: a skill \*describes\* what should happen; software \*guarantees\* it. Wherever the framework currently relies on an agent remembering to update state, pin a version, or run a check, that responsibility moves into deterministic code. The generative work — writing requirements, designs, and code — stays with the agents; the control, validation, and enforcement become executable.

# **18\. The Executable Control Plane**

A single orchestrator runtime owns the deterministic control plane. The skills become callable workers; the runtime owns state, sequencing, and verification. This is the highest-leverage change in the whole framework, because it removes the process from the agent's discretion.

| The runtime owns | Why it must be code, not prose |
| :---- | :---- |
| The stage state machine | Agents cannot skip a stage or run against a stale one. |
| Manifest updates | State is reliable instead of prompt-dependent. |
| Gate execution \+ remediation cycles | A failed gate triggers bounded automatic repair before escalation. |
| Workspace allocation | One requirement per isolated workspace becomes real, not aspirational. |
| Spec-version pinning | Agents cannot silently build against different contract versions. |
| Dependency-graph traversal | Only affected requirements are rebuilt after a spec change (§24). |
| CI result ingestion | The system knows whether code actually passed, from an authoritative source. |
| The escalation queue | Human questions are batched and routed, not fired as interruptions. |

A reference command surface (a thin CLI that records and verifies what the skills produce):

ai-pipeline init                 \# create manifest.json \+ traceability.jsonai-pipeline run \--mode standard \--parallel 4ai-pipeline resume               \# continue from the last incomplete stageai-pipeline gate C \--repair      \# run a gate; auto-remediate on BLOCKEDai-pipeline dispatch FR-014      \# hand one requirement to a coding agentai-pipeline trace \--strict       \# validate broken \+ stale edges (blocks handoff)ai-pipeline impact \--change data\_model.orders   \# which requirements to rebuildai-pipeline validate contracts   \# schema-validate an artefactai-pipeline report               \# generate the markdown report from state

The boundary is deliberate. init, status, gate, trace, impact, validate, and report are pure deterministic operations the runtime performs and is the source of truth for. run, resume, and dispatch are the **agent-integration boundary**: the runtime drives the coding agents through the stages and records their results, but it does not itself write the BRD, the design, or the code. It orchestrates and verifies; the agents generate.

# **19\. Machine-Readable Artefacts and Validators**

For the runtime to validate, regenerate, and trace, the artefacts it consumes must be **structured data, not prose**. The machine-readable file is the source of truth; the human-readable markdown is generated from it, never maintained in parallel. A practical specification tree:

docs/spec/  requirements.yaml      data-model.yaml       architecture.yaml  api.openapi.yaml       auth-matrix.yaml      state-machines.yaml  error-taxonomy.yaml    env-contract.yaml     dependency-register.yaml  nfr-thresholds.yaml    decisions.yaml  traceability.json      spec-graph.json

Each structured element carries identity, version, dependencies, risk tier, owner, and status — the metadata that makes cascades and stale-edge detection computable:

id: FR-014version: 3source\_requirement: \[FR-014\]depends\_on: \[data\_model.orders, api.POST\_/orders, auth.customer.orders.create\]risk\_tier: 2owner: systemstatus: approved

The runtime then validates each artefact against a schema — validate requirements, validate contracts, validate traceability, validate spec-graph — so a malformed or incomplete specification fails fast, before it reaches a coding agent.

| Refinement: machine-readable for what is \*consumed\*, prose for what is \*reasoned about\* Make strict, structured files of the artefacts software consumes: the API contract (as real OpenAPI), the auth matrix, state machines, the environment and dependency contracts, NFR thresholds, and the traceability and spec graphs. Keep prose for what humans reason about — architecture rationale, design intent, and decision memos. Forcing every nuance into YAML throws away the expressiveness that makes those artefacts worth reviewing. The goal is machine-\*checkable\* contracts, not the elimination of human-readable reasoning. |
| :---- |

# **20\. Contract-to-Code and Contract-to-Test Generation**

This is the single highest-quality lever, and it follows directly from machine-readable contracts. Once a contract is structured data, most of the code and tests it implies should be **generated, not written by an agent**. The agent stops "implementing auth" and starts wiring generated auth checks and generated tests. Agent discretion — the source of divergence — drops sharply, and the generated tests are deterministic and exhaustive in a way LLM-written tests are not.

| Contract | Generated output |
| :---- | :---- |
| OpenAPI / API contract | Server stubs, typed client, request/response validators, contract tests |
| Authorisation matrix | Permission tests for every role × resource × operation |
| State machine | Transition validator and illegal-transition tests |
| Error taxonomy | Error classes and a response mapper, with snapshot tests |
| Environment contract | A startup config validator |
| Dependency register | A CI check that blocks unapproved dependencies |
| NFR thresholds | Pagination, query-limit, and performance-threshold tests |

For CRUD-shaped work this is most of the implementation. The agent fills structured values into trusted generators rather than inventing common code each time — which is both faster and far more consistent across requirements.

# **21\. Stack Packs and Golden Paths**

Generators are stack-specific, so they live in **stack packs** — one per supported technology stack. A pack carries the templates, generators, commands, and a small but complete reference implementation that makes a stack a "golden path":

stacks/\<pack\>/  stack.yaml            file-layout.yaml      codegen-rules.yaml  test-commands.yaml    lint-commands.yaml    typecheck-commands.yaml  generators/  (endpoint · repository · service · form · table · auth-test · migration)  reference-implementation/  (create · list · update · soft-delete · role-protected ·                              state-transition · external-service · background-job · audit-log)

The reference implementation enables **pattern tests** — a pattern-check that verifies generated code matches the approved structure: the repository/service/controller split, reuse of shared validators and the approved error mapper, auth-before-data-access, the structured logger, no deep relative imports, no duplicate utilities. This catches the common agent failure of writing plausible but locally-inconsistent code.

| Governance: packs concentrate risk — treat them accordingly A templated generator shifts the failure mode from \*distributed\* (an agent makes a local mistake, review catches it) to \*concentrated\* (a generator is subtly wrong, and every requirement using it is identically wrong — and pattern-check \*passes\*, because the code matches the template that produced it). Therefore: generators and packs need their own tests, versioning, and human review, and pattern-check must validate against an independently-authored reference, not against the generator's own output. Build one pack at a time, for a stack you actually use, and prove the quality lift on real features before adding the next. Seven half-maintained packs are worse than one trusted one. |
| :---- |

# **22\. The CI Gate Layer**

Hooks (§6, layer 3\) are the \*local\* guardrail — they block a dangerous action in-session. They are not the merge gate. The **real** quality gate is CI, run on the pull request against the whole change, because that is the authoritative, un-skippable checkpoint before code enters the main line.

Tier every check explicitly — block stops the merge, warn reports without blocking — and manage flake at this boundary, because a flaky required check that blocks merges erodes trust until the whole suite gets bypassed. A representative split:

| Tier | Checks |
| :---- | :---- |
| block (merge-blocking) | build · type-check · lint · unit tests · contract tests · migration dry-run · dependency-vulnerability scan · secret scan · traceability validation |
| warn (report, don't block) | integration tests · E2E for touched flows · coverage threshold · SAST · API-contract-drift · accessibility scan |

Platform features make this enforceable rather than advisory — required status checks before merge, push-protection that blocks secrets before they reach the repository, and CI-integrated SAST/SCA/secret scanning. As checks stabilise, promote them from warn to block. The hooks and the CI layer are complementary: hooks stop the dangerous thing locally and immediately; CI proves quality authoritatively before merge.

# **23\. Automated Failure Triage and Repair Loops**

The difference between mediocre and high automation is not whether the agent writes code — it is whether the system can **observe a failure, classify it, repair it, rerun, and prove it fixed** without a human. Extend the gate-remediation idea to every verification failure: classify the failure, then apply a per-type policy.

compile\_error / type\_error / lint\_error   \-\> auto\_repair, max 3, escalate if same error repeatsunit / integration / e2e failure          \-\> auto\_repair, rerun, escalate on repeatcontract\_drift / auth\_matrix\_violation    \-\> auto\_repair, escalate if the contract is unclearmigration\_failure                         \-\> auto\_repair additive; human required if destructivesecurity\_finding                          \-\> auto\_repair; human required if data exposure / auth bypassflaky\_test                                \-\> quarantine \+ record; do not 'repair' by deletion

| The hard guardrail: repair may not move the goalposts An agent can always make a test pass by editing the test, loosening the contract, or suppressing the error. That is not repair — it is manufacturing a green checkmark. Repair may modify implementation code only. It must never modify the test oracle, the contract, the acceptance cases, or the spec. A change to any of those is an amendment (§9/§24) that re-enters the gates, not a repair. "Proven fixed" must be demonstrated by the independent (black-box) oracle, not only by the test the agent just touched. Without this rule, repair loops make the veneer of rigour worse, not better. |
| :---- |

# **24\. The Impact Graph**

The amendment workflow (§9) is targeted surgery; the impact graph is what makes "targeted" computable instead of judged. Store the dependency graph as data — nodes are requirements, entities, endpoints, auth rows, state machines, code, and tests, each versioned; edges record dependency — and the runtime answers change-impact questions directly:

ai-pipeline impact \--change data\_model.orders     \# requirements that must rebuildai-pipeline impact \--change auth.customer.orders.createai-pipeline stale-edges                           \# requirements built on superseded artefacts

This matters most for complex enterprise systems, where automation is usually lost to \*change-impact uncertainty\* — the fear that a schema or contract change has unknown downstream effects. With the graph, a change yields a precise, minimal rebuild set, and a requirement built against a now-superseded artefact version surfaces as a stale edge to be rebuilt. The graph reduces manual analysis; it does not replace the gates, because dependency tagging remains best-effort.

# **25\. Evidence-Only Review**

Review verdicts must be **structured, evidence-based, and machine-actionable** so they can drive the repair loop (§23) instead of producing prose a human must interpret. Every reviewer emits a verdict in a fixed shape: a verdict (APPROVED / CHANGES\_REQUESTED / BLOCKED), the spec versions it was formed against, and a list of findings, each with severity, category, a falsifiable claim, evidence, and a required fix.

The rules that make it work:

* **No evidence, no finding.** A finding in an objective category (authorisation, contract, security, migration, performance, concurrency) must cite a file, lines, or a failing test. A claim without evidence is dropped.

* **Every block maps to a repair action.** A P0/P1 in a blocking verdict carries the concrete required\_fix the repair loop will perform.

* **Every approval records the spec versions reviewed** — so a later amendment can automatically invalidate a now-stale approval.

* **Judgement is allowed but labelled.** UX and taste findings may be prose, but they are marked as judgement and cannot, by themselves, block — they route to the human UX gate, not the repair loop.

This removes false review friction, makes approvals auditable, and turns the reviewer into a precise input to automated repair rather than a conversation.

# **26\. Decision Policies — the middle category**

The Escalation Contract (§5) covers decisions that genuinely need a human. But many recurring choices sit in between: ambiguous to an agent, yet safely resolvable by a standing policy. Capture those as configuration — not a new engine, just policy that lives alongside the contracts and NFR thresholds — and have the agent apply the default, **log it to a decisions record**, and escalate only where the policy says a human is required.

decision\_policies:  pagination:        { default\_page\_size: 50, max\_page\_size: 200, human\_required: false }  delete\_behavior:   { default: soft\_delete, hard\_delete\_requires\_human: true }  external\_api\_failure: { default: retry\_with\_backoff\_then\_domain\_error,                          human\_required\_if\_money\_movement: true }  auth\_default:      { default: deny, public\_endpoint\_requires\_explicit\_contract: true }  schema\_change:     { additive\_change: auto, destructive\_change: human\_required }

The decision-resolution step is: detect the unresolved choice, search the requirements/architecture/contracts/prior decisions, apply the policy default when confidence is high, log the decision, and escalate only when policy demands it. This cuts needless interruptions while keeping the dangerous choices human — and the decisions log keeps every auto-resolution auditable, so a wrong default is visible rather than silent.

# **27\. Domain Packs and the Discovery Zone**

Two extensions raise the ceiling on the hard cases — complex enterprise systems and genuinely novel products — without pretending the agent can supply what it cannot.

### **Domain packs (for enterprise complexity)**

Complex enterprise systems rarely fail because the agent cannot write code; they fail on **domain-specific assumptions** — money movement, auditability, tenant isolation, compliance, retention, concurrency, external-system failure. A domain pack encodes those as reusable, expert-authored controls: domain risks, standard entities and state machines, auth and audit-log patterns, retention policy, a threat-model template, NFR baselines, and mandatory acceptance-test patterns (for payments, say: idempotency, duplicate-payment prevention, ledger-balance invariant, audit-trail completeness). This is how enterprise automation rises safely — by reusing encoded domain judgement, not by asking the agent to invent risk controls. The same governance caveat as stack packs applies, more sharply: a wrong domain pack is dangerous, so author and review each one with a real domain expert, and build only the domains you operate in.

### **A discovery zone (for novel work)**

Novel product work cannot be automated like CRUD because the requirements themselves are unstable — and, as Part I states, traceability proves consistency, not correctness, so building consistently against an unvalidated requirement just produces confidently-wrong software faster. Add a **Discovery Zone before specification** that automates the \*structuring and exploration\* while keeping the \*bet\* human: problem framing, persona hypotheses, an assumption ledger, a competitive/reference scan, prototype and UX-flow options, and an experiment plan — feeding a human product decision. The agent turns rough ideas into structured options, surfaces hidden assumptions, drafts alternative flows and clickable prototypes, and synthesises feedback; the human decides which pain matters, which trade-off is acceptable, whether the UX feels right, and whether the bet is worth making.

# **28\. Economics, Maintenance, and What This Does Not Fix**

Part II describes real software with real cost. Three honest points before adopting it wholesale.

* **This is a product, not a configuration.** A runtime, generators, stack and domain packs, CI integration, an impact graph, and a repair engine form a system with permanent maintenance — packs must track framework and library versions; domain packs need ongoing expert upkeep. Half-maintained packs are worse than none (a stale control implies coverage that is absent). Adopt incrementally, staff the ownership, and prove each layer on real work before building the next — the effectiveness metrics (§10) are how you confirm a layer actually paid off rather than trusting an estimate.

* **None of this raises the ceiling on specification correctness — and some of it can deepen the veneer.** A runtime, generators, and repair loops make you faster and more consistent at producing \*what the spec says\*. If the spec is wrong, you now ship wrong software faster, with more green checks and a better audit trail. So **automation percentage is the wrong north-star** — optimising it incentivises removing humans from exactly the correctness-critical loops. Track \*consistency × correctness\*: first-time-right and right-requirement. As you automate the consistency loops, the human spec review at Gates A/B/C, the independent oracle, and the repair guardrail (§23) become \*more\* important, not less.

* **Concentrated risk needs governance.** Generated-everything trades distributed, reviewable mistakes for concentrated, identical ones in templates and packs. That is a net win only if the generators and packs are themselves tested, versioned, and independently reviewed, and the pattern checks are not tautologies (§21).

Adopt Part II in order of compounding leverage: the executable control plane and machine-readable artefacts first (they unlock everything else), then contract-to-code/test generation with one stack pack, then the CI gate layer, then repair loops and the impact graph, then — only where the work demands it — domain packs and the discovery zone. Build the runtime to harden the rigour, never to fake it.

---

# **Part III — Agent Adapters, Packaging, and the Close-to-10 Hardening Layer**

Part I defines the lifecycle. Part II defines the executable runtime. Part III defines the adapter boundary: what remains shared across coding agents and what must be packaged differently for each agent surface. The core pipeline does **not** fork between Claude Code and Codex. The runtime, artefact schemas, CI gates, contract generators, impact graph, repair policy, evidence-only review format, and escalation contract are agent-independent. Only the **adapter layer** differs: where instructions are loaded, how skills are discovered, how hooks are registered, which edit tool events are intercepted, and what project guidance file the agent reads.

## **29. Core vs. Adapter Boundary**

The pipeline must be kept as one shared methodology. Forking the lifecycle for each agent would create governance drift: one tool would eventually have a stricter traceability rule, a different repair policy, or a weaker escalation path. The shared core is therefore the source of truth:

| Shared core — same for Claude Code and Codex | Tool-specific adapter — separate bundle |
| :---- | :---- |
| `docs/spec/**` machine-readable artefacts | Skill discovery folder and frontmatter conventions |
| `tools/ai-pipeline.py` control-plane CLI | Hook registration file and event matcher names |
| `schemas/**` validation contracts | Project guidance file: `CLAUDE.md` vs `AGENTS.md` |
| `tools/generators/**` contract-to-test generators | Tool-specific edit event handling: Claude `Write/Edit`, Codex `apply_patch` |
| `tools/ci/**` and GitHub Actions template | Optional adapter-specific prompt/context hooks |
| Escalation Contract, repair policy, impact graph | Local trust/review flow for hooks |
| Evidence-only review JSON format | Agent-specific skill invocation syntax |

The practical rule: **change the pipeline once; adapt it twice.** If a lifecycle, gate, schema, or repair rule changes, it changes in the shared core. If a hook path, skill location, or guidance file changes, it changes only in the adapter bundle.

## **30. Claude Code Adapter**

Claude Code uses project guidance through `CLAUDE.md`, project skills under `.claude/skills/<skill-name>/SKILL.md`, and hook registration through `.claude/settings.json`. Claude Code skills use YAML frontmatter and markdown instructions; the skill directory name becomes the slash command. Claude Code hooks fire on lifecycle events such as `PreToolUse`, `PostToolUse`, and `Stop`, and a command hook exits with code `2` to block an action.

Recommended Claude bundle layout:

```text
.claude/
  settings.json
  hooks/
    db_change_guard.py
    secrets_guard.py
    repair_mode_guard.py
    validate_sql.py
    run_tests_if_changed.py
    lint_changed.py
    pipeline_context.py
  skills/
    pipeline-orchestrator/SKILL.md
    project-setup/SKILL.md            # superseded by new-project-setup, 2026-07-08
    requirements-generator/SKILL.md   # superseded by requirements-capture, 2026-07-09
    data-model-generator/SKILL.md     # superseded by brd-data-modeler, 2026-07-08
    architecture-generator/SKILL.md   # superseded by architecture-doc-generator, 2026-07-08
    guidelines-generator/SKILL.md
    contracts-generator/SKILL.md
    gap-analysis/SKILL.md
    lld-and-test-spec/SKILL.md        # superseded by lld-generator, 2026-07-08
    acceptance-test-generator/SKILL.md
    phased-planner/SKILL.md
    phase-executor/SKILL.md
    plan-to-pipeline/SKILL.md
    quality-gate-checker/SKILL.md
    evidence-reviewer/SKILL.md        # superseded by full-review, 2026-07-08
    integration-reviewer/SKILL.md     # superseded by cross-fr-review, 2026-07-08
    traceability-auditor/SKILL.md     # retired 2026-07-08, no direct replacement (see retired-skills/README.md)
    release-readiness/SKILL.md
    discovery-zone/SKILL.md
CLAUDE.template.md
```

The Claude adapter should use `PreToolUse` for blocking guards, `PostToolUse` for advisory validation after writes or commands, and `Stop` for end-of-turn lint/type-check reporting. The repair-mode guard must run before DB/secrets guards so a repair cannot edit `docs/spec/**`, `docs/lld/**`, `tests/acceptance/**`, `tests/e2e/**`, or `schemas/**`.

## **31. Codex Adapter**

Codex uses project guidance through `AGENTS.md`, project skills under `.agents/skills/<skill-name>/SKILL.md`, and hook registration through `.codex/hooks.json` or `.codex/config.toml`. Codex skills also use `SKILL.md` with `name` and `description` frontmatter, but the discovery path is different. Codex hooks are reviewed/trusted through `/hooks`; project-local hooks load only after the project `.codex/` layer is trusted. Codex edit interception must handle `apply_patch` as the primary write path.

Recommended Codex bundle layout:

```text
.codex/
  hooks.json
  hooks/
    db_change_guard.py
    secrets_guard.py
    repair_mode_guard.py
    validate_sql.py
    run_tests_if_changed.py
    lint_changed.py
    pipeline_context.py
.agents/
  skills/
    pipeline-orchestrator/SKILL.md
    project-setup/SKILL.md            # superseded by new-project-setup, 2026-07-08
    requirements-generator/SKILL.md   # superseded by requirements-capture, 2026-07-09
    data-model-generator/SKILL.md     # superseded by brd-data-modeler, 2026-07-08
    architecture-generator/SKILL.md   # superseded by architecture-doc-generator, 2026-07-08
    guidelines-generator/SKILL.md
    contracts-generator/SKILL.md
    gap-analysis/SKILL.md
    lld-and-test-spec/SKILL.md        # superseded by lld-generator, 2026-07-08
    acceptance-test-generator/SKILL.md
    phased-planner/SKILL.md
    phase-executor/SKILL.md
    plan-to-pipeline/SKILL.md
    quality-gate-checker/SKILL.md
    evidence-reviewer/SKILL.md        # superseded by full-review, 2026-07-08
    integration-reviewer/SKILL.md     # superseded by cross-fr-review, 2026-07-08
    traceability-auditor/SKILL.md     # retired 2026-07-08, no direct replacement (see retired-skills/README.md)
    release-readiness/SKILL.md
    discovery-zone/SKILL.md
AGENTS.template.md
```

Codex hooks should register `PreToolUse` for both `Bash` and `apply_patch`. Blocking can be done with exit code `2`, which keeps the hook logic aligned with the Claude adapter. Because Codex requires hook trust review, the bundle must include a clear install step: run Codex, open `/hooks`, review the hook definitions, and trust them before relying on local enforcement.

## **32. Adapter Compatibility Matrix**

| Capability | Claude Code adapter | Codex adapter | Shared runtime responsibility |
| :---- | :---- | :---- | :---- |
| Always-on project guidance | `CLAUDE.md` | `AGENTS.md` | Same golden rules and canonical paths |
| Skill path | `.claude/skills/<name>/SKILL.md` | `.agents/skills/<name>/SKILL.md` | Same skill names and lifecycle roles |
| Hook registration | `.claude/settings.json` | `.codex/hooks.json` | Same hook scripts, adapter-specific matchers |
| File edits intercepted as | `Write` / `Edit` | `apply_patch` plus aliases | Hook scripts normalize event inputs |
| Shell commands intercepted as | `Bash` | `Bash` | Same DB/secrets policy logic |
| Repair-mode enforcement | `PreToolUse: Write/Edit` | `PreToolUse: apply_patch` | `.ai-pipeline/current-mode.json` source of truth |
| Runtime commands | `python3 tools/ai-pipeline.py ...` | same | Tool-neutral |
| CI gates | GitHub Actions / external CI | same | Tool-neutral |
| Traceability | `docs/spec/traceability.json` | same | Tool-neutral |

## **33. Definition of Close-to-10 Readiness**

A project is “close-to-10 ready” only when the following are true:

1. `python3 tools/ai-pipeline.py doctor --adapter <claude|codex>` passes.
2. `python3 tools/ai-pipeline.py validate all` passes with JSON Schema installed.
3. `docs/spec/traceability.json` and `docs/spec/spec-graph.json` exist and validate.
4. `docs/spec/api.openapi.yaml`, `auth-matrix.yaml`, `state-machines.yaml`, `env-contract.yaml`, `dependency-register.yaml`, and `nfr-thresholds.yaml` are machine-readable and validated.
5. Generated auth-matrix and state-machine tests run in CI.
6. CI block tier is required before merge.
7. Repair mode blocks edits to specs, designs, schemas, and black-box test oracles.
8. Every blocking review finding is evidence-backed JSON and creates a repair task.
9. Stack packs and domain packs have their own tests and version history.
10. The first real requirement has been piloted end to end with metrics recorded.

This is the point where the process moves from “strong methodology” to “operationally enforceable AI SDLC.” It still does not make specification correctness automatic; it makes inconsistency, drift, unsafe repair, and untraceable code materially harder to introduce.

---

# **Part IV — Continuous-Improvement Layer (added 2026-06-10)**

## **34. Why this layer exists**

The 10-stage pipeline in Parts I–III moves the project from "AI-assisted" to "operationally enforceable." What it does NOT do, on its own, is *get smarter the more you use it*. The 2026-06 pilots surfaced a cluster of failure modes the existing stages kept missing: orchestrator self-evaluation of its own gate verdicts, BRD derivation rules that silently deferred to later stages, agent token-burn that masked under-specified LLDs, exploratory discovery work leaking into the spec, and lessons that lived only in the operator's head between features.

This Part IV layer is six mechanisms layered on top of the existing stages. None add new stages. Each addresses a specific failure mode named by 2026-06 pilot observations. The founding principle (every consequential decision explicit before code is generated) is unchanged. The amendment is: *the pipeline now learns from its own runs and exposes a structured channel for the agent's world knowledge*, so the human's decision count goes down over time instead of staying flat.

## **35. The six mechanisms**

### **35.1 Fresh-context gate checker** *(closes orchestrator self-evaluation)*

Gates A, B, and C are never evaluated by the orchestrator. Each gate dispatches as a subagent via the Agent tool with `subagent_type: Explore` (read-only). The subagent receives **only** the artefact + the upstream contracts the producer was supposed to honour + the gate checklist + `docs/spec/manifest.json`. It does NOT receive the producer's notes, planning, or summary of what was done.

Why this matters: an orchestrator that built the artefact carries its own justifications. A checker that inherits those justifications reads "we decided X because Y" and approves X without re-evaluating it. The 2026-06-08 LAC dashboard pilot recorded `"by": "auto (orchestrator self-evaluated; no quality-gate-checker CLI available)"` on Gates A and B with CONDITIONAL verdicts — exactly the failure mode this protocol prevents.

Recorded in manifest: `gates.<X>.checker_context = {mode, subagent_type, model, started_at, completed_at, input_scope, excluded_inputs_note}`.

Legacy `by: "auto (orchestrator self-evaluated)"` is now a checker-mode BLOCK — any prior manifest with that value triggers a re-run before the feature is considered closed.

### **35.2 BRD §0.6 Derivation-Rule-to-Source Map** *(closes silent derivation deferrals)*

Required new BRD sub-step (Step 1.6 in `brd-generator`), parallel to the existing §0.5 Verb-to-Surface Map. Every derivation phrase in the source spec ("show disputed accounts", "split cash across N plots", "flag first-time download", "block application when X exists") must appear exactly once in §0.6 with:

- **Source table(s)** — named, exists in the data model
- **Source column(s) / expression** — the precise filter, enum value(s), aggregation, or join condition
- **Status** — `RESOLVED` (inline) / `DEFERRED` (with caveat + explicit discharge stage) / `NEW` (linked to the FR that introduces the column)

Gate A enforces with `DERIVATION_NOT_MAPPED`, `DERIVATION_DEFERRED_WITHOUT_CAVEAT`, `DERIVATION_UNRESOLVED_BUT_MARKED_RESOLVED` BLOCK findings.

Why this exists: both 2026-06-08 pilots landed Gate A as CONDITIONAL with 4 caveats each. All 8 caveats across both pilots were the same shape — the BRD named what to display but never named how to compute it from underlying data. §0.6 catches this class inline.

Applied to `brd-generator` and `quality-gate-checker` via cross-feature learning report `2026-06-10-lac-dashboard-loi-overview-merge.json` finding `P-COND-A`.

### **35.3 Token budget per FR** *(closes "is this LLD under-specified?")*

Before each FR is dispatched in Stage 7, the orchestrator records `tokens.budget` derived from the FR's tier:

| Tier | First-pass budget | Rationale |
|------|------------------|-----------|
| 1 — simple (~0.5pp LLD) | 30,000 tokens | endpoint + happy path; agent should rarely re-read context |
| 2 — moderate (~2pp LLD) | 80,000 tokens | full endpoint, taxonomy errors, auth check, component tree |
| 3 — complex (5+pp LLD) | 200,000 tokens | state machine, transactions, perf considerations, full test table |

After the FR's coding subagent finishes, `tokens.actual` and `tokens.overage_ratio = actual / budget` are recorded in `manifest.requirements.FR-NNN.tokens`. Semantics:

- `overage_ratio ≤ 1.5` — nominal, no action.
- `1.5 < overage_ratio ≤ 3.0` — log as `INFO` in completion report; trend across features.
- `overage_ratio > 3.0` — **the LLD is wrong**. Set `trigger_fired = true` and spawn an LLD-quality audit subagent. Token burn measures specification under-specification, not agent inefficiency.

Budgets are read from `project.config.yaml#token_budgets` when present. The orchestrator never *blocks* on budget — overage is a signal, not a quota.

### **35.4 Metric threshold guard** *(catches under-specification mid-run, not at handoff)*

A `Stop`-event hook (`.claude/hooks/metric_threshold_guard.py`) reads `manifest.metrics` after every agent turn and compares each metric to a configurable threshold:

| Metric | Default threshold | Trigger on breach |
|--------|------------------|--------------------|
| `clarification_rate` per FR | `> 0.25` | Spawn LLD-quality audit subagent for that FR |
| `gate_remediation_cycles.<X>` | `≥ 2` | Flag gate's checklist as `weak_signal` — producing skill is under-specified for this project |
| `rework_rate` cumulative | `> 0.30` | Halt new Stage-7 dispatches; orchestrator reviews LLD generation pattern |
| `first_pass_rate` cumulative | `< 0.60` | Same as above |
| `tokens.overage_ratio` per FR | `> 3.0` | Spawn LLD-quality audit for the FR |

Triggers are recorded to `manifest.metric_triggers[]` with `{metric, threshold, observed, fired_at, at_stage, response, outcome}`. The hook is idempotent — once a metric is in `metric_triggers[]` for a feature, it does not re-fire until cleared.

Why this matters: previously, metrics were surfaced only in the completion report. By then, the bad pattern had already produced 5 FRs of broken code. The guard catches the same pattern in hour 2.

### **35.5 Discovery promotion gate** *(bounds the only open-loop zone)*

Discovery is the pipeline's only open-loop zone. To keep the closed pipeline trustworthy, discovery has an explicit promotion gate.

Discovery outputs land in `docs/discovery/<topic-slug>/` and include:
- `problem-brief.md`, `personas.md`, `assumption-ledger.md`, `reference-scan.md`, `prototype-options.md`, `ux-flow-options.md`, `experiment-plan.md`, `decision-memo.md`

After the human writes `decision-memo.md`, the orchestrator extracts a candidate-requirement list and classifies each candidate as `promote` / `narrow-and-promote` / `defer` / `drop`. The classifications land in `promotion-decisions.md`. Only `promote` and `narrow-and-promote` candidates are handed to `/brd-generator` as the Stage 1 input. Unpromoted items land in `explored-not-promoted.md` so future discoveries can see what was already tried.

Soft token budget for discovery: 150,000 output tokens per exploration, recorded as `discovery.tokens_used` in the decision memo. Exceeding 2× the budget surfaces a "narrow the exploration" prompt to the human.

### **35.6 Cross-feature learning loop** *(closes recurring failure modes across features)*

A GitHub Actions workflow runs on every PR merge to `main` that touches `docs/spec/manifest.json`. The workflow invokes `scripts/analyze-feature-merge.mjs` which compares the just-merged manifest to the most-recent N archived manifests under `docs/spec/archive/` and detects:

- **Recurring CONDITIONAL gates** — same gate landing CONDITIONAL in ≥60% of recent features → producing skill is under-specified for this project
- **Late caveat discharge** — high ratio of caveats discharged at Stage 7 (schema-read moment) → Stage 2 / data-modeler should be reading schemas more aggressively
- **Recurring Stage-7 deviations** — same kind of deviation (`in-module helper because LLD-named helpers don't exist`) appearing across FRs → missing shared utility or contract gap
- **Token overage by tier** — Tier-N FRs averaging > 1.5× budget across multiple samples → tier template is under-specifying

Output: `docs/learning-reports/<YYYY-MM-DD>-<feature>.json` with structured findings, each carrying a `proposed_amendment` pointing at the target skill. A tracking GitHub Issue is opened so the operator sees the new findings.

Operator drives adoption via `/cross-feature-learning apply <finding-id>`. The skill reads the report, drafts the smallest surgical amendment to the target skill's SKILL.md, opens a PR. The finding is recorded in the report's `actions[]` array. Idempotent: re-running the analyzer preserves `actions[]`.

The first analysis already caught a real pattern — both 2026-06-08 pilots landed Gate A CONDITIONAL with 4 derivation-rule caveats each. Applied as the §0.6 step above (mechanism 35.2).

### **35.7 Advisory Track** *(agent voice within spec discipline)*

The previous six mechanisms make the pipeline more robust. The Advisory Track makes it more *intelligent* — it gives the agent a structured channel to contribute world knowledge (patterns from thousands of similar systems) without breaking spec discipline.

#### The pattern: two tracks, never blended

| Track | Role | Voice belongs to | Output |
|---|---|---|---|
| **Spec track** (Stages 1–9, unchanged) | "Build exactly this" | Spec owner | BRD, data model, contracts, LLDs, code |
| **Advisory track** | "Here is what your spec may not have considered" | Agent | Structured proposals awaiting human decision |

The spec track is unchanged. The agent's voice lands in a *ledger*, not in the spec. The ledger is read by the spec owner at a defined decision moment; accepted proposals enter the spec via the existing amendment workflow. The two tracks only connect at one place — the decision ritual — and the pipeline preserves traceability the rest of the time.

#### Four invocation points

`feature-life-cycle` dispatches `/agent-insights-pass <stage> <artefact>` at exactly four moments:

| Stage | Trigger | Insight type |
|---|---|---|
| `1_brd` | After §0.6 lands, before Gate A | **World-knowledge** — what this kind of feature usually needs that the BRD does not yet name (idempotency, RFC 7807 error shape, common edge cases, regulatory standards) |
| `6_lld` | After each LLD is written, before Stage 7 dispatch | **Implementation-alternative** — is there a materially better-known pattern than the LLD prescribes? |
| `8_review` | Alongside the Stage 8 review verdict | **Observation** — non-violating notes (pattern repetition that could be extracted, library choice friction, UX inconsistency). Never gating. |
| `10_production` | When a production-feedback event lands (deferred until Stage 10 loop ships) | **Pattern-match** — does this error class match a known issue in similar systems? |

#### Constraints on the pass

- **Citation mandatory.** Every insight cites a concrete reference: library + URL, named architectural pattern, competing product behavior, or RFC/regulation. Insights without a citation are auto-rejected at ledger intake.
- **Cap of 10 per invocation.** Hard cap. Rank by impact (`high` / `medium` / `low`).
- **Additive framing only.** Words like "should have," "missed," "incorrect," "wrong" are forbidden. Use "industry typically adds," "common edge case is."
- **No re-raising rejected insights.** The pass MUST read the existing ledger and not re-propose substantively identical insights the spec owner already rejected on this feature.
- **No spec edits.** The pass writes only to `docs/agent-insights/<feature>.md`. The spec is touched only after the spec owner accepts an insight, via the existing amendment workflow.

#### Ledger entry shape

```yaml
- id: AIC-001
  raised_at_stage: 1_brd
  source_skill: brd-generator
  type: missing-requirement | better-approach | known-edge-case | library-suggestion | architecture-alternative
  priority: high | medium | low
  observation: "Payment endpoints in this BRD do not specify idempotency handling."
  rationale: "Industry typically adds an X-Idempotency-Key header so client retries do not double-charge."
  citation:
    - source: Stripe Idempotency-Key
      url: https://stripe.com/docs/api/idempotent_requests
  proposed_addition: "Add NFR-PAY-IDEMPOTENCY: 24h replay window, X-Idempotency-Key header, HTTP 409 on duplicate."
  status: proposed | accepted | rejected | deferred
  decision_reason: null
  rolled_into_artefact: null
```

#### The pre-gate decision ritual

Before each gate dispatches, the orchestrator walks open insights for the closing stage with the spec owner:

1. Group by `priority` — `high` first.
2. Present each insight as a decision request (observation + rationale + citations + proposed_addition).
3. Receive `accept` / `reject <reason>` / `defer <discharge-at-stage>` per insight.
4. For `accepted`: fold the `proposed_addition` into the named artefact section via amendment workflow.
5. For `rejected`: record `decision_reason` (one sentence). Future passes read this and must not re-propose.
6. For `deferred`: keep `status: deferred` with `discharge_at_stage`.
7. Update `manifest.advisory_track.<stage> = {insights_raised, insights_accepted, insights_rejected, insights_deferred}`.

Then the gate dispatches. Unprocessed `high`-priority insights surface in the gate's input scope so the gate checker can note them as `INFO` findings.

#### Why this preserves discipline

- The spec is untouched until a human decides. All amendments still flow through Gates A/B/C with sign-off.
- Decisions are bounded — 10 insights per stage, ranked, with citations → ~5 minutes of review per gate.
- Rejections compound within a feature; the spec owner does not litigate the same idea repeatedly.
- The cross-feature learning loop reads the ledger. If an insight `type` is accepted ≥80% of the time on features of a similar shape, the loop proposes that the source skill (`brd-generator`, `lld-generator`, etc.) include that consideration by default — eventually reducing per-feature ledger volume.

The result: agent breadth (patterns from many systems) and spec-owner depth (this specific business, team, politics) combine at exactly one structured point, and the pipeline preserves its traceability invariant the rest of the time.

## **36. Updated manifest schema**

The continuous-improvement layer extends the existing manifest with four new top-level fields and one new sub-field on `requirements`:

```json
{
  "feature": "<name>",
  "current_stage": 6,
  "gates": {
    "A": {
      "signed_off": true,
      "verdict": "PASS",
      "by": "fresh-subagent",
      "checker_context": {
        "mode": "fresh-subagent",
        "subagent_type": "Explore",
        "model": "<model-id>",
        "input_scope": ["docs/brd.md", "docs/spec/manifest.json"],
        "excluded_inputs_note": "producer scratchpad NOT provided"
      }
    }
  },
  "requirements": {
    "FR-001": {
      "tier": 2,
      "status": "merged",
      "spec_versions": {"contracts": 3, "lld": 2},
      "tokens": {
        "budget": 80000,
        "actual": 67430,
        "overage_ratio": 0.84,
        "trigger_fired": false
      }
    }
  },
  "metrics": {
    "first_pass_rate": 0.82,
    "clarification_rate": 0.11,
    "rework_rate": 0.18,
    "gate_remediation_cycles": {"A": 1, "B": 2, "C": 1},
    "escalation_count": 0,
    "thresholds_source": "project.config.yaml#metric_thresholds"
  },
  "metric_triggers": [
    {
      "metric": "clarification_rate",
      "threshold": 0.25,
      "observed": 0.31,
      "fired_at": "<iso8601>",
      "at_stage": "7_generation",
      "response": "spawned LLD-quality audit subagent",
      "outcome": "FR-007 LLD upgraded T2→T3; Stage 7 re-dispatched"
    }
  ],
  "advisory_track": {
    "ledger": "docs/agent-insights/<feature>.md",
    "1_brd":       {"insights_raised": 7, "insights_accepted": 3, "insights_rejected": 3, "insights_deferred": 1},
    "6_lld":       {"insights_raised": 12, "insights_accepted": 5, "insights_rejected": 6, "insights_deferred": 1},
    "8_review":    {"insights_raised": 4, "insights_accepted": 1, "insights_rejected": 3, "insights_deferred": 0},
    "10_production": {"insights_raised": 0, "insights_accepted": 0, "insights_rejected": 0, "insights_deferred": 0}
  }
}
```

## **37. Updated effectiveness metrics**

§10 of this document defined the original metrics (first-pass test rate, clarification rate, rework rate, escalation frequency, gate remediation cycles, traceability completeness, caveat-ledger age, escaped defects). The continuous-improvement layer adds four:

| Metric | What it measures | Where it points when it breaches |
|---|---|---|
| **Token overage ratio per tier** | `actual / budget` averaged across FRs of the same tier | The tier template in `lld-generator` is under-specifying |
| **Advisory acceptance rate per `type`** | `accepted / (accepted + rejected)` for each insight type | A consistently-accepted type means the source skill should fold the consideration in by default |
| **Metric trigger frequency** | Count of fired triggers per feature | A trigger firing on most features means its threshold is too tight, or the producing skill genuinely has a recurring problem |
| **Cross-feature finding rate** | New finding IDs per analyzed merge | High rate = pipeline still learning; near-zero = pipeline at steady state for this project (a good thing) |

These are surfaced in the completion report and in the GitHub-issue body the cross-feature learning workflow opens.

## **38. How the layer composes**

Each mechanism has its own purpose, but together they form a closed loop:

```
       ┌─── Stage 1 BRD ────┐
       │  + §0.6 derivation │
       │  + 1_brd advisory  │
       │  + fresh-subagent  │
       │    Gate A          │
       └────────────────────┘
                 │
                 ▼
       ┌─── Stage 6 LLD ────┐         ┌──── Metric guard ───────┐
       │  + 6_lld advisory  │◀────────│  reads manifest.metrics │
       │  + tier budget set │         │  between every phase    │
       └────────────────────┘         └─────────────────────────┘
                 │                              ▲
                 ▼                              │
       ┌─── Stage 7 code ───┐                   │
       │  + token accounting│───────────────────┘
       │  + trigger on 3×   │
       └────────────────────┘
                 │
                 ▼
       ┌─── Stage 8 review ─┐
       │  + 8_review advisory│
       └────────────────────┘
                 │
                 ▼
       ┌── Stage 9 cross-FR ┐
       └────────────────────┘
                 │
                 ▼
       ┌── PR merged → analyze-feature-merge ┐
       │  detects recurring patterns         │
       │  → /cross-feature-learning apply    │
       │  → skill amendments via PR          │────────┐
       └─────────────────────────────────────┘        │
                                                      │ amendments
                                                      ▼ feed back to
                                            ┌────────────────────────┐
                                            │ brd-generator,         │
                                            │ lld-generator,         │
                                            │ contracts-generator,   │
                                            │ etc.                   │
                                            └────────────────────────┘
                                                      │
                                                      ▼ next feature
                                            (compounded improvement)
```

The Advisory Track sits at four points in this flow (§35.7) and its accepted-insight patterns become inputs to the cross-feature learning loop.

The result is a pipeline that gets *sharper per feature*, not just *more thoroughly enforced*. Each shipped feature contributes to a smaller decision count on the next, because the recurring decisions are surfaced as proposed skill amendments and resolved before the next run starts.

## **39. Definition of Close-to-10 readiness (extended)**

§33 listed the original ten conditions. The continuous-improvement layer adds two:

11. **Every gate verdict in `manifest.gates.<X>.checker_context` has `mode: "fresh-subagent"`.** No verdict carries `by: "auto (orchestrator self-evaluated)"`.
12. **`scripts/analyze-feature-merge.mjs` has run at least once** and the resulting learning report has either zero findings or every finding has an `actions[]` entry showing it was acted on, rejected with reason, or deliberately deferred.

A project meeting all 12 conditions has compounding quality — each feature it ships sharpens the pipeline, and no failure mode that has been observed before is allowed to recur silently.
