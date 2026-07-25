---
name: feature-life-cycle
description: "Agent-native feature lifecycle for v8. Starts with process classification, chooses discovery/light/standard/full, then drives goal-based execution with evidence gates. Use when the user asks to build a feature, run the pipeline, continue a feature, or take a requirement from idea to verified code."
argument-hint: "<feature-description or path-to-doc> [--path discovery|light|standard|full] [resume] [interactive]"
user_invocable: true
allowed-tools: Read Write Edit Grep Glob Bash Skill Task AskUserQuestion
---

# Feature Life Cycle — v8 Agent-Native Conductor

The lifecycle is the user-facing conductor. It should not blindly force every request through the full ten-stage v7 sequence.

Core principle:

```text
Prescribe the boundaries. Let the agent discover the path. Verify with evidence.
```

## First action: classify before executing

Before generating specs or editing code, run `process-classifier` unless the caller has explicitly supplied `--path`.

The classifier must produce:

- selected path: `discovery`, `light`, `standard`, or `full`;
- objective;
- autonomy envelope;
- contracts to reuse/amend/create;
- minimum artefacts;
- tests and review plan;
- escalation triggers;
- recommended next command.

Write or update:

```text
docs/spec/process-classification.md
docs/spec/manifest.json
```

If the classification is ambiguous and the answer materially changes cost/risk, ask the operator once. Otherwise proceed.

## Path behavior

### Discovery path

Use when product bet or requirements are unstable.

Run:

```text
/discovery-zone <topic>
```

Then run the discovery promotion gate. Only promoted or narrow-and-promote items enter requirements capture. Raw discovery artefacts must not become the BRD.

### Light path

Use for small changes on stable contracts.

Run only what is necessary:

1. Confirm objective and touched area.
2. Reuse existing contracts.
3. Write or update a focused test/reproduction case.
4. Execute implementation by goal.
5. Run touched tests and configured lint/typecheck.
6. Run focused review or `full-review <target> no-fix` if risk justifies it.
7. Update traceability note.

Do not generate a full BRD, data model, architecture doc, full contracts package, all LLDs, or full phased plan unless the classifier explains why.

### Standard path

Use for several FRs on an existing system.

Run:

1. `requirements-capture` for a lean requirements slice.
2. `brd-coverage` or gap analysis against existing code.
3. `contracts-generator` only for touched contract amendments.
4. `uiux-designer` only if the work introduces or materially changes a user-facing surface, before the LLD so it references the handoff (see UX/UI design track).
5. `lld-generator` only for changed FRs that need implementation-grade detail.
6. `test-case-generator` for acceptance cases and executable tests.
7. `phased-planner` only if dependency ordering matters.
8. `phase-executor` or native `/goal` execution for each phase/FR.
9. `quality-gate-checker` only for changed formal artefacts.
10. `brd-coverage`, `full-review no-fix`, and `cross-fr-review` as verification.

### Full path

Use for greenfield systems, major modules, high-risk/money/data-sensitive work, or audited traceability.

Run the v7-style specification zone:

1. Requirements / BRD → Gate A.
2. Data model → Gate B.
3. Architecture.
4. Guidelines.
5. Contracts → Gate C.
6. Gap analysis.
7. UX/UI design + developer handoff for user-facing requirements (see UX/UI design track).
8. LLD + white-box test specs.
9. Acceptance cases.
10. Phased plan.
11. Goal-driven implementation.
12. Individual and integration review.
13. Traceability and completion report.

Even in full path, do not pause between phases unless an escalation condition occurs or `interactive` is set.

## UX/UI design track

This is the design counterpart to goal execution: when the work has a real user-facing surface, design it deliberately before it is built instead of letting implementation re-guess the interface.

