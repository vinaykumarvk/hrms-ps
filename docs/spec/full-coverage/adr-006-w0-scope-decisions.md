# ADR-006 — W0 scope decisions for full-coverage parity

**Status:** Accepted · **Decided:** 2026-07-26 · **Decided by:** agent, under the operator's
standing instruction to "take the most appropriate decisions" and treat all gates as auto
**Context:** `docs/full-coverage-remediation-plan.md` §5 lists four decisions as a W0 gate. They
are answered here so W1–W9 are unambiguous. Each records what would change if reversed.

Measured ground truth used throughout: the prototype's `NAV` declares **22 personas** and
**226 unique screens** across **55 sections**; the built app serves **16 routes**.

---

## D-COV-01 — Multi-tenancy: **confirmed, and already the substrate**

The plan framed this as an open question ("current build is a single government tenant"). It is
not, at the data layer: `CLAUDE.md` states multi-tenancy is mandatory, every entity already
carries `tenant_id`/`entity_id`, `security_clearances` and every table added this session are
tenant-scoped, and the RLS isolation tests in the API suite exercise cross-tenant denial.

**Decision.** Multi-tenancy is confirmed as the model. No data-layer work is required. What is
genuinely missing is the *operator surface* — the `platform_super_admin` persona and the 13
Tenant-operations / Migration / Operations-and-security screens — which is W9, not a foundational
change.

**If reversed:** W9 disappears, and `platform_super_admin` drops from 22 personas to 21. Nothing
in W1–W8 changes, which is the evidence that this was never really a foundational fork.

## D-COV-02 — Performance model: **both, config-selectable, APAR as a profile of M09**

The prototype ships corporate goals/reviews (M09); the built app ships government APAR (PS08).
`MODULE_RECONCILIATION.md` records that APAR *extends* M09 rather than competing with it.

**Decision.** Keep both. M09 is the general cycle engine (goal plans, review cycles, calibration,
normalisation, PIP); PS08 APAR becomes a configured profile over it — the reporting/reviewing/
accepting tier chain is a three-stage review cycle with sealed-cover handling. Selection is
configuration, not a build-time fork.

**Rationale.** Converging to one model would discard PS08, which is delivered and has statutory
semantics (sealed cover, DPC feed suppression) that generic review cycles cannot express.
Building them as unrelated modules would duplicate cycle, scoring and calibration machinery.

**If reversed** (converge to one): W6 grows substantially, PS08's statutory behaviour must be
re-proven against the new engine, and the PS06 DPC feed contract has to be re-verified.

## D-COV-03 — Payroll scope: **keep the PS10 engine; corporate statutory extras stay out**

PS10 is delivered and deeper than the prototype (TDS engine, PF/UAN, loans, perquisites, GL and
treasury). The corporate extras named in the plan (corporate TDS, reimbursements) have **no FS** —
only a roadmap mention in `BRD`/`Product_Vision`.

**Decision.** PS10 remains the payroll engine. Corporate statutory extras are explicitly **not**
in W0–W9. Building to a roadmap bullet would mean inventing requirements, which the ambiguity
protocol forbids.

**If reversed:** an FS must be authored first; it would land as a new wave after W9, and would
need reconciliation against PS10's existing tax and contribution engines rather than replacing them.

**Consequence to state plainly:** with this decision, "100% parity with the prototype" is true for
screens and false for corporate payroll depth. The prototype's payroll screens are covered; the
roadmap features behind them are not, because they are unspecified.

## D-COV-04 — Navigation and RBAC: **adopt the 22-persona model, data-driven, over the existing shell**

The prototype drives navigation from `NAV[role]` — a per-persona section/item list, with admin
personas excluded from the `Self` section. The built app hardcodes 16 nav items across three
workspaces.

**Decision.** Adopt the prototype's persona-driven model, but as *data* over the existing route
guard rather than a shell rewrite:

- extend the persona catalogue to all 22 personas,
- express navigation as a per-persona structure,
- keep `RouteGuard` and the permission families as the enforcement boundary — navigation shapes
  what is *offered*, never what is *permitted*.

**Rationale.** With 226 screens ahead, adding a screen must be a data change. Hardcoding would
make every later wave a shell edit and would guarantee drift between what a persona can see and
what it can reach. Keeping RouteGuard authoritative preserves the standing rule that client
navigation is UX and data minimisation, never authorisation — the point FR-02 and the review both
insisted on.

**If reversed** (map personas onto the existing three workspaces): W8's 74 screens must be folded
into three menus, personas collapse and the prototype's exclusive-admin-workspace behaviour is
lost.

---

## Standing constraints these decisions do not touch

Recorded so no later wave treats them as open: the data model stays authoritative and schema
changes stay migrations-only; approvals stay on the P01 workflow engine and audit on the P05 dual
log; the platform 8-code error table is closed; every workspace resolves its own
loading/error/empty/ready state.
