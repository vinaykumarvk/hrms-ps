---
name: discovery-zone
description: "Structure novel product work before specification. Use when requirements are unstable, user is exploring a product idea, or the correct product bet is unknown."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Discovery Zone

Use before Stage 1 when the product is novel or requirements are unstable.

This is the pipeline's only **open-loop** zone — exploratory by design. To keep the closed pipeline (Stages 1–9) trustworthy, discovery has explicit boundaries, an output contract, and a one-way promotion gate.

## What discovery produces

For each exploration, write everything to `docs/discovery/<topic-slug>/`:

- `problem-brief.md` — what user pain, in whose words, with frequency/severity evidence;
- `personas.md` — persona hypotheses (named, falsifiable, not "the user");
- `assumption-ledger.md` — every assumption with `{id, claim, confidence, would-be-falsified-by}`;
- `reference-scan.md` — competitive/reference patterns examined, with screenshots or links;
- `prototype-options.md` — 2–4 prototype paths with sketch-level diagrams;
- `ux-flow-options.md` — 2–4 user-flow variants per prototype option;
- `experiment-plan.md` — what would be tested and what result would change the bet;
- `decision-memo.md` — the human's bet (which option, which assumptions accepted, which pain is in scope).

## Discovery is open-loop. The closed pipeline is not.

Discovery agents may roam: try multiple framings, abandon directions, change vocabulary mid-flight. That freedom is the point — discovery exists to find the right *bet*, not to specify the right *implementation*.

But **discovery outputs cannot enter Stage 1 directly**. They must be **promoted** through the gate below. This is the fence that keeps exploratory ambiguity out of the BRD.

## Promotion gate — discovery → Stage 1 (mandatory, added 2026-06-10)

After the human writes `decision-memo.md`, the operator runs the promotion gate. The orchestrator (or the operator) MUST:

1. **Extract a candidate-requirement list** from the decision memo — each candidate is `{id, one-line description, source-section-of-memo, NFR-implication-if-any}`.
2. **Classify each candidate** as one of:
   - `promote` — sufficiently bounded to enter Stage 1; bullet sentence is BRD-eligible;
   - `narrow-and-promote` — promotable after a single clarification (the clarification is captured in the memo as an addendum, not punted);
   - `defer` — interesting but not in this bet's scope; logged for later;
   - `drop` — explored, abandoned, with rationale.
3. **Write `promotion-decisions.md`** with one row per candidate and its classification + rationale.
4. **Write `explored-not-promoted.md`** with the `defer` + `drop` items so future discoveries can see what was already tried.
5. **Hand the `promote`/`narrow-and-promote` list** to `/brd-generator` as the Stage 1 input — NOT the raw discovery artefacts.

The promotion gate is the explicit closed-loop checkpoint. If 12 ideas were explored and 4 are promoted, the BRD has 4 candidates — never 12. The other 8 do not enter the pipeline as "future scope" — they live in `explored-not-promoted.md` and re-enter only via a fresh discovery cycle.

## Output budget (added 2026-06-10)

Discovery has a soft token budget to keep open-loop exploration from spiralling. Default: **150,000 output tokens per exploration**, recorded as `discovery.tokens_used` in `docs/discovery/<topic-slug>/decision-memo.md` frontmatter. The orchestrator never blocks on this — but exceeding 2× the budget is a signal that the exploration is unfocused; surface to the human and ask whether to narrow before continuing.

## Roles

- The **agent** structures exploration: enumerates options, surfaces tradeoffs, generates artefacts.
- The **human** owns the bet: which user pain matters, which tradeoff is acceptable, whether the UX feels right, which candidates to promote.
- The **promotion gate** is the human's checkpoint, not the agent's. The agent prepares the candidate list and the classification matrix; the human signs the promotion decisions.
