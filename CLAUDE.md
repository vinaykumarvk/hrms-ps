# Project: PrimeSoft HRMS (primesoft-hrms)

This is the project-level CLAUDE.md. It extends the global `~/.claude/CLAUDE.md`
and is the single source of truth for any agent working in this repo. The AI Dev
Pipeline (v8) is installed project-scoped under `.claude/` — see
`.claude/ai-dev-pipeline-v8.md` for the method and `.claude/docs/developer-guide.md`
for which skill to use at which stage.

## Project Context

**Name:** PrimeSoft HRMS
**Domain:** Public-sector / government (PSU) HRMS — a modular establishment system
(APAR, DPC & sealed cover, transfers, promotion/seniority, pension, digital service
register, disciplinary/vigilance) built on a shared platform (P01 workflow engine,
P05 audit, RBAC, multi-tenancy).
**Current pipeline stage:** brownfield — PS01–PS14 partially delivered; program now
targets full parity with `docs/HRMS Deliverables to Development Phase/prototype_hrms.html`.
**Scale tier:** large

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 19 + Vite SPA (`apps/web`), TypeScript, Tailwind, Radix UI |
| Backend | Node.js modular monolith (`apps/api`), TypeScript, service/repository layering |
| Database | PostgreSQL via `pg`; SQL migrations in `apps/api/db/migrations` |
| Auth | Session token (`apps/web/src/app/session.ts`) + RBAC permission families; `RouteGuard` gates routes |
| Deployment | Docker → Cloud Run + Cloud SQL (see `Dockerfile`, `server.mjs`, `ops/`) |
| ORM | None — raw SQL via `pg` repositories |

## Key File Paths

```
apps/api/src/modules/psNN/            ← backend module services + repositories (PS01–PS14)
apps/api/src/platform/                ← P01 workflow, P05 audit, authorization, authority-resolution
apps/api/db/migrations/               ← source of truth for schema changes (policy: migrations)
apps/web/src/modules/psNN/            ← module workspaces (React)
apps/web/src/app/                     ← App shell, navigation, session, route guard
docs/data-model/*.sql                 ← canonical data model (00-platform-core .. 14-PS14)
docs/brd/MODULE_RECONCILIATION.md     ← maps the corporate (FS_M*) and government (PS01–PS14) scopes
docs/spec/                            ← phase plans + verdicts
docs/tests/                           ← per-module test specs
docs/HRMS Deliverables to Development Phase/  ← FS_M* functional specs, RBAC, DwnB field exports, prototype_hrms.html
project.config.yaml                   ← machine-readable config for the pipeline + hooks
```

## Standing Instructions for Coding Agents

- **Data model is authoritative.** Table/column names come from `docs/data-model/*.sql`
  and the migrations in `apps/api/db/migrations`. Never invent schema — add a migration.
- **DB-change policy is `migrations`.** The `db_change_guard` hook blocks ad-hoc DDL and
  writes to sensitive tables (see `project.config.yaml`). To approve intentionally, add a
  line to `.claude/approved-db-changes.txt` and announce it — never bypass the secrets guard.
- **Multi-tenancy is mandatory.** Every entity carries `tenant_id`/`entity_id`; reject
  unscoped queries (see `MODULE_RECONCILIATION.md` §C/§E).
- **Reuse the platform, don't re-implement it.** Approvals/maker-checker run on the P01
  workflow engine; audit goes to the P05 dual log (`audit_log` + `security_audit_log`);
  never define a module-local workflow/audit engine.
- **Layering:** DB access in `*Repository.ts`, business logic in `*Service.ts`.
- **Error model:** platform 8-code table + `{error:{code,message,field,details}}` +
  `X-Correlation-Id` header. Do not invent error codes.
- **Pagination:** cursor-only, `limit` default 25 / max 100.
- **UI:** every workspace resolves its own loading/error/empty/ready state (the PH-05E pattern).

## Commands

```
npm run typecheck        # api typecheck        npm run web:typecheck   # web typecheck
npm run build            # api build            npm run web:build       # web build
npm test                 # api tests (node:test) npm run web:test       # web tests
npm run web:test:e2e     # playwright e2e       npm run web:dev         # run web locally
npm run check            # typecheck + test (api gate)
```

## Ambiguity Protocol

If something is not covered by the FS / data model / contracts: write `AMBIGUITY.md` at
the repo root naming the module (PSnn/FS_Mnn), the field/endpoint/behaviour in question,
and the two most reasonable interpretations. Stop and escalate before choosing.

## Program Status (full-coverage remediation)

Target: 100% parity with `prototype_hrms.html` (nothing scoped out) layered on PS01–PS14.
Requirements availability and the phased plan (Waves 0–9) are tracked with the team; most
gap areas are fully specified in `docs/HRMS Deliverables to Development Phase/` (FS_M* +
`DwnB Form Fields/` CSVs). Areas still needing FS authoring: **AI assistants**, the
**Platform Super Admin operational console**, and **visitor-management / access-control**.
