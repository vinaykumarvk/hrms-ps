# W8 — BRD/prototype coverage evaluation

**Wave:** W8 (Dashboards, directory, org chart, per-role homes) · **Evaluated:** 2026-07-26

## Verdict: W8 is a COMPOSITION wave — 1 FS-grounded table, 0 registry screens, by design

W8 is the largest wave by screen count (74) and the one the registry/schema lens fits **least**.
FS_Dashboard v1.0 says so directly: it "adds the build layer — widget data-binding, refresh/cache,
drill-down, per-role composition, the aggregation API" over data the other modules already own. The
74 screens are per-persona **read surfaces**, not new persistent entities.

### The one persistent entity, authored

`0042_w8_dashboard_widgets.sql` — the widget catalog. Per the FS each widget is "specified once and
composed per persona"; `GET /dashboard` returns a manifest for {role holdings × workspace ×
has-reportees}. That catalog is the only table W8 needs. It carries no registry descriptor because
**no `cfg-widgets` screen exists in the backlog** — attaching one would be the invented-screen-id
mistake W6 exposed, so it stays as infrastructure (like `review_cycles`).

### Why the 74 screens are not "uncovered work" in the schema sense

Their data substrate already exists, built across W0–W7 and the PS modules:

| W8 screen group | Composed from |
|---|---|
| `tasks`, `approvals`, `*-approvals`, `notifications` (19 Tasks screens) | P01 workflow tasks |
| `dashboard`, `psa-analytics`, `dept-*` oversight | PS14 analytics + module summaries |
| `my-leave`, `my-assets`, `my-goals`, `my-profile`, `my-tickets` (Self) | PS03/W7/W6/PS01 records |
| `directory`, `org-chart`, `employee-master`, `calendar` | PS01 employee master + org_units (W1) |
| `team-*`, `hod-employees`, `my-team` | reporting hierarchy over PS01 |
| module oversight (`recruitment`, `ra-*`, `onboarding-oversight`, `documents-oversight`) | W3/W4/W7 tables |

The remaining work is **per-persona home UI composition** — real frontend build, but *not blocked
on schema and not registry-shaped*. W0's persona-driven navigation (ADR-006 D-COV-04) is the shell
that makes it possible; PS14's `AnalyticsWorkspace`/`Charts`/`KpiCard` are the widget primitives.

### Screens in W8 that actually belong to W9

The backlog placed several 🔴 screens in W8 that have **no FS**: `ai-policy-chat`, `psa-analytics`,
`access-control`, `biometric-mgmt`, `visitor-mgmt`. These are the AI-assistant / PSA / visitor-
management surfaces the source plan itself flags as unspecified (🔴). They are not buildable to a
specification because none exists — same category as W9. Recorded here so they are not mistaken for
composition work that merely needs UI.

## Honest position

W8 cannot be "completed" by authoring tables — doing so would be manufacturing schema for read
surfaces. The correct W8 deliverable is (a) the widget catalog, done, and (b) a large per-persona
home-composition UI effort that is unblocked but substantial, plus (c) the handful of 🔴 screens
that are unspecified and belong with W9. This is stated plainly rather than reported as a coverage
fraction that the wave's nature makes meaningless.

## Running totals (registry metric, where it applies)

W1 22/27 · W2 11/20 · W3 6/24 · W4 3/13 · W5 0/12 · W6 2/16 · W7 3/27 · W8 n/a (composition) =
47/139, plus **17 FS-grounded tables** across W4–W8.
