---
name: process-classifier
description: "Classify an AI-dev request into discovery, light, standard, or full path before strict pipeline execution. Produces the autonomy envelope, minimum artefact plan, success criteria, verification plan, and escalation triggers. Use before feature-life-cycle, or as the first planning pass when the user asks to build, change, fix, or review a feature."
argument-hint: "<feature request, ticket, file path, or pasted spec>"
user_invocable: true
allowed-tools: Read Write Edit Bash Glob Grep Skill Task
---

# Process Classifier — v8 Entry Gate

Classify the work before the pipeline becomes strict.

This skill exists to prevent two failures:

1. Running the full pipeline for a small change.
2. Letting an implementation agent start coding before the boundaries are known.

## Output

Write `docs/spec/process-classification.md` and update `docs/spec/manifest.json` if it exists.

The report must contain:

```yaml
selected_path: discovery | light | standard | full
rationale: <why this path is sufficient>
objective: <verifiable goal>
autonomy_envelope:
  context: []
  constraints: []
  freedom: []
  evidence_required: []
  escalate_when: []
minimum_artefacts:
  required: []
  skipped_with_reason: []
contracts:
  reuse: []
  amend: []
  create: []
verification_plan:
  tests_to_write: []
  tests_to_run: []
  review_skills: []
risks: []
open_questions: []
recommended_next_command: <exact command>
```

## Classification rules

### Discovery

Choose `discovery` when:

- the user is still exploring the product bet;
- target users, workflow, or success criteria are unstable;
- multiple solution shapes are plausible;
- building now would mostly be a prototype to learn.

Next command:

```text
/discovery-zone <topic>
```

Raw discovery output must not enter Stage 1 directly. Promote only selected/narrowed candidates.

### Light

Choose `light` when:

- one bug, one small enhancement, or one local change is requested;
- existing contracts are stable;
- the change touches a small number of files;
- no data model, auth, state machine, or API contract change is required;
- verification can be done with touched tests and focused review.

Typical artefacts:

- process classification;
- focused test or reproduction case;
- implementation diff;
- review/traceability note.

Do not generate a full BRD, data model, architecture document, or full phased plan for light work.

### Standard

Choose `standard` when:

- several FRs are involved;
- the work is on an existing system;
- API/auth/state/error contracts may need amendment;
- parallel implementation or cross-layer coherence matters;
- acceptance/E2E tests are needed.

Typical artefacts:

- requirements slice;
- gap analysis;
- contract amendments;
- LLD/test specs only for changed FRs;
- acceptance cases;
- phased plan if there are dependencies.

### Full

Choose `full` when:

- the system/module is new;
- architecture or data model is foundational;
- the feature is regulated, money-adjacent, safety-adjacent, or irreversible-data-adjacent;
- many agents will work in parallel;
- traceability/auditability is mandatory.

Run the full v7-style specification zone and Gates A/B/C.

## Agent-insights challenge

After drafting the classification, run or simulate an advisory pass asking:

- What is over-prescribed?
- What can be simplified?
- Which existing code/pattern should be reused?
- Which contract is truly necessary?
- What can be safely deferred?

Record accepted observations in the report. Do not silently apply speculative changes.

## Stop conditions

Escalate if:

- path selection is genuinely ambiguous and materially changes cost/risk;
- a destructive or sensitive DB operation is required;
- a required contract does not exist and cannot be safely inferred;
- a user-visible verb maps to multiple plausible surfaces;
- the request is too vague to produce a verifiable objective.
