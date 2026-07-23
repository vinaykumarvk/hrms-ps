# BRD Coverage Review — PS01 Employee Profile Management

Date: 2026-07-02
BRD under review: `docs/brd/v3/PS01-employee-profile-management.md`
Verdict: **FAIL — partial spine implemented, full BRD not yet implemented**

## Scope

Authoritative requirement source is PS01 v3.2. The BRD defines 25 functional requirements from `FR-EPM-001` through `FR-EPM-025` (`docs/brd/v3/PS01-employee-profile-management.md:1821`, `docs/brd/v3/PS01-employee-profile-management.md:3626`). It also binds the module to platform services P01/P02/P05/P06/X.1/X.2/X.3 (`docs/brd/v3/PS01-employee-profile-management.md:140`, `docs/brd/v3/PS01-employee-profile-management.md:155`) and defines PS01 as the canonical employee master for all other modules (`docs/brd/v3/PS01-employee-profile-management.md:20`, `docs/brd/v3/PS01-employee-profile-management.md:25`).

This review distinguishes:

- **Specification/design coverage:** schema, OpenAPI, state-machine, and phase-verdict artefacts exist.
- **Executable implementation coverage:** backend service/route behavior, UI behavior, and automated tests exist.

## Evidence Base

Code inventory:

- PS01 backend module implementation consists of `apps/api/src/modules/ps01/employeeMasterService.ts`, plus typed test-case sources `ps01ToPS12SrIngest.test.ts` and `p02FieldMasking.test.ts`; no other PS01 service files were present in `apps/api/src/modules/ps01` from `find apps/api/src/modules/ps01 -type f`.
- PS01 API route implementation is limited to list/detail/profile/governed-change routes in `apps/api/src/routes/ps01.routes.ts:17` through `apps/api/src/routes/ps01.routes.ts:107`.
- PS01 web implementation consists of `apps/web/src/modules/ps01/EmployeeProfile.tsx` only from `find apps/web/src/modules/ps01 -type f`.
- The OpenAPI contract is broad and includes tags/endpoints for the full PS01 domain, including contacts, dependents, identity, bank, photos, positions, custom fields, dedup, imports, lifecycle, privacy, retention, certificates, succession, and search (`docs/contracts/openapi/PS01.yaml:18`, `docs/contracts/openapi/PS01.yaml:53`).
- The SQL data model defines broad PS01 satellite coverage, including contacts, addresses, nominees, identity, bank, Aadhaar vault, profile completeness, dedup, import, aliases, attribute history, legal holds, DPDP requests, governed changes, outbox, and break-glass (`docs/data-model/01-PS01-employee-profile.sql:39`, `docs/data-model/01-PS01-employee-profile.sql:57`).

Executable coverage found:

- Profile list/detail/profile-360 route coverage is tested in `apps/api/test/ph04-p01-ps01-routes.test.cjs:64`.
- P02 field masking is implemented in `apps/api/src/modules/ps01/employeeMasterService.ts:132` and tested in `apps/api/src/modules/ps01/p02FieldMasking.test.ts:32`.
- Governed identity change posts a PS01 SR fact through PS12 in `apps/api/src/modules/ps01/employeeMasterService.ts:75` and is tested in `apps/api/src/modules/ps01/ps01ToPS12SrIngest.test.ts:52`.
- API kernel enforces protected routes, authorization, idempotency for unsafe routes, pagination, and correlation headers in `apps/api/src/http/apiKernel.ts:38`, `apps/api/src/http/apiKernel.ts:51`, `apps/api/src/http/apiKernel.ts:52`, `apps/api/src/http/apiKernel.ts:53`, and `apps/api/src/http/apiKernel.ts:84`.
- Web PS01 renders only a compact profile-360 panel with service number, name, designation, and PII status (`apps/web/src/modules/ps01/EmployeeProfile.tsx:12`, `apps/web/src/modules/ps01/EmployeeProfile.tsx:37`).

## Coverage Matrix

