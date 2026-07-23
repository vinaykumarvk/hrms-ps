# R2 — Shared Canonical-Entity Alignment Review

**Scope:** Cross-cutting integration audit of 14 platform-grounded primesoft-hrms BRDs (`docs/brd/v3/PS01..PS14`) plus `docs/brd/PLATFORM_FOUNDATION.md`, for ONE concern: **no forking of the shared canonical entities** — the employee master (PS01 / PrimeSoft M01), documents (PS13 / M11), audit (P05 dual-log), and org units (P04 / PS01).

**Reviewer:** Integration reviewer (read-only audit). **Date:** 2026-07-01.

---

## Verdict

**Strong alignment — PASS with minor findings.** Across all 12 consumer modules (PS02–PS12, PS14) the canonical entities are **referenced, not redefined**: no module hard-defines its own `employees`, `org_units`, `documents`, or `audit_log` table; every employee foreign key is the canonical `employee_id` UUID (no module joins on `service_no`); `documents` is uniformly PS13-owned and reached via `document_id`; and audit is uniformly the P05 DB-trigger dual-log — PS02 explicitly **removed** its invented `cr_audit_chain` (E18) and PS08 removed its bespoke per-form hash-chain, both re-grounded onto P05 + OPEN-PLAT-03. The only genuine schema-fork is **PS03's re-declaration of the PS01-owned `employee_dependents` satellite (E29) with divergent field names and a divergent relationship enum** (MEDIUM). The remainder are low-severity naming/consistency drifts — chiefly PS05 referencing `org_unit` (singular) where every other module and the canonical use `org_units` (plural). No CRITICAL or HIGH issues; no canonical master was forked.

---

## Findings

| # | Finding | Severity | Modules involved | Evidence (file + section/quote) | Recommended fix |
|---|---------|----------|------------------|----------------------------------|-----------------|
| F1 | **PS03 redefines the PS01-owned `employee_dependents` satellite with divergent fields and a divergent enum.** PS01 canonical E4 uses `relationship` VARCHAR(24) enum `RELATIONSHIP` (SPOUSE/SON/DAUGHTER/FATHER/MOTHER…), plus `full_name`, `gender`, `is_dependent`, `is_minor`, `is_differently_abled`, `is_legal_heir`, `heir_succession_rank`, `national_id_masked`, `proof_document_id`. PS03 E29 instead defines `relation` ENUM (CHILD/SPOUSE/PARENT/OTHER), `is_surviving`, `is_disabled` — i.e. `relation`≠`relationship`, the enum value sets diverge, `is_disabled`≠`is_differently_abled`, `is_surviving` is net-new, and all of PS01's heir/succession fields are absent. This is the canonical-name-divergence the check targets (item 3) and, because PS11 family-pension depends on PS01's `is_legal_heir`/`heir_succession_rank`, the slim mirror risks an inconsistent dependents view feeding pension. | **MEDIUM** | PS03 (vs PS01 owner; downstream PS11) | `PS01-employee-profile-management.md` §5.4 E4 `employee_dependents` (lines 682–695: `relationship` enum, `is_differently_abled`, `is_legal_heir`, `heir_succession_rank`). `PS03-attendance-and-leave-management.md` §5.2 E29 `employee_dependents (EXTEND PS01/M01 — R14; read/mirror)` (lines 671–681): `relation ENUM CHILD/SPOUSE/PARENT/OTHER`, `is_surviving`, `is_disabled`; note "Canonical home is PS01/M01… PS03 reads/mirrors; if M01 does not yet expose it, PS03 owns interim and emits a dependency-amendment request to PS01." | Do not re-declare the table. Adopt PS01's exact column names/enum (`relationship`, `is_differently_abled`, `is_legal_heir`, `heir_succession_rank`) so the mirror is field-compatible; if PS01 genuinely lacks `is_surviving`/CCL-specific needs, raise the dependency-amendment to PS01 (Recon §D) and add them to the canonical E4, not a forked copy. Until then mark E29 as a read-only projection of PS01 E4 with identical schema. |
| F2 | **PS05 references `org_unit` (singular) as the FK target where the canonical entity is `org_units` (plural).** PS05 uses `FK→org_unit` 13× across `vacancy_positions`, `clearance_checklists`, `transfer_preferences`, quarters, etc.; every other consumer module (PS02/03/06/07/08/09/10/11/12/14) and the PS01/PLATFORM canonical use `org_units`. Same concept, divergent name — risks FK-resolution drift at build time. | **LOW** | PS05 (vs canonical `org_units`) | `PS05-transfer-relieving-joining-workflow.md` §5.2 (e.g. lines 411, 421, 441, 675 `UUID FK→org_unit`); contrast `PLATFORM_FOUNDATION.md` §2/§6.2 (`org_unit`/`org_units` master) and PS01 §5.4 `org_unit_id UUID FK→org_units`. Count: PS05 `org_unit`(sing FK)=13, `org_units`(plural)=1; all other modules 0 singular. | Normalise all PS05 FK targets to `org_units` to match the master table name; keep the column name `org_unit_id`. Pure rename, no semantic change. |
| F3 | **PS04 carries a `service_no_raw` capture column** — the only place a `service_no`-shaped key appears below the master. It is explicitly a legacy as-keyed value "resolved to employee_id", so the canonical join key is preserved; flagged only so it is never promoted to a join/FK key. | **LOW (informational)** | PS04 | `PS04-leave-sr-integration.md` §5 (line 570: `service_no_raw varchar(64) … As-keyed; resolved to employee_id`). | Keep as a migration-provenance column only; ensure all joins resolve through `employee_id` (and `employee_id_aliases`), never `service_no_raw`. No schema change needed if that invariant holds. |
| F4 | **Residual domain hash-chain columns on P05-grounded ledgers.** PS09 `case_timeline_events` (E19) still carries `row_hash`/`prev_hash` (AI-15/DI-21) although the re-grounding note states it "rides on" the P05 substrate and "does not invent a parallel cryptographic chain"; PS02 `esignatures` and PS08 `apar_disclosure_log` similarly retain domain chains "aligned to OPEN-PLAT-03". These are **not** `audit_log` forks (audit itself is correctly P05-only in every module) but the retained chain columns are mildly inconsistent with the stated "no parallel chain" intent. | **LOW (informational)** | PS09, PS02, PS08 | `PS09-disciplinary-cases-punishment.md` line 127 & 257 ("no module-defined `audit_log`"; "rides on this substrate rather than inventing a parallel cryptographic chain") vs line 70 AI-15 (`row_hash`/`prev_hash` on E19). `PS02` §5 E18 REMOVED (lines 328, 667–669). `PS08` lines 54, 603 (`apar_disclosure_log` domain ledger on P05). | Confirm the domain `row_hash`/`prev_hash` columns are derived-from / verified-against the OPEN-PLAT-03 chain (not an independent integrity source), or drop them and rely on the `/verify` endpoint over the P05 chain. Documentation alignment, not a data-model fork. |

