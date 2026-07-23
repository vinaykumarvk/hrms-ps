# R5 — Platform Conformance Review (PrimeSoft Platform Contract)

**Scope:** Uniform conformance of the 14 primesoft-hrms BRDs (`docs/brd/v3/PS01..PS14`) to the PrimeSoft platform contract (`docs/brd/PLATFORM_FOUNDATION.md`).
**Method:** Targeted `rg` spot-checks across all 14 files for each of the 6 dimensions, then context-disambiguation of every suspicious hit to distinguish **live spec adoption** from **amendment/reconciliation-table** mentions (the audit only credits live adoption and only faults live leaks).
**Reviewer:** Integration reviewer (report-only; no edits made).
**Date:** 2026-07-01.

## Verdict

The BRD suite is **strongly and uniformly conformant** to the platform contract. All 14 modules adopt multi-tenancy (`tenant_id`/`entity_id` + data-layer scoping), the `/api/v1` + `Idempotency-Key` + cursor (`limit` 25/max 100 + `next_cursor`) + `X-Correlation-Id` conventions, the 8-code error table with the `{error:{code,message,field,details}}` envelope, consume P01/P02/P05/P06/X.1/X.2 by id (no module defines its own `audit_log`; approvals run on P01 `workflow_actions`), reuse the RBAC v1.7 taxonomy with enterprise roles expressed as additions + capability flags + SoD, and carry the platform NFR baseline (99.5%/month, RPO < 1h). The reconciliation discipline is excellent: the invented `SHARED_FOUNDATION` conventions (`requestId` body field, `VALIDATION_ERROR(400)`/`AUTH_REQUIRED(401)`/`UPSTREAM_UNAVAILABLE(503)`, `99.9%`/15-min, `workflow_tasks`) appear almost exclusively in clearly-labelled override rows that retire them. Two modules carry residual **live leaks** — **PS12** (live `503`, live `workflow_tasks` entity name, `requestId` in audit/observability text) and **PS09** (invented/non-standard codes in FR failure-handling tables + a module hash-chain mirror parallel to P05). None are Critical/High; all are localized cleanups.

## (a) Conformance Matrix

Columns: **1** Multi-tenancy · **2** API conventions · **3** Error codes · **4** Platform services (P01/P02/P05/P06/X) · **5** RBAC v1.7 · **6** NFR baseline.

| Module | 1 Tenancy | 2 API conv. | 3 Error codes | 4 Platform svcs | 5 RBAC v1.7 | 6 NFR |
|---|---|---|---|---|---|---|
| **PS01** Employee Profile | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS02** Personal-Details Workflow | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS03** Attendance & Leave | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS04** Leave–SR Integration | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS05** Transfer/Relieving/Joining | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS06** Promotion/Posting | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS07** Training & Skill | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS08** Performance Appraisal | PASS | PASS | PASS¹ | PASS | PASS | PASS |
| **PS09** Disciplinary Cases | PASS | PASS | **PARTIAL** | **PARTIAL** | PASS | PASS |
| **PS10** Payroll & Benefits | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS11** Retirement & Pension | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS12** Digital Service Register | PASS | **PARTIAL** | **PARTIAL** | **PARTIAL** | PASS | PASS |
| **PS13** Document Management | PASS | PASS | PASS | PASS | PASS | PASS |
| **PS14** Dashboard & Analytics | PASS | PASS | PASS | PASS | PASS | PASS |

Cell notes:
- **Tenancy (col 1):** every file carries `tenant_id` (non-null) + `entity_id` where entity-scoped and states data/persistence-layer scoping with unscoped-query rejection (e.g. PS05 §266, PS06 §239, PS13 §462). PASS across all 14.
- **API (col 2):** all 14 use `/api/v1`, `Idempotency-Key` on state-changing POSTs, cursor pagination (`limit` default 25 / max 100 / `next_cursor`), `X-Correlation-Id` **header**, and `{error:{code,message,field,details}}`. Every `requestId` mention is an override row ("not a body `requestId`") **except PS12** (see Finding 4).
- **Error codes (col 3):** all 14 declare the 8-code table in their canonical error section; invented codes/503 appear only in override rows **except PS09** (Finding 1) and **PS12** (Finding 2).
- **Platform services (col 4):** no module defines its own `audit_log` (all explicitly consume P05 dual-log via DB-trigger); approvals run on P01 `workflow_actions`; P02 `Authorization.check`, P06, X.1/X.2 referenced by id throughout. **PS12** still names the invented `workflow_tasks` in live sections (Finding 3); **PS09** keeps a module hash-chain mirror parallel to P05/OPEN-PLAT-03 (Finding 5).
- **RBAC (col 5):** all 14 cite RBAC v1.7, express enterprise actors as new roles + capability flags as ADDITIONS, and enforce SoD via P01/P02 — no parallel scheme.
- **NFR (col 6):** all 14 state 99.5%/month + RPO < 1h + RTO < 4h in live NFR sections; every `99.9%`/`RPO ≤ 15 min` hit is an override row. Residual "15 min" in PS08/PS09/PS14 refers to **analytics cache/mart freshness**, not RPO — not a violation.

