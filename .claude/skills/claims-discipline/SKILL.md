---
name: claims-discipline
description: "Govern what may be claimed about a project to any outside audience — README, pitch, client report, changelog, marketing copy, stakeholder status update — by grading every claim on an evidence ladder, enforcing a reproducibility standard for exported numbers, and redacting internals. Use when drafting or reviewing externally-facing text, or when deciding whether something may be called done, proven, or production-ready. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Claims Discipline

This skill governs how a project is described to anyone who cannot read the repo. The core rule: **every external claim must be backed by an artifact in the repo, at the strength the artifact actually supports.** The most common failure mode in AI-assisted delivery is claims without verification — assumed behaviour, unmeasured performance, targets quoted as results. Do not export that failure mode into a README, a pitch, or a status update.

Key terms used throughout:

- **Claim** — any externally-visible statement of capability, scale, novelty, or quality, including implied ones (a screenshot, a comparison-table checkmark).
- **External** — any audience that will not independently read the code: prospects, clients, investors, managers, blog readers, changelog subscribers, other teams.
- **Evidence artifact** — a saved, path-addressable output in the repo or CI (report, log, baseline diff, run record) that a reviewer could open and re-run.
- **Rung** — a level on the claim strength ladder (section 1); every claim sits on exactly one.
- **Durable claim** — a claim published somewhere that outlives the conversation (README, site, deck), and therefore needs a register entry (section 6).

## When to use this skill

- Drafting or reviewing externally-facing text: README intro, pitch deck, demo script, case study, client/stakeholder report, changelog entry, marketing copy, talk abstract, RFP answer, status update.
- Deciding whether a capability may be described as "done", "proven", "production-grade", "at scale", or "the first/only/fastest".
- Answering "can we claim X?" or "what is actually novel here?".
- Before publishing any number (throughput, latency, coverage, accuracy, count) outside the repo.

Related skills, by concern:

