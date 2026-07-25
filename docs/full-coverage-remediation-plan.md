# PrimeSoft HRMS — Full-Coverage Remediation Plan

**Status:** Program plan · **Created:** 2026-07-25 · **Owner:** (assign)
**Target:** 100% parity with `docs/HRMS Deliverables to Development Phase/prototype_hrms.html`
(all ~209 screens, ~22 personas) layered on top of the existing PS01–PS14 build — **nothing scoped out.**

> Companion docs: `docs/brd/MODULE_RECONCILIATION.md` (scope mapping), `docs/phased-plan.md`
> (original PS01–PS14 plan), `docs/HRMS Deliverables to Development Phase/` (FS_M* specs + `DwnB Form Fields/` CSV exports).

---

## 1. Context — why this plan exists

The built app (`apps/`) and the prototype are **two overlapping products**:

| | Built app (`apps/`) | Prototype (`prototype_hrms.html`) |
|---|---|---|
| Domain | Government / PSU establishment HRMS | Corporate multi-tenant SaaS HRMS |
| Structure | 3 workspaces (Me / My Team / Admin), 16 nav items → **PS01–PS14** | ~22 role personas, **209 screens** |
| Signature features | APAR, DPC & sealed cover, Pension, Service Register, Transfers, Vigilance | Recruitment/ATS, Onboarding, Separation/FnF, Service Desk, Goals & Reviews, multi-tenant platform admin |

Of ~209 prototype screens, **~30 are built or partial** (PS01, PS02, PS03-leave, PS10, PS13, PS14).
**~180 are net-new.** `MODULE_RECONCILIATION.md` confirms both scopes share one substrate
(P01 workflow engine, P05 audit, M01 employee master, RBAC), so this program is **additive**, not a rewrite.

---

## 2. What is already built (overlap with the prototype)

| Prototype area | Built module | Status |
|---|---|---|
| My profile / employee master / dependents / privacy consent | PS01 | ✅ Built |
| Edit profile / sensitive-changes approval | PS02 | ✅ Built |
| My leave / apply / approvals / balance | PS03 (leave) | ✅ Built |
| Attendance (regularization, punch anomalies) | PS03 (attendance backend) | 🟡 Partial — no shifts/geofence/check-in/comp-off UI |
| Payroll export / PF-UAN / TDS | PS10 | ✅ Built (deeper than prototype) |
| Document vault / consent / DSR | PS13 | 🟡 Partial — no letter queue/templates/bulk/sign-off |
| Dept dashboards | PS14 | 🟡 Partial — no per-persona role dashboards |

Government modules built that the prototype does **not** contain (keep as-is): PS04 Leave-SR Relay,
PS05 Transfers, PS06 Promotions/DPC, PS07 Training, PS08 APAR, PS09 Disciplinary/Vigilance,
PS11 Pension, PS12 Service Register, P01 workflow platform.

---

## 3. Requirements-readiness scorecard

🟢 full FS + field-level specs · 🟡 FS or roadmap only · 🔴 **no requirements — must author**

| Feature area | Requirements source | Readiness |
|---|---|---|
| Org-Admin config, RBAC, permissions | `FS_Org_Admin_Configuration`, `FS_Org_Admin_Master_Data`, `Admin_Settings_Requirements`, `RBAC_Design`, `rbac/*.csv/xlsx`, `DwnB/{Organisation,Permissions,Additional Config}` | 🟢 |
| Workflow / approval / SLA / form builders | `Platform_Spec`, `DwnB/workflows/*.csv`, `Workflow.docx`, `Flow.docx` | 🟢 |
| Attendance (shifts, geofence, OT, check-in) | `FS_M05_Attendance`, `DwnB/Attendance/*.csv`, Attendance & Leave walkthrough `.pptx` | 🟢 |
| Leave admin (policies, comp-off, holidays) | `FS_M04_Leave`, `DwnB/Leaves/*.csv` | 🟢 |
| Recruitment / ATS (+ referrals, BGV) | `FS_M08_Recruitment`, `DwnB/Recruitment/*.csv`, `Recruitment.docx` | 🟢 |
| Onboarding + probation | `FS_M02_Onboarding`, `DwnB/Onboarding Settings and Flows/*.csv` | 🟢 |
| Exits / Separation / FnF | `FS_M03_Exits_Offboarding`, `DwnB/seperation/Separation_requirement.docx` | 🟢 |
| Corporate Performance (goals/reviews/calibration/PIP) | `FS_M09_Performance`, `DwnB/Performance Management/*.csv` | 🟢 |
| Document / Letter admin | `FS_M11_Document_Management`, `DwnB/Additional Config/*` | 🟢 |
| Assets & IT + Service Desk (catalog, CMDB, tickets, postmortems) | `FS_M17_Assets_IT` | 🟢 |
| Dashboards / directory / org chart / calendar | `FS_Dashboard`, `FS_M01_Employee_Master` | 🟢 (per-persona dashboard layouts thin) |
| **Corporate Payroll extras** (TDS, PF/UAN, reimbursements) | `BRD` / `Product_Vision` only — Phase 2/3 roadmap, no FS | 🟡 |
| **Platform Super Admin operational UI** (tenants, licenses, feature flags, provisioning, monitoring, releases) | Platform *services* speced in `Platform_Spec` (P06); **screens have no FS** | 🟡 |
| **Office-admin: visitor mgmt, access control, biometric ops** | Fragments in `FS_M05`, `Admin_Settings`, `RBAC` — no dedicated FS | 🟡 |
| **AI assistants** (policy chat, suggest-goals, Leadership AI) | `Product_Vision` / `BRD` roadmap only — **no FS** | 🔴 |

