import { TenantScope, inScope } from "../../platform/types";

/**
 * W1 — Org-Admin configuration registries.
 *
 * The prototype's 27 W1 screens are, with two exceptions, the same shape: a tenant-scoped list of
 * configuration records with a business key, a name, an active flag and a handful of registry-
 * specific attributes. Building 27 bespoke services would duplicate the same scoping, audit and
 * validation 27 times, so this repository holds one generic record type and the service layer
 * distinguishes registries by key.
 *
 * The registries administer master data that ALREADY EXISTS in the data model and migrations —
 * org_units, grades, designations, locations, entities — rather than inventing schema. The
 * `attributes` bag carries the registry-specific columns; each registry's descriptor declares
 * which attributes it expects, so the shape stays checkable without a table per registry.
 */

/** The registry keys W1 administers. Each maps to a prototype screen id. */
export type ConfigRegistryKey =
  | "org-units"
  | "grades"
  | "designations"
  | "locations"
  | "entities"
  | "classifications"
  | "custom-fields"
  | "rbac-roles"
  | "permission-grants"
  | "geofences"
  | "national-id-types"
  | "document-categories"
  | "business-units"
  | "devices"
  | "ip-allowlist"
  | "tenant-settings"
  | "integrations"
  | "sso-providers"
  | "service-catalog"
  | "kb-articles"
  | "separation-policies"
  | "separation-workflows"
  | "shifts"
  | "weekly-off-patterns"
  | "holiday-calendars"
  | "leave-accrual-policies"
  | "leave-types"
  | "attendance-reasons"
  | "leave-reasons"
  | "attendance-policies"
  | "comp-off-rules"
  | "blackout-periods"
  | "decision-matrix";

export interface ConfigRecord {
  id: string;
  tenantId: string;
  entityId?: string;
  registry: ConfigRegistryKey;
  /** Business key, unique per (tenant, registry) — e.g. org_unit_code, grade_code. */
  code: string;
  name: string;
  isActive: boolean;
  /** Registry-specific columns, validated against the registry descriptor. */
  attributes: Record<string, string | number | boolean | undefined>;
  /** Self-reference for hierarchical registries (org units); must not form a cycle. */
  parentId?: string;
  version: number;
  updatedAt: string;
}

export interface OrgConfigRepository {
  list(scope: TenantScope, registry: ConfigRegistryKey): ConfigRecord[];
  findById(scope: TenantScope, id: string): ConfigRecord | undefined;
  findByCode(scope: TenantScope, registry: ConfigRegistryKey, code: string): ConfigRecord | undefined;
  save(record: ConfigRecord): void;
  count(): number;
}

export class InMemoryOrgConfigRepository implements OrgConfigRepository {
  private readonly records: ConfigRecord[] = [];

  list(scope: TenantScope, registry: ConfigRegistryKey): ConfigRecord[] {
    return this.records
      .filter((r) => r.registry === registry && inScope(r, scope))
      .map((r) => ({ ...r, attributes: { ...r.attributes } }));
  }

  findById(scope: TenantScope, id: string): ConfigRecord | undefined {
    return this.records.find((r) => r.id === id && inScope(r, scope));
  }

  findByCode(scope: TenantScope, registry: ConfigRegistryKey, code: string): ConfigRecord | undefined {
    return this.records.find(
      (r) => r.registry === registry && r.code.toUpperCase() === code.toUpperCase() && inScope(r, scope)
    );
  }

  save(record: ConfigRecord): void {
    const index = this.records.findIndex((r) => r.id === record.id);
    if (index < 0) this.records.push(record);
    else this.records[index] = record;
  }

  count(): number {
    return this.records.length;
  }
}