| Requirement | BRD Evidence | Executable Evidence | Status |
|---|---:|---:|---|
| FR-EPM-001 Create Employee Profile on Hire | `docs/brd/v3/PS01-employee-profile-management.md:1821`; contract `docs/contracts/openapi/PS01.yaml:798`; schema supports employee satellites | No `POST /api/v1/employees` implementation in `apps/api/src/routes/ps01.routes.ts:17`-`107`; seed-only employees in `apps/api/src/seed/ph03Seed.ts:18` | **GAP** |
| FR-EPM-002 360 Profile View | `docs/brd/v3/PS01-employee-profile-management.md:1906`; contract `docs/contracts/openapi/PS01.yaml:976` | Basic route and masked serializer in `apps/api/src/routes/ps01.routes.ts:50`, `apps/api/src/modules/ps01/employeeMasterService.ts:68`; UI in `apps/web/src/modules/ps01/EmployeeProfile.tsx:12` | **PARTIAL** |
| FR-EPM-003 Contacts and Addresses | `docs/brd/v3/PS01-employee-profile-management.md:1984`; schema `docs/data-model/01-PS01-employee-profile.sql:141`, `docs/data-model/01-PS01-employee-profile.sql:175`; contract `docs/contracts/openapi/PS01.yaml:1031` | No contacts/address service or route implementation in actual PS01 route file `apps/api/src/routes/ps01.routes.ts:17`-`107` | **GAP** |
| FR-EPM-004 Dependents, Family, Nominees, Heirs | `docs/brd/v3/PS01-employee-profile-management.md:2051`; schema `docs/data-model/01-PS01-employee-profile.sql:209`; contract `docs/contracts/openapi/PS01.yaml:1184` | No dependents/nominees route implementation in actual PS01 route file | **GAP** |
| FR-EPM-005 Emergency Contacts | `docs/brd/v3/PS01-employee-profile-management.md:2123`; schema `docs/data-model/01-PS01-employee-profile.sql:243`; contract `docs/contracts/openapi/PS01.yaml:1310` | No emergency-contact implementation in actual PS01 route file | **GAP** |
| FR-EPM-006 Education, Qualifications, Experience | `docs/brd/v3/PS01-employee-profile-management.md:2176`; schema present in PS01 SQL inventory `docs/data-model/01-PS01-employee-profile.sql:43` | No education/experience service, route, UI, or tests found in PS01 implementation inventory | **GAP** |
| FR-EPM-007 Identity and Aadhaar Vault | `docs/brd/v3/PS01-employee-profile-management.md:2237`; schema `docs/data-model/01-PS01-employee-profile.sql:330`, `docs/data-model/01-PS01-employee-profile.sql:359`; contract `docs/contracts/openapi/PS01.yaml:1488` | Runtime only stores masked Aadhaar on in-memory employee fixture (`apps/api/src/seed/ph03Seed.ts:31`); no vault/reveal/write behavior implemented | **GAP** |
| FR-EPM-008 Bank and Financial Detail | `docs/brd/v3/PS01-employee-profile-management.md:2316`; schema `docs/data-model/01-PS01-employee-profile.sql:393`; contract `docs/contracts/openapi/PS01.yaml:1575` | No bank account service/route/4-eyes behavior in PS01 implementation | **GAP** |
| FR-EPM-009 Profile Photo and Biometric Reference | `docs/brd/v3/PS01-employee-profile-management.md:2383`; contract `docs/contracts/openapi/PS01.yaml:1641`; schema inventory references employee photos `docs/data-model/01-PS01-employee-profile.sql:46` | No photo/biometric behavior in PS01 implementation | **GAP** |
| FR-EPM-010 Position Management and Org Placement | `docs/brd/v3/PS01-employee-profile-management.md:2454`; schema `docs/data-model/01-PS01-employee-profile.sql:502`; contract `docs/contracts/openapi/PS01.yaml:1702` | Authority seed has position facts for resolver (`apps/api/src/seed/ph03Seed.ts:55`), but PS01 position CRUD/effective dating is not implemented | **GAP** |
| FR-EPM-011 Effective-Dated Attributes and Point-in-Time View | `docs/brd/v3/PS01-employee-profile-management.md:2531`; schema `docs/data-model/01-PS01-employee-profile.sql:979`; state machine `docs/contracts/state-machines.yaml:60` | No as-of profile route or attribute-history service implementation in PS01 runtime | **GAP** |
| FR-EPM-012 Configurable Sections and Custom Fields | `docs/brd/v3/PS01-employee-profile-management.md:2600`; contract `docs/contracts/openapi/PS01.yaml:1823` | Deferred Phase 2 in BRD; no runtime implementation | **DEFERRED/GAP** |
| FR-EPM-013 Field-Level PII, Break-Glass, Privacy | `docs/brd/v3/PS01-employee-profile-management.md:2670`; schema break-glass `docs/data-model/01-PS01-employee-profile.sql:1241`; contract `docs/contracts/openapi/PS01.yaml:1904` | PII masking exists (`apps/api/src/modules/ps01/employeeMasterService.ts:140`) and tests exist (`apps/api/src/modules/ps01/p02FieldMasking.test.ts:32`); break-glass reveal/cap/anomaly workflow absent | **PARTIAL** |
| FR-EPM-014 Completeness and Data Quality | `docs/brd/v3/PS01-employee-profile-management.md:2750`; schema `docs/data-model/01-PS01-employee-profile.sql:838` | No completeness scoring engine, job, API, UI, or tests | **GAP** |
| FR-EPM-015 Duplicate Detection and Alias Deduplication | `docs/brd/v3/PS01-employee-profile-management.md:2821`; schema `docs/data-model/01-PS01-employee-profile.sql:863`, `docs/data-model/01-PS01-employee-profile.sql:950`; contract `docs/contracts/openapi/PS01.yaml:2017` | No dedup scanner/merge/undo implementation | **GAP** |
| FR-EPM-016 Self-Service Profile Read | `docs/brd/v3/PS01-employee-profile-management.md:2903`; contract tag `docs/contracts/openapi/PS01.yaml:37` | No self-service-specific API/UI; generic profile read exists only | **GAP** |
| FR-EPM-017 Bulk Import and Migration | `docs/brd/v3/PS01-employee-profile-management.md:2969`; state machine `docs/contracts/state-machines.yaml:119`; contract `docs/contracts/openapi/PS01.yaml:2150` | Migration staging reconciliation exists as a foundation utility and test (`apps/api/test/ph03-foundation.test.cjs:183`), but PS01 import batch/upload/commit/rollback endpoints are not implemented | **PARTIAL/GAP** |
| FR-EPM-018 Lifecycle Deactivation, Reactivation, Archival | `docs/brd/v3/PS01-employee-profile-management.md:3050`; state machine `docs/contracts/state-machines.yaml:60`; contract `docs/contracts/openapi/PS01.yaml:2257` | No lifecycle transition implementation in PS01 service/routes | **GAP** |
| FR-EPM-019 Consumption API and Change Feed | `docs/brd/v3/PS01-employee-profile-management.md:3122`; route list `apps/api/src/routes/ps01.routes.ts:18`; change feed placeholder route `apps/api/src/routes/ps01.routes.ts:18` | List/detail works, but `/employees/changes` returns an empty placeholder (`apps/api/src/routes/ps01.routes.ts:25`); alias resolution/change-feed backbone not implemented | **PARTIAL** |
| FR-EPM-020 DPDP Rights, Consent, Breach | `docs/brd/v3/PS01-employee-profile-management.md:3204`; schema `docs/data-model/01-PS01-employee-profile.sql:1099`; contract `docs/contracts/openapi/PS01.yaml:2318` | No privacy request/breach workflow implementation | **GAP** |
| FR-EPM-021 Retention, Legal Hold, Erasure | `docs/brd/v3/PS01-employee-profile-management.md:3284`; schema `docs/data-model/01-PS01-employee-profile.sql:1072`; contract `docs/contracts/openapi/PS01.yaml:2441` | PS13 document hold exists separately, but PS01 employee retention/erasure is not implemented | **GAP** |
| FR-EPM-022 Governed Statutory-Field Change | `docs/brd/v3/PS01-employee-profile-management.md:3355`; contract `docs/contracts/openapi/PS01.yaml:2536` | Simplified display-name governed identity change implemented (`apps/api/src/modules/ps01/employeeMasterService.ts:75`) and SR tested (`apps/api/src/modules/ps01/ps01ToPS12SrIngest.test.ts:52`), but DOB/category/gender/name workflow, proof, approval states, and attribute history are absent | **PARTIAL** |
| FR-EPM-023 Category and PwD Certificate Management | `docs/brd/v3/PS01-employee-profile-management.md:3430`; contract `docs/contracts/openapi/PS01.yaml:2591` | No certificate service/routes/UI/tests | **GAP** |
| FR-EPM-024 Deceased Succession and Family-Pension Handoff | `docs/brd/v3/PS01-employee-profile-management.md:3497`; contract tag `docs/contracts/openapi/PS01.yaml:45` | No deceased succession workflow or PS11 handoff in PS01 implementation | **GAP** |
| FR-EPM-025 Phonetic and Transliteration Search | `docs/brd/v3/PS01-employee-profile-management.md:3570`; contract query `docs/contracts/openapi/PS01.yaml:827` | No phonetic/transliteration matcher in actual list implementation (`apps/api/src/modules/ps01/employeeMasterService.ts:60`) | **GAP** |

