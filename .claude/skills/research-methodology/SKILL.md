---
name: research-methodology
description: Discipline for turning a hunch into an accepted result — falsifiable hypotheses with pre-registered predictions, adversarial refutation before adoption, default-off experiment flags with an adopt-or-retire verdict, an ambiguity ledger instead of silent guessing, and an open-problems register with disproof criteria. Use when someone says "let's try", "I think X causes Y", "is this proven", "run a pilot", or when gating unproven behaviour, deciding adoption, retiring a stale experiment, or writing up trial results. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
---

# Research Methodology — Hypothesis to Accepted Result

This skill defines how an idea earns the status of "result": state a falsifiable hypothesis with predicted numbers before running anything, try to break the conclusion before believing it, gate unproven runtime behaviour behind a default-off flag with an owner and a retire-by date, and resolve every experiment to an explicit ADOPT or RETIRE verdict. The dominant failure mode this guards against is **claims without verification** — conclusions adopted because they were plausible and nobody tried to refute them.

## When to use this skill

- You have a hypothesis about a system ("the flaky test is timezone-dependent", "batching will cut import time by half") and want to test it properly.
- You are trialling a process, tool, or pipeline change and need success/failure criteria defined before running.
- You want to ship unproven runtime behaviour safely (flag-gated experiment, dark launch).
- You are deciding whether results justify adoption, or whether a flag/idea should be retired.
- You hit a genuine ambiguity mid-task and must record it instead of guessing.
- You are maintaining a register of open problems and need falsifiable milestones for them.

## When NOT to use this skill

| Situation | Use instead |
|---|---|
| A proposed idea/design needs multi-perspective challenge before anyone commits to it | `adversarial-idea-evaluator` — it stress-tests a proposal; this skill governs how a hypothesis becomes an accepted result through experiments |
| You need the general evidence bar for claiming any change works | `verification-doctrine` |
| You need concrete measurement recipes (queries, profiling, predict-before-run counts) | `proof-and-analysis-toolkit` |
| You are mining past incidents for lessons | `failure-archaeology` |
| Routine feature implementation | the pipeline path (`process-classifier`, `feature-life-cycle`) |

## Key concepts

- **Hypothesis** — a falsifiable statement plus predicted numbers, written BEFORE running anything. If you cannot name the observation that would prove it wrong, it is not a hypothesis yet.
- **Discriminating experiment** — the cheapest test whose outcome differs depending on whether the hypothesis is true or false.
- **Experiment flag** — a feature flag or env var, default OFF, gating unproven runtime behaviour so it can ship dark and be evaluated in place.
- **Refutation pass** — a deliberate, recorded attempt to break your own conclusion before adopting it.
- **Ambiguity ledger** — the written record of "I could not resolve this from existing artefacts", with an owner, instead of a silent guess.
- **Open-problems register** — the file that records what the project is trying to prove but has NOT proven, each entry with a falsifiable milestone and a disproof criterion.

---

## Hypothesis format — predict before you run

Write this block into your working notes or trial doc BEFORE executing anything:

```markdown
## Hypothesis
<falsifiable statement — one sentence>

## Predicted observations (written before running)
- <metric / count / behaviour> will be <specific number or range>
- <what I expect to see if TRUE>
- <what I would see instead if FALSE>   ← mandatory: the disproof condition

## Discriminating experiment
<exact command / query / procedure — cheapest test that separates TRUE from FALSE>

## Result (filled AFTER running — never edit the prediction)
- Predicted: <X>  Observed: <Y>  Verdict: CONFIRMED / REFUTED / INCONCLUSIVE
```

Rules:

- **Never revise a prediction after seeing data.** Add a new hypothesis instead; keep the failed one visible. Failed predictions are the most informative rows in a trial doc.
- **Prefer counts over adjectives.** "The importer sometimes duplicates rows" is a hunch; "re-running the importer on the same fixture will produce >0 duplicate keys in ≥3 of 20 tables" is a hypothesis.
- **Estimate before you execute.** For any non-trivial query or run, write the expected row count / latency / hit rate first, then compare (recipes in `proof-and-analysis-toolkit`).
- **A number guessed after seeing the output is a description, not a confirmed prediction.**

