# W2 — BRD/prototype coverage evaluation

**Wave:** W2 (Attendance full + leave-admin completion) · **Evaluated:** 2026-07-26

## Verdict: 11/20 screens backed (was 8/20 before Gap-A remediation)

Every one of the eight is backed by a table that ALREADY EXISTED in
`docs/data-model/03-PS03-attendance-leave.sql` or `00-platform-core.sql`. No schema was
authored for W2 and no specification was inferred — unlike W1's Gap A, the FS coverage
(FS_M04_Leave, FS_M05_Attendance) and the data model were already in place.

## Covered

| Screen | Table |
|---|---|
| `cfg-shifts` | `shifts` |
| `cfg-weeklyoff` | `weekly_off_patterns` |
| `cfg-holiday-calendars` | `holiday_calendars` |
| `cfg-leave-policy` | `leave_accrual_policies` |
| `leave-config` | `leave_types` |
| `attendance-reasons` | `attendance_reasons` |
| `leave-reasons` | `leave_reasons` |
| `attendance-policies` | `attendance_policies` |

## Gap A — needs a table (4)

| Screen | Table needed |
|---|---|
| `cfg-blackout` | `blackout_periods` |
| `cfg-compoff` | `comp_off_rules` |
| `cfg-decisionmatrix` | `decision_matrix` |
| `cfg-infraction` | `infractions` |

## Gap C — same registry, second surface (6)

These prototype screens present data a covered registry already administers. They need a
distinct *view* (a different persona's entry point or a narrower slice), not a new registry.
Counting them as covered would overstate parity, so they are listed separately.

| Screen | Already administered by |
|---|---|
| `attendance-config` | attendance-policies (attendance_policies) |
| `attendance-shifts` | cfg-shifts (shifts) |
| `cfg-att-platform` | attendance-policies (attendance_policies) |
| `cfg-att-policy` | attendance-policies (attendance_policies) |
| `cfg-leave-platform` | leave-config (leave_types) |
| `leave-policies` | cfg-leave-policy (leave_accrual_policies) |

## Gap B — not registry-shaped (2)

| Screen | What it is |
|---|---|
| `geofencing` | covered by the W1 geofences registry under cfg-geofence |
| `leave-balance-adjust` | an adjustment transaction with approval, not a config list |

## Note on the counting rule

8/20 is deliberately conservative. Six of the twelve uncovered screens (Gap C) are alternate
surfaces over registries that ARE built, so a looser rule would report 14/20. The stricter
count is used because a screen is not delivered until its own surface exists.

---

## Gap-A remediation (2026-07-26, same session)

Migration `0036_w2_leave_attendance_config.sql` adds `comp_off_rules`, `blackout_periods` and
`decision_matrix`, with descriptors for `cfg-compoff`, `cfg-blackout` and `cfg-decisionmatrix`.
**Coverage 8/20 → 11/20.**

The important difference from W1's Gap A: **these were not inferred.** Every column traces to a
named field in the DwnB form-field exports that ship with the FS —
`Tenant_Leaves_Compoff_Export.csv`, `Leave-Policy-Block-Leave-Export.csv`,
`Approvalflows-Export.csv`. The column comments carry the mapping.

`cfg-infraction` was deliberately **excluded**. No field export or FS section specifies it, and
authoring it would repeat exactly the problem W1's Gap A created. It stays uncovered until
specified — that is the correct outcome, not a shortfall.

`decision_matrix` binds to a P01 workflow definition rather than re-implementing approval routing
(CLAUDE.md: reuse the platform).

Review of 0036: 3/3 tables tenant-scoped with `NOT NULL tenant_id`, 3/3 have a per-tenant unique
business key, additive only, no destructive DDL. `blackout_periods` carries a CHECK preventing a
window that ends before it starts.

**Not applied to any database.** Authored and reviewed only.
