import { AuditService } from "../../platform/audit/auditService";
import { AuthorizationService } from "../../platform/authorization/authorizationService";
import { ActorContext, FoundationError, TenantScope, nextId, requireTenantScope } from "../../platform/types";
import { ConfigRecord, ConfigRegistryKey, InMemoryOrgConfigRepository, OrgConfigRepository } from "./orgConfigRepository";

/**
 * W1 — Org-Admin configuration service.
 *
 * One service over every configuration registry. A registry is declared, not coded: its
 * descriptor names the permission family, the attributes it accepts, and whether it is
 * hierarchical. Adding a W1 screen is therefore a descriptor entry plus a route — which is the
 * property the full-coverage plan needs, with 226 screens ahead.
 *
 * Invariants held here rather than per-registry:
 *   - tenant scoping on every read and write (CLAUDE.md: multi-tenancy is mandatory)
 *   - business-key uniqueness per (tenant, registry)
 *   - optimistic concurrency via version
 *   - cycle rejection for hierarchical registries (VAL-ORG-NOCYCLE in the data model)
 *   - P05 audit on every mutation
 *   - platform 8-code errors only
 */

export interface AttributeSpec {
  key: string;
  label: string;
  type: "text" | "number" | "boolean";
  required?: boolean;
}

export interface RegistryDescriptor {
  key: ConfigRegistryKey;
  label: string;
  /** Permission family prefix; read is `${permissionPrefix}.read`, write `${permissionPrefix}.write`. */
  permissionPrefix: string;
  /** Prototype screen id this registry backs — the parity trace. */
  screenId: string;
  /** Underlying table in the canonical data model; this service administers it, never invents it. */
  table: string;
  hierarchical?: boolean;
  attributes: AttributeSpec[];
}