---

## Positive confirmations (no fork detected)

- **No hard fork of any canonical table.** A scan for module-owned `#### … employees | employee_master | org_units | documents | audit_log | security_audit_log` definitions across PS02–PS14 returned **none**. Each module lists these under "Referenced (owned elsewhere)" / ownership-and-reuse matrices (e.g. PS02 §5.2 lines 721–725; PS05 line 709; PS06 lines 905–910; PS07 lines 687–691; PS09 line 306; PS14 lines 752–758).
- **Employee FK key is consistent (check 2 — PASS).** Every child/transaction table across all 12 modules uses `employee_id UUID FK→employees`. No module uses `service_no` as a foreign key (only PS04's provenance-only `service_no_raw`, F3).
- **`documents` is consistently PS13-owned (check 4 — PASS).** All modules attach/fetch via `document_id UUID FK→documents (PS13/M11)` and store references only (PS02 E3 `change_request_documents`, PS05/PS06/PS09/PS11/PS12/PS14 document FKs). The PS13 attach contract is the canonical `document_links` (E7: `module_code`, `entity_name`, `entity_ref_id`, `link_role`); consumer modules reference `documents` rather than re-defining it.
- **Audit is consistently the P05 dual-log (check 5 — PASS).** No per-module `audit_log` is defined anywhere. PS02 explicitly **removed** `cr_audit_chain` (E18 → P05 + OPEN-PLAT-03); PS08 replaced its invented per-form hash-chain with the P05 substrate; PS04/PS07/PS09/PS11 state "PS0x defines no `audit_log`" and capture via the P05 DB-trigger.
- **Org model not forked.** PS05 `vacancy_positions` is an explicitly **non-authoritative read-through cache** of PS06/PS01 strength (`sanctioned_strength_cached`, `strength_source`, `strength_as_of`, "never the source of truth"), not a redefinition of `positions`/`org_units` (PS05 §5.2.7, lines 417–432).
- **Payroll/pension employee data are point-in-time snapshots, not master copies.** PS10/PS11 snapshot emoluments/calc inputs as-of cutoff and reference PS01 as the golden source (PS10 line 160; PS11 lines 132, 169, 193) — no employee-master redefinition.

---

## Severity counts

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 3 (incl. 2 informational) |