**Trigger — run `uiux-designer` when the work introduces or materially changes a user-facing surface:** new screens or flows, a redesign, a "make it modern / more intuitive" request, or a user-visible verb with more than one plausible surface (Escalation #5). **Skip it** for backend-only, API-only, internal-tooling, or non-visual changes — do not manufacture a design pass where there is nothing to design.

**What it produces:** the package in the `uiux-designer` skill — screen-by-screen specs, a chosen aesthetic direction, a design-token system, and a structured developer handoff validated by `scripts/validate_handoff.py`. The `design_system` tokens and screen states are the **design↔code contract**: implementation consumes them, and review/acceptance verify against them. This is what discharges the anti-skeleton rule — real fields, data, states, and tokens are decided here, not improvised at code time.

**Where it sits:** after requirements/contracts are understood and before (or alongside) LLD and implementation, so the handoff is an input to `phase-executor`, not an afterthought. On greenfield UI it may run right after architecture/guidelines; on brownfield it runs after gap analysis.

**Scale with the path:**

- Light — a sized visual or interaction pass on the touched screens (often Level 1–2), or skip if the change is not visual.
- Standard — a handoff (Level 3) for the new or changed screens only; reuse the existing token system rather than reinventing it.
- Full / building in the current coding agent — full handoff (Level 3), and Level 5 when the lifecycle is also building the frontend against the tokens.

**Boundaries vs. freedom — this is where the balance lives.** Prescribe only the boundary: every screen traces to a requirement or user goal; every required state is covered (empty/loading/error/success/permission/offline); WCAG AA contrast and keyboard/focus behavior; consume the project's guidelines, design system, and contracts rather than contradicting them; emit a validated handoff. Inside that boundary the skill owns the route — aesthetic direction, information architecture, flow, components, and motion are its imagination to exercise, not the lifecycle's to dictate. Capture surplus product ideas it raises through the advisory track, not by silently widening scope.

**Feeds verification:** `ui-review` and the acceptance/E2E cases check the build against the handoff's screens, states, accessibility requirements, and tokens.

## Goal execution

For Codex, translate the approved plan into a native `/goal` prompt.

For Claude Code, dispatch `phase-executor` with the same content. In Codex, native `/goal` is preferred; if a separate executor skill is used, pass the same envelope:

```text
Objective: <objective>
Context: <files/contracts/tests>
Constraints: <non-negotiables>
Freedom: <agent may choose route within these areas>
Evidence required: <tests, logs, diffs, traceability>
Escalate when: <conditions>
```

The executor may choose the implementation route inside the autonomy envelope. It must not edit requirements, contracts, or acceptance tests in repair mode.

## Advisory track

Invoke `agent-insights-pass` as the agent's voice, not as a gate:

- after process classification;
- before Gate A when Gate A exists;
- after each LLD before execution;
- alongside Stage 8 review;
- on Stage 10 production feedback.

Insights go to `docs/agent-insights/<feature>.md` and are never applied silently. Accepted insights enter via amendment workflow.

## Fresh-context gates

When Gates A/B/C are required, dispatch `quality-gate-checker` as a fresh-context subagent.

The checker must receive only:

- the artefact paths;
- upstream contracts/requirements;
- `docs/spec/manifest.json`;
- the relevant checklist.

It must not receive producer scratchpads, summaries, or rationales.

Gate results:

- `PASS` → proceed.
- `CONDITIONAL` → proceed, but record caveat and discharge plan.
- `BLOCKED` → route finding to the producing skill; retry within remediation budget; escalate if still blocked.

## Repair discipline

Review and repair are separate.

Classify every failure:

```text
implementation bug -> repair code
spec ambiguity -> amend spec/LLD/contract
test/oracle defect -> amendment workflow
contract mismatch -> amend contract and re-run gate
environment/tooling failure -> record and retry or escalate
```

Never move goalposts by editing tests/contracts/specs to make implementation pass.

## Escalation contract

Stop or quarantine only for:

1. destructive or irreversible database operations;
2. unresolved ambiguity after one attempt to resolve from existing artefacts;
3. a formal gate that remains BLOCKED after remediation budget;
4. foundational architecture choice on an unconfigured greenfield repo;
5. ambiguous user-visible verb with multiple equal UI surface candidates.

A blocked FR must not freeze unrelated work. Quarantine it, record it in the manifest, and continue where safe.

## Done report

The lifecycle is complete only after writing a final report under `docs/reviews/` with:

- selected path and rationale;
- objective;
- changed files;
- tests/checks run and results;
- gates/reviews run and results;
- traceability updates;
- caveats resolved/accepted/deferred;
- remaining risks;
- explicit verification gaps, if any.
