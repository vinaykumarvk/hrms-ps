# Prototype Screen → Module Map

Classifies **all 296 PrimeSoft prototype screens** (every `*.txt` in
`reconciliation/prototype-extract/`) into a **enterprise module** (PS01–PS14 / platform-core /
platform-config) or **out-of-scope commercial** (recruitment, onboarding, separation, IT/service
desk, platform super-admin, payroll). Module labels are best-fit against the enterprise HRMS BRD set;
the load-bearing axis is **in-enterprise-scope vs out-of-scope**.

## Summary counts

| Scope | Screens |
|---|---|
| **In enterprise scope** (PS01/PS02/PS03/PS08/PS13/platform-core/platform-config) | **183** |
| **Out of scope** (recruitment/onboarding/separation/ITSM/psa/payroll) | **113** |
| **Total** | **296** |

In-enterprise-scope by module: PS01 = 32, PS02 = 2,
PS03 = 33, PS08 = 31,
PS13 = 20,
platform-core = 12,
platform-config = 53.

Out-of-scope by group: Recruitment = 45,
Onboarding = 12, Separation = 18,
IT assets & Service Desk = 21,
Platform Super-Admin = 13,
PS10 Payroll = 4.

---

## In enterprise scope (183)

### PS01 employee profile / master / directory / org / lifecycle (32)

*Rationale:* Employee golden-record CRUD, directory, org chart, and lifecycle (probation/confirmation) surfaces — core enterprise HR.

| Screen | Module |
|---|---|
| `add-certification` | PS01 employee profile / master / directory / org / lifecycle |
| `add-dependent` | PS01 employee profile / master / directory / org / lifecycle |
| `add-disability` | PS01 employee profile / master / directory / org / lifecycle |
| `add-education` | PS01 employee profile / master / directory / org / lifecycle |
| `add-experience` | PS01 employee profile / master / directory / org / lifecycle |
| `add-skill` | PS01 employee profile / master / directory / org / lifecycle |
| `add-visa` | PS01 employee profile / master / directory / org / lifecycle |
| `bank-entry` | PS01 employee profile / master / directory / org / lifecycle |
| `dept-headcount` | PS01 employee profile / master / directory / org / lifecycle |
| `dept-view` | PS01 employee profile / master / directory / org / lifecycle |
| `directory` | PS01 employee profile / master / directory / org / lifecycle |
| `directory-mini-profile` | PS01 employee profile / master / directory / org / lifecycle |
| `dob-view` | PS01 employee profile / master / directory / org / lifecycle |
| `employee-detail` | PS01 employee profile / master / directory / org / lifecycle |
| `employee-master` | PS01 employee profile / master / directory / org / lifecycle |
| `hod-employee-detail` | PS01 employee profile / master / directory / org / lifecycle |
| `hod-employees` | PS01 employee profile / master / directory / org / lifecycle |
| `hr-add-employee` | PS01 employee profile / master / directory / org / lifecycle |
| `hr-employee-detail` | PS01 employee profile / master / directory / org / lifecycle |
| `hr-project-master` | PS01 employee profile / master / directory / org / lifecycle |
| `hrbp-employee-detail` | PS01 employee profile / master / directory / org / lifecycle |
| `hrbp-my-employees` | PS01 employee profile / master / directory / org / lifecycle |
| `my-org` | PS01 employee profile / master / directory / org / lifecycle |
| `my-profile` | PS01 employee profile / master / directory / org / lifecycle |
| `my-team` | PS01 employee profile / master / directory / org / lifecycle |
| `national-id` | PS01 employee profile / master / directory / org / lifecycle |
| `nominees` | PS01 employee profile / master / directory / org / lifecycle |
| `org-chart` | PS01 employee profile / master / directory / org / lifecycle |
| `probation-approval` | PS01 employee profile / master / directory / org / lifecycle |
| `probation-confirmation` | PS01 employee profile / master / directory / org / lifecycle |
| `probation-decision` | PS01 employee profile / master / directory / org / lifecycle |
| `probation-management` | PS01 employee profile / master / directory / org / lifecycle |

### PS02 personal-details change workflow (2)

*Rationale:* Governed self-service / HR-on-behalf change requests for sensitive fields — this module.

