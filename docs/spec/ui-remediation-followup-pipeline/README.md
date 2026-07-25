# UI Remediation Follow-up pipeline

Execution harness for `docs/spec/ui-remediation-followup/phased-plan.yaml`, which closes the
CONDITIONAL verdict of `docs/reviews/full-review-ui-remediation.md`.

This is the successor to `docs/spec/ui-remediation-pipeline/` (UIR-00..UIR-08, complete). That
pipeline's UIR-08 oracle remains in use here as an inherited regression gate.

## What it does

Runs one phase per **fresh agent session**, verifies that phase's success **outside the model**,
then either advances (`gate: auto`) or parks for a human approval token (`gate: human`).

```
./run.sh                 # dry-run: show state, preview the next phase's check
./run.sh --status        # print every phase's state
./run.sh --execute       # run for real — requires a non-main branch
./run.sh --from URF-03   # resume or force-start at a phase
./run.sh --reset URF-03  # clear a phase's state marker (files untouched)
```

Approve a parked human gate by creating the token:

```
touch docs/spec/ui-remediation-followup-pipeline/approvals/URF-01.approved
```

## Phases

| ID | Name | Gate | Depends on |
|----|------|------|-----------|
| URF-00 | Baseline re-verification and finding-state matrix | auto | — |
| URF-01 | Conflict closure — auth contract and deployment-security amendments | **human** | URF-00 |
| URF-02 | Identity and session data model plus migration | **human** | URF-01 |
| URF-03 | Token verification service and bridge hardening | auto | URF-02 |
| URF-04 | Auth API contract and endpoints | auto | URF-03 |
| URF-05 | Deployment security headers and CSP | auto | URF-01 |
| URF-06 | Web auth integration and demo-credential removal | auto | URF-04, URF-05 |
| URF-07 | Residual UI, accessibility, and design-system closure | auto | URF-00 |
| URF-08 | Evidence and traceability ledger regeneration | auto | URF-06, URF-07 |
| URF-09 | Integration validation and human release decision | **human** | URF-08 |

`run.sh` executes in manifest order. URF-05 and URF-07 are declared parallelizable in the plan
(`parallelizable_groups`) but the driver is sequential — to actually run them concurrently, use
separate worktrees and merge deliberately.

## Check-authoring gap — read this before trusting a GREEN

The hard rule is *automate sequencing, never judgment*. Where a phase's success is a human
judgment, the check verifies **structure only** and the phase is `gate: human`. Being explicit
about which is which:

| Phase | Oracle strength | Note |
|-------|-----------------|------|
| URF-00 | **structural + build** | Verifies the matrix covers 17 findings and the commands were logged with results. It deliberately does **not** require those commands to be green — a red baseline is this phase's product. |
| URF-01 | **structural only** | Cannot grade a security decision. Checks the four decisions exist, are owned, and name concrete mechanics. `gate: human`. |
| URF-02 | **strong, plus human gate** | Real schema test, additive-only scan, tenant-scoping scan, approval-file check. Still `gate: human` because it is a DB change. |
| URF-03 | **strong** | Behavioral negative-case suite is primary; two source greps are regression guards only. |
| URF-04 | **strong** | Contract parses, endpoints tested, error-model and rate-limit posture asserted. |
| URF-05 | **strong** | Header test plus the browser suite run against a header-enabled server, so a CSP that breaks the SPA fails here rather than at URF-09. |
| URF-06 | **strong** | Negative scan against the built artifact with the demo flag both unset **and set** — the flag-on case the prior scan never covered. |
| URF-07 | **strong** | Behavioral only by design; a source-regex assertion closes nothing in this phase. |
| URF-08 | **strong** | Runs the phase-authored ledger-integrity check and independently re-verifies the two properties FR-09 named. |
| URF-09 | **strong, plus human gate** | Full external oracle. GREEN is a precondition for the release decision, never the decision. |

No phase in this pipeline uses a `true` stub. Two phases (URF-01, URF-09) have oracles that
cannot capture their real success criterion, and both are `gate: human` for exactly that reason.

### One oracle-integrity note worth knowing

`checks/lib.sh` here is **not** the copy used by `docs/spec/ui-remediation-pipeline/`. It was
rewritten to use `grep` instead of `rg`, and to hard-fail when a required tool is missing.

Reason: `rg` is not installed on this machine. Inside an interactive Claude Code shell it
resolves to a shell function, but the driver runs checks in a plain bash environment where it
does not exist — and `! rg pattern file` with no `rg` binary **succeeds**, so every negative
assertion silently reported ok. The dry run of the first draft of this pipeline showed exactly
that. The new `absent`/`absentF` helpers also go RED when their target path is missing, because
a negative assertion against a file that does not exist proves nothing.

The inherited `docs/spec/ui-remediation-pipeline/checks/uir-08.sh` still uses `rg`, including
for its production-artifact negative scan. URF-09 runs it as a regression gate, so **install
ripgrep or port that check to grep before trusting its GREEN** — as written, it will pass
vacuously in a plain shell.

Several checks reference test files that do not exist yet (`auth-token-verification.test.cjs`,
`security-headers.test.cjs`, `session-auth.test.cjs`, `error-boundary.test.cjs`,
`a11y-residual.spec.ts`, `ledger-integrity.sh`). That is intended: each check is RED until its
phase creates the evidence. A check that passes before its phase runs is not an oracle.

## Safety

- Run on a **sandbox branch**. `run.sh --execute` refuses `main`/`master`.
- Each phase logs a `git reset --hard <rev>` rollback line before it starts.
- `URF-02` is forward-only. Its rollback is a **compensating migration**, which the phase must
  write down *before* applying the forward one — never an edit to an applied migration.
- The repo's `db_change_guard` hook stays on. Approve intentionally by adding a line to
  `.claude/approved-db-changes.txt`; never bypass the secrets guard.
- `CLAUDE_FLAGS` controls agent permissions. Unattended tool use needs a conscious,
  least-privilege, spend-capped choice. Never point it at production credentials.
- **Validate the prompts before executing.** A wrong prompt executes faithfully to a wrong
  result; automation scales garbage-in worse than a human-in-the-loop run does.

## Known lane conflict

URF-03 (via `decodeActor`) and URF-05 (via response headers) both edit `server.mjs`. Running
them concurrently will conflict. Either serialize them or keep URF-05's edit confined to header
composition in a separate worktree. This is recorded as R-01 in the plan's risk register.

## Provenance

- Plan: `docs/spec/ui-remediation-followup/phased-plan.yaml` (phased-planner)
- Source review: `docs/reviews/full-review-ui-remediation.md`
- Driver: `run.sh`, copied unchanged from the plan-to-pipeline skill assets
- Inherited oracle: `docs/spec/ui-remediation-pipeline/checks/uir-08.sh`