### Worked example (neutral)

```markdown
## Hypothesis
The nightly import duplicates rows only when the upstream feed resends a batch —
the importer itself is idempotent.

## Predicted observations (written before running)
- Re-running the importer twice on the same local fixture will produce 0 duplicate keys.
- Replaying a resent-batch fixture will produce 40–60 duplicates (one per batch row).
- If FALSE (importer is at fault): the plain double-run will itself produce >0 duplicates.

## Discriminating experiment
Run `import --fixture=standard` twice against a clean local DB; count duplicate
business keys. Then run once with `--fixture=resent-batch`; count again.

## Result (filled AFTER running — never edit the prediction)
- Predicted: 0 then 40–60. Observed: 12 then 58. Verdict: REFUTED —
  the double-run alone produced 12 duplicates, so the importer is not idempotent.
- New hypothesis (H2): duplicates come from rows lacking a natural key, which the
  importer inserts unconditionally. Predicted: all 12 duplicates have NULL natural keys.
```

Note what happened: the disproof condition fired, the prediction was left intact, and a new hypothesis was added underneath. That predict-then-score trail is the house standard for trial docs.

## Adversarial refutation protocol

Before adopting any conclusion — your own or an agent's — run one deliberate refutation pass. For the conclusion "X is true / X is the right design", answer in writing:

1. **Alternative cause.** What OTHER mechanism produces the same observation? (Example: "500 files flagged as modified" is equally consistent with mass tampering and with line-ending normalization — only a normalize-then-compare test separates them.)
2. **Coincidence / base-rate check.** Would I have seen this result anyway, even if the hypothesis were false? What is the base rate? (A green test run proves little if the suite silently skips when a dependency is absent — check executed-vs-skipped counts.)
3. **Masking check.** Could a fallback, default, or cache be hiding the failure? Classic pattern: an outer join plus a default value making absent data look like success.
4. **Strongest counter-experiment.** Name the single test most likely to break the conclusion, and run it if it costs less than being wrong. For a design decision, name the failure scenario the design handles worst.
5. **Who disagrees in the written record?** Check reviews, post-mortems, the incident history (`failure-archaeology`), and known-traps lists for contradicting evidence. A conclusion that contradicts a recorded incident must explain the incident.

Record the pass in the trial doc as a short section: "Refutation attempts and why they failed." **A conclusion nobody tried to break is a candidate, not a result** — label it `candidate`. For high-stakes conclusions, escalate the refutation pass to a full `adversarial-idea-evaluator` council.

## Experiment-flag lifecycle

Unproven runtime behaviour ships dark: behind a flag or env var, default OFF, evaluated in place.

| Stage | Requirement |
|---|---|
| Create | Default OFF. The flag key names the experiment, not the mechanism (`checkout_retry_trial`, not `new_code_path`). Created through the project's normal change path — never hand-edited in production. |
| Document | Record the owner, start date, retire-by date, and the hypothesis being tested — in the flag's description field if one exists, and always in a dated experiment doc. A flag whose purpose exists only in someone's head is already stale. |
| Bound | Give time-boxed experiments a hard end (expiry rule, `activeTo` window, or calendar retire-by date) so expiry does not depend on memory. |
| Evaluate | Score the pre-registered predictions against measured data. |
| Resolve | Either **ADOPT** (flip the default through change control, then remove the flag and the dead branch) or **RETIRE** (remove the flag and the gated code). |

**A flag left half-on with no verdict is the worst outcome** — it is unverified behaviour living in production paths, invisible to the next maintainer. Every flag resolves to ADOPT or RETIRE; there is no third state.

Env-var-gated experiments follow the same lifecycle minus the flag store: default off, owner and retire-by in the experiment doc, resolved to adopt-or-retire.

## Adoption criteria

An experiment graduates to adopted behaviour only through the project's change-control path. Checklist:

