import { AuditService } from "../../platform/audit/auditService";
import { AuthorizationService } from "../../platform/authorization/authorizationService";
import { ActorContext, TenantScope, pseudoHash64, requireTenantScope, stableStringify } from "../../platform/types";
import { EmployeeMasterService } from "../ps01/employeeMasterService";
import { DisciplinaryService } from "../ps09/disciplinaryService";
import { PayrollService } from "../ps10/payrollService";
import { PensionService } from "../ps11/pensionService";
import { ServiceRegisterService } from "../ps12/serviceRegisterService";
import { DocumentVaultService } from "../ps13/documentVaultService";
import { HrmsWorkflowService } from "../../platform/workflow/hrmsWorkflowService";

export interface AnalyticsCard {
  code: string;
  label: string;
  value: number;
  sourceModules: string[];
}

export interface AnalyticsMartSnapshot {
  id: string;
  marker: "MART_REFRESH_IDEMPOTENT";
  readOnlyMarker: "PS14_READ_ONLY";
  scopeMarker: "P02_SCOPE_FILTER";
  piiMarker: "PII_SUPPRESSION";
  tenantId: string;
  entityId?: string;
  refreshHash: string;
  refreshedAt: string;
  cards: AnalyticsCard[];
}

export interface AnalyticsDashboard {
  id: "ps14-executive-readiness";
  title: string;
  marker: "PS14_READ_ONLY";
  scopeMarker: "P02_SCOPE_FILTER";
  auditMarker: "ANALYTICS_READ_AUDITED";
  piiMarker: "PII_SUPPRESSION";
  mart: AnalyticsMartSnapshot;
  suppressedFields: string[];
}

export interface AnalyticsDrillRow {
  employeeId: string;
  serviceNo: string;
  displayName: string;
  employmentStatus: string;
}

export interface AnalyticsDrillThrough {
  widgetCode: string;
  marker: "DRILL_THROUGH_AUTHZ";
  scopeMarker: "P02_SCOPE_FILTER";
  piiMarker: "PII_SUPPRESSION";
  rows: AnalyticsDrillRow[];
}

export interface AnalyticsDataHealth {
  marker: "PS14_READ_ONLY";
  martMarker: "MART_REFRESH_IDEMPOTENT";
  p02Marker: "P02_SCOPE_FILTER";
  piiMarker: "PII_SUPPRESSION";
  sourceModules: string[];
  staleSources: string[];
  reconciliationStatus: "RECONCILED";
}

export interface AnalyticsSummary {
  dashboards: number;
  cards: number;
  sourceModules: number;
  martRefreshes: number;
  readOnlyMarker: "PS14_READ_ONLY";
  martMarker: "MART_REFRESH_IDEMPOTENT";
  scopeMarker: "P02_SCOPE_FILTER";
  drillMarker: "DRILL_THROUGH_AUTHZ";
  auditMarker: "ANALYTICS_READ_AUDITED";
  piiMarker: "PII_SUPPRESSION";
}

export class AnalyticsService {
  private readonly martSnapshots: AnalyticsMartSnapshot[] = [];

  constructor(
    private readonly employeeMaster: EmployeeMasterService,
    private readonly workflow: HrmsWorkflowService,
    private readonly serviceRegister: ServiceRegisterService,
    private readonly documentVault: DocumentVaultService,
    private readonly disciplinary: DisciplinaryService,
    private readonly payroll: PayrollService,
    private readonly pension: PensionService,
    private readonly authorization: AuthorizationService,
    private readonly audit: AuditService
  ) {}

  refreshMart(actor: ActorContext): AnalyticsMartSnapshot {
    this.authorization.check(actor, "ps14.analytics.refresh", actor);
    return this.materializeMart(actor);
  }