| Screen | Module |
|---|---|
| `edit-profile` | PS02 personal-details change workflow |
| `sensitive-changes` | PS02 personal-details change workflow |

### PS03 leave & attendance (33)

*Rationale:* Leave apply/approve/config, attendance, shifts, holidays, biometric/geofence — the PS03 enterprise module.

| Screen | Module |
|---|---|
| `apply-leave` | PS03 leave & attendance |
| `apply-optional-holiday` | PS03 leave & attendance |
| `attendance` | PS03 leave & attendance |
| `attendance-approvals` | PS03 leave & attendance |
| `attendance-config` | PS03 leave & attendance |
| `attendance-lock` | PS03 leave & attendance |
| `attendance-policies` | PS03 leave & attendance |
| `attendance-reasons` | PS03 leave & attendance |
| `attendance-shifts` | PS03 leave & attendance |
| `biometric-mgmt` | PS03 leave & attendance |
| `calendar` | PS03 leave & attendance |
| `checkin-approvals` | PS03 leave & attendance |
| `compoff-approvals` | PS03 leave & attendance |
| `dept-attendance` | PS03 leave & attendance |
| `dept-leave` | PS03 leave & attendance |
| `geofencing` | PS03 leave & attendance |
| `holiday-admin` | PS03 leave & attendance |
| `holiday-calendar` | PS03 leave & attendance |
| `holiday-calendar-config` | PS03 leave & attendance |
| `leave-balance-adjust` | PS03 leave & attendance |
| `leave-config` | PS03 leave & attendance |
| `leave-policies` | PS03 leave & attendance |
| `leave-reasons` | PS03 leave & attendance |
| `leave-revocation` | PS03 leave & attendance |
| `my-leave` | PS03 leave & attendance |
| `office-attendance` | PS03 leave & attendance |
| `pl-encashment` | PS03 leave & attendance |
| `request-ot` | PS03 leave & attendance |
| `request-regularisation` | PS03 leave & attendance |
| `team-attendance` | PS03 leave & attendance |
| `team-leave` | PS03 leave & attendance |
| `team-member-attendance-history` | PS03 leave & attendance |
| `team-member-leave-history` | PS03 leave & attendance |

### PS08 performance (goals / reviews / calibration / PIP) (31)

*Rationale:* Goal-setting, appraisal cycles, reviews, calibration, normalization and PIP — the PS08 enterprise module.