export const CONFIG_REGISTRIES: readonly RegistryDescriptor[] = [
  {
    key: "org-units",
    label: "Departments and org units",
    permissionPrefix: "cfg.orgunit",
    screenId: "cfg-depts",
    table: "org_units",
    hierarchical: true,
    attributes: [
      { key: "orgUnitType", label: "Type", type: "text", required: true },
      { key: "businessUnitCode", label: "Business unit code", type: "text" },
      { key: "costCentreCode", label: "Cost centre", type: "text" },
      { key: "headEmployeeId", label: "Head", type: "text" },
    ],
  },
  {
    key: "grades",
    label: "Grades",
    permissionPrefix: "cfg.grade",
    screenId: "cfg-grades",
    table: "grades",
    attributes: [
      { key: "levelOrder", label: "Seniority order", type: "number", required: true },
      { key: "payBand", label: "Pay band", type: "text" },
      { key: "bandCode", label: "Band code", type: "text" },
    ],
  },
  {
    key: "designations",
    label: "Designations",
    permissionPrefix: "cfg.designation",
    screenId: "cfg-assign",
    table: "designations",
    attributes: [
      { key: "gradeCode", label: "Grade", type: "text" },
      { key: "cadreCode", label: "Cadre", type: "text" },
      { key: "effectiveFrom", label: "Effective from", type: "text" },
    ],
  },
  {
    key: "locations",
    label: "Locations and geography",
    permissionPrefix: "cfg.location",
    screenId: "cfg-geo",
    table: "locations",
    attributes: [
      { key: "city", label: "City", type: "text" },
      { key: "state", label: "State", type: "text" },
      { key: "country", label: "Country", type: "text" },
      { key: "pincode", label: "Pincode", type: "text" },
    ],
  },
  {
    key: "entities",
    label: "Legal entities",
    permissionPrefix: "cfg.entity",
    screenId: "cfg-entities",
    table: "entities",
    attributes: [{ key: "registeredName", label: "Registered name", type: "text" }],
  },
  {
    key: "classifications",
    label: "Employee classifications",
    permissionPrefix: "cfg.classification",
    screenId: "cfg-classification",
    table: "org_units",
    attributes: [{ key: "category", label: "Category", type: "text", required: true }],
  },
  {
    key: "custom-fields",
    label: "Custom fields",
    permissionPrefix: "cfg.customfield",
    screenId: "cfg-custom",
    table: "custom_field_definitions",
    attributes: [
      { key: "dataType", label: "Data type", type: "text", required: true },
      { key: "appliesTo", label: "Applies to", type: "text", required: true },
    ],
  },
  {
    key: "rbac-roles",
    label: "Roles",
    permissionPrefix: "cfg.role",
    screenId: "cfg-rbac",
    table: "roles",
    attributes: [{ key: "scope", label: "Scope", type: "text", required: true }],
  },
  {
    key: "permission-grants",
    label: "Permission grants",
    permissionPrefix: "cfg.grant",
    screenId: "cfg-grants",
    table: "role_permissions",
    attributes: [
      { key: "roleCode", label: "Role", type: "text", required: true },
      { key: "permissionCode", label: "Permission", type: "text", required: true },
    ],
  },
  {
    key: "geofences",
    label: "Geofences",
    permissionPrefix: "cfg.geofence",
    screenId: "cfg-geofence",
    table: "geofences",
    attributes: [
      { key: "centreLat", label: "Centre latitude", type: "number", required: true },
      { key: "centreLng", label: "Centre longitude", type: "number", required: true },
      { key: "radiusMetres", label: "Radius (m)", type: "number", required: true },
    ],
  },
  {
    key: "national-id-types",
    label: "National ID types",
    permissionPrefix: "cfg.nid",
    screenId: "cfg-nid",
    table: "national_id_types",
    attributes: [{ key: "validationPattern", label: "Validation pattern", type: "text" }],
  },
  {
    key: "document-categories",
    label: "Document categories",
    permissionPrefix: "cfg.doccategory",
    screenId: "da-categories",
    table: "document_categories",
    attributes: [{ key: "classification", label: "Default classification", type: "text", required: true }],
  },
  // W1 Gap A — unblocked by migration 0035_w1_config_master_data.sql.
  {
    key: "business-units", label: "Business units", permissionPrefix: "cfg.businessunit",
    screenId: "cfg-bu", table: "business_units",
    attributes: [
      { key: "headEmployeeId", label: "Head", type: "text" },
      { key: "costCentreCode", label: "Cost centre", type: "text" },
    ],
  },
  {
    key: "devices", label: "Devices", permissionPrefix: "cfg.device",
    screenId: "cfg-devices", table: "devices",
    attributes: [
      { key: "deviceType", label: "Type", type: "text", required: true },
      { key: "serialNumber", label: "Serial number", type: "text" },
      { key: "locationCode", label: "Location", type: "text" },
    ],
  },
  {
    key: "ip-allowlist", label: "IP allowlist", permissionPrefix: "cfg.ip",
    screenId: "cfg-ip", table: "ip_allowlist",
    attributes: [
      { key: "cidrBlock", label: "CIDR block", type: "text", required: true },
      { key: "appliesTo", label: "Applies to", type: "text", required: true },
    ],
  },
  {
    key: "tenant-settings", label: "Tenant settings", permissionPrefix: "cfg.tenant",
    screenId: "cfg-tenant", table: "tenant_settings",
    attributes: [
      { key: "settingValue", label: "Value", type: "text" },
      { key: "valueType", label: "Value type", type: "text", required: true },
    ],
  },
  {
    key: "integrations", label: "Integrations", permissionPrefix: "cfg.integration",
    screenId: "cfg-integrations", table: "integrations",
    attributes: [
      { key: "provider", label: "Provider", type: "text", required: true },
      { key: "endpointUrl", label: "Endpoint", type: "text" },
      // Deliberately a reference, never the secret itself — the vault holds the material.
      { key: "credentialRef", label: "Credential reference", type: "text" },
    ],
  },
  {
    key: "sso-providers", label: "SSO providers", permissionPrefix: "cfg.sso",
    screenId: "cfg-sso", table: "sso_providers",
    attributes: [
      { key: "protocol", label: "Protocol", type: "text", required: true },
      { key: "issuerUrl", label: "Issuer URL", type: "text" },
      { key: "credentialRef", label: "Credential reference", type: "text" },
    ],
  },
  {
    key: "service-catalog", label: "Service catalog", permissionPrefix: "cfg.catalog",
    screenId: "cfg-catalog-items", table: "service_catalog_items",
    attributes: [
      { key: "category", label: "Category", type: "text", required: true },
      { key: "slaHours", label: "SLA (hours)", type: "number" },
      { key: "ownerGroup", label: "Owner group", type: "text" },
    ],
  },
  {
    key: "kb-articles", label: "Knowledge base", permissionPrefix: "cfg.kb",
    screenId: "cfg-kb-articles", table: "kb_articles",
    attributes: [
      { key: "category", label: "Category", type: "text" },
      { key: "reviewStatus", label: "Review status", type: "text", required: true },
    ],
  },
  {
    key: "separation-policies", label: "Separation policies", permissionPrefix: "cfg.separationpolicy",
    screenId: "cfg-separation-policy", table: "separation_policies",
    attributes: [
      { key: "noticePeriodDays", label: "Notice period (days)", type: "number", required: true },
      { key: "appliesToGrade", label: "Applies to grade", type: "text" },
    ],
  },
  {
    key: "separation-workflows", label: "Separation workflows", permissionPrefix: "cfg.separationworkflow",
    screenId: "cfg-separation-workflow", table: "separation_workflows",
    attributes: [
      // Binds to a P01 definition; separation never gets its own workflow engine.
      { key: "p01WorkflowCode", label: "P01 workflow", type: "text", required: true },
      { key: "separationType", label: "Separation type", type: "text", required: true },
    ],
  },
  // W2 — Attendance and leave administration. Every table below ALREADY EXISTS in
  // docs/data-model/03-PS03-attendance-leave.sql or 00-platform-core.sql, so these screens are
  // covered with no new schema and no inferred specification (FS_M04_Leave / FS_M05_Attendance).
  {
    key: "shifts", label: "Shifts", permissionPrefix: "cfg.shift",
    screenId: "cfg-shifts", table: "shifts",
    attributes: [
      { key: "startTime", label: "Start time", type: "text", required: true },
      { key: "endTime", label: "End time", type: "text", required: true },
      { key: "graceMinutes", label: "Grace (minutes)", type: "number" },
    ],
  },
  {
    key: "weekly-off-patterns", label: "Weekly-off patterns", permissionPrefix: "cfg.weeklyoff",
    screenId: "cfg-weeklyoff", table: "weekly_off_patterns",
    attributes: [{ key: "pattern", label: "Pattern", type: "text", required: true }],
  },
  {
    key: "holiday-calendars", label: "Holiday calendars", permissionPrefix: "cfg.holidaycalendar",
    screenId: "cfg-holiday-calendars", table: "holiday_calendars",
    attributes: [{ key: "calendarYear", label: "Year", type: "number", required: true }],
  },
  {
    key: "leave-accrual-policies", label: "Leave policies", permissionPrefix: "cfg.leavepolicy",
    screenId: "cfg-leave-policy", table: "leave_accrual_policies",
    attributes: [
      { key: "frequency", label: "Accrual frequency", type: "text", required: true },
      { key: "unitsPerPeriod", label: "Units per period", type: "number", required: true },
    ],
  },
  {
    key: "leave-types", label: "Leave types", permissionPrefix: "cfg.leavetype",
    screenId: "leave-config", table: "leave_types",
    attributes: [
      { key: "countsHolidays", label: "Counts holidays", type: "boolean", required: true },
      { key: "openingBalance", label: "Opening balance", type: "number" },
      { key: "entitlementCapDays", label: "Entitlement cap (days)", type: "number" },
    ],
  },
  {
    key: "attendance-reasons", label: "Attendance reasons", permissionPrefix: "cfg.attendancereason",
    screenId: "attendance-reasons", table: "attendance_reasons",
    attributes: [{ key: "appliesTo", label: "Applies to", type: "text", required: true }],
  },
  {
    key: "leave-reasons", label: "Leave reasons", permissionPrefix: "cfg.leavereason",
    screenId: "leave-reasons", table: "leave_reasons",
    attributes: [{ key: "leaveTypeCode", label: "Leave type", type: "text" }],
  },
  {
    key: "attendance-policies", label: "Attendance policies", permissionPrefix: "cfg.attendancepolicy",
    screenId: "attendance-policies", table: "attendance_policies",
    attributes: [
      { key: "backdateWindowDays", label: "Backdate window (days)", type: "number", required: true },
      { key: "regularisationCapPerPeriod", label: "Regularisation cap", type: "number", required: true },
      { key: "halfDayUnderMinutes", label: "Half-day under (minutes)", type: "number" },
    ],
  },
  // W2 Gap A — unblocked by 0036. Columns trace to the DwnB field exports, not to screenshots.
  {
    key: "comp-off-rules", label: "Comp-off rules", permissionPrefix: "cfg.compoff",
    screenId: "cfg-compoff", table: "comp_off_rules",
    attributes: [
      { key: "calculationFrequency", label: "Calculation frequency", type: "text", required: true },
      { key: "overtimePolicyCode", label: "Overtime policy", type: "text" },
      { key: "isHourlyLeave", label: "Hourly leave", type: "boolean" },
      { key: "minDurationMinutes", label: "Min duration (minutes)", type: "number" },
    ],
  },
  {
    key: "blackout-periods", label: "Blackout periods", permissionPrefix: "cfg.blackout",
    screenId: "cfg-blackout", table: "blackout_periods",
    attributes: [
      { key: "leaveTypeCode", label: "Leave type", type: "text" },
      { key: "frequency", label: "Frequency", type: "text" },
      { key: "allowPastDates", label: "Allow past dates", type: "boolean" },
    ],
  },
  {
    key: "decision-matrix", label: "Approval decision matrix", permissionPrefix: "cfg.decisionmatrix",
    screenId: "cfg-decisionmatrix", table: "decision_matrix",
    attributes: [
      { key: "requestType", label: "Request type", type: "text", required: true },
      { key: "p01WorkflowCode", label: "P01 workflow", type: "text", required: true },
      { key: "tierOrder", label: "Tier", type: "number", required: true },
      { key: "approverRule", label: "Approver rule", type: "text", required: true },
    ],
  },
  // W3 Gap A (configuration only) — unblocked by 0037. Columns trace to DwnB/Recruitment exports.
  // The transactional ATS core is deliberately NOT modelled here; see the 0037 header.
  {
    key: "external-recruiters", label: "External recruiters", permissionPrefix: "cfg.recruiter",
    screenId: "ra-external-recruiters", table: "external_recruiters",
    attributes: [
      { key: "email", label: "Email", type: "text", required: true },
      { key: "recruiterStatus", label: "Status", type: "text", required: true },
      { key: "contractFrom", label: "Contract from", type: "text" },
      { key: "contractTo", label: "Contract to", type: "text" },
    ],
  },
  {
    key: "job-portals", label: "Job portals", permissionPrefix: "cfg.jobportal",
    screenId: "ra-portals", table: "job_portals", attributes: [],
  },
  {
    key: "interview-types", label: "Interview types", permissionPrefix: "cfg.interviewtype",
    screenId: "ra-recruiters", table: "interview_types", attributes: [],
  },
  {
    key: "interview-guides", label: "Interview guides", permissionPrefix: "cfg.interviewguide",
    screenId: "ra-schedule-interview", table: "interview_guides",
    attributes: [{ key: "guidelines", label: "Guidelines", type: "text" }],
  },
  {
    key: "duplicity-settings", label: "Duplicity check settings", permissionPrefix: "cfg.duplicity",
    screenId: "ra-duplicity", table: "duplicity_check_settings",
    attributes: [{ key: "compareFields", label: "Compare fields", type: "text" }],
  },
  {
    key: "hiring-leads", label: "Hiring lead assignment", permissionPrefix: "cfg.hiringlead",
    screenId: "ra-recruiter-assignment", table: "hiring_leads",
    attributes: [
      { key: "assignmentType", label: "Assignment type", type: "text", required: true },
      { key: "applicableTo", label: "Applicable to", type: "text" },
    ],
  },
];