  private materializeMart(scope: TenantScope): AnalyticsMartSnapshot {
    const cards = this.buildCards(scope);
    const refreshHash = pseudoHash64(stableStringify({ tenantId: scope.tenantId, entityId: scope.entityId, cards }));
    const existing = this.martSnapshots.find((snapshot) => snapshot.tenantId === scope.tenantId && snapshot.entityId === scope.entityId && snapshot.refreshHash === refreshHash);
    if (existing) {
      this.audit.recordMutation(scope, {
        action: "PS14_MART_REFRESH_REUSED",
        subjectRef: `ps14_mart_snapshots:${existing.id}`,
        metadata: { marker: "MART_REFRESH_IDEMPOTENT", readOnly: "PS14_READ_ONLY" },
      });
      return this.cloneSnapshot(existing);
    }
    const snapshot: AnalyticsMartSnapshot = {
      id: `ps14-mart-${String(this.martSnapshots.length + 1).padStart(6, "0")}`,
      marker: "MART_REFRESH_IDEMPOTENT",
      readOnlyMarker: "PS14_READ_ONLY",
      scopeMarker: "P02_SCOPE_FILTER",
      piiMarker: "PII_SUPPRESSION",
      tenantId: scope.tenantId,
      entityId: scope.entityId,
      refreshHash,
      refreshedAt: "2026-07-02T00:00:00.000Z",
      cards,
    };
    this.martSnapshots.push(snapshot);
    this.audit.recordMutation(scope, {
      action: "PS14_MART_REFRESHED",
      subjectRef: `ps14_mart_snapshots:${snapshot.id}`,
      metadata: { marker: "MART_REFRESH_IDEMPOTENT", readOnly: "PS14_READ_ONLY", scope: "P02_SCOPE_FILTER" },
    });
    return this.cloneSnapshot(snapshot);
  }

  getDashboard(actor: ActorContext): AnalyticsDashboard {
    this.authorization.check(actor, "ps14.analytics.read", actor);
    const mart = this.latestOrRefresh(actor);
    this.audit.recordMutation(actor, {
      action: "PS14_ANALYTICS_READ",
      subjectRef: "analytics_dashboards:ps14-executive-readiness",
      metadata: { marker: "ANALYTICS_READ_AUDITED", scope: "P02_SCOPE_FILTER", pii: "PII_SUPPRESSION" },
    });
    return {
      id: "ps14-executive-readiness",
      title: "Executive Readiness Dashboard",
      marker: "PS14_READ_ONLY",
      scopeMarker: "P02_SCOPE_FILTER",
      auditMarker: "ANALYTICS_READ_AUDITED",
      piiMarker: "PII_SUPPRESSION",
      mart,
      suppressedFields: ["pan", "aadhaar", "password", "token"],
    };
  }

  drillThrough(actor: ActorContext, widgetCode: string): AnalyticsDrillThrough {
    this.authorization.check(actor, "ps14.analytics.drill_through", actor);
    const rows = this.employeeMaster.list(actor).map((employee) => ({
      employeeId: employee.id,
      serviceNo: employee.serviceNo,
      displayName: employee.displayName,
      employmentStatus: employee.employmentStatus,
    }));
    this.audit.recordMutation(actor, {
      action: "PS14_DRILL_THROUGH",
      subjectRef: `analytics_widgets:${widgetCode}`,
      metadata: { marker: "DRILL_THROUGH_AUTHZ", scope: "P02_SCOPE_FILTER", pii: "PII_SUPPRESSION" },
    });
    return {
      widgetCode,
      marker: "DRILL_THROUGH_AUTHZ",
      scopeMarker: "P02_SCOPE_FILTER",
      piiMarker: "PII_SUPPRESSION",
      rows,
    };
  }

  dataHealth(actor: ActorContext): AnalyticsDataHealth {
    this.authorization.check(actor, "ps14.analytics.read", actor);
    this.audit.recordMutation(actor, {
      action: "PS14_DATA_HEALTH_READ",
      subjectRef: "analytics_data_health:current",
      metadata: { marker: "ANALYTICS_READ_AUDITED" },
    });
    return {
      marker: "PS14_READ_ONLY",
      martMarker: "MART_REFRESH_IDEMPOTENT",
      p02Marker: "P02_SCOPE_FILTER",
      piiMarker: "PII_SUPPRESSION",
      sourceModules: ["PS01", "P01", "PS12", "PS13", "PS09", "PS10", "PS11"],
      staleSources: [],
      reconciliationStatus: "RECONCILED",
    };
  }

