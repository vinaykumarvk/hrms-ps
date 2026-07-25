# ADR-005 — Retire `origin/feature/dev`; `main` is the authoritative line

**Status:** Accepted · **Decided:** 2026-07-26 · **Decided by:** repository owner
**Superseded branch tip:** `f53f706` · **Preserved as tag:** `archive/feature-dev`
**Context commit:** `7a5682a` (main, post-merge of the UI-remediation follow-up)

---

## Decision

`main` is the authoritative line. `origin/feature/dev` is retired: tagged for the record and
deleted from the remote. Its data-model direction is **not** adopted.

## Context

`origin/feature/dev` diverged from `main` at `15f0a7b` (the workspace-polish commit) and ran six
commits ahead. It never received the PrimeSoft rebrand (`ad02ea5`), which renamed every module
path `g01…g14` → `ps01…ps14`, so the two lines describe the same system through different
filenames — and, more importantly, through different data models.

A merge was attempted on a throwaway branch and aborted: **221 conflicting files out of 372
touched** — `apps/api/test` (106), `apps/api/src` (41), `apps/api/db` (32 migrations),
`apps/web/src` (23), `apps/web/test` (13). `main` was left untouched.

The conflict count is a symptom. The cause is that the branches made opposite architectural
decisions on the same questions:

| | `main` | `origin/feature/dev` |
|---|---|---|
| Primary keys | UUID (`ad02ea5` resolved a mismatch text → uuid) | text (32 migrations converted uuid → text) |
| Enumerations | 353 PostgreSQL enum types | text columns; `CREATE TYPE` / `ALTER TYPE ADD VALUE` removed |
| Money | `numeric(x,2)` | `bigint` paise (~103 columns) |
| API kernel | `dispatch(request): ApiResponse` — synchronous | asynchronous (`002b273`) |

`main`'s schema is deployed: 32 migrations applied, 225 tables, live on Cloud Run + Cloud SQL.
`feature/dev`'s text-ID conversion was performed under an explicit instruction recorded in
`76ac8e4` ("user direction: make the database use text IDs") and verified against a real
PostgreSQL instance. Both directions were deliberate; they are mutually exclusive.

Merging would have silently selected a data model for a live database. The money-representation
difference alone is correctness-critical for the PS10 payroll and PS11 pension modules.

## Rationale

1. **The deployed schema wins.** `main` is applied to a live Cloud SQL database. Adopting the
   text-ID model would require rewriting 32 applied migrations, rebuilding or migrating the
   database, and replaying the rebrand onto `feature/dev`.
2. **Nothing of proven value is lost by the merge itself.** Two of the six commits are already on
   `main`, independently reimplemented:
   - `4335641` (useForm `allTouched` bug + web-test debt) — reproduced by URF-00R on 2026-07-25.
   - `f53f706` (Cloud Run demo) — all three fixes already present in `server.mjs`:
     `kernel.dispatch` (:100), tenant injection (:65-66), MIME map (:114-120).
3. **Drift only grows.** The branch had been unmerged for eleven days and the gap widened with
   every commit on either side.

## What this decision discards

Retiring the branch is not free. The following work exists only on `archive/feature-dev`:

### Five defect fixes, all verified ABSENT from `main` at `7a5682a`

These are **re-opened as live defects on `main`** and must be re-fixed against `ps*` paths. They
are not resolved by this decision — only relocated to the backlog. **CC-003, CC-019 and CC-021
have since been fixed (2026-07-26); CC-007 and DEF-1 remain outstanding.**

| ID | Defect | Status on `main` |
|---|---|---|
| **CC-003** | PS03 leave-approve atomicity — the PS04 relay must run *before* the balance/status mutation | **FIXED on main, 2026-07-26.** The relay now runs before any balance, ledger or status mutation in `leaveService.approve`. Regression tests in `apps/api/test/cc003-ps03-leave-approve-atomicity.test.cjs`, verified to fail against the previous ordering. |
| **CC-007** | Manager hierarchy: `resolveReportingSubtree`, `resolveDottedLineManager`, `resolveSkipLevelManagers` on `AuthorityResolutionService` | **OPEN.** None of the three symbols exist anywhere in `apps/api/src`. |
| **CC-019** | PS07 duplicate-nomination guard — `UNIQUE(training_session_id, employee_id)` | **FIXED on main, 2026-07-26.** `uq_training_nominations` was already declared in the canonical data model but nothing enforced it at runtime (the nominations table is not yet in `apps/api/db/migrations` and the store is in-memory). `trainingService.nominate` now rejects a duplicate with 409 `CONFLICT` / `ERR-PS07-DUPLICATE-NOMINATION` before starting a second workflow. |
| **CC-021** | PS13 `grantSecurityClearance` service-level idempotency — `ck_clearance_unique_active` | **FIXED on main, 2026-07-26.** Service returns the existing ACTIVE row instead of duplicating, and migration `0034_ps13_clearance_unique_active.sql` adds the partial unique index. **The migration is authored but NOT yet applied to any database** — run `docs/evidence/cc-021/duplicate-active-clearance-precheck.sql` first, since pre-existing duplicates would block the index build. |
| **DEF-1** | PS12 `sr_second_custodian` corrigendum propose/approve 3-way segregation of duties | **OPEN.** No `sr_second_custodian` / `secondCustodian` in `apps/api/src` or `apps/api/db`. |

### Architectural work not carried across

- **Async API kernel** (`002b273`) — `main`'s `dispatch` remains synchronous. If asynchronous
  repositories or genuine PostgreSQL I/O are needed later, this problem returns and
  `archive/feature-dev` is the reference implementation.
- **Live-PostgreSQL repository verification** (`76ac8e4`) — eight `Pg*` repositories proven
  end-to-end against a real database with INSERT and read-back. `main`'s equivalent repositories
  have not been exercised that way; the rebrand commit notes the migrations "had never run
  against real Postgres" before `ad02ea5`.

## Consequences

- `archive/feature-dev` is an annotated tag on `f53f706`. The history is recoverable in full;
  only the branch ref is removed.
- The five defects above enter the backlog against `ps*` paths. **They should be scheduled
  explicitly** — this ADR is the only record that they were ever fixed.
- Any future need for async kernel dispatch or text-ID storage should reopen this ADR rather than
  re-derive the analysis.
- `docs/spec/ui-remediation-followup/urf-00r-triage.md` §0 raised this reconciliation as an open
  human decision. That section is now closed by this ADR.