```
□ Hypothesis doc exists with pre-registered predictions and scored results
□ Refutation pass recorded (attempts + outcomes)
□ Evidence bundle complete: exact commands, raw outputs or artefact paths,
  thresholds, environment it ran against (verification-doctrine sets the bar)
□ Measured vs. assumed labelled on every number
□ Flag default flipped / mechanism promoted through normal gates — no bypass
□ Dead experimental branch and flag removed (or removal scheduled with owner + date)
```

"Deferred" cleanup needs a named owner and a close-by date — "we'll get to it" is not a rationale.

## Retirement criteria

Retire (remove flag + gated code, or close the idea with a written verdict) when ANY of these holds:

- The disproof condition fired: observed data matched the pre-registered "if FALSE" prediction.
- The retire-by date passed with no adoption decision — **expiry without a verdict defaults to RETIRE**, not silent extension.
- The owner left the context and nobody re-adopted the experiment within one review cycle.
- A refutation pass found an alternative cause that fits the data at least as well and is cheaper.

Write the retirement down (one paragraph: what was predicted, what was observed, why retired). Un-recorded retirements become the next agent's phantom feature.

### Explaining negative and null results

1. State the pre-registered prediction and the observed value side by side.
2. Classify: hypothesis **REFUTED** (mechanism wrong) vs. experiment **INCONCLUSIVE** (test lacked power, environment differed, data insufficient) — they have different follow-ups.
3. Name what the failure rules out — a refuted hypothesis that eliminates a whole cause family is a positive contribution; record it so the next investigator does not re-run it.
4. File it in the same dated locations as successes (`docs/reviews/` or the project's process-learnings directory). Negative results that live only in a chat transcript are lost.

## Trial write-up template

Every experiment — successful, failed, or inconclusive — gets a dated doc (`docs/reviews/` or the project's process-learnings directory). Structure:

```markdown
# <Experiment name> — trial log <YYYY-MM-DD>

## Hypotheses going in
<the pre-registered hypothesis blocks, verbatim — predictions untouched>

## Environment and commands
<exact commands/queries, the environment they ran against, fixture/dataset used>

## Observations
<each prediction scored against what actually happened; raw output or artefact
paths, not paraphrases; measured vs. assumed labelled>

## Refutation attempts and why they failed
<the five-step protocol outcomes for any conclusion being adopted>

## Verdict
ADOPT / RETIRE / INCONCLUSIVE (+ follow-up) — with the flag disposition if any

## Caveats and open items
<each with owner and date; unresolved ambiguities cross-referenced to the ledger>
```

The evidence bar for what counts inside this doc (raw output preserved, executed-vs-skipped counts, no unmeasured performance claims) is owned by `verification-doctrine`; the measurement recipes by `proof-and-analysis-toolkit`.

## The ambiguity ledger

When a genuine ambiguity survives one honest attempt to resolve it from existing artefacts (schema, contracts, LLDs, code), do NOT guess. Record it:

- **Blocking ambiguity:** write `AMBIGUITY.md` (repo root or the feature workdir) stating the date, stage, the FR/goal, what the spec assumed, what the live artefact actually says (with the query output or file quote), and the precise question for the human.
- **Non-blocking ambiguity:** an inline `# AMBIGUITY: <text>` marker or a ledger file entry, whichever the project's tooling collects — always with enough context that someone else can answer it.

Every ledger entry needs an **owner**. Review the ledger at experiment wrap-up: unresolved entries either become questions in the review doc or explicit `open` items with an owner and date. An ambiguity ledger nobody reads is guessing with extra steps.

## From failure to mechanical enforcement

When an experiment or incident yields a durable lesson, the shape that historically holds is:

**observed failure → written analysis with evidence → MECHANICAL enforcement (a hook, check script, CI gate, or contract line) — not a memo.**

Documentation alone does not change agent behavior: rules "documented in three places" still get violated on turn one. Land the lesson as something a machine enforces — a pre-commit hook that blocks the pattern, a check script that exits non-zero, a schema constraint, a CI gate — and keep the written analysis as the rationale behind it. Typical channels:

| Channel | Output |
|---|---|
| Post-mortem | A guard hook or lint rule that blocks the failure pattern |
| Audit | A baseline contract that later work is diffed against |
| Learning report | A reviewable amendment to the skill or process that produced the defect |
| Root-cause analysis | A check script plus a regression test |

(`failure-archaeology` covers mining past incidents; this skill covers closing the loop on new ones.)

## The open-problems register

Keep one file (e.g. `docs/open-problems.md`) recording what the project is trying to prove but has NOT proven. Rules of the register:

- **Nothing in it may be presented, internally or externally, as achieved.** Every claim is labelled `candidate` (plausible, not yet validated) or `open` (unresolved) until a dated evidence artefact says otherwise.
- **Recording disproof is a success of the register**, not a failure of the work — a disproven goal redirects effort, which is the system working.
- Check the register before calling a proposal "new": if it is already a tracked entry, extend the entry instead of forking it.
- Update the register in the same change that meets or disproves a milestone.

Each entry has six parts:

```markdown
## <Entry name>

**Goal:** <one sentence — the capability to demonstrate>

### Why the current state is insufficient
<verified evidence of the gap — cite files, incidents, measurements; no vibes>

### Assets already present
<what exists to build on, not rebuild — with locations>

### First steps (all `candidate`)
1. <ordered, concrete, in-repo actions>

### Falsifiable milestone
<a concrete observable event — "a new tenant onboards end-to-end with zero code
changes and the certification check prints OK" — not "onboarding is easy now">

### Disproof evidence
<the observation that would show the goal is NOT met on the current architecture>
```

Working an entry: pick one entry and its single next step (do not open every front at once), write the hypothesis and predicted numbers first, run the change through normal gates — frontier status never exempts a change from change control — then record the outcome (met / partially met / disproven) as a dated report and update the entry in the same change.

## Evidence standards

Before claiming an experimental result:

- Predictions pre-registered in writing; results scored against them verbatim.
- Every number traceable to a command plus an artefact path; measured vs. assumed labelled.
- One recorded refutation attempt for any conclusion you intend to adopt.
- Flags/env gates for anything that touched runtime behaviour; default off; owner + retire-by recorded.
- Adoption only through change control; retirement written down.
- **"The harness exists" is never evidence the property holds.** A detector, certification suite, or check script that is not run on every relevant change protects nothing — defects ship while the harness sits idle. Cite the run, not the existence. The strongest form of this trap: a verification harness and the defect it targets coexisting in the same repo because the harness was out-of-band.
- Anything not meeting the bar is labelled `candidate`, `unverified`, or `open` — never presented as a result.

## Quick reference

```
□ Hypothesis written with predicted numbers + disproof condition, BEFORE running
□ Discriminating experiment chosen (cheapest test separating TRUE from FALSE)
□ Prediction never edited after data — failed hypotheses stay visible, new ones added
□ Refutation pass run and recorded (5 steps) before adopting any conclusion
□ Runtime experiments flag-gated: default OFF, owner + retire-by + hypothesis recorded
□ Every flag resolved to ADOPT or RETIRE — no half-on flags without a verdict
□ Ambiguities recorded with owner, never silently guessed
□ Negative results written up with the same rigor as successes
□ Durable lessons landed as mechanical enforcement, not memos
□ Open problems tracked in the register with falsifiable milestones + disproof criteria
□ Nothing labelled a "result" that nobody tried to break
```

## Related generic skills

- `adversarial-idea-evaluator` — challenges a proposed idea/design before commitment; use it as the heavyweight form of the refutation pass. This skill governs the experimental loop that follows.
- `verification-doctrine` — the general evidence bar for claiming any change works.
- `proof-and-analysis-toolkit` — concrete measurement and proof recipes (predict-before-run counts, masking audits, profiling etiquette).
- `failure-archaeology` — mining past incidents; feeds step 5 of the refutation protocol and the failure-to-enforcement loop.
- `cross-feature-learning` — the reviewable-amendment channel for turning learning-report findings into process changes.
