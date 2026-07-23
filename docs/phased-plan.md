# primesoft-hrms — Dependency-Ordered Phased Build Plan

**Scope:** 14 enterprise modules (PS01–PS14) on the existing PrimeSoft platform.
**Companion contract:** `docs/contracts/dependency-register.yaml` (machine-readable per-module dependencies).
**Grounded in:** `docs/brd/v3/*` · `docs/brd/PLATFORM_FOUNDATION.md` · `docs/brd/MODULE_RECONCILIATION.md` · `docs/data-model/README.md` (447-table validated schema, 15-file load order 00→14).

> **Non-greenfield rule.** Every module *consumes* platform engines P01–P06 / X.1–X.3 / W.1–W.3 by id and never re-authors them. The only things authored from scratch are the net-new statutory engines (SR ledger, pension, disciplinary due-process, qualifying-service, transfer/relieving/joining, seniority/promotion). This plan sequences *those* against the shared contracts.

---

## Critical path

```
Phase 0 Platform Core  →  PS01 (Employee Master)  →  PS12 (SR ingestion contract)
        →  PS03 (Attendance & Leave)  →  PS10 (Payroll)  →  PS11 (Pension)  →  PS14 (Analytics)
                              ▲                                    ▲
      SR writers PS04 · PS09 (Phase 3) ─────────────────────────────┘  (merge into PS11)
```