const REGISTRY_BY_KEY = new Map<ConfigRegistryKey, RegistryDescriptor>(CONFIG_REGISTRIES.map((r) => [r.key, r]));

export interface ConfigUpsertInput {
  code: string;
  name: string;
  isActive?: boolean;
  parentId?: string;
  attributes?: Record<string, string | number | boolean | undefined>;
  /** Required on update; rejected when it does not match the stored version. */
  expectedVersion?: number;
}

export class OrgConfigService {
  constructor(
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditService,
    private readonly repository: OrgConfigRepository = new InMemoryOrgConfigRepository()
  ) {}

  listRegistries(): readonly RegistryDescriptor[] {
    return CONFIG_REGISTRIES;
  }

  list(actor: ActorContext, registry: ConfigRegistryKey): ConfigRecord[] {
    const descriptor = this.requireRegistry(registry);
    this.authorization.check(actor, `${descriptor.permissionPrefix}.read`, actor);
    requireTenantScope(actor);
    return this.repository.list(actor, registry);
  }

  get(actor: ActorContext, registry: ConfigRegistryKey, id: string): ConfigRecord {
    const descriptor = this.requireRegistry(registry);
    this.authorization.check(actor, `${descriptor.permissionPrefix}.read`, actor);
    return this.requireRecord(actor, registry, id);
  }