## User-Facing Coverage

The PS01 UI is not feature-complete against BRD Section 7. The BRD requires profile header, contacts/address/dependents/nominees, job/position timeline, documents, audit trail, privacy and rights surfaces, dedup/import screens, and full empty/loading/error/success/permission/offline states (`docs/brd/v3/PS01-employee-profile-management.md:3632`, `docs/brd/v3/PS01-employee-profile-management.md:3651`). Current UI renders only a simple profile panel with four facts and a PII status line (`apps/web/src/modules/ps01/EmployeeProfile.tsx:20`, `apps/web/src/modules/ps01/EmployeeProfile.tsx:37`). Existing UI tests check marker strings rather than behavioral workflows (`apps/web/test/ph05-records.test.cjs:13`).

## Test Coverage Assessment

Existing tests are useful but narrow:

- `apps/api/test/ph04-p01-ps01-routes.test.cjs:64` covers list/detail/profile masking and governed-change happy path.
- `apps/api/src/modules/ps01/p02FieldMasking.test.ts:32` covers field masking only.
- `apps/api/src/modules/ps01/ps01ToPS12SrIngest.test.ts:52` covers governed identity-change SR integration and idempotency conflict behavior.
- There are no executable tests for contacts, addresses, dependents, nominees, emergency contacts, education, identity vault write/reveal, bank 4-eyes, photos, positions, as-of views, custom fields, break-glass cap/anomaly, completeness, dedup, self-service, import API, lifecycle, DPDP, retention, certificates, deceased succession, or phonetic search.

