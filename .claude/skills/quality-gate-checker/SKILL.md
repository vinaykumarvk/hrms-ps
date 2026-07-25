---
name: quality-gate-checker
description: "Run automated Gates A, B, and C. Use when the orchestrator reaches a formal gate or when an artefact is amended. MUST run as a fresh-context subagent — the orchestrator may not self-evaluate."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Quality Gate Checker

Emit a verdict: `PASS`, `CONDITIONAL`, or `BLOCKED`.

## Fresh-context dispatch protocol (mandatory, added 2026-06-10)

**The producer never grades its own homework.** Every gate runs in a fresh context. The orchestrator MUST NOT call this skill in its own producer context.

Adapter dispatch:

- Claude Code: dispatch via the Agent tool (`subagent_type: Explore` by default — read-only, no Edit/Write/NotebookEdit).
- Codex: dispatch via the available Codex sub-agent / multi-agent facility when present, or start a separate Codex run with a prompt containing only the inputs below. If no fresh-context mechanism is available, record the gate as `BLOCKED` with `NO_FRESH_CHECKER_CONTEXT`; do not self-evaluate.

**What the checker subagent receives (in its prompt):**
1. The gate identifier (`A`, `B`, `C`, `B-prime`, `Stage-9-fixture`).
2. The exact checklist for that gate (the sections below).
3. The artefact under review (file paths only — let the subagent Read them itself).
4. The **upstream contracts** the producing skill was supposed to honour (e.g., for Gate B: `docs/data-model/DATA_MODEL.md`, `docs/data-model/schema.sql`, the BRD; for Gate C: the BRD, the data model, `docs/contracts/*`).
5. The current `docs/spec/manifest.json` so the checker can see prior gate state and the caveat ledger.

**What the checker subagent does NOT receive:**
- The producing skill's internal notes, chain-of-thought, or scratchpad.
- The orchestrator's planning narrative or rationale for how the artefact was built.
- Any "summary of what was done" written by the producer. The checker forms its own summary by reading the artefact.

**Why:** the orchestrator's reasoning leaks into a checker that sees it — the checker reads "we decided X because Y" and treats X as resolved. A subagent that only sees the deliverable + the spec it was supposed to meet evaluates against the spec, not against the producer's confidence. Example (from a past pilot project): a manifest recorded `gates.A.by = "auto (orchestrator self-evaluated)"` — the producer had graded its own homework, which is the exact gap this protocol closes.

**Claude Code dispatch example (from feature-life-cycle to quality-gate-checker):**
```
Agent(
  description="Gate B check",
  subagent_type="Explore",
  prompt="""
You are the Gate B checker. You have not seen the data-model generation process.
Read these inputs and apply the Gate B checklist (and Gate B-prime if gap-analysis has run):
- docs/brd.md
- docs/data-model/DATA_MODEL.md
- docs/data-model/schema.sql
- docs/spec/manifest.json
- The Gate B section of the installed `quality-gate-checker/SKILL.md`

Emit a single JSON object:
{
  "verdict": "PASS" | "CONDITIONAL" | "BLOCKED",
  "checked_at": "<iso8601>",
  "model": "<your-model-id>",
  "checks_run": ["entity-coverage", "constraint-coverage", ...],
  "findings": [
    {"id": "F-001", "severity": "BLOCK"|"CONDITIONAL"|"INFO", "claim": "...",
     "evidence": "<file:line>", "required_fix": "..."}
  ],
  "caveats": [{"id": "CAV-NNN", "text": "...", "discharge_by": "<stage>"}]
}
No prose outside the JSON.
"""
)
```

## Recording the verdict in the manifest

After the subagent returns, the orchestrator writes:

