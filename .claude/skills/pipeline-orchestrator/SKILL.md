---
name: pipeline-orchestrator
description: "Internal runtime controller for the AI Dev Pipeline. Manages manifest state, validation, gates, traceability, and deterministic commands. Do not use as the primary user-facing conductor; use feature-life-cycle first."
allowed-tools: Read Write Edit Bash Glob Grep Skill Task
---

# Pipeline Orchestrator — Runtime Controller

This skill is internal. It manages state and deterministic checks; it does not decide product scope and it does not replace native `/plan` or `/goal`.

User-facing flow:

```text
feature-life-cycle -> process-classifier -> selected path -> runtime/gates/trace through this skill
```

## Non-negotiables

- Source of truth state is `docs/spec/manifest.json`.
- If a legacy root `manifest.json` exists, read it only for migration/backward compatibility.
- Start by reading `docs/spec/manifest.json` to determine current stage/gate state; if no manifest exists, create it per the documented shape (the pipeline CLI is not part of this distribution).
- Before dispatching implementation for standard/full paths, verify the required artefacts exist and parse (read the contracts/requirements files directly; there is no `validate` CLI).
- Before handoff when traceability applies, run the traceability check via the `traceability-auditor` skill or verify the manifest's traceability entries manually.
- Never edit specs, contracts, or acceptance tests in repair mode. Route changes through the amendment workflow: update the artefact and record the amendment in `docs/spec/manifest.json` directly.

## v8 operating sequence

1. Confirm process classification exists.
2. Confirm the selected path: discovery/light/standard/full.
3. Ensure the minimum artefacts listed in `docs/spec/process-classification.md` exist.
4. Start/complete only the stages that apply to the selected path.
5. Dispatch formal gates only when their artefacts changed.
6. Record caveats and evidence in the manifest.
7. Produce traceability and completion evidence.

## Path-specific orchestration

### Light

- No formal stage sequence by default.
- Validate touched tests, lint/typecheck, and focused traceability.
- Gate only if a formal contract/spec artefact changed.

### Standard

- Requirements slice.
- Gap analysis.
- Touched contract amendments.
- LLD/tests for changed FRs.
- Goal-driven implementation.
- Review and traceability.

### Full

- v7 stage sequence with Gates A/B/C.
- Fresh-context gate checking only.
- Both test oracles.
- Cross-FR integration review.

## Gate dispatch

Use `quality-gate-checker` as a fresh-context subagent. Do not self-evaluate.

Record:

```json
{
  "verdict": "PASS|CONDITIONAL|BLOCKED",
  "by": "fresh-subagent",
  "checker_context": {
    "mode": "fresh-subagent",
    "input_scope": [],
    "excluded_inputs_note": "producer scratchpad NOT provided"
  }
}
```

## Escalate only for

- destructive/irreversible data operations;
- unresolved ambiguity not covered by existing artefacts;
- a gate blocked after configured remediation cycles;
- foundational architecture selection on an unconfigured new project;
- ambiguous user-visible verb with multiple equal UI-surface candidates.