  create(actor: ActorContext, registry: ConfigRegistryKey, input: ConfigUpsertInput): ConfigRecord {
    const descriptor = this.requireRegistry(registry);
    this.authorization.check(actor, `${descriptor.permissionPrefix}.write`, actor);
    requireTenantScope(actor);
    this.assertCode(input.code);
    if (this.repository.findByCode(actor, registry, input.code)) {
      throw new FoundationError("CONFLICT", `${descriptor.label} code already exists`, {
        field: "code",
        details: { messageId: "ERR-CFG-DUPLICATE-CODE", registry, code: input.code },
      });
    }
    const attributes = this.validateAttributes(descriptor, input.attributes ?? {});
    if (input.parentId) this.assertParent(actor, descriptor, registry, input.parentId, undefined);

    const record: ConfigRecord = {
      id: nextId(`cfg-${registry}`, this.repository.count()),
      tenantId: actor.tenantId,
      entityId: actor.entityId,
      registry,
      code: input.code.trim(),
      name: input.name.trim(),
      isActive: input.isActive ?? true,
      attributes,
      parentId: input.parentId,
      version: 1,
      updatedAt: new Date().toISOString(),
    };
    this.repository.save(record);
    this.audit.recordMutation(actor, {
      action: "CFG_REGISTRY_CREATE",
      subjectRef: `${descriptor.table}:${record.id}`,
      metadata: { registry, code: record.code },
    });
    return { ...record, attributes: { ...record.attributes } };
  }