```json
"gates": {
  "B": {
    "signed_off": true,
    "verdict": "CONDITIONAL",
    "checker_context": {
      "mode": "fresh-subagent",
      "subagent_type": "Explore or codex-fresh-run",
      "model": "<model-id-the-subagent-reported>",
      "started_at": "<iso8601>",
      "completed_at": "<iso8601>",
      "input_scope": ["docs/brd.md", "docs/data-model/DATA_MODEL.md",
                      "docs/data-model/schema.sql", "docs/spec/manifest.json"],
      "excluded_inputs_note": "producer scratchpad NOT provided"
    },
    "by": "fresh-subagent",
    "at": "<iso8601>",
    "attempts": 1,
    "caveats": ["CAV-NNN"]
  }
}
```

**Legacy `by: "auto (orchestrator self-evaluated)"` is now a Gate-checker BLOCK.** A retroactive audit of any manifest with that value triggers a re-run of the gate as a fresh-subagent dispatch before the feature is considered closed.

## Checklists

Gate A checks requirements completeness, unique IDs, roles, workflows, failure paths, NFR numbers, external systems, and out-of-scope boundaries.

**Gate A — verb-to-surface sub-check.** On brownfield projects, the BRD MUST contain a §0.5 Verb-to-Surface Map (see `brd-generator` Step 1.5). Gate A additionally verifies:
1. Every user-visible verb in the source spec paragraph appears exactly once in §0.5.
2. Every §0.5 row has either a New FR ID (which must exist in §6) OR a "Reuses existing surface" file:line citation that exists on disk.
3. Every FR with status `NEW COMPONENT` or `NEW BUTTON` has a non-empty `Components and Screen Behavior` row in §6 that names a file path.
4. A user-visible verb with no row in §0.5 = BLOCK with finding `VERB_NOT_MAPPED: verb '<X>' from source spec has no entry in §0.5 Verb-to-Surface Map`.

This sub-check surfaces missing UI affordances at Gate A, before data modelling — instead of after integration review.

**Gate A — derivation-rule-to-source sub-check.** On brownfield projects, the BRD MUST also contain a §0.6 Derivation-Rule-to-Source Map (see `brd-generator` Step 1.6). Gate A additionally verifies:
1. Every derivation phrase in the source spec paragraph (classification rules, aggregations, distributions, source-of-truth references, consistency invariants, location-of-enforcement claims) appears exactly once in §0.6.
2. Every §0.6 row with `Status: RESOLVED` names a source table and a column/expression. Empty source columns = BLOCK with `DERIVATION_UNRESOLVED_BUT_MARKED_RESOLVED`.
3. Every §0.6 row with `Status: DEFERRED` has a non-empty `Caveat ID` referencing an entry in the BRD's §0.7 caveat list whose `discharge_by` names a specific stage (`Stage 2`, `Stage 5.5`, `Stage 6`, or `Stage 7`). A DEFERRED row with no caveat = BLOCK with `DERIVATION_DEFERRED_WITHOUT_CAVEAT`.
4. Every §0.6 row with `Status: NEW` references an FR that introduces the new column or computation.
5. A derivation phrase with no row in §0.6 = BLOCK with `DERIVATION_NOT_MAPPED: phrase '<X>' from source spec has no entry in §0.6 Derivation-Rule-to-Source Map`.

**Gate B-prime — gap-analysis citation sub-check (runs at Stage 5.5 close).** The gap-analysis artefact (produced by `brd-coverage`) MUST classify every FR per layer (DATA / API / UI / PARSER) per the per-layer rule in `brd-coverage` SKILL.md. Gate B-prime additionally verifies:
1. Every layer marked `EXISTS` cites a specific `file:line` for the evidence. Bare "EXISTS — already supported" = BLOCK.
2. Every layer marked `UNTESTED` (PARSER layer only) has a corresponding entry in `docs/tests/fixture-coverage.md` planning at least one real-fixture acceptance case in Stage 6a. Missing entry = BLOCK.
3. No FR has a `DONE` headline verdict while any of its layers is `MISSING` or `UNTESTED`. Mismatch = BLOCK with finding `LAYER_VERDICT_INCONSISTENT`.