| Screen | Module |
|---|---|
| `add-goal` | PS08 performance (goals / reviews / calibration / PIP) |
| `add-goal-for-reportee` | PS08 performance (goals / reviews / calibration / PIP) |
| `admin-add-goal` | PS08 performance (goals / reviews / calibration / PIP) |
| `ai-suggest-goals` | PS08 performance (goals / reviews / calibration / PIP) |
| `appraisal-review` | PS08 performance (goals / reviews / calibration / PIP) |
| `calibration` | PS08 performance (goals / reviews / calibration / PIP) |
| `copy-previous-goal` | PS08 performance (goals / reviews / calibration / PIP) |
| `copy-previous-goal-mgr` | PS08 performance (goals / reviews / calibration / PIP) |
| `dept-performance` | PS08 performance (goals / reviews / calibration / PIP) |
| `goal-approvals` | PS08 performance (goals / reviews / calibration / PIP) |
| `manager-appraisal-tasks` | PS08 performance (goals / reviews / calibration / PIP) |
| `my-goals` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-assign-plan` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-calibration` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-cycle-create` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-cycle-detail` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-exclusions` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-goal-plan-create` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-goal-plan-detail` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-goal-plans` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-metrics` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-normalization` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-pip` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-review-cycles` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-review-status` | PS08 performance (goals / reviews / calibration / PIP) |
| `pa-scorecard-pillars` | PS08 performance (goals / reviews / calibration / PIP) |
| `pip-cases` | PS08 performance (goals / reviews / calibration / PIP) |
| `review-goal-plan` | PS08 performance (goals / reviews / calibration / PIP) |
| `reviews` | PS08 performance (goals / reviews / calibration / PIP) |
| `self-review` | PS08 performance (goals / reviews / calibration / PIP) |
| `start-review` | PS08 performance (goals / reviews / calibration / PIP) |

### PS13 documents / letters / policy library (20)

*Rationale:* Document admin (da-*), vault, uploads, letters, policy library and acknowledgements — PS13.

| Screen | Module |
|---|---|
| `da-ack-campaign` | PS13 documents / letters / policy library |
| `da-bulk-letters` | PS13 documents / letters / policy library |
| `da-categories` | PS13 documents / letters / policy library |
| `da-doc-master` | PS13 documents / letters / policy library |
| `da-letter-queue` | PS13 documents / letters / policy library |
| `da-merge-fields` | PS13 documents / letters / policy library |
| `da-policies` | PS13 documents / letters / policy library |
| `da-signoff-tracker` | PS13 documents / letters / policy library |
| `da-storage` | PS13 documents / letters / policy library |
| `da-templates` | PS13 documents / letters / policy library |
| `da-vault` | PS13 documents / letters / policy library |
| `da-versioning` | PS13 documents / letters / policy library |
| `document-clusters` | PS13 documents / letters / policy library |
| `document-upload` | PS13 documents / letters / policy library |
| `documents-oversight` | PS13 documents / letters / policy library |
| `letters` | PS13 documents / letters / policy library |
| `my-letters` | PS13 documents / letters / policy library |
| `policies` | PS13 documents / letters / policy library |
| `policy-ack` | PS13 documents / letters / policy library |
| `upload-document` | PS13 documents / letters / policy library |

### platform-core (9)

*Rationale:* Cross-cutting P01/X.2 inbox, tasks, notifications, dashboard, AI chat and settings shared by all enterprise modules.

| Screen | Module |
|---|---|
| `ai-policy-chat` | platform-core |
| `approvals` | platform-core |
| `bulk-upload` | platform-core |
| `dashboard` | platform-core |
| `escalations` | platform-core |
| `leadership-ai-chat` | platform-core |
| `notifications` | platform-core |
| `settings` | platform-core |
| `tasks` | platform-core |

### platform-core (P05/DPDPA) (2)

*Rationale:* Tamper-evident audit and DPDPA consent ledgers — platform-core.

| Screen | Module |
|---|---|
| `audit-log` | platform-core (P05/DPDPA) |
| `consent-history` | platform-core (P05/DPDPA) |

### platform-core (compliance) (1)

*Rationale:* Statutory POSH grievance/compliance reporting — enterprise statutory scope.

| Screen | Module |
|---|---|
| `report-posh` | platform-core (compliance) |

### platform-config (53)

*Rationale:* Tenant/module configuration (cfg-*, access-control): workflows, SLA, RBAC, masters, policies for enterprise modules.

| Screen | Module |
|---|---|
| `access-control` | platform-config |
| `cfg-approval-builder` | platform-config |
| `cfg-approval-flows` | platform-config |
| `cfg-assign` | platform-config |
| `cfg-att-platform` | platform-config |
| `cfg-att-policy` | platform-config |
| `cfg-blackout` | platform-config |
| `cfg-bu` | platform-config |
| `cfg-calibration` | platform-config |
| `cfg-classification` | platform-config |
| `cfg-compoff` | platform-config |
| `cfg-cross-entity` | platform-config |
| `cfg-custom` | platform-config |
| `cfg-decisionmatrix` | platform-config |
| `cfg-depts` | platform-config |
| `cfg-devices` | platform-config |
| `cfg-doc-templates` | platform-config |
| `cfg-document-settings` | platform-config |
| `cfg-duplicity` | platform-config |
| `cfg-entities` | platform-config |
| `cfg-form-builder` | platform-config |
| `cfg-forms` | platform-config |
| `cfg-geo` | platform-config |
| `cfg-geofence` | platform-config |
| `cfg-goal-templates` | platform-config |
| `cfg-grades` | platform-config |
| `cfg-grants` | platform-config |
| `cfg-holiday` | platform-config |
| `cfg-holiday-calendars` | platform-config |
| `cfg-infraction` | platform-config |
| `cfg-integrations` | platform-config |
| `cfg-ip` | platform-config |
| `cfg-leave-platform` | platform-config |
| `cfg-leave-policy` | platform-config |
| `cfg-letterheads` | platform-config |
| `cfg-nid` | platform-config |
| `cfg-notif` | platform-config |
| `cfg-pip` | platform-config |
| `cfg-rating` | platform-config |
| `cfg-rbac` | platform-config |
| `cfg-rbac-role` | platform-config |
| `cfg-review-templates` | platform-config |
| `cfg-shifts` | platform-config |
| `cfg-signers` | platform-config |
| `cfg-skip` | platform-config |
| `cfg-skip-edit` | platform-config |
| `cfg-sla` | platform-config |
| `cfg-sla-edit` | platform-config |
| `cfg-sso` | platform-config |
| `cfg-tenant` | platform-config |
| `cfg-weeklyoff` | platform-config |
| `cfg-workflow-builder` | platform-config |
| `cfg-workflows` | platform-config |

---

## Out of scope — commercial (113)

### Recruitment / TA (45)

*Rationale:* Requisitions, candidates, interviews, offers, recruiter/vendor and referral screens — commercial talent-acquisition, out of enterprise scope.

| Screen | Module |
|---|---|
| `candidate-profile` | Recruitment / TA |
| `candidates` | Recruitment / TA |
| `cfg-external-rec` | Recruitment / TA |
| `cfg-hiring-leads` | Recruitment / TA |
| `cfg-sources` | Recruitment / TA |
| `create-job` | Recruitment / TA |
| `external-recruiters` | Recruitment / TA |
| `generate-offer` | Recruitment / TA |
| `hiring-flow` | Recruitment / TA |
| `hiring-pipeline` | Recruitment / TA |
| `interview-detail` | Recruitment / TA |
| `interviews` | Recruitment / TA |
| `job-openings` | Recruitment / TA |
| `my-interviews` | Recruitment / TA |
| `my-referrals` | Recruitment / TA |
| `offer-letter` | Recruitment / TA |
| `offer-letters` | Recruitment / TA |
| `ra-add-candidate` | Recruitment / TA |
| `ra-candidates` | Recruitment / TA |
| `ra-document-review` | Recruitment / TA |
| `ra-document-review-detail` | Recruitment / TA |
| `ra-duplicity` | Recruitment / TA |
| `ra-external-recruiters` | Recruitment / TA |
| `ra-interviews` | Recruitment / TA |
| `ra-offer-preview` | Recruitment / TA |
| `ra-offer-queue` | Recruitment / TA |
| `ra-pipeline` | Recruitment / TA |
| `ra-portals` | Recruitment / TA |
| `ra-pre-offer-issue` | Recruitment / TA |
| `ra-pre-offer-queue` | Recruitment / TA |
| `ra-raise-requisition` | Recruitment / TA |
| `ra-recruiter-assignment` | Recruitment / TA |
| `ra-recruiter-reqs` | Recruitment / TA |
| `ra-recruiters` | Recruitment / TA |
| `ra-req-detail` | Recruitment / TA |
| `ra-requisitions` | Recruitment / TA |
| `ra-schedule-interview` | Recruitment / TA |
| `ra-sources` | Recruitment / TA |
| `ra-vendor-onboarding` | Recruitment / TA |
| `rec-overview` | Recruitment / TA |
| `recruiter-profile` | Recruitment / TA |
| `recruitment` | Recruitment / TA |
| `refer` | Recruitment / TA |
| `requisition-approval` | Recruitment / TA |
| `requisitions` | Recruitment / TA |

### Onboarding / pre-joining / BGV (12)

*Rationale:* Pre-joining, joining forms, onboarding workflows and background verification — commercial onboarding, out of scope.

| Screen | Module |
|---|---|
| `bgv` | Onboarding / pre-joining / BGV |
| `bgv-reports` | Onboarding / pre-joining / BGV |
| `bgv-upload` | Onboarding / pre-joining / BGV |
| `cfg-bgv-checklist` | Onboarding / pre-joining / BGV |
| `joining-form-detail` | Onboarding / pre-joining / BGV |
| `joining-forms-approval` | Onboarding / pre-joining / BGV |
| `onboarding-config` | Onboarding / pre-joining / BGV |
| `onboarding-form` | Onboarding / pre-joining / BGV |
| `onboarding-initiate` | Onboarding / pre-joining / BGV |
| `onboarding-oversight` | Onboarding / pre-joining / BGV |
| `onboarding-workflow-forms` | Onboarding / pre-joining / BGV |
| `pre-joining` | Onboarding / pre-joining / BGV |

### Separation / exit / FnF / clearance (18)

*Rationale:* Separation stages, exit interview, absconding, force-separation, FnF and clearance — commercial separation, out of scope.

| Screen | Module |
|---|---|
| `absconding` | Separation / exit / FnF / clearance |
| `cfg-exit-interview-form` | Separation / exit / FnF / clearance |
| `cfg-separation-checklist` | Separation / exit / FnF / clearance |
| `cfg-separation-policy` | Separation / exit / FnF / clearance |
| `cfg-separation-workflow` | Separation / exit / FnF / clearance |
| `clearance-attendance` | Separation / exit / FnF / clearance |
| `clearance-compliance` | Separation / exit / FnF / clearance |
| `clearance-facilities` | Separation / exit / FnF / clearance |
| `clearance-it-assets` | Separation / exit / FnF / clearance |
| `clearance-leave` | Separation / exit / FnF / clearance |
| `exit-interview` | Separation / exit / FnF / clearance |
| `fnf-clearance` | Separation / exit / FnF / clearance |
| `fnf-clearance-hub` | Separation / exit / FnF / clearance |
| `force-separation` | Separation / exit / FnF / clearance |
| `initiate-separation` | Separation / exit / FnF / clearance |
| `separation-finalise` | Separation / exit / FnF / clearance |
| `separation-stage1` | Separation / exit / FnF / clearance |
| `separation-stage2` | Separation / exit / FnF / clearance |

### IT assets & Service Desk (21)

*Rationale:* IT/office asset lifecycle, CMDB, service desk tickets, catalog, knowledge base and visitor mgmt — commercial ITSM, out of scope.

| Screen | Module |
|---|---|
| `cfg-catalog-items` | IT assets & Service Desk |
| `cfg-kb-articles` | IT assets & Service Desk |
| `cfg-sd-config` | IT assets & Service Desk |
| `it-asset-assignment` | IT assets & Service Desk |
| `it-asset-master` | IT assets & Service Desk |
| `it-asset-requests` | IT assets & Service Desk |
| `it-cmdb` | IT assets & Service Desk |
| `it-masters` | IT assets & Service Desk |
| `it-postmortems` | IT assets & Service Desk |
| `kb-article` | IT assets & Service Desk |
| `knowledge-base` | IT assets & Service Desk |
| `my-assets` | IT assets & Service Desk |
| `my-tickets` | IT assets & Service Desk |
| `office-assets` | IT assets & Service Desk |
| `raise-ticket` | IT assets & Service Desk |
| `sd-queue` | IT assets & Service Desk |
| `sd-ticket-work` | IT assets & Service Desk |
| `service-catalog` | IT assets & Service Desk |
| `team-assets` | IT assets & Service Desk |
| `ticket-detail` | IT assets & Service Desk |
| `visitor-mgmt` | IT assets & Service Desk |

### Platform Super-Admin (13)

*Rationale:* psa-* tenant provisioning, licensing, releases, migration and platform monitoring — vendor super-admin, out of scope.

| Screen | Module |
|---|---|
| `psa-analytics` | Platform Super-Admin |
| `psa-environments` | Platform Super-Admin |
| `psa-feature-flags` | Platform Super-Admin |
| `psa-licenses` | Platform Super-Admin |
| `psa-master-data` | Platform Super-Admin |
| `psa-migration` | Platform Super-Admin |
| `psa-migration-detail` | Platform Super-Admin |
| `psa-monitoring` | Platform Super-Admin |
| `psa-provisioning` | Platform Super-Admin |
| `psa-releases` | Platform Super-Admin |
| `psa-security` | Platform Super-Admin |
| `psa-tenant-detail` | Platform Super-Admin |
| `psa-tenants` | Platform Super-Admin |

### PS10 Payroll (4)

*Rationale:* Payroll export, TDS, PF/UAN and reimbursements — PS10 payroll, treated as commercial/out of enterprise scope here.

| Screen | Module |
|---|---|
| `payroll-export` | PS10 Payroll |
| `pf-uan` | PS10 Payroll |
| `reimbursements` | PS10 Payroll |
| `tds-tax` | PS10 Payroll |