  update(actor: ActorContext, registry: ConfigRegistryKey, id: string, input: ConfigUpsertInput): ConfigRecord {
    const descriptor = this.requireRegistry(registry);
    this.authorization.check(actor, `${descriptor.permissionPrefix}.write`, actor);
    const record = this.requireRecord(actor, registry, id);
    if (input.expectedVersion !== undefined && input.expectedVersion !== record.version) {
      throw new FoundationError("OPTIMISTIC_LOCK_CONFLICT", "Configuration was changed by someone else", {
        details: { messageId: "ERR-CFG-STALE-VERSION", expected: input.expectedVersion, actual: record.version },
      });
    }
    this.assertCode(input.code);
    const clash = this.repository.findByCode(actor, registry, input.code);
    if (clash && clash.id !== record.id) {
      throw new FoundationError("CONFLICT", `${descriptor.label} code already exists`, {
        field: "code",
        details: { messageId: "ERR-CFG-DUPLICATE-CODE", registry, code: input.code },
      });
    }
    if (input.parentId) this.assertParent(actor, descriptor, registry, input.parentId, record.id);

    record.code = input.code.trim();
    record.name = input.name.trim();
    record.isActive = input.isActive ?? record.isActive;
    record.parentId = input.parentId;
    record.attributes = this.validateAttributes(descriptor, input.attributes ?? record.attributes);
    record.version += 1;
    record.updatedAt = new Date().toISOString();
    this.repository.save(record);
    this.audit.recordMutation(actor, {
      action: "CFG_REGISTRY_UPDATE",
      subjectRef: `${descriptor.table}:${record.id}`,
      metadata: { registry, code: record.code, version: record.version },
    });
    return { ...record, attributes: { ...record.attributes } };
  }

