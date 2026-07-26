# 0035 re-derivation against the extracted FS bodies

**Done:** 2026-07-26 · **Trigger:** migration 0035 authored its ten tables before the FS `.docx`
bodies were known to be readable; I flagged it repeatedly as the weakest, "inferred from screens"
artifact and recommended re-deriving it. This is that pass.

## Result: better than I feared — and my earlier framing was too harsh

I called 0035 "ten tables inferred from prototype screens" many times. Having now read the FS, that
overstates it. **All ten concepts are specified in the FS bodies**, and **nine of the ten have
columns consistent with the spec.** The tables were not invented; I authored them from screen names
because I wrongly believed the FS was unreadable, and they turned out to mostly match anyway.

| Table | FS source | Column verdict |
|---|---|---|
| `business_units` | FS_Org_Admin_Master_Data §2.2 (cfg-bu) | consistent |
| `devices` | FS_M05_Attendance §2.15 "Device register and health" | consistent |
| `ip_allowlist` | FS_Org_Admin_Config / M05 IAM | consistent |
| `tenant_settings` | FS_Org_Admin_Config | consistent |
| `integrations` | FS_Org_Admin_Config | consistent |
| `sso_providers` | FS_Org_Admin_Config §138 (SSO policy, session/expiry) | consistent |
| `service_catalog_items` | FS_M17 | consistent |
| `kb_articles` | FS_M17 | consistent |
| `separation_policies` | FS_M03 §4.8.1 / §370 | **UNDER-MODELLED — corrected** |
| `separation_workflows` | FS_M03 | consistent (superseded — see note) |

## The one material defect, corrected

`separation_policies` was authored flat (`policy_code`, `name`, `notice_period_days`,
`applies_to_grade`). FS_M03 §4.8.1 / §370 specifies it as a **5-step wizard** with:
- Policy-detail toggles: `allow_past_dated_resignation`, `force_separate_on_lwd`, `applicability`
- Two child entities: §4.8.1a `separation_policy_initiators`, §4.8.1b `separation_policy_workflow_map`

Migration `0044_separation_policy_detail.sql` adds the four columns and the two child tables,
additively (0035 is unmodified and unapplied). This is exactly the class of defect re-derivation
existed to catch: a flat inference where the spec has structure.

## Note on separation_workflows

0035's `separation_workflows` (a policy→P01 binding) is now largely **superseded** by 0044's
`separation_policy_workflow_map`, which is the FS's own §4.8.1b binding entity. They overlap. The
FS-named `separation_policy_workflow_map` is authoritative; `separation_workflows` should be
retired or merged when this is applied. Flagged, not silently left as a duplicate. Neither is
applied to any database, so the reconciliation is a pre-deployment cleanup, not a data migration.

## Takeaway

The re-derivation both **improved** the schema (separation policy now matches the spec) and
**corrected the record**: 0035 was FS-consistent to a degree I had been understating. The single
most important process lesson of this whole programme stands — *the FS was readable all along* — but
its consequence for 0035 specifically is milder than I had been reporting.