¹ PS08 col 3 PASS with note: `ACCESS_DENIED` appears as a domain audit/event-type label (the HTTP return is `FORBIDDEN`), not as a leaked HTTP error code (Finding 6).

## (b) Findings

| # | Finding | Severity | Module | Evidence | Recommended fix |
|---|---|---|---|---|---|
| 1 | Invented/non-standard error codes leak into **live** FR failure-handling tables, contradicting the module's own canonical 8-code section (§255). `UPSTREAM_UNAVAILABLE` and `VALIDATION_ERROR` are used as live codes, and `503` is returned in two FR tables. | **Medium** | PS09 | `PS09 §1429` "PS10/PS01 down ⇒ outbox retry (`UPSTREAM_UNAVAILABLE`)"; `§2251` "kernel-disable attempt ⇒ 422 `VALIDATION_ERROR`"; `§1489` "PDF render fail ⇒ 503 retain DRAFT"; `§2078` "PS13 down ⇒ 503". | Replace `UPSTREAM_UNAVAILABLE`→ X.3-mapped `PRECONDITION_FAILED(412)`/`INTERNAL(500)`; `VALIDATION_ERROR`→`VALIDATION_FAILED(422)`; drop both `503`s (render/upstream failure → retain DRAFT + `INTERNAL`/`ERR-LOADFAIL`), per the module's own §255 rule. |
| 2 | `503` returned in **live** failure-handling/availability sections, contradicting PS12's own "non-standard 503 dropped" statements (§263, §368, §1825). | **Medium** | PS12 | `PS12 §901` "upstream→503"; `§950` "lock timeout→503"; `§1988` "sources retry on 503 with idempotency". | Map upstream/lock-timeout to `PRECONDITION_FAILED(412)`/`INTERNAL(500)` + `ERR-LOADFAIL` via X.3; remove the live `503` returns so they match the declared 8-code table. |
| 3 | Live spec body and the entity table still name the **invented `workflow_tasks`** platform table (and "the shared workflow engine") instead of P01 `workflow_actions` — every other module retires `workflow_tasks` to override rows only. | **Medium** | PS12 | `PS12 §177` "routes through `workflow_instances`/`workflow_tasks`"; `§244` "routes through the shared workflow engine"; `§391` entity E7 lists `workflow_instances`/`workflow_tasks` as a referenced shared entity. | Rename to P01 `workflow_instances`/`workflow_actions`; reference `WorkflowEngine` (P01) by id as PS01/PS05/PS10/PS11 do; drop the `workflow_tasks` entity row. |
| 4 | `requestId` referenced in **live** audit and observability text despite the envelope override to the `X-Correlation-Id` header, creating an internal inconsistency. | **Low** | PS12 | `PS12 §176` "writes to `audit_log` … with actor, before/after, and `requestId`"; `§265` "structured logs with `requestId` + `correlation_id`". | Use `correlation_id` / `X-Correlation-Id` consistently in audit + log lines; remove the `requestId` field references. |
| 5 | A module-level hash-chain **mirror** (E19 `row_hash`/`prev_hash` on `case_timeline_events` + a verify endpoint `FR-PS09-027`) sits parallel to the platform P05 audit substrate and OPEN-PLAT-03. The text re-grounds it as "riding on" the P05 substrate (§127), but a parallel cryptographic chain still exists. | **Low** | PS09 | `PS09 §70` court-grade hash-chained `audit_log`/`case_timeline_events`; `§921` "module mirror hash-chained in E19"; `§127` DI-21 re-grounded onto P05. | Confirm the chain is an explicit enterprise-specific extension tracking OPEN-PLAT-03 (chain head → WORM) rather than a substitute for P05 tamper-evidence; cross-reference OPEN-PLAT-03 so the dependency is unambiguous, and avoid implying a second `audit_log`. |
| 6 | `ACCESS_DENIED` used as an audit event-type/label alongside the correct `FORBIDDEN` HTTP return; harmless today but risks being read as a 9th error code. | **Low** | PS08 | `PS08 §759` event_type enum includes `ACCESS_DENIED`; `§778`/`§1535` "returns `FORBIDDEN`, append `ACCESS_DENIED` (+ `security_audit_log`)". | Keep `ACCESS_DENIED` only as the audit/event label and state explicitly that the API code is `FORBIDDEN(403)`, so it is not mistaken for an HTTP error code. |

### Severity counts
- Critical: 0
- High: 0
- Medium: 3 (Findings 1, 2, 3)
- Low: 3 (Findings 4, 5, 6)

### Net assessment
84 of 84 matrix cells, less 4 PARTIAL (PS09×2, PS12×2 — wait: PS09 cols 3&4, PS12 cols 2,3,4) = **5 PARTIAL, 79 PASS**. The two affected modules already contain the correct platform rule in their canonical sections; the findings are residual contradictions in FR-level sub-tables and entity lists, fixable without touching the platform contract. No module re-authors a platform engine, invents tenancy, or downgrades the NFR baseline.