  /**
   * Configuration is never hard-deleted — deactivation preserves the history that downstream
   * modules reference (an employee posted to a retired org unit must still resolve it).
   */
  deactivate(actor: ActorContext, registry: ConfigRegistryKey, id: string): ConfigRecord {
    const descriptor = this.requireRegistry(registry);
    this.authorization.check(actor, `${descriptor.permissionPrefix}.write`, actor);
    const record = this.requireRecord(actor, registry, id);
    const children = this.repository.list(actor, registry).filter((r) => r.parentId === record.id && r.isActive);
    if (children.length > 0) {
      throw new FoundationError("PRECONDITION_FAILED", "Deactivate the child entries first", {
        details: { messageId: "ERR-CFG-HAS-ACTIVE-CHILDREN", children: children.length },
      });
    }
    record.isActive = false;
    record.version += 1;
    record.updatedAt = new Date().toISOString();
    this.repository.save(record);
    this.audit.recordMutation(actor, {
      action: "CFG_REGISTRY_DEACTIVATE",
      subjectRef: `${descriptor.table}:${record.id}`,
      metadata: { registry, code: record.code },
    });
    return { ...record, attributes: { ...record.attributes } };
  }

  private requireRegistry(registry: ConfigRegistryKey): RegistryDescriptor {
    const descriptor = REGISTRY_BY_KEY.get(registry);
    if (!descriptor) {
      throw new FoundationError("NOT_FOUND", "Unknown configuration registry", { field: "registry" });
    }
    return descriptor;
  }

  private requireRecord(scope: TenantScope, registry: ConfigRegistryKey, id: string): ConfigRecord {
    const record = this.repository.findById(scope, id);
    if (!record || record.registry !== registry) {
      throw new FoundationError("NOT_FOUND", "Configuration entry not found");
    }
    return record;
  }

  private assertCode(code: string): void {
    if (!code || !code.trim()) {
      throw new FoundationError("VALIDATION_FAILED", "Code is required", { field: "code" });
    }
  }

  private validateAttributes(
    descriptor: RegistryDescriptor,
    supplied: Record<string, string | number | boolean | undefined>
  ): Record<string, string | number | boolean | undefined> {
    const accepted: Record<string, string | number | boolean | undefined> = {};
    for (const spec of descriptor.attributes) {
      const value = supplied[spec.key];
      if (value === undefined || value === "") {
        if (spec.required) {
          throw new FoundationError("VALIDATION_FAILED", `${spec.label} is required`, { field: spec.key });
        }
        continue;
      }
      if (spec.type === "number" && typeof value !== "number") {
        throw new FoundationError("VALIDATION_FAILED", `${spec.label} must be a number`, { field: spec.key });
      }
      if (spec.type === "boolean" && typeof value !== "boolean") {
        throw new FoundationError("VALIDATION_FAILED", `${spec.label} must be true or false`, { field: spec.key });
      }
      accepted[spec.key] = value;
    }
    // Unknown attributes are dropped rather than stored: the descriptor is the contract, and
    // silently persisting undeclared keys would let a screen invent schema.
    return accepted;
  }

  /** VAL-ORG-NOCYCLE — a parent chain may never revisit the record being edited. */
  private assertParent(
    scope: TenantScope,
    descriptor: RegistryDescriptor,
    registry: ConfigRegistryKey,
    parentId: string,
    selfId: string | undefined
  ): void {
    if (!descriptor.hierarchical) {
      throw new FoundationError("VALIDATION_FAILED", `${descriptor.label} is not hierarchical`, { field: "parentId" });
    }
    if (selfId && parentId === selfId) {
      throw new FoundationError("VALIDATION_FAILED", "An entry cannot be its own parent", { field: "parentId" });
    }
    let cursor = this.repository.findById(scope, parentId);
    if (!cursor || cursor.registry !== registry) {
      throw new FoundationError("NOT_FOUND", "Parent entry not found", { field: "parentId" });
    }
    const seen = new Set<string>([parentId]);
    while (cursor?.parentId) {
      if (selfId && cursor.parentId === selfId) {
        throw new FoundationError("VALIDATION_FAILED", "Parent chain would form a cycle", {
          field: "parentId",
          details: { messageId: "VAL-ORG-NOCYCLE" },
        });
      }
      if (seen.has(cursor.parentId)) break;
      seen.add(cursor.parentId);
      cursor = this.repository.findById(scope, cursor.parentId);
    }
  }
}