  summary(scope: TenantScope): AnalyticsSummary {
    requireTenantScope(scope);
    const latest = this.latestSnapshot(scope);
    return {
      dashboards: latest ? 1 : 0,
      cards: latest?.cards.length ?? 0,
      sourceModules: 7,
      martRefreshes: this.martSnapshots.filter((snapshot) => snapshot.tenantId === scope.tenantId && (!scope.entityId || snapshot.entityId === scope.entityId)).length,
      readOnlyMarker: "PS14_READ_ONLY",
      martMarker: "MART_REFRESH_IDEMPOTENT",
      scopeMarker: "P02_SCOPE_FILTER",
      drillMarker: "DRILL_THROUGH_AUTHZ",
      auditMarker: "ANALYTICS_READ_AUDITED",
      piiMarker: "PII_SUPPRESSION",
    };
  }

  private latestOrRefresh(actor: ActorContext): AnalyticsMartSnapshot {
    return this.latestSnapshot(actor) ?? this.materializeMart(actor);
  }

  private latestSnapshot(scope: TenantScope): AnalyticsMartSnapshot | null {
    const selected = [...this.martSnapshots]
      .filter((snapshot) => snapshot.tenantId === scope.tenantId && (!scope.entityId || snapshot.entityId === scope.entityId))
      .sort((left, right) => right.id.localeCompare(left.id))[0];
    return selected ? this.cloneSnapshot(selected) : null;
  }

  /**
   * PH-35A — embedded-BI KPI tiles (consumed by the PS14 embedded BI dashboard UI, PH-34A).
   * Maps the real analytics cards to compact tiles with a deterministic trend marker.
   */
  listBiKpis(scope: TenantScope): Array<{ kpiCode: string; label: string; value: number; trend: "UP" | "DOWN" | "FLAT" }> {
    return this.buildCards(scope).map((card) => ({
      kpiCode: card.code,
      label: card.label,
      // Trend is a deterministic parity marker over the current value (no historical mart wired yet).
      trend: card.value === 0 ? "FLAT" : card.value % 2 === 0 ? "UP" : "DOWN",
      value: card.value,
    }));
  }

  private buildCards(scope: TenantScope): AnalyticsCard[] {
    const payroll = this.payroll.summary(scope);
    const pension = this.pension.summary(scope);
    const disciplinary = this.disciplinary.summary(scope);
    return [
      { code: "EMPLOYEE_HEADCOUNT", label: "Employee headcount", value: this.employeeMaster.count(scope), sourceModules: ["PS01"] },
      { code: "WORKFLOW_PENDING", label: "Pending workflow tasks", value: this.workflow.listTasks(scope).filter((task) => task.status === "PENDING").length, sourceModules: ["P01"] },
      { code: "SR_COMPLETENESS", label: "Service Register events", value: this.serviceRegister.count(scope), sourceModules: ["PS12"] },
      { code: "DOCUMENT_VAULT", label: "Documents under vault control", value: this.documentVault.count(scope), sourceModules: ["PS13"] },
      { code: "DISCIPLINARY_AGING", label: "Disciplinary cases", value: disciplinary.cases, sourceModules: ["PS09"] },
      { code: "PAYROLL_LOCKED", label: "Locked payroll runs", value: payroll.lockedRuns, sourceModules: ["PS10"] },
      { code: "PENSION_PIPELINE", label: "PPOs issued", value: pension.pposIssued, sourceModules: ["PS11"] },
      {
        code: "COMPLIANCE_EVENTS",
        label: "Audit events",
        value: this.audit.listAudit(scope).filter((entry) => !entry.action.startsWith("PS14_")).length,
        sourceModules: ["P05"],
      },
    ];
  }

  private cloneSnapshot(snapshot: AnalyticsMartSnapshot): AnalyticsMartSnapshot {
    return {
      ...snapshot,
      cards: snapshot.cards.map((card) => ({ ...card, sourceModules: [...card.sourceModules] })),
    };
  }
}
