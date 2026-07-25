---
name: cross-feature-learning
description: "Act on a finding from a cross-feature learning report. The GitHub Actions workflow analyzes manifests after each PR merge and emits a report under docs/learning-reports/. Use this skill to draft and propose the amendment for a specific finding ID. Invoke as '/cross-feature-learning apply <finding-id>', '/cross-feature-learning list', or '/cross-feature-learning apply <finding-id> from <report-file>'."
argument-hint: "apply <finding-id> [from <report-file>] | list"
user_invocable: true
allowed-tools: Read Write Edit Bash Glob Grep
---

# Cross-feature Learning — operator-driven amendment proposer

The `cross-feature-learning.yml` GitHub Action runs after each PR merge that touches `docs/spec/manifest.json`, analyses the last N manifests, and writes a structured learning report to `docs/learning-reports/<date>-<feature>.json` with proposal findings. Each finding names a target skill and a proposed amendment.

This skill is the human-in-the-loop side: you decide which findings to act on, and the skill drafts the amendment as a PR.

## Modes

### `/cross-feature-learning list`

List all learning reports under `docs/learning-reports/`, newest first, with their finding count and one-line summaries. Use this to scan what's pending.

### `/cross-feature-learning apply <finding-id> [from <report-file>]`

Act on one finding. Steps:

1. **Locate the finding.** If `from <report-file>` is given, read that file. Otherwise, walk `docs/learning-reports/` newest-first and pick the first report containing a finding with the given `id`.

2. **Read the target skill.** Resolve `proposed_amendment.target_skill` to a path:
   - `skills/<skill-name>/SKILL.md` in this repo when available;
   - `.agents/skills/<skill-name>/SKILL.md`, `~/.codex/skills/<skill-name>/SKILL.md`, or `~/.agents/skills/<skill-name>/SKILL.md` for Codex-installed skills;
   - `~/.claude/skills/<skill-name>/SKILL.md` for Claude Code-installed skills;
   - `docs/contracts/<contract-name>` for contracts-package items;
   - For "X OR Y" targets, ask the operator which to amend.

3. **Draft the amendment.** Read the target file. Identify the smallest, most surgical edit that incorporates the lesson — typically:
   - For a skill SKILL.md: a new sub-section, a new checklist item, or a sentence inserted into an existing section. NOT a full rewrite.
   - For a contract file: a new entry following the existing schema; NEVER reorder existing entries.

4. **Cite the evidence.** Every amendment includes an inline `(added <date>, from learning report <date>-<feature>.json)` marker citing the report. Future learners must be able to walk back from the amendment to the data that motivated it.

5. **Open a PR, do not push to main directly.** Create a branch named `learning/<finding-id>-<feature-slug>`, apply the edit, commit with a message that quotes the finding's `claim`, and open a PR titled `Learning: <finding-id> — <one-line claim>`.

6. **PR description** must include:
   - The full finding JSON;
   - A diff summary of the amendment;
   - A test plan: "Run the next feature life-cycle through this skill; verify the recurring caveat / deviation / overage does not recur in the new manifest";
   - A link to the source report.

7. **Mark the finding as `acted_on` in the report.** Append `{"finding_id": "<id>", "acted_on_at": "<iso8601>", "pr_url": "<url>"}` to the report's `actions` array (create the array if missing). Commit that change as part of the same PR.

## Operating rules

- **Never auto-merge.** The whole point of the loop is that proposals are reviewable; the operator merges after reading.
- **One finding per PR.** Even when multiple findings target the same skill, keep them separate — review is sharper.
- **If you cannot draft surgically, surface and stop.** A finding that requires restructuring the target skill is escalated to the human ("this finding implies the skill's section X needs a redesign, not an addition"), not papered over.
- **A finding that is wrong is still useful.** If the report's `proposed_amendment` text misreads the evidence, mark the finding `rejected` in the report's `actions` array with `rejected_reason`, and surface the rejection to the operator. Wrong findings sharpen the analyzer.

## Inputs / outputs summary

- **Inputs:** `docs/learning-reports/*.json` (one per merged feature), the target skill / contract file, the operator's choice.
- **Outputs:** a branch + PR amending the target file, with the report file updated to record the action.
