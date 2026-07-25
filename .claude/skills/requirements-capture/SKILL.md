---
name: requirements-capture
description: "Create a lean, AI-buildable requirements slice without forcing a full BRD. Use for light and standard path work when the feature needs explicit requirements, acceptance criteria, or brownfield verb/surface clarification but does not justify the full brd-generator output."
argument-hint: "<feature request, ticket, file path, or pasted spec>"
user_invocable: true
allowed-tools: Read Write Edit Bash Glob Grep Skill Task
---

# Requirements Capture — Lean Requirements Slice

Use this skill when the work needs clearer requirements but does not justify a full BRD.

It produces a compact requirements artefact that downstream contracts, LLDs, tests, and traceability can consume.

## Output

Write:

```text
docs/spec/requirements-slice.md
```

and update `docs/spec/manifest.json` if present.

## Required sections

```markdown
# Requirements Slice: <feature>

## 0. Source
- Source request / ticket / doc:
- Date:
- Selected process path: light | standard

## 1. Objective
A single verifiable outcome.

## 2. In scope
Bullets only. No implementation detail unless it is a hard constraint from the source.

## 3. Out of scope
Explicit exclusions.

## 4. Roles and users
Only roles affected by this change.

## 5. Workflows
For each changed workflow:
- happy path;
- failure path;
- permission boundary;
- data created/read/updated/deleted.

## 6. Functional requirements
| FR ID | Requirement | Acceptance criteria | Risk tier |
|---|---|---|---|

## 7. NFRs and constraints
Only concrete constraints that apply to this change.

## 8. Brownfield Verb-to-Surface Map
| Verb from source | Surface | File:line evidence | Status | FR ID |
|---|---|---|---|---|

## 9. Derivation-Rule-to-Source Map
| Derivation phrase | Output/UI field | Source table/file | Source column/expression | Status | Caveat ID |
|---|---|---|---|---|---|

## 10. Caveats and open questions
| ID | Caveat/question | Discharge stage | Owner |
|---|---|---|---|

## 11. Test obligations
| FR ID | Required tests | Fixture needed? | Acceptance evidence |
|---|---|---|---|
```

## Rules

- Keep the artefact lean. Do not include architecture, full data model, API details, or LLD content unless the source explicitly demands them.
- Every FR must have at least one acceptance criterion.
- FR/NFR IDs are stable and unique (`FR-001`, `NFR-001`); split compound requirements instead of stuffing two behaviours under one ID.
- Every FR traces to a workflow with a named failure path, not just a happy path.
- NFR thresholds are numbers, not adjectives ("p95 < 500ms", never "fast").
- Flag each ambiguity once: if an existing decision policy or artefact resolves it, log the decision; otherwise record it in Caveats with an owner — never silently guess.
- After saving, read the artefact back and verify IDs are unique and every FR has trigger, failure path, and acceptance criteria.
- Every user-visible verb in a brownfield source request must appear in the Verb-to-Surface Map.
- Every derivation phrase must either be resolved or explicitly deferred with a caveat.
- Any FR that changes API/auth/state/error behavior must identify the contract that must be amended.
- If the work is discovered to be larger than the selected path, update the process classification instead of inflating this document silently.

## When to escalate to full BRD

Escalate to `brd-generator` if:

- there are many modules or roles;
- the system is greenfield;
- the workflow is not bounded;
- architecture/data model decisions are foundational;
- regulatory or audit traceability requires a full requirements package.
