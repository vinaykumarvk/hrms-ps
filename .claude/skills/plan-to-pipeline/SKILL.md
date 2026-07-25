---
name: plan-to-pipeline
description: "Compile a phased plan into a safe, gated, resumable execution harness — a manifest, one /goal prompt per phase, a machine-checkable exit-criteria stub per phase, and an external driver script. Use after phased-planner when you want to run phases as controlled agent runs with real gates instead of a single unattended master goal. The hard rule it enforces: automate SEQUENCING, never JUDGMENT."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Plan → Pipeline (execution-harness generator)

Turns a phased plan (`docs/spec/phased-plan.yaml`, or any phase list) into an **executable, gated,
resumable harness** that runs each phase as **one fresh agent session**, then verifies that phase's
success **outside the model**, and either auto-advances or parks for a human. It is the operationalisation
layer between `phased-planner` (produces the plan) and `phase-executor` (does the work inside one phase).

It exists because the naive alternative — encoding all phases into one master `/goal` that loops over a file
"until all subgoals complete" — fails predictably: it exhausts context across phases, structurally fights the
human review gates (a `/goal` Stop hook *prevents* halting; a gate *requires* it), and lets the same agent
self-certify "done" (reward-hacking: declare completion or weaken a failing test to green). This skill
produces the disciplined form instead.

## The hard rule (non-negotiable)
**Automate sequencing, never judgment.** Every phase's `exit_criteria` is EITHER:
- **(a) an executable command** that returns 0 (GREEN) / non-zero (RED), run by the driver **outside the
  model** (the independent oracle — tests pass, schema loads, contract parses, artifact exists) — required
  for any `gate: auto`; OR
- **(b) `gate: human`** with a trivially-green check, so the driver runs the phase then **parks** for an
  approval token.

Never let the agent that did the work grade its own completion. If a phase's success cannot be written as a
command, it stays `gate: human`. Say so explicitly rather than fake a check.

## When to use
- After `phased-planner`, when you want to *run* the plan in small controllable steps rather than by hand.
- Any multi-phase build with dependencies, review gates, exit-criteria, and code/schema that must stay green.
- Not for a single-file fix (that is `phase-executor` directly).

## Process
1. **Read the plan.** Load the phase list (id, name, objective, steps, exit-criteria, evidence, dependencies,
   human-gate points). Read `CLAUDE.md`/`AGENTS.md` for repo conventions.
2. **Scaffold** a `pipeline/` dir (default `docs/spec/pipeline/`) by copying the templates in this skill's
   `assets/`: `run.sh` (the generic driver — do not edit), `phases.yaml`, `prompts/`, `checks/`,
   `README.md`, and gitignore the runtime dirs (`.state/ approvals/ logs/`).
3. **Generate one prompt per phase** (`prompts/<PHASE>.md`) from the plan, as a `/goal` autonomy envelope
   (objective · context · constraints · freedom · work_loops with `repeat_until` + `max_iterations` · evidence
   · escalate). Ground it in the plan's own fields; do not invent scope.
4. **Generate one check per phase** (`checks/<phase>.sh`) — the independent oracle. Where the plan's
   exit-criteria is already a command (tests/build/schema-load/contract-parse), wire it. Where it is
   human judgement, leave a `true` stub and set `gate: human`. Prefer real oracles; be honest about the rest.
5. **Write the manifest** `phases.yaml`: per phase `{id, name, prompt, exit_criteria, gate: auto|human,
   depends_on}` plus `defaults.phase_timeout_seconds`.
6. **Report the check-authoring gap:** list every phase still on a `true`/`gate:human` stub so nothing
   silently ships as auto-verified when it is not.
7. **Prove it dry:** run `./run.sh` (dry-run) and `./run.sh --status`; do NOT `--execute` — that is the user's
   call, on a sandbox branch.

## Outputs (into the target project)
```
<pipeline>/phases.yaml        # the manifest
<pipeline>/run.sh             # the driver (generic; from assets, unchanged)
<pipeline>/prompts/<PHASE>.md # one /goal prompt per phase
<pipeline>/checks/<phase>.sh  # one exit-criteria oracle (or stub) per phase
<pipeline>/README.md          # usage + safety
<pipeline>/.state .approvals .logs   # runtime (gitignored)
```

## The driver's guarantees (from `assets/run.sh`)
- **One fresh session per phase** — context never spans phases (no compaction rot).
- **External verification** — the driver runs `exit_criteria`, not the agent.
- **Gates** — `gate:auto` advances on GREEN; `gate:human` parks until `approvals/<id>.approved` exists.
- **Resumable** — phases with a `.done` marker are skipped; never re-run.
- **Hard-stop on RED** — no retry-loop → no budget runaway.
- **Safe by default** — dry-run unless `--execute`; refuses `--execute` on `main`/`master`; per-phase timeout.

## Safety harness (author these into the generated README + defaults)
- Run on a **sandbox branch**; each phase logs a `git reset --hard <rev>` rollback line.
- Keep the **DB-change approval** (and anything destructive/irreversible) as a `gate: human`.
- `CLAUDE_FLAGS` controls agent permissions; fully-unattended tool use needs a conscious, least-privilege,
  spend-capped choice — never point it at production credentials.
- **Validate the manifest content first** — a wrong prompt executes faithfully to a wrong result; automation
  scales garbage-in worse than a human-in-the-loop run.

## Relationship to other skills
`phased-planner` → **plan-to-pipeline** (this: plan → harness) → the driver runs `phase-executor` inside each
phase's session, with gates enforced externally. `pipeline-orchestrator` remains the runtime state/manifest
controller; this skill produces the *execution* spine that respects its gates.

## Anti-patterns
- One master `/goal` looping over a subgoal file unattended (context exhaustion + self-certification + gates fought).
- `exit_criteria` that is the agent's own opinion of "done".
- `gate: auto` on a phase whose success is not a real command.
- Wiping memory between phases without persisting the *rationale/caveats* (files persist; the "why" does not).
