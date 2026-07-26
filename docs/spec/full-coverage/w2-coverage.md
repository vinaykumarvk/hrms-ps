# W2 — BRD/prototype coverage evaluation

**Wave:** W2 (Attendance full + leave-admin completion) · **Evaluated:** 2026-07-26

## Verdict: 8/20 screens backed by a registry descriptor

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
