# Cross-Module Consistency Review & Remediation (v3 → v3.1)

The 14 platform-grounded v3 BRDs were authored by independent agents, so a cross-cutting integration
review was run on five concerns, findings consolidated into a remediation spec, and fixes applied surgically.

## Review reports (evidence-first, report-only)
| Report | Concern | Verdict | Severities |
|---|---|---|---|
| `R1-sr-ingestion-consistency.md` | PS12 SR ingestion contract across all writers | **MATERIAL CONFLICTS** | 2 Crit · 4 High · 5 Med · 3 Low |
| `R2-shared-entity-alignment.md` | No forking of employee master / documents / audit | PASS (minor) | 1 Med · 3 Low |
| `R3-cross-module-references.md` | Referenced FRs/entities/events exist & agree | Well-referenced; SR seam weak | 4 High · 6 Med · 2 Low |
| `R4-id-registry-collisions.md` | VAL/JOB/MSG/ERR/role id namespacing | Mostly clean; PS09/PS13 lagged | 2 High · 5 Med · 2 Low |
| `R5-platform-conformance.md` | Uniform platform adoption (matrix) | 79/84 PASS, no FAIL | 3 Med · 3 Low |

## Remediation applied (`REMEDIATION.md` = authoritative decisions)
- **SR ingestion contract frozen** (D1/D2): one write-port `POST /api/v1/sr/ingest`; PS12 published the full
  `sr_event_type` catalog + `APPRAISAL` category + canonical writer matrix; every writer (PS01/PS04/PS05/PS06/PS08/PS10/PS11)
  now cites identical event-type codes, populates the `(source_module, source_reference_id, source_event_version)`
  dedup tuple, sends `fact_key` for qualifying-service events, explicit `source_module`/`tenant_id`/`entity_id`,
  and uses the `is_reversal` correction envelope (invented `COMPENSATING`/`AMENDMENT` verbs removed).
- **Writer roster resolved** (F-05/F-06): PS11 IS the separation/superannuation writer; PS03 is NOT a writer
  (PS04 posts leave); PS02 is NOT an SR source (PS01 posts identity events on commit); pay-fixation = PS10 (not PS06).
- **ID hygiene** (D3): PS09 and PS13 adopted `ERR-PS09-*` / `ERR-PS13-*` namespaces; `SIGNATURE_INVALID` collision
  resolved by namespacing both.
- **Leak cleanup** (D4): live `503`/`UPSTREAM_UNAVAILABLE`, `workflow_tasks`, `requestId` removed from PS12/PS09;
  PS09's parallel hash-chain replaced by P05 + OPEN-PLAT-03.
- **Shared-entity naming** (D5): `org_units` (plural) standardized; PS03 references PS01's `employee_dependents`
  (no fork); `JOB-PS01-EFFDATE` owned by PS01; PS03↔PS04 handoff keyed on `leave_spell_lineage_id`.

Each edited BRD carries a `## Amendments (v3 → v3.1: cross-module remediation)` table (12/14 files; PS07 & PS14
needed no fixes). The v3 set is now mutually consistent and integration-ready.
