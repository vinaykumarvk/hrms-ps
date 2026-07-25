---
name: full-review
description: "Evidence-first multi-domain review. Default is report-only/no-fix. Use fix modes only after the review report exists and the user explicitly asks to repair selected severity levels. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here."
argument-hint: "[target] [no-fix|--fix critical-only|--fix high+|--fix all]"
user_invocable: true
allowed-tools: Read Write Edit Bash Glob Grep Skill Task
---

# Full Review — Report First

`full-review` reviews first and repairs only when explicitly asked.

The v7 behavior encouraged a single skill to review, fix, and re-review in one run. v8 separates those responsibilities so the reviewer does not become judge, fixer, and scope-changer at the same time.

## Default behavior

If no fix option is provided, behave as:

```text
/full-review <target> no-fix
```

Produce a report only. Do not edit files.

## Modes

| Mode | Behavior |
|---|---|
| `no-fix` | Default. Review only. No edits. |
| `--fix critical-only` | Repair only CRITICAL/P0 implementation findings. |
| `--fix high+` | Repair CRITICAL/P0 and HIGH/P1 implementation findings. |
| `--fix all` | Repair all implementation findings after review. Use sparingly. |

Any finding that requires changing requirements, contracts, LLDs, acceptance tests, state machines, error taxonomy, dependency register, or database policy must be routed to amendment workflow, not silently fixed.

## Review sequence

1. Determine target scope.
2. Load project config and process classification if present.
3. Run applicable review passes:
   - guardrails / coding standards;
   - UI review, if UI exists;
   - quality review;
   - security review;
   - infra review, if infra exists;
   - `brd-coverage`, if requirements exist;
   - component substance / anti-skeleton check.
4. Deduplicate findings.
5. Assign severity.
6. Write the report.
7. Stop unless a `--fix` mode was explicitly requested.

## Conditional skip logic

Skip reviews that do not apply to the target, but record the skip reason.

| Review | Skip condition |
|---|---|
| UI review | No frontend/UI files under target |
| Infra review | No Dockerfile, deploy config, migrations, or CI files affected |
| BRD coverage | No requirements/BRD/spec artefact applies to target |
| Cross-FR review | Light path or single local change |

Security and quality review are always applicable.

## Severity model

| Severity | Meaning | Default action |
|---|---|---|
| CRITICAL / P0 | Data loss, security breach, broken core workflow, skeleton component | Must fix or explicitly accept risk |
| HIGH / P1 | Significant bug/regression likely this sprint | Fix in `--fix high+` |
| MEDIUM / P2 | Hardening or non-core issue | Usually backlog unless requested |
| LOW / P3 | Cleanup/nit | Backlog |

Skeleton/stub components are CRITICAL when they claim to implement a user-facing FR but lack real form fields, data rendering, API calls, or workflow substance.

### Evidence rules (folded in from the retired `evidence-reviewer`, 2026-07-08)

- No evidence, no objective finding — every objective finding must cite file:line, command output, or an artefact.
- CRITICAL/P0 and HIGH/P1 findings in a FAIL or CONDITIONAL verdict must include a concrete required fix, not just a claim.
- An approval (PASS) must record which spec/artefact versions were reviewed (the "artefacts used" list in Scope).
- Judgement-only UX/taste findings may not block the verdict; record them and route to the release/UX gate.

## Report output

Write:

```text
docs/reviews/full-review-<target-slug>.md
```

Report structure:

```markdown
# Full Review: <target>

## Verdict
PASS | CONDITIONAL | FAIL

## Scope
- target:
- selected path:
- files reviewed:
- artefacts used:

## Checks run
| Check | Ran? | Result | Evidence |
|---|---|---|---|

## Findings
| ID | Severity | Domain | File:line | Claim | Evidence | Recommended action | Repair mode eligible? |
|---|---|---|---|---|---|---|---|

## Component substance check
| Component | File | Inputs | API calls | Data renders | Verdict |
|---|---|---|---|---|---|

## Traceability impact

## Required amendments
Items that cannot be fixed as implementation repair.

## Verification commands
Commands that should be run after repair.

## Remaining risks
```

## Repair mode rules

If a fix mode is explicitly supplied:

1. Read the existing report.
2. Filter findings by selected severity.
3. Repair implementation issues only.
4. Run targeted verification after each group of fixes.
5. Update the report with resolution evidence.
6. Re-run a final no-fix review.

Do not commit unless the user or project workflow explicitly asks for commits.

## Conflict priority

When fixes conflict, use:

```text
Security > Data Integrity > Build Health > Accessibility > UI/UX > Performance > Style
```

Log every conflict and chosen resolution.