**Why this is the critical path.** PS11 (Retirement & Pension, **XL**, net-new) has the deepest hard-dependency fan-in in the whole program — its input-provenance gate cannot run until it can read verified service history (**PS12**), leave/LWP (**PS03**), leave→SR postings (**PS04**), disciplinary/compulsory-retirement orders (**PS09**) and last-pay-drawn (**PS10**). PS10 in turn needs PS03; PS12 needs PS01; PS01 needs platform core. PS14 then closes the program because it reads everything (including PS11's pension pipeline). Nothing finishes PS11 faster than this chain, so it governs schedule. The two other **XL** modules (PS06, PS09) are *not* on the finishing critical path but are the highest-risk parallel work in Phase 3.

**Single-line critical-path module sequence:**
`Platform Core → PS01 → PS12 → PS03 → PS10 → PS11 → PS14` (with PS04 + PS09 merging into PS11).

## PH-10 implementation evidence

PH-10 is now represented in the executable pipeline as `PH-10A` through `PH-10E`. The phase produces PS14 read-only analytics, migration dry-run certification, hardening/NFR evidence, deployment and rollback runbooks, UAT scripts, and release evidence. Production cutover and UAT sign-off remain explicit human approvals outside the agentic development pipeline.

## PH-11 implementation evidence

PH-11 is now represented in the executable pipeline as `PH-11A` through `PH-11E`. The phase rehearses UAT execution, defect triage, cutover control, rollback authority, support handoff, operational RACI, and hypercare readiness after PH-10. It is agentic only where executable checks can verify evidence; UAT sign-off, CAB/go-live approval, production cutover, and rollback execution remain human-only decisions marked `GO_LIVE_HUMAN_APPROVAL_PENDING`.

## PH-12 implementation evidence

PH-12 is now represented in the executable pipeline as `PH-12A` through `PH-12E`. The phase prepares the release-board dossier, human approval checklist, target-environment readiness dry-run, release-board agenda, go/no-go decision record template, and rollback authorization template. It remains a readiness phase: UAT sign-off, CAB approval, go-live, production cutover, production credentials, and rollback execution stay human-only decisions.

## PH-13 implementation evidence

PH-13 is now represented in the executable pipeline as `PH-13A` through `PH-13E`. The phase seals the release-candidate evidence package, verifies checksums, prepares human approval intake and change-ticket guardrails, and creates archive/handoff evidence. It remains pre-approval work: UAT sign-off, CAB approval, go-live, production cutover, target-environment smoke, credentials, and rollback execution stay human-only decisions.

## PH-14 implementation evidence

PH-14 is now represented in the executable pipeline as `PH-14A` through `PH-14E`. The phase watches the sealed release candidate for drift, prepares board-day run cards and no-go quarantine handling, and defines approval-evidence quarantine/redaction rules. It remains pre-execution work: approvals, target-environment smoke, production credentials, cutover, and rollback execution stay human-only decisions.

---

## Per-module effort / complexity

| Module | Name | Type | Tables | Effort | Note |
|---|---|---|---|---|---|
| PS01 | Employee Profile Mgmt | extend | 32 | **L** | Heavy satellites (Aadhaar vault, history, consent) on M01 master |
| PS02 | Personal Details Workflow | extend | 18 | **M** | Maker-checker configured on P01; not an SR writer |
| PS03 | Attendance & Leave | extend | 31 | **L** | Public-sector leave types + enterprise holiday/shift on M04/M05 |
| PS04 | Leave → SR Integration | net-new | 14 | **M** | Outbox/relay/reconcile/DLQ; first SR-writer to prove the contract |
| PS05 | Transfer/Relieving/Joining | net-new | 21 | **L** | New order entities + P01 flows (W.1) |
| PS06 | Promotion/Posting/Progression | net-new | 32 | **XL** | Seniority/DPC/MACP — statutory-complex, high parallel risk |
| PS07 | Training & Skill Development | net-new | 37 | **L** | Largest table count but non-statutory; L&D on P01 + W.2 |
| PS08 | Performance Appraisal (APAR) | extend | 23 | **L** | APAR form (W.2) + officer chain on M09 |
| PS09 | Disciplinary Cases | net-new | 30 | **XL** | CCA due-process + SoD; SR-writer reference implementation |
| PS10 | Payroll & Benefits | phase-2 | 27 | **L** | Extends PrimeSoft M06/M07; runs after Phase-2 platform live |
| PS11 | Retirement & Pension | net-new | 34–35 | **XL** | Deepest fan-in; determinism engine gated on complete inputs |
| PS12 | Digital SR (Digital SR) | net-new | 18 (+core) | **L** | Small surface but **contract-critical** — owns the SR write-port |
| PS13 | Document Management | extend | 24 | **L** | Statutory doc classes/retention on M11 vault |
| PS14 | Dashboard & Analytics | extend | 26 | **L** | Read-only marts over all sources; RLS = P02 |

Program totals: **447 tables · 1,907 FKs · 443 RLS tables · 700 enums** (validated end-to-end, `docs/data-model/README.md`).

---

## Phase 0 — Platform Core Schema & Platform-Service Readiness

**Goal.** Stand up the substrate every module builds on so no module re-authors an engine.

**Deliverables / modules.** `00-platform-core.sql` (35 tables): tenancy + data-layer scoping, RBAC v1.7 catalogue + `Authorization.check`, `employees` master, P01 workflow core (`workflows`/`workflow_instances`/`workflow_actions`), P05 dual audit (`audit_log`/`security_audit_log`, DB-trigger, immutable), **PS12 SR ledger core** (`service_register_events`, append-only on P05), **PS13 documents core**, notifications/jobs/`migration_runs`.

**Entry criteria.** PrimeSoft platform spec v1.6 available; empty target PostgreSQL cluster.

**Exit criteria.**
- `00-platform-core.sql` loads clean with `ON_ERROR_STOP=1`; seed data inserts.
- P01/P02/P03/P04/P05/P06 and X.1–X.3 / W.1–W.3 reachable via their service contracts (auth + idempotency-key + `X-Correlation-Id` + standard error envelope).
- P05 DB-trigger capture verified on a sample business table (INSERT/UPDATE/soft-DELETE → immutable row).
- Cursor pagination, `/api/v1` versioning, and the 8-code error table (`VALIDATION_FAILED 422`…) confirmed platform-wide.

**Parallelizable.** RBAC catalogue seeding, P01 pattern verification (Appendix D), P05 trigger tests, and notification-template registration can proceed in parallel once core DDL loads.

**Integration checkpoints.** RBAC deny-by-default proven; tenant-scope rejection (unscoped query returns no rows); SR ledger core append-only + P05 immutability.

**Mock/stub strategy.** None inbound — this *is* the substrate. External portals (treasury/DigiLocker/penny-drop) stubbed behind X.3 for later phases.

---

## Phase 1 — Foundational Systems of Record (PS01, PS12, PS13)

**Goal.** Establish the three shared-contract owners: employee master (PS01), SR ingestion contract (PS12), documents vault (PS13). Everything downstream references these by id.

**Modules.** **PS01** Employee Profile Mgmt (L) · **PS12** Digital SR (L, contract-critical) · **PS13** Document Management (L).

**Entry criteria.** Phase 0 exit met.

**Exit criteria.**
- **PS01:** enterprise master additions (`service_no`, `cadre`, `pay_scale_id`, posting history, Aadhaar vault, consent) live and effective-dated via `JOB-PS01-EFFDATE`; **PS01 posts identity/personal-data SR events** (`source_module=PS01`) to the ledger successfully.
- **PS12:** `POST /api/v1/sr/ingest` write-port live and conformance-tested — **idempotent, versioned, schema-validated, provenance-stamped, semantic-per-fact dedup, source-driven reversal**; event taxonomy + status sub-ledger + anchoring in place; ledger append-only + hash-chain (OPEN-PLAT-03) confirmed.
- **PS13:** statutory document classes/retention/legal-hold on the M11 vault; collision-safe table names (`document_retention_policies`/`document_legal_holds`).

**Parallelizable.** All three build in parallel; PS12 and PS13 sit on Phase-0 core, and PS01 extends the core master. **Sync point:** PS12 needs PS01 `subject_ref` identities and PS01 needs the PS12 write-port — co-develop the SR event contract for identity events; freeze it before Phase 3.

**Integration checkpoints.**
- **SR-contract conformance:** PS01 identity-event round-trip through `POST /api/v1/sr/ingest`; idempotency replay returns original (409 on duplicate start).
- **Schema reconciliation:** PS01↔PS13 `retention_policies`/`legal_holds` collision resolved (owner-rename ratified).
- **RBAC:** SR Custodian/Registrar role + Document Admin capability flags registered as ADDITIONS (RBAC §4.3).

**Mock/stub strategy.** PS13 subject linkage to PS01 can start against a stubbed employee fixture; swap to live PS01 before exit. SR writers of later phases are not yet present — the contract is validated with a synthetic writer harness.

---

## Phase 2 — Employee-Facing Transactional Base (PS02, PS03)

**Goal.** Layer the two highest-volume employee surfaces on the master: self-service change workflow and attendance/leave.

**Modules.** **PS02** Personal Details Workflow (M) · **PS03** Attendance & Leave (L).

**Entry criteria.** Phase 1 exit met (PS01 master + PS12 contract stable).

**Exit criteria.**
- **PS02:** change-request maker-checker configured as P01 flows over governed PS01 fields; on STATUTORY commit **PS01 (not PS02)** posts the SR event; PS02 tracks posting status and retro-reconciliation.
- **PS03:** public-sector leave types (EL/HPL/commuted/study) + enterprise holiday/shift/roster; leave ledger + attendance capture live; `VAL-LV`/`VAL-AT` wired.

**Parallelizable.** PS02 and PS03 are independent (both depend only on PS01); build fully in parallel.

**Integration checkpoints.**
- **SR-contract conformance:** confirm PS02 emits **no** SR write (R3 F2 remediation — PS01 owns identity postings).
- **RBAC:** field-level `E·AR` request-change routing (PS02) and Leave/Attendance Admin scoping (PS03).
- **Schema reconciliation:** PS02↔PS03 `ix_delegations_*` index collision resolved (→ `ix_appr_delegations_*`).

**Mock/stub strategy.** PS03 needs no downstream module. PS02's downstream recompute acknowledgers (PS10/PS11/PS06) are not built yet — stub the ack channel; PS02 only tracks acknowledgement, it does not execute recompute.

---

## Phase 3 — SR Writers & Statutory Workflows (PS04, PS05, PS06, PS07, PS08, PS09)

**Goal.** Build the statutory workflow modules that write to the SR ledger. This is the widest parallel phase and carries the two remaining **XL** modules (PS06, PS09).

**Modules.** **PS04** Leave→SR (M) · **PS05** Transfer/Relieving/Joining (L) · **PS06** Promotion/Posting/Progression (XL) · **PS07** Training & Skill (L) · **PS08** Performance/APAR (L) · **PS09** Disciplinary (XL).

> **Note on membership.** The program brief's Phase-3 shortlist (PS04/PS05/PS06/PS08/PS09) omitted **PS07**; it belongs here — it is an SR-writing (schema `sr_outbox`), P01-driven L&D module whose only hard dependency is PS01, so it parallelizes cleanly with the rest of Phase 3. PS07 is **not** in PS12's FR-01.B *canonical statutory* writer set — treat its SR posting as optional/non-statutory.

**Entry criteria.** Phase 1 (PS01, PS12) and Phase 2 (PS03) exit met. **SR ingestion contract frozen.** PS04 is sequenced *first* within the phase as the reference SR-writer that proves the contract end-to-end before the others fan out.

**Exit criteria.**
- Each SR writer (PS04, PS05, PS06, PS08, PS09) posts its life-events via `POST /api/v1/sr/ingest` with the correct `source_module` stamp, passing idempotency + semantic-dedup + reversal conformance.
- **PS04:** leave→SR outbox/relay/reconcile/DLQ closes the loop with PS03 leave events.
- **PS05:** transfer-order → relieving → joining P01 flows (W.1) with relieving/joining date consistency (`VAL-TRANSFER-ORDER`).
- **PS06:** seniority list + DPC + MACP + sanctioned-post + qualifying-service; SR events emitted.
- **PS08:** APAR form (W.2) + reporting/reviewing/accepting-officer chain (P01).
- **PS09:** charge→reply→inquiry→penalty→appeal due-process with SoD (maker ≠ checker); reference SR-writer impl.
- **PS07:** competency framework + training calendar/nomination/certification on P01 + W.2.

**Parallelizable.** All six run in parallel once PS04 has validated the SR write-port. The heavy cross-references among them are **soft** (see mock strategy), so no build-order coupling inside the phase.

**Integration checkpoints.**
- **SR-contract conformance (gate):** every writer's events accepted; double-record prevention verified via semantic dedup (no double-counted qualifying service).
- **Schema reconciliation:** PS04↔PS12 `ix_sr_corr_*` collision resolved (→ `ix_ps12_sr_corr_*`).
- **RBAC / SoD:** Disciplinary Authority, Inquiry Officer, Appointing Authority roles + SoD enforced by P01/P02; no self-approval.

**Mock/stub strategy (intra-phase soft deps).**
- **PS06** reads PS08 APAR ratings, PS09 disciplinary status, PS05 posting movement, PS07 competency master → **stub with fixtures**; integrate live as each peer completes.
- **PS05** reads PS06 seniority/sanctioned strength and raises PS10 pay signals → **stub** (PS10 not built until Phase 4).
- **PS09** orders are later consumed by PS06 seniority recompute and PS11 → downstream, no inbound stub needed.
- Document attachments (PS05/PS06/PS08/PS09) resolve against live **PS13** (Phase 1).

---

## Phase 4 — Payroll & Pension (PS10, PS11)

**Goal.** Build the financial settlement spine: payroll (Phase-2 platform extension) then the pension engine that consumes the widest set of upstream facts.

**Modules.** **PS10** Payroll & Benefits (L, phase-2) · **PS11** Retirement & Pension (XL).

**Entry criteria.**
- Phase-2 platform modules (PrimeSoft M06 Payroll / M07 Statutory) live — **PS10 is explicitly sequenced after them** (MODULE_RECONCILIATION.md §E), not authored as a parallel engine.
- PS01, PS03 exit met (PS10 hard deps).
- For **PS11**: PS01, PS12, PS03, PS04, PS09, PS10 all integrable — PS11's input-provenance gate refuses to compute until service history is verifiably complete.

**Exit criteria.**
- **PS10:** payroll run / deductions / loans / benefits / FnF on M06/M07 extension with public-sector pay scales; consumes PS03 LOP/encashable and PS06/PS05 pay signals; posts payroll SR events (`source_module=PS10`); emits cost journal (Finance ERP owns the GL).
- **PS11:** deterministic pension/gratuity/commutation engine gated on a `SIGNED_OFF`/`LOCKED` service-verification with closed discrepancy ledger; OPS/NPS/UPS regimes; PPO (incl. provisional Rule-9) issued before pension commencement; pensioner master + lifecycle; separation/superannuation events posted to **PS12** (`source_module=PS11`); `calc_trace` persisted; disbursement over X.3 with penny-drop.

**Parallelizable.** PS10 must lead; PS11 begins entity/rule-table work in parallel but its benefit engines cannot pass the provenance gate until PS10 supplies last-pay-drawn and the Phase-3 writers (PS04/PS09) are live. Rule-table authoring (DA/commutation/family-pension/gratuity) parallelizes with case-flow work inside PS11.

**Integration checkpoints.**
- **SR-contract conformance:** PS11 *reads* SR for qualifying-service verification **and** *writes* separation events — verify both directions.
- **RBAC:** Pension/Payroll Officer roles (module-admin analogues); SoD (maker ≠ sanctioning authority) enforced by P01/P02.
- **Migration (P06):** legacy service-register and pension data through ETL+V, 3 dry runs, waves, `<enterprise>_source_id` traceability.
- **NFR:** deterministic reproducibility (same inputs + snapshotted rule version → same output).

**Mock/stub strategy.** PS11 can develop against **recorded fixtures** of PS10 emoluments, PS04 leave-SR postings, and PS09 orders while those integrate; swap to live before the provenance gate is enabled. PDA/treasury, DigiLocker, death-registry/DBT run against **X.3 sandbox stubs** until UAT.

---

## Phase 5 — Analytics (PS14)

**Goal.** Close the program with role-scoped dashboards and compliance analytics over all owned data.

**Module.** **PS14** Dashboard & Analytics (L).

**Entry criteria.** All source modules (PS01–PS13) producing data; PS11 pension pipeline emitting so the pension-liability/compliance marts are meaningful.

**Exit criteria.**
- Marts + KPI definitions + reports built read-only over PS01–PS13; **PS14 never mutates source records** — drill-through opens the owning module's record view read-only.
- Public-sector KPIs live: SR completeness, pension pipeline, disciplinary aging, reservation-roster views.
- Row-level security enforced via **P02** (not a parallel scheme); dashboard LCP < 2.5 s on pre-aggregated marts; report APIs p95 < 1000 ms uncached / < 300 ms cached.

**Parallelizable.** Individual marts/dashboards parallelize by source domain; each can be built and shipped as its source stabilizes rather than waiting for all sources.

**Integration checkpoints.**
- **SR-contract conformance:** PS14 as SR **consumer** (read-only) for compliance KPIs.
- **RBAC:** analytics scope-policy honors PII ceilings and five scoping dimensions; no leak of out-of-scope records.
- **Schema reconciliation:** mart source columns track owner renames from earlier phases.

**Mock/stub strategy.** Any not-yet-stable source is represented by a **stub mart** with the final column contract, swapped to live extract on source exit — lets PS14 start in parallel with Phase 4 without blocking.

---

## Program integration disciplines (all phases)

- **SR contract conformance** is a per-phase gate for every writer (PS01, PS04, PS05, PS06, PS08, PS09, PS10, PS11) and the consumer (PS14). One owner (PS12); no forks.
- **Schema reconciliation** re-runs the full 00→14 load with `ON_ERROR_STOP=1` at each phase boundary; the four known collisions stay fixed (retention/legal-hold, `ix_delegations_*`, `ix_sr_corr_*`, PS12 `documents` seed).
- **RBAC** additions are registered in RBAC §4.3 as new roles/flags with SoD enforced by P01/P02 — never a parallel access scheme.
- **Conflict resolution:** arbiter = **Lead Architect**; platform artefact governs on intent conflict; a blocked module is quarantined (mock its port) and does not freeze parallel work (see `dependency-register.yaml` → `conflict_resolution`).