Validation baseline captured during this review:

- `npm test` passed: 125/125 API tests.
- `npm run web:test` passed: 32/32 web tests.
- These green checks validate the existing phase spine; they do not close the BRD coverage gaps listed here.

## Critical Gaps

| Gap ID | Severity | Gap | Evidence |
|---|---|---|---|
| PS01-COV-001 | Critical | BRD has 25 FRs; runtime implements only the PS01 spine. | BRD FR range `docs/brd/v3/PS01-employee-profile-management.md:1821`-`3626`; actual PS01 route file `apps/api/src/routes/ps01.routes.ts:17`-`107`; actual PS01 service file `apps/api/src/modules/ps01/employeeMasterService.ts:36`-`146` |
| PS01-COV-002 | Critical | Canonical master create/update lifecycle is missing, so downstream module confidence is based on seed fixtures rather than real PS01 master behavior. | Seed employees are static in `apps/api/src/seed/ph03Seed.ts:18`; no create route in `apps/api/src/routes/ps01.routes.ts:17`-`107` |
| PS01-COV-003 | Critical | PS01 OpenAPI promises broad APIs that do not exist in runtime routes. | Broad contract tags `docs/contracts/openapi/PS01.yaml:18`-`53`; actual routes limited to seven registrations `apps/api/src/routes/ps01.routes.ts:18`-`106` |
| PS01-COV-004 | High | Privacy/Aadhaar/break-glass are schema/contract-covered but not behaviorally implemented. | BRD privacy/vault requirements `docs/brd/v3/PS01-employee-profile-management.md:2237`, `docs/brd/v3/PS01-employee-profile-management.md:2670`; schema `docs/data-model/01-PS01-employee-profile.sql:330`, `docs/data-model/01-PS01-employee-profile.sql:1241`; runtime serializer only masks fields `apps/api/src/modules/ps01/employeeMasterService.ts:140` |
| PS01-COV-005 | High | UI is not BRD-complete and currently functions as an evidence panel, not a usable PS01 workspace. | BRD UI requirements `docs/brd/v3/PS01-employee-profile-management.md:3632`-`3651`; UI implementation `apps/web/src/modules/ps01/EmployeeProfile.tsx:12`-`39` |
| PS01-COV-006 | High | Tests verify phase markers and spine paths but do not prove most PS01 workflows. | Marker-style UI tests `apps/web/test/ph05-records.test.cjs:13`; API tests limited to PS01 route spine `apps/api/test/ph04-p01-ps01-routes.test.cjs:64` |

## Scorecard

| Category | Score | Notes |
|---|---:|---|
| BRD line-item implementation | 4 / 25 FRs materially touched | FR-002, FR-013, FR-019, FR-022 are partial; all others gap or deferred |
| API contract conformance | Low for PS01 full surface | Contract is much larger than implemented route surface |
| Data model coverage | High as design artefact | SQL covers most entities but is not backed by runtime behavior |
| Backend behavior | Low to medium | Good foundation kernel; thin PS01 domain logic |
| Frontend behavior | Low | Single profile summary panel only |
| Automated tests | Low for BRD completeness | Tests cover foundation and selected spine behavior |
| Security/privacy behavior | Partial | P02 masking exists; break-glass, Aadhaar vault, DPDP rights absent |

Overall status: **Not release-complete for PS01.** The phase pipeline produced a strong architectural and executable foundation, but it should not be treated as complete implementation of the PS01 BRD.

## Recommended Remediation Path

1. Convert PS01 from spine implementation to a real domain service in thin vertical increments.
2. Start with the canonical master CRUD and consumption backbone: FR-001, FR-002, FR-019, FR-022.
3. Add privacy-critical controls next: FR-007, FR-013, FR-020, FR-021.
4. Add employee profile satellites in workflow-safe clusters: FR-003/005, FR-004/024, FR-006/023, FR-008/009/010/011/015/017/025.
5. For each cluster, add acceptance tests before implementation and rerun this coverage report until every row is PASS or explicitly deferred with owner/date.