| If you need… | Use instead / alongside |
|---|---|
| To evaluate whether a *demo* is ready to give (flows, data, environment, narrative) | `demo-readiness-evaluation` — that skill readies the performance; this one governs what may be *said* about the product before, during, and after it |
| What counts as technical verification evidence inside the repo | `verification-doctrine` (or the project's own verification skill) |
| Ship-time evidence assembly and human approval for a release | `release-readiness` |

## How the rules land on each surface

The same discipline applies everywhere, but each surface has a sharpest risk. Lead the review with it:

| Surface | Sharpest risk | Extra attention |
|---|---|---|
| README / project site | Durable claims that decay silently as code changes | Register every claim (section 6); date-stamp counts and version-specific statements |
| Pitch deck / investor brief | Rung inflation ("built" presented as "proven") and unbased superlatives | Ladder (section 1); every superlative names its comparison basis |
| Client report / stakeholder status update | Targets read as results; "on track" implying verification that has not run | Label targets as targets; state what was actually verified versus planned |
| Changelog / release notes | "Fixed" claimed from a detector-clean check, not a closed root cause | "Detector clean ≠ solved" trap (section 3); claim the repair, not the cure |
| Marketing copy / blog post | Redaction leaks and dressed-up commodity tech | Redaction scan (section 4) on the final text; standard tooling described as standard |
| Case study / talk | Customer-identifying details; one anecdote generalized to a population | Redaction rules; state the n and the conditions |

Screenshots, diagrams, and recorded demos are claims too: a screenshot asserts the screen works, and it can leak URLs, IDs, and real data just like text. Review them under the same rules.

## How to run a claims review

Apply this workflow to any draft (or when writing from scratch, apply it clause by clause as you write):

1. **Inventory the claims.** Go through the draft sentence by sentence and list every statement of capability, scale, novelty, or quality. Include implied claims — a screenshot of a dashboard full of data implies the data pipeline works; a feature listed in a comparison table implies parity.
2. **Attach evidence.** For each claim, find the repo artifact that backs it and re-verify it in the current session (run the count, open the report, check the tag). Quote nothing from memory or from older docs — docs drift.
3. **Assign a rung.** Grade each claim on the ladder (section 1) at the lowest rung its evidence supports, and reword the sentence to match that rung.
4. **Apply the trap set.** Check every claim against section 3 — especially any number, any "works", any "solved".
5. **Redact.** Scan the final text against section 4. A quick mechanical pass helps before the human one:

   ```bash
   grep -inE 'https?://|localhost|password|secret|token|api[_-]?key|staging\.|internal\.' draft.md
   ```

6. **Run the checklist** (section 5). Fix, downgrade, or cut anything that fails.
7. **Register durable claims** (section 6) with their evidence links.

Steps 1–4 are where the honesty lives; steps 5–7 are where it survives contact with the future.

Calibrate the ceremony to the surface. A one-line changelog entry does not need a written review
doc — but it still gets the ladder, the trap set, and the redaction glance, mentally applied in
thirty seconds. A pitch deck or public case study gets the full workflow with notes kept. The
rules never relax; only the paperwork does.

## 1. The claim strength ladder

Four rungs, weakest to strongest. **Always use the lowest rung the evidence supports.** A claim on a rung the evidence does not reach is not optimism; it is a defect that due diligence will find.

| Rung | What it asserts | Minimum evidence required |
|---|---|---|
| **Built** | The capability exists in code | The code paths exist and are identifiable; a reviewer could locate them. Counts (files, modules, endpoints) verified by command in the current session, not quoted from docs. |
| **Demonstrated** | It worked in a controlled run (local, staging, UAT) | A recorded run: the flow exercised end-to-end at least once, with the run's output, logs, or report saved at a known path. Stubbed dependencies (fake payments, fixed OTPs, seeded data) are fine but cap the claim at this rung. |
| **Certified** | It passed defined baselines or gates | A defined pass/fail threshold that existed *before* the run, a green result against it, and the result artifact saved. The evaluator must be independent of the author (a fresh-context checker, CI, or another person) — self-graded gates do not certify. |
| **Proven in production** | Real users, real data, sustained | Production deployment evidence (release tag, deploy record) plus real usage telemetry or a documented field pilot. Not "deployed and nothing crashed on day one". |

Phrasing follows the rung. "Built": "the engine supports X" / "designed for X" / "intended to". "Demonstrated": "we have run X end-to-end in staging". "Certified": "X passes our published baseline of Y". "Proven": "X handles N real users daily". Hedge words like "designed for", "intended to", "enforced by checks" are accurate at low rungs; "guarantees", "fully automated", "zero-touch", "battle-tested" belong only at the top, if anywhere.

When evidence is mixed (some parts certified, some merely built), the composite claim takes the *lowest* rung of its parts, or it is split into separate claims.

Phrasing calibration — the same underlying fact at honest versus inflated strength:

| Evidence on hand | Honest phrasing | Inflated phrasing (do not use) |
|---|---|---|
| Retry logic exists in code, never exercised against a real outage | "The client is designed to retry with backoff on transient failures" | "The system is fault-tolerant" |
| Full order flow ran green once in staging with seeded data | "We have demonstrated the order flow end-to-end in staging" | "Order processing is production-ready" |
| Nightly CI gate with a published latency budget, green for 30 days | "The API is certified against a p95 budget of 400 ms in CI" | "Guaranteed sub-400 ms responses" |
| Three pilot customers using it daily for a quarter, telemetry saved | "Proven in production with three pilot teams over 90 days" | "Trusted by industry leaders at scale" |

## 2. The reproducibility standard for exported numbers

Any number that leaves the repo — "handles 500 rps", "94% coverage", "processes 10k records/min", "40% faster than v1" — must carry, in your notes or the review doc (not necessarily in the published text itself):

1. **Command** — the exact invocation that produced it.
2. **Dataset/fixture** — what data it ran against (seed script, fixture file, snapshot, environment).
3. **Threshold or definition** — the pass/fail line or the definition of the metric, and where it is configured (e.g., "p95 under 400 ms per `perf.config.yaml`", "coverage = line coverage of `src/`, excluding generated code").
4. **Artifact path** — where the saved output lives (`docs/reviews/`, `reports/`, CI run link, `docs/quality/`).

**If any of the four is missing, downgrade the claim one rung or cut it.** A number nobody can reproduce is an anecdote wearing a suit.

Worked example — claiming import throughput:

```bash
# Command:
npm run bench:import -- --fixture fixtures/orders-50k.json
# Dataset: fixtures/orders-50k.json (50,000 synthetic orders, seeded via scripts/seed-bench.ts)
# Threshold: >= 8,000 records/min per perf-budgets.yaml (bench.import.min_rpm)
# Artifact: reports/bench/import-2026-07-09.json
```

With all four present and the run green, "imports 50k records in under 6 minutes against our published budget" is publishable at the *certified* rung. With only the command and no saved artifact, it drops to "we have benchmarked imports in a controlled run" (*demonstrated*), and no specific number may be quoted.

## 3. The trap set

Traps that make honest teams publish dishonest claims. Check every draft against all four.

- **Budgets ≠ benchmarks.** A performance budget, an SLO, a target metric in a config file is a *threshold*, not a *result*. "Our target first-pass rate is 85%" is honest; "our pipeline hits 85%" is false until a measured run says so. Label targets as targets, in the sentence itself, every time — "we are working toward", "our budget is", "target:".
- **"The demo works" ≠ "the claim is true".** A flawless demo run with stubbed payments, fixed test accounts, and cherry-picked seed data proves exactly one thing: *demonstrated in a controlled environment*. It does not license "production-ready", "reliable", or any number. Pair with `demo-readiness-evaluation` for the demo itself; do not let its success inflate the claim rung.
- **"Detector clean" ≠ "problem solved".** A validator, scanner, or integrity check passing on repaired data proves the *repair* landed, not that the *generating mechanism* is fixed. Claim the repair ("we corrected the affected records and the detector is clean"); do not claim the cure ("data corruption is solved") until the root cause is closed and the detector runs continuously (e.g., as a CI gate), not out-of-band.
- **Rounded-up sample sizes.** "Our process achieves X" from one run, self-evaluated, reads as measured across many. The truth — n=1, graded by its own author — is discoverable by anyone who reads the repo in a due-diligence pass. **Assume diligence**: write every claim as if the reader will clone the repo and check. State the n ("in our first full run…"), state who evaluated it, or stay silent until the sample is defensible.

Supporting habits that keep the traps closed:

- **Verify against the repo, not the docs.** Internal documents drift; re-run the counting command or open the artifact before quoting anything, even your own earlier writing.
- **Never present standard tooling or well-known techniques as innovation.** "We run industry-standard scanning" is fine; "we invented" is not. Technical readers notice, and one dressed-up commodity discredits the genuine differentiators next to it.
- **Advisory checks are not enforcement.** If a gate warns but does not block, say "N blocking checks plus M advisory" — accurate and usually still impressive — never "all checks enforced".

## 4. Redaction rules — never in external material

Scan the *final* text, not just the draft:

- **Internal URLs and hostnames** — staging/UAT/admin endpoints, internal dashboards. Say "our staging environment".
- **Credentials of any kind** — test accounts, default passwords, fixed OTPs, API keys, JWT material. Naming a known-weak test credential in public is an invitation.
- **Secret names and secret-manager schemes** — "we use a managed secret store with rotation" is fine; naming individual secrets or the naming convention is not.
- **Project/account/tenant IDs, connection strings, bucket names, instance identifiers.** Say "a managed cloud database in region X" at most.
- **Customer data and identifying incident details** — real names, records, or anything that identifies a specific user or client. Incident *mechanisms* are shareable as engineering lessons; raw data is not.
- **Unfixed vulnerability specifics** from scanner output.
- **Internal codenames and jargon** — replace with the public product name or a plain description; define or drop acronyms that mean nothing outside the team.

Redaction is about *identifiers*, not *lessons*. "We had a data-integrity incident caused by an
unvalidated publish path, and here is how we hardened it" is a strength worth telling; the
hostname it happened on and the record it corrupted are not part of the story.

## 5. Pre-publication checklist

Run against every external draft before it ships:

```
□ Every capability claim maps to a repo artifact re-verified THIS session (path noted)
□ Every claim sits on the lowest honest rung: built / demonstrated / certified / production
□ Every exported number carries command + dataset + threshold + artifact path (section 2)
□ Targets, budgets, and SLOs are labeled as targets, never phrased as results
□ Every superlative ("fastest", "first", "most complete") names its comparison basis —
  compared to what, measured how; no basis, no superlative
□ Every "X%" has a denominator stated or noted (X% of what population, over what period)
□ Claims that will decay (counts, versions, "currently supports…") are version- or
  date-stamped so a stale copy is self-identifying
□ "Production" appears only with production evidence (release tag + usage), per the ladder
□ Zero internal URLs, credentials, secret names, IDs, customer data; codenames replaced
□ Standard tooling described as standard, not as innovation
□ Draft reviewed against this checklist by someone other than its author, where possible
```

Any unchecked box: fix the text, downgrade the claim, or cut it. Do not ship with a known false box.

## 6. The claim register

Ephemeral claims (a status update) die with their audience. **Durable claims** — README, website, deck, published case study — outlive the code state that justified them. Record each durable claim so it can be re-verified or retired:

- **Location**: `docs/claims-register.md` (or the project's configured equivalent).
- **One row per durable claim**: the claim text (or a stable summary), where it is published, its ladder rung, the evidence link (artifact path or CI run), the verification date, and a re-verify trigger (e.g., "on every release", "if the import pipeline changes", "quarterly").
- **On change**: when code touching a registered claim changes, re-verify the claim or edit the published text. A claim that was true at publication and false now is still your false claim.
- **On retirement**: strike the row and update the published surface in the same change — never let the register and the public text disagree.

Example row:

```
| Claim | Published in | Rung | Evidence | Verified | Re-verify when |
|---|---|---|---|---|---|
| "Imports 50k records in <6 min" | README §Performance | certified | reports/bench/import-2026-07-09.json | 2026-07-09 | import code or budget changes |
```

What does *not* need registering: ephemeral statements (a status update, a meeting answer),
claims about intent ("we plan to…") that are already labeled as targets, and anything internal.
The register exists so public promises stay true, not to bureaucratize every sentence.

At release time, `release-readiness` should include a pass over the register: every registered
claim either re-verified or amended before the release announcement goes out. For what counts as
verification evidence behind a capability in the first place, defer to `verification-doctrine`
or the project's own verification skill; this register records the *link* between the published
words and that evidence.

## 7. When someone wants a stronger claim

Pressure to upgrade a claim ("can't we just say production-ready?") is normal and not malicious. The disciplined answer is never a bare "no" — it is the **unlock path**: name exactly what evidence would raise the claim one rung, and offer that as the plan.

- "We can say *demonstrated in staging* today. To say *certified*, we need the acceptance suite green in CI against the published thresholds with the report saved — roughly a day of work."
- "We can say *targeting 99.9% uptime*. To quote an uptime number, we need 90 days of production telemetry."

Maintain, per project, a short **do-not-say list**: the three to five most tempting overclaims, the verified reality, and the unlock evidence for each. Keep it next to the claim register and update it as rungs are actually climbed — it turns every awkward review conversation into a roadmap item. If a claim is demanded that the evidence does not support and no unlock is accepted, escalate to a human owner rather than publishing it; a false external claim is outside any autonomy envelope.

## Done definition

A piece of external text is claims-clean when: (a) every factual claim has a repo path or command output attached from the current session; (b) every forward-looking statement is explicitly labeled a target; (c) the section-5 checklist passes with no unchecked box; (d) the redaction scan ran over the final text; (e) durable claims are entered in the claim register with evidence links. Record what was verified and when, so the next editor inherits provenance instead of folklore.
