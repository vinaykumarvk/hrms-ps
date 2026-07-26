# W7 — BRD/prototype coverage evaluation

**Wave:** W7 (Document/Letter admin + Assets/Service-desk) · **Evaluated:** 2026-07-26

## Verdict: 3/27 config screens, plus 8 FS-grounded transactional tables

Like W5/W6, W7 is transactional-heavy; the config count (3/27) understates it. The value is the
M11 letter model and the M17 asset/service-desk model, from extracted `FS_M11` and `FS_M17`.

`0041` adds 8 tables:
- **M11:** `letter_templates`, `letters` (queue, bulk, sign-off tracker)
- **M17:** `asset_categories`, `assets`, `asset_assignments`, `ticket_categories`, `tickets`, `cmdb_cis`

Constraints traced to the FS, not inferred:
- `assets.asset_status` and `ck_asset_status` — the IN_STOCK→ASSIGNED→…→DISPOSED lifecycle (§2)
- `ck_asset_active_assignment` — one un-returned assignment per asset (partial unique index)
- `ck_ticket_status` — OPEN/IN_PROGRESS/ON_HOLD/RESOLVED/CLOSED/ESCALATED
- `letters.batch_id` — bulk runs group in the queue (§ da-bulk-letters)

Reuse: `kb_articles` and `service_catalog_items` already exist (0035) and are **not** re-created;
`tickets.catalog_item_id` FKs the existing catalog. `document_categories` exists under PS13.

## The W6 lesson, applied

Every W7 descriptor's screen id (`da-templates`, `it-masters`, `cfg-sla`) was **verified against
the backlog before the build**, after W6 exposed that I had invented screen ids. The check printed
"in backlog" for all three prior to compiling. This is now the standing rule: read the backlog ids,
never guess them.

## Screen disposition

- `da-letter-queue`, `da-bulk-letters`, `da-signoff-tracker`, `da-merge-fields` — transactional over
  `letters`/`letter_templates` (tables now exist; UI unbuilt)
- `it-asset-master`, `it-asset-assignment`, `it-cmdb`, `sd-queue`, `knowledge-base` — transactional
  over the M17 tables
- `da-vault`, `da-doc-master`, `da-storage`, `da-versioning` — PS13 document vault surfaces (PS13
  exists; these are additional views)
- `cfg-approval-flows`, `cfg-workflows`, `cfg-signers`, `cfg-sla`(partly), `cfg-skip`, `cfg-notif`,
  `cfg-letterheads`, `cfg-doc-templates`, `cfg-document-settings` — workflow/document config that
  belongs with the P01 workflow-config console and the document-template slice
- `pip-cases`, `escalations`, `hrbp-my-employees` — casework surfaces over W5/W6 tables

## Running totals

W1 22/27 · W2 11/20 · W3 6/24 · W4 3/13 · W5 0/12 · W6 2/16 · W7 3/27 = **47/139** registry,
plus **16 FS-grounded transactional tables** across W5–W7.