**Bottom line:** ~90% of the missing surface is **fully specified**. Only four areas need requirements
authored first: **AI assistants (🔴)**, **PSA operational console (🟡)**, **visitor-management/access-control (🟡)**,
and a decision on **corporate payroll statutory scope (🟡)**.

---

## 4. Phased plan (Waves 0–9)

Waves 2–8 are largely parallelizable **after Wave 1 lands** (they share config, not each other).

| Wave | Scope | Readiness | Depends on |
|---|---|---|---|
| **W0 — Scope closure & foundations** *(blocking)* | Author the 🔴/🟡 FS gaps (AI assistants, PSA console, visitor/access-control); ratify payroll scope; resolve the 4 decisions (§5); extend RBAC to the full persona set; rework shell → persona-driven nav | mixed | — |
| **W1 — Config & Admin foundation** | All `cfg-*` / Org-Admin / RBAC / workflow-approval-form-SLA builders / leave-attendance-holiday policy config. Extends existing `WorkflowConfigConsole` | 🟢 | W0 |
| **W2 — Attendance (full) + Leave-admin completion** | Shifts, rosters, weekly-off, geofencing, biometric devices, check-in, regularization, comp-off, OT, attendance lock, reasons. Extends PS03 | 🟢 | W1 |
| **W3 — Recruitment / ATS** | Requisitions→offer pipeline, candidates, interviews + scheduling + guides, offers + queues, external recruiters/vendors, job portals, duplicity, BGV, referrals | 🟢 | W1 |
| **W4 — Onboarding + Probation** | Candidate persona, onboarding/joining forms, document upload, offer acceptance, pre-joining, document clusters, probation mgmt/confirmation | 🟢 | W3 |
| **W5 — Exits / Separation / FnF** | Separation stage 1/2, force separation, absconding, FnF clearance hub, exit interviews + form config, clearance stages (assets/IT, facilities, attendance, leave, compliance), exit-doc generation | 🟢 | W1 |
| **W6 — Corporate Performance + APAR harmonization** | Goals, self/appraisal review, goal plans, review cycles, calibration, scorecard pillars, normalization, custom formulas, PIP, assign plans, exclusions; reconcile with PS08 APAR | 🟢 | W1 |
| **W7 — Document/Letter Admin + Assets & Service Desk** | Letter queue/templates/bulk/merge/sign-off/versioning (extends PS13); asset master/CMDB/assignment/requests, service catalog, tickets, KB, postmortems, my-assets | 🟢 | W1 |
| **W8 — Dashboards, Directory, Org chart, Calendar, per-role home** | Role dashboards for all personas, directory + mini-profiles, org chart, shared calendar | 🟢 (layouts thin) | W1 |
| **W9 — Platform Super Admin (multi-tenant) + AI assistants** | PSA tenant mgmt/provisioning, licenses/seats, feature flags, migration toolkit (P06), monitoring, security, environments, releases, cross-tenant analytics; the 3 AI assistants | 🟡🔴 | W0 (FS), W1 |

---

## 5. Decisions needed (Wave 0 gate)

1. **Multi-tenant?** Prototype is multi-tenant SaaS (tenant_id everywhere + PSA console); current build is a single government tenant. Full parity = build the multi-tenant platform layer. Confirm.
2. **Performance model:** keep **both** corporate goals/reviews (M09) *and* government APAR (PS08) as config-selectable, or converge? (Reconciliation says APAR extends M09.)
3. **Payroll scope:** author a full corporate-payroll FS (TDS/PF/reimbursements) now, or keep the PS10 engine and defer corporate statutory extras?
4. **Navigation/RBAC:** adopt the prototype's 22-persona model, or map personas onto the existing 3-workspace shell?

---

## 6. How to execute with the installed pipeline

The AI Dev Pipeline (v8) is installed project-scoped (`.claude/`). Suggested entry points per wave:

- `phased-planner` — turn a wave into a concrete FR/screen backlog.
- `brd-generator` / `brd-coverage` — author the 🔴/🟡 FS gaps in W0 and track coverage.
- `uiux-designer` — screen specs + developer handoff per module.
- `feature-life-cycle` — classify → spec → design → build → gates → review, per FR.
- `full-review` — evidence-first review before declaring a wave done.
- `local-deployment` / `demo-readiness-evaluation` — prove each wave runs before sign-off.

---

## 7. Reality check

This is effectively finishing the remainder of a full enterprise HRMS (~180 net-new screens) —
a multi-team, multi-month program. Sequence W0 → W1 first (they unblock everything else),
then fan W2–W8 across teams, and land W9 last once its FS gaps are authored.