Gate B checks data model coverage, constraints, relationships, statuses, access rules, indexes, assumptions, and migration policy.

**Gate B — schema-grounding sub-checks (added 2026-06-07).** On brownfield projects, Gate B additionally verifies that:
1. Every table the data-model artefact references that ALREADY EXISTS in the live schema has been introspected (`\d <table>` output present in the artefact's Assumptions section).
2. No proposed enum value or CHECK constraint conflicts with an enum or CHECK already present on the same column. Conflict = BLOCK with finding "ENUM_CONFLICT: column X has live values {A,B,C}; proposed values {D,E,F} are not a strict superset".
3. Every entity the data-model artefact claims to reference for column `Y` has column `Y` in its live schema. Missing column = BLOCK with finding "COLUMN_NOT_FOUND: artefact assumed <table>.<column> but live \d does not show it".
4. `UNVERIFIED — schema not reachable` tags on tables that already exist on disk (per the project's migrations directory) auto-BLOCK; the agent must restore DB connectivity or surface the inability as Escalation #2.

Gate C checks API/auth/state/error/env/testing/dependency/NFR contracts and cross-requirement transition conflicts.

**Gate C — closure sub-checks (added 2026-06-07).** Gate C additionally verifies that:
1. Every error code that appears in any LLD's `Failure Handling` row already exists in `error-taxonomy.md`. Missing code = BLOCK.
2. Every audit-table INSERT planned by any LLD respects the target table's CHECK constraints, parsed from the data-model artefact or live `\d`. A planned `INSERT INTO X (col, …) VALUES ('Y', …)` where the table's CHECK restricts `col` to a closed enum not containing `'Y'` is a BLOCK at Gate C — not a Stage 8 finding.
3. Every state transition any LLD prescribes matches a transition in `state-machines.md` for the named entity. Mismatch = BLOCK.

**Advisory ledger sub-check (added 2026-06-10).** Before each gate dispatches, the orchestrator runs the pre-gate decision ritual on `docs/agent-insights/<feature>.md` (see `feature-life-cycle` Advisory Track section). When the checker subagent dispatches, it MUST also:
1. Read `docs/agent-insights/<feature>.md` if it exists.
2. Verify every insight with `priority: high` raised for this gate's stage has a non-null `status` (one of `accepted`, `rejected`, `deferred`). A `high` insight still with `status: proposed` at gate time = INFO finding `ADVISORY_HIGH_UNPROCESSED: insight AIC-NNN ("<short>") still proposed at gate dispatch`.
3. Verify every `rejected` insight has a non-empty `decision_reason`. Empty = INFO `ADVISORY_REJECTION_WITHOUT_REASON`.
4. NOT BLOCK on advisory items — these are INFO-only. The advisory track is parallel; it never gates the spec track. The findings are present so the operator sees what was deferred.

**Stage 9 fixture-coverage sub-check (added 2026-06-07-v2).** When Stage 9 (cross-FR integration review) reaches its close, the checker also verifies:
1. For every FR whose `PARSER / INTEGRATION` layer was classified `UNTESTED` at Stage 5.5, at least one acceptance test in `docs/tests/fixture-coverage.md` has run end-to-end against a real fixture in `docs/spec/fixtures/<feature>/`.
2. For every file under `docs/spec/fixtures/<feature>/`, at least one test in `apps/*/src/**/*.test.ts` or `e2e/**/*.spec.ts` loaded it. (Grep the test bodies for the filename.)
3. If `docs/spec/fixtures/<feature>/` is empty AND the feature involves file upload / parser / external integration, emit a **WARN** (not BLOCK) with finding `MISSING_REAL_FIXTURE` and the rationale "synthetic-only test coverage — first production payload may surface library edge cases the test suite cannot anticipate." The WARN must be processed (accept/reject with rationale) before Stage 9 closes per the v1 WARN-closure rule.

Record the verdict by writing it into the manifest directly (`docs/spec/manifest.json`, or the root `manifest.json` where that is the documented location) per the "Recording the verdict in the manifest" shape above — the pipeline CLI is not part of this distribution.
BLOCKED enters bounded remediation; repeated BLOCKED escalates.

## Change-category validation matrix

Before grading any gate that covers implementation work, classify each change into exactly one primary category. The category dictates the minimum evidence the checker demands. A change spanning categories owes the UNION of their requirements.

| Category | Minimum required evidence |
|---|---|
| **Schema** | Migration file (never direct DDL); applied locally with the runner's own output captured; live schema read confirming the result |
| **API contract** | Contract artefact updated in the same change; every new endpoint explicitly public or auth-protected; error codes pre-registered in the taxonomy |
| **Business logic** | Unit/integration tests covering the changed branches, with executed counts; real typecheck |
| **UI** | Real typecheck; the actual user flow exercised; required states present (no skeleton components) |
| **Config / flags** | Re-run whatever reads the changed key (parsers often fail open on bad config — verify the parse, not just the write) |
| **Dependency** | Package-age check per the new-dependency quarantine rule (`npm view <pkg> time.created` or ecosystem equivalent); lockfile updated in the same change |
| **Infra / deploy** | Deploy-config validation; evidence the target environment was verified, not assumed |
| **Data repair** | The data-repair migration discipline below, in full |

A change claiming a category's verdict without that category's evidence = BLOCK with finding `CATEGORY_EVIDENCE_MISSING: <category> change lacks <evidence>`.

## Definition-of-done hardening

A "done" claim survives the gate only when all of the following hold:

1. **The real flow ran with real data** — not a unit test standing in for the flow, and not synthetic happy-path input only (evidence bar: `verification-doctrine`).
2. **A real typecheck passed** — `tsc --noEmit` or the ecosystem equivalent. A bundler build succeeding proves nothing about types; never accept it as the static gate.
3. **Test results carry executed counts** — `N passed | M skipped`, not an exit code. A green suite whose relevant tests were skipped is not evidence.
4. **Any schema claim is backed by a live schema read** performed in-session (e.g. `\d <table>`), not by the ORM definition or the artefact's memory of the schema.

Claims missing any of these are graded unverified, not done.

## Never-bypass list

Detecting any of the following behind a verdict is an automatic BLOCK, regardless of how green the gate otherwise looks:

1. **Applied migrations are never regenerated or edited.** The original bytes are the audit trail; if an applied migration is wrong, a NEW forward migration fixes it.
2. **Failing tests are never deleted to pass a gate**, and skips are never added without a tracked issue reference.
3. **Guard hooks are never disabled to make a gate green.** A guard block is an input to the gate, not an obstacle to it; legitimate overrides follow the override etiquette (user-approved, surfaced, logged — see `vibe-coding-guardrails`).

## Data-repair migration discipline

When the artefact under review repairs existing rows (as opposed to changing schema shape), the checker verifies all of the following; any miss = BLOCK:

1. **Baseline first.** The remediation started from a baseline measurement — a query or detector run quantifying the defect, recorded before any row was touched — and measurable success criteria were defined before repairing ("the detector exits 0", "zero non-exempt rows"), never "looks right".
2. **Narrow scope, explicit row mapping.** The migration enumerates exactly which rows it touches (an explicit mapping of keys to new values), changes only the defective fields, and preserves everything else.
3. **Before-images are mandatory.** Pre-repair values are inserted into a backup table keyed by a dated repair id (e.g. `<FAMILY>-<date>-<phase>`) in the same migration, before the UPDATE runs.
4. **Rollback SQL is recorded twice** — in the migration header and in the review doc — and the review doc carries per-row Before/After with a one-line rationale citing the evidence source for each mapping.
5. **Post-repair measurement** repeats the baseline query and records the result against the success criteria.

Query recipes for baseline and post-repair proof: `proof-and-analysis-toolkit`. The incident patterns behind this discipline: `failure-archaeology`.
