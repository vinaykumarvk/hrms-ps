---
name: agent-insights-pass
description: "Advisory-track pass that lets the agent contribute world knowledge to the pipeline without breaking spec discipline. Use after a spec artefact lands (BRD, LLD, Stage-8 review, Stage-10 production event) to surface what the spec might be missing, what a better-known approach might be, what edge cases industry experience suggests, what libraries/patterns exist that would simplify or strengthen the work. Output goes to the per-feature Agent Insights Ledger as proposals — never silently applied, never silently dropped. Invoke as '/agent-insights-pass <stage> <artefact-path> [feature-name]'."
argument-hint: "<stage> <artefact-path> [feature-name]"
allowed-tools: Read Write Edit Bash Glob Grep
---

# Agent Insights Pass — The Advisory Track

The pipeline's spec track (Stages 1–9) intentionally reduces the agent's decision count to zero — by design, the coding agent executes the spec, it does not invent. That discipline is what keeps multi-agent builds coherent.

This skill is the **other channel**. It is the agent's voice, expressed in a structured way that the spec owner reads, decides on, and either folds into the spec or rejects with a reason. The spec track is untouched; only the ledger receives output. Accepted insights enter the spec via the existing amendment workflow — never around it.

The founding principle is unchanged: every consequential decision is explicit before code is generated. The amendment is just — **the agent is allowed to propose what to make explicit, before the spec owner decides what's in.**

## When this skill is invoked

Four checkpoints, each at a moment when the cost of an idea is still low:

| Stage | What the pass reads | What it produces |
|---|---|---|
| `1_brd` | The draft BRD (after Step 1.6 §0.6 lands, before Gate A) | "World-knowledge" insights — what this kind of feature usually needs that this BRD doesn't yet name |
| `6_lld` | One LLD at a time | "Implementation-alternative" insights — is there a materially better approach than the LLD's chosen pattern? |
| `8_review` | The Stage-8 review verdict + the merged code | "Observation" insights — non-violating notes the reviewer wouldn't flag as findings: pattern repetition, library choice friction, UX inconsistency |
| `10_production` | A production error or feedback ticket | "Pattern-match" insights — does this match a known class of issue? what does the broader community recommend? |

The pass is dispatched by `feature-life-cycle` (and by the Stage-10 production-feedback loop when it exists). Operators can also invoke it manually on any artefact.

## What the pass MUST do

1. **Read the artefact and the existing ledger.** The ledger lives at `docs/agent-insights/<feature>.md`. Read it to avoid re-proposing insights the spec owner has already rejected — a rejected `id` of the same `type` and `observation` shape is **forbidden to re-raise**. If the same insight class has been rejected twice across this feature, do not propose it a third time even with a different framing.

2. **Produce at most 10 insights.** Hard cap. If the artefact has 20 potential improvements, you must rank by impact and drop the bottom 10. This is a feature, not a constraint: insights below your top 10 are by definition lower-leverage; they don't justify the spec owner's review time.

3. **Require a citation per insight.** No insight without a concrete reference. Acceptable citations:
   - A named library + its docs URL (`Razorpay Idempotency-Key header: https://razorpay.com/docs/api/idempotency/`)
   - A named architectural pattern from a recognized source (`CQRS — Greg Young's 2010 essay`)
   - A competing product's known behavior (`Stripe rejects duplicate idempotency keys within 24h`)
   - A named RFC, regulation, or industry standard (`RFC 7807 problem+json`, `OWASP A03:2021 Injection`)
   Insights without a citation are auto-rejected at the ledger level (the orchestrator filters them on intake).

4. **Frame additively, not correctively.** The skill prompt internalises: *"the developer's spec is reasonable; identify what their experience may not have seen, not what they got wrong."* Words like "should have," "missed," "incorrect," "wrong" are forbidden in the `observation` and `rationale` fields. Use "may benefit from," "industry typically adds," "common edge case is."

5. **Rank by impact.** Each insight carries a `priority` of `high` / `medium` / `low`. The orchestrator surfaces `high` ones first to the spec owner. Definitions:
   - `high` — failure to consider would cause a real bug, data-loss, security issue, or regulatory violation
   - `medium` — would meaningfully strengthen the implementation but not strictly required
   - `low` — stylistic, ergonomic, or "nice to have"

## Ledger format (`docs/agent-insights/<feature>.md`)

The ledger is a single markdown file with YAML front-matter for each insight. Each entry:

```yaml
---
- id: AIC-001
  raised_at: 2026-06-10T14:23:00Z
  raised_at_stage: 1_brd
  source_skill: brd-generator
  artefact_reviewed: docs/brd/lac-dashboard-loi-overview-merge-2026-06-08.md
  type: missing-requirement | better-approach | known-edge-case | library-suggestion | architecture-alternative
  priority: high | medium | low
  observation: |
    Payment endpoints in this BRD do not specify idempotency handling.
    Industry typically adds an X-Idempotency-Key header so client retries
    after a network failure do not result in double-charges.
  rationale: |
    Stripe and Razorpay both require client-generated idempotency keys with
    a configurable replay window. Without one, a transient network error
    on the citizen's app forces them to call the helpdesk to confirm whether
    the payment succeeded.
  citation:
    - source: Razorpay Idempotency-Key header
      url: https://razorpay.com/docs/api/idempotency/
    - source: Stripe Idempotency-Key header
      url: https://stripe.com/docs/api/idempotent_requests
  proposed_addition: |
    Add NFR-PAY-IDEMPOTENCY: every payment-initiation endpoint accepts an
    X-Idempotency-Key header; rejects duplicate keys within a 24h replay
    window with HTTP 409 + RFC 7807 problem+json body containing the
    original request's transaction reference.
  status: proposed                  # proposed | accepted | rejected | deferred
  decided_at: null
  decided_by: null
  decision_reason: null
  rolled_into_artefact: null        # e.g., docs/brd.md §NFRs after acceptance
  rolled_into_artefact_section: null
---
```

The ledger is append-only during a feature's life. On the next feature, a fresh ledger is created. Rejected insights from prior features are still readable (via the file-system or via the cross-feature learning analyzer) but they are not enforced as "do not raise again" across features — context changes.

## The decision ritual (before each gate)

The orchestrator (`feature-life-cycle`) walks open insights for the closing stage **before** that stage's gate dispatches:

1. **Group by priority.** `high` first, `medium` next, `low` last.
2. **Present each insight as a structured decision request** to the spec owner: observation + rationale + citations + proposed addition.
3. **Receive one decision per insight**: `accept` / `reject <reason>` / `defer <discharge-at-stage>`.
4. **For accepted insights**: fold the `proposed_addition` into the named artefact section via the existing amendment workflow — edit the artefact and record the amendment in `docs/spec/manifest.json` directly (the pipeline CLI is not part of this distribution). Record `rolled_into_artefact` and `rolled_into_artefact_section`.
5. **For rejected insights**: record `decision_reason` (one sentence). The reason is durable — future passes read it and must not re-propose substantively identical insights.
6. **For deferred insights**: keep `status: deferred` with `discharge_at_stage` pointing at where the decision will be revisited (typically a later stage where more context is available).
7. **Update the manifest**: `manifest.advisory_track.<stage>.insights_decided = N`.

Then the gate dispatches as normal. The ledger does not block gates — but unprocessed `high`-priority insights surface in the gate's input scope so the gate checker can note them as `INFO` findings in its verdict.

## Boundaries (what this skill MUST NOT do)

- Edit any spec artefact (BRD, data model, contracts, LLDs, code). Only the operator's `accept` decision triggers an amendment.
- Re-raise an insight whose substance was rejected on this feature's ledger.
- Emit more than 10 insights per invocation.
- Emit any insight without a citation.
- Use corrective language ("should have," "missed").
- Block a gate or any pipeline transition. The skill is purely advisory.

## Output contract

The skill writes to two places:

1. **The ledger file** `docs/agent-insights/<feature>.md` — appends the new YAML entries with `status: proposed`.
2. **`docs/spec/manifest.json`** — increments `advisory_track.<stage>.insights_raised` and records the last-raised batch ID with timestamp.

The skill returns (as its final text, which is the agent tool's return value) a one-line summary: `<N> insight(s) raised at <stage>: <high>H/<med>M/<low>L. Ledger: <path>.`

## Token budget

The pass has a soft budget of **15,000 output tokens per invocation**. If the artefact is large enough that 15K won't cover a thoughtful read + 10 insights, narrow scope (e.g., scan only the §6 FR list, not the entire BRD) and note the narrowing in the ledger entry's metadata field.

## Why this works without breaking discipline

- **The spec is untouched until a human decides.** All amendments still flow through Gate A / B / C with their normal sign-off.
- **The decision is bounded.** 10 insights per stage, ranked, with citations — this is 5 minutes of review per gate, not an hour.
- **Rejections compound.** A rejected insight class doesn't get re-proposed, which means the spec owner doesn't litigate the same idea repeatedly.
- **Cross-feature learning sees the ledger.** If `type: missing-requirement` insights are accepted 80% of the time on payment-related features, the cross-feature loop will eventually propose that `brd-generator` itself include that consideration by default — closing the loop and reducing per-feature ledger volume over time.

The result: agent breadth (knowing patterns from thousands of similar systems) and human depth (knowing this specific business, team, and politics) combine at exactly one point — the decision ritual — and the pipeline preserves its traceability invariant the rest of the time.
