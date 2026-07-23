# v3 Cross-Module Remediation Spec (authoritative decisions)

Consolidated from R1–R5 integration reviews (`docs/review/R1..R5*.md`). Every fix agent MUST conform to
these decisions so the modules converge instead of re-diverging. Make **surgical edits** to the live spec
sections; record each change in the file's existing `Amendments` area or a new `## Amendments (v3 → v3.1: cross-module remediation)` table.

## D1 — Canonical SR ingestion contract (PS12 is the single source of truth)
- **Write-port URL:** `POST /api/v1/sr/ingest` (and `POST /api/v1/sr/ingest/reversal`) is the ONLY ledger
  write path. Module-local `.../post-to-sr` endpoints are permitted **internal façades** that MUST state
  "relays to `POST /api/v1/sr/ingest`". No writer may use `/api/v1/sr/events` or imply a direct table INSERT.
- **Dedup tuple (mandatory on every ingest call):** `(source_module, source_reference_id, source_event_version)`.
  Rename any `source_event_id` → `source_reference_id`. The HTTP `Idempotency-Key` header value may be a
  writer-local hash, but the persisted dedup tuple is the contract.
- **`fact_key` (mandatory for qualifying-service-bearing events):** PS04, PS05, PS06, PS10, PS11 MUST derive and
  send `fact_key` per the event type's `fact_correlation_rule` (PS12 FR-01). Missing → `SR_FACT_KEY_REQUIRED`.
- **Provenance:** explicit `source_module` field (NOT inferred), value in `PS01..PS14, PS12_MANUAL, PS12_LEGACY`,
  validated against the type's `allowed_source_modules`.
- **Scoping:** `tenant_id` and `entity_id` are explicit required fields on the ingest payload (PS12 hashes
  `tenant_id`+`employee_id` into `entry_hash`).
- **Reversal/correction:** use PS12's `is_reversal=true` + `reverses_source_reference_id` envelope with a
  published `*_REVERSAL`/`*_CANCELLED` partner type. **Remove** PS05 `COMPENSATING` and PS04 `AMENDMENT`
  correction verbs; PS12 auto-spawns the corrigendum. Never delete/edit (supersede-only).
- **Event taxonomy:** PS12 publishes a `sr_event_type` row (with `allowed_source_modules` + `payload_schema`)
  for EVERY code any writer emits, and adds an **`APPRAISAL`** `event_category` (PS08 `APAR_FINAL_GRADE`).
  Each writer cites the exact published `event_type_code`.

## D2 — Canonical SR writer matrix (publish in PS12 FR-01/FR-02 and mirror in MODULE_RECONCILIATION §D)
| source_module | Posts (event categories) | Notes |
|---|---|---|
| PS01 | identity/qualification/personal-data life events (incl. name/DOB/category change, deceased) | PS01 owns the master, so PS01 posts identity-change SR events. **PS02 is NOT an SR source** — PS02 is the approval workflow whose committed change causes PS01 to post. |
| PS04 | leave spells affecting service/qualifying service | **PS04 is the leave→SR writer** (PS03 feeds PS04; PS03 does NOT post to SR). |
| PS05 | transfer / relieving / joining | event codes `TRANSFER`/`RELIEVING`/`JOINING` family — align names to PS12 catalog. |
| PS06 | promotion / posting / officiating / MACP / confirmation | pay-fixation SR owned here OR PS10 — pick one (recommend PS06 posts the *establishment* event, PS10 posts the *pay* event; no double-claim). |
| PS08 | appraisal final grade (APAR) | category `APPRAISAL`. |
| PS09 | disciplinary penalty / exoneration / suspension (+ `*_REVERSAL`) | **reference implementation — already conformant; do not regress.** |
| PS10 | pay / increment events | Phase-2: author the SR-posting FR now (endpoint, codes, fact_key, dedup tuple, source_module=PS10) but mark "deferred build". Ledger framing = "net-new PS12 ledger on P05 substrate", not "Platform primitive". |
| PS11 | separation / superannuation / retirement life events | **PS11 IS a writer** for the separation/superannuation event; remove any "consumes only" wording; add to reconciliation writer list. |

