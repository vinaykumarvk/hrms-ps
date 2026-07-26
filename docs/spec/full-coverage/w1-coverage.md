# W1 — BRD/prototype coverage evaluation
**Wave:** W1 (Config and Admin foundation) · **Evaluated:** 2026-07-26
**Backlog:** docs/spec/full-coverage/screen-backlog.yaml · **Prototype:** prototype_hrms.html

## Verdict: 12/27 W1 screens backed

The registry substrate backs a screen when a descriptor names it AND the table it
administers exists in the data model. Both conditions are required: a descriptor
pointing at a table that does not exist would be inventing schema, which CLAUDE.md forbids.

## Covered

| Screen | Section | Registry | Table |
|---|---|---|---|
| `cfg-geofence` | IAM & security | yes | `geofences` |
| `cfg-grants` | IAM & security | yes | `role_permissions` |
| `cfg-nid` | IAM & security | yes | `national_id_types` |
| `cfg-rbac` | IAM & security | yes | `roles` |
| `cfg-assign` | Org structure | yes | `designations` |
| `cfg-classification` | Org structure | yes | `org_units` |
| `cfg-custom` | Org structure | yes | `custom_field_definitions` |
| `cfg-depts` | Org structure | yes | `org_units` |
| `cfg-geo` | Org structure | yes | `locations` |
| `cfg-grades` | Org structure | yes | `grades` |
| `da-categories` | Policy library | yes | `document_categories` |
| `cfg-entities` | Tenant & entities | yes | `entities` |

## Gap A — blocked on a missing table (10)

These are registry-shaped and would need only a descriptor — but the table they would
administer does not exist in `docs/data-model/` or `apps/api/db/migrations/`. Adding one is
a data-model change requiring an FS, not a descriptor entry.

| Screen | Table needed |
|---|---|
| `cfg-catalog-items` | `service_catalog_items` |
| `cfg-kb-articles` | `kb_articles` |
| `cfg-separation-policy` | `separation_policies` |
| `cfg-separation-workflow` | `separation_workflows` |
| `cfg-devices` | `devices` |
| `cfg-ip` | `ip_allowlist` |
| `cfg-bu` | `business_units` |
| `cfg-integrations` | `integrations` |
| `cfg-sso` | `sso_providers` |
| `cfg-tenant` | `tenant_settings` |

## Gap B — not registry-shaped (5)

These need their own surface; the registry substrate is the wrong tool.

| Screen | What it actually is |
|---|---|
| `cfg-sd-config` | service-desk settings singleton |
| `audit-log` | operational read view over audit_log/security_audit_log |
| `bulk-upload` | import job with staging + validation, not a registry |
| `dob-view` | date-of-birth exception view; PII-gated read |
| `da-ack-campaign` | campaign job that targets employees, not a config list |

## Recommendation

W1 cannot reach 27/27 by writing more descriptors. Ten screens are blocked on
data-model additions and five need bespoke surfaces. Closing W1 fully requires an FS pass
for the ten missing tables first — which is W0-class work that the original plan placed in
W0 but scoped only to AI assistants, the PSA console and visitor management.

**This is a real finding: W0's FS-gap list was incomplete.**