## D3 — Identifier-registry hygiene
- **PS09 and PS13** MUST adopt the `ERR-PS09-*` / `ERR-PS13-*` namespace for module error codes in LIVE
  FR/API/failure-handling sections (bare `UPPER_SNAKE` codes → `ERR-PS##-*` mapped onto the 8 standard HTTP
  codes). Resolve the `SIGNATURE_INVALID` collision (PS12 vs PS13) by namespacing both (`ERR-PS12-…`, `ERR-PS13-…`).
- No module redefines a shared platform id (`VAL-PAN`, `VAL-AADHAAR`, `MSG-SYS-*`, `ERR-FORBIDDEN`, the SR
  ledger append-validation) — cite it. Consolidate the 3-way SR-append validation under PS12's `VAL`/rule.
- **Role codes:** "Appointing Authority" (and any actor named by >1 module) gets ONE canonical role code in
  RBAC-addition terms; modules cite it, not a divergent local code.

## D4 — Residual invented-convention leaks (remove from LIVE sections; keep only in override tables)
- **PS12:** remove live `503`/`UPSTREAM_UNAVAILABLE` (FR-02 edge cases → `INTERNAL 500`/`ERR-LOADFAIL` via X.3),
  rename the live `workflow_tasks` entity reference → P01 `workflow_actions`, remove `requestId` from
  audit/observability text (use `X-Correlation-Id`).
- **PS09:** remove invented codes + `503` from FR failure-handling tables; drop the parallel module hash-chain
  mirror — statutory tamper-evidence = P05 dual-log + OPEN-PLAT-03 (not a PS09-owned chain).

## D5 — Shared-entity naming
- **`org_units`** (plural) everywhere — fix PS05's singular `org_unit`.
- **`employee_dependents`** is PS01-owned; **PS03 references it** (remove PS03's re-declaration with divergent
  field names / relationship enum; if PS03 needs extra fields, add them as a PS03 satellite keyed to the PS01 entity).
- **`JOB-PS01-EFFDATE`** is registered/owned by **PS01** (the effective-dating job on the master); PS02 and others
  cite it (do not invent `JOB-M01-EFFDATE`/unregistered variants).
- **PS03↔PS04 leave handoff:** agree the correlation key = **`leave_spell_lineage_id`** (PS04's key); PS03 exposes
  it on the approved-leave event; align the signed-capture shape PS04 expects to what PS03 emits.

## File → fix ownership (one agent per file, no overlaps)
- **PS12** — D1 catalog (publish all writer codes + APPRAISAL category + canonical writer matrix + write-port), D4 leaks, D3 append-validation consolidation, F-05/F-06 writer-roster freeze.
- **PS04** — D1 (write-port URL, dedup tuple, fact_key, source_module, tenant/entity, remove `AMENDMENT`), D5 (PS03↔PS04 key), event codes cite PS12.
- **PS05** — D1 (write-port, dedup tuple, fact_key, source_module, tenant/entity, remove `COMPENSATING`), D5 (`org_units`).
- **PS06** — D1 (dedup tuple incl. rename `source_event_id`→`source_reference_id`, fact_key, codes), D2 pay-fixation no-double-claim.
- **PS08** — D1 (façade relays to /sr/ingest, dedup tuple, source_module, tenant/entity, APPRAISAL category code).
- **PS09** — D3 (ERR-PS09-* namespace), D4 (remove 503/invented codes + parallel hash-chain), F-12 reword "INSERT" → "append via FR-02".
- **PS10** — D1/D2 (author deferred SR-posting FR with full contract), D4 framing ("net-new PS12 ledger on P05").
- **PS11** — D1/D2 (PS11 IS the separation/superannuation writer; add endpoint/codes/fact_key/tuple; remove "consumes only").
- **PS13** — D3 (ERR-PS13-* namespace, SIGNATURE_INVALID collision).
- **PS01** — D2 (PS01 posts identity/qualification SR events; cite the canonical write-port/tuple), D5 (own `JOB-PS01-EFFDATE`, own `employee_dependents`).
- **PS02** — D2 (PS02 is NOT an SR source — identity SR posting is by PS01 on commit; reword), cite `JOB-PS01-EFFDATE`.
- **PS03** — D5 (reference PS01 `employee_dependents`; expose `leave_spell_lineage_id` on approved-leave event for PS04; confirm PS03 does NOT post to SR).
- **PS14** — (low) ensure analytics source list reflects that leave-SR feeds come via PS04/PS12, not PS02/PS04 direct.
