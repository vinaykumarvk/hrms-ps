import { ApiKernel, accepted, created, ok } from "../http/apiKernel";
import { optionalNumber, optionalString, optionalStringArray, readBodyRecord, requiredString } from "../http/body";
import { pageItems } from "../http/pagination";
import { RouteDefinition } from "../http/apiTypes";
import { FoundationError } from "../platform/types";
import { PS14RefreshRunType, PS14ScopeType } from "../modules/ps14/analyticsEngineRepository";

export const ps14RouteEvidence = {
  dashboard: "/api/v1/analytics/dashboards/executive-readiness",
  refresh: "/api/v1/analytics/marts:refresh",
  drillThrough: "/api/v1/analytics/drill-through",
  health: "/api/v1/analytics/data-health",
  markers: ["PS14_READ_ONLY", "MART_REFRESH_IDEMPOTENT", "P02_SCOPE_FILTER", "DRILL_THROUGH_AUTHZ", "ANALYTICS_READ_AUDITED", "PII_SUPPRESSION"],
};

export function registerPS14Routes(kernel: ApiKernel): void {
  const routes: RouteDefinition[] = [
    {
      method: "POST",
      path: "/api/v1/analytics/marts:refresh",
      operationId: "ps14.refreshMart",
      protected: true,
      permission: "ps14.analytics.refresh",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ mart: context.services.analytics.refreshMart(context.actor) }),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/dashboards/executive-readiness",
      operationId: "ps14.getExecutiveDashboard",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => ok({ dashboard: context.services.analytics.getDashboard(context.actor) }),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/drill-through",
      operationId: "ps14.drillThrough",
      protected: true,
      permission: "ps14.analytics.drill_through",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => ok(context.services.analytics.drillThrough(context.actor, context.request.query?.widgetCode ?? "EMPLOYEE_HEADCOUNT")),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/data-health",
      operationId: "ps14.dataHealth",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => ok(context.services.analytics.dataHealth(context.actor)),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/summary",
      operationId: "ps14.summary",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => ok(context.services.analytics.summary(context.scope)),
    },
    // ---- PH-10D analytics engine (BRD PS14 FR-02/03/04/17/23) --------------------------------
    {
      method: "POST",
      path: "/api/v1/analytics/kpis",
      operationId: "ps14.defineKpi",
      protected: true,
      permission: "ps14.kpi.manage",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          kpi: context.services.analyticsEngine.defineKpi(context.actor, {
            kpiCode: requiredString(body, "kpiCode"),
            name: requiredString(body, "name"),
            description: requiredString(body, "description"),
            domain: requiredString(body, "domain"),
            sourceMartCode: requiredString(body, "sourceMartCode"),
            expression: requiredString(body, "expression"),
            unit: requiredString(body, "unit"),
            grain: requiredString(body, "grain"),
            minCellSize: optionalNumber(body, "minCellSize"),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/kpis",
      operationId: "ps14.listKpis",
      protected: true,
      permission: "ps14.analytics.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) =>
        ok(pageItems(context.services.analyticsEngine.listKpis(context.scope, context.request.query?.kpiCode), context.pagination ?? { limit: 25 })),
    },
    {
      method: "POST",
      path: "/api/v1/analytics/kpis/{code}:activate",
      operationId: "ps14.activateKpi",
      protected: true,
      permission: "ps14.kpi.activate",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        const version = optionalNumber(body, "version");
        if (version === undefined) {
          throw new FoundationError("VALIDATION_FAILED", "version is required", { field: "version" });
        }
        return accepted({ kpi: context.services.analyticsEngine.activateKpi(context.actor, { kpiCode: requiredParam(context.params, "code"), version }) });
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/kpis/{code}:compute",
      operationId: "ps14.computeKpiSnapshot",
      protected: true,
      permission: "ps14.kpi.compute",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          snapshot: context.services.analyticsEngine.computeKpiSnapshot(context.actor, {
            kpiCode: requiredParam(context.params, "code"),
            periodKey: requiredString(body, "periodKey"),
            validTime: requiredString(body, "validTime"),
            version: optionalNumber(body, "version"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/kpis/{code}:restate",
      operationId: "ps14.restateKpiSnapshot",
      protected: true,
      permission: "ps14.kpi.compute",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          snapshot: context.services.analyticsEngine.restateKpiSnapshot(context.actor, {
            kpiCode: requiredParam(context.params, "code"),
            periodKey: requiredString(body, "periodKey"),
            reason: requiredString(body, "reason"),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/kpis/{code}/as-of",
      operationId: "ps14.kpiValueAsOfKnowledge",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => {
        const periodKey = context.request.query?.periodKey;
        const asOf = context.request.query?.asOf;
        if (!periodKey || !asOf) {
          throw new FoundationError("VALIDATION_FAILED", "periodKey and asOf are required", { field: !periodKey ? "periodKey" : "asOf" });
        }
        return ok({
          result: context.services.analyticsEngine.kpiValueAsOfKnowledge(context.scope, {
            kpiCode: requiredParam(context.params, "code"),
            periodKey,
            asOfKnowledgeTime: asOf,
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/aggregate",
      operationId: "ps14.queryAggregate",
      protected: true,
      permission: "ps14.analytics.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const martCode = context.request.query?.martCode;
        const dimension = context.request.query?.dimension;
        if (!martCode || !dimension) {
          throw new FoundationError("VALIDATION_FAILED", "martCode and dimension are required", { field: !martCode ? "martCode" : "dimension" });
        }
        const result = context.services.analyticsEngine.queryAggregate(context.actor, { martCode, dimension });
        return ok({ ...result, cells: pageItems(result.cells, context.pagination ?? { limit: 25 }) });
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/datamarts:refresh",
      operationId: "ps14.refreshDatamarts",
      protected: true,
      permission: "ps14.analytics.refresh",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted(
          context.services.analyticsEngine.refreshDatamarts(context.actor, {
            runType: (optionalString(body, "runType") as PS14RefreshRunType | undefined) ?? "MANUAL",
            runKey: context.idempotencyKey ?? requiredString(body, "runKey"),
          })
        );
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/datamarts/refresh-logs",
      operationId: "ps14.listRefreshLogs",
      protected: true,
      permission: "ps14.analytics.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => ok(pageItems(context.services.analyticsEngine.listRefreshLogs(context.scope), context.pagination ?? { limit: 25 })),
    },
    {
      method: "POST",
      path: "/api/v1/analytics/scope-policies",
      operationId: "ps14.createScopePolicy",
      protected: true,
      permission: "ps14.scope.manage",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          policy: context.services.analyticsEngine.createScopePolicy(context.actor, {
            role: requiredString(body, "role"),
            scopeDimensions: optionalStringArray(body, "scopeDimensions") ?? [],
            martCode: optionalString(body, "martCode"),
            priority: optionalNumber(body, "priority"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/scope-policies/{id}:activate",
      operationId: "ps14.activateScopePolicy",
      protected: true,
      permission: "ps14.scope.activate",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ policy: context.services.analyticsEngine.activateScopePolicy(context.actor, requiredParam(context.params, "id")) }),
    },
    // PH-29C — PS14 natural-language query + probabilistic attrition (route exposure).
    {
      method: "POST",
      path: "/api/v1/analytics/nl-query",
      operationId: "ps14.nlQuery",
      protected: true,
      permission: "ps14.nlquery.ask",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return ok(context.services.nlQuery.ask(context.actor, { question: requiredString(body, "question") }));
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/attrition-score",
      operationId: "ps14.scoreAttrition",
      protected: true,
      permission: "ps14.predict.attrition",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created(
          context.services.predictiveAnalytics.scoreAttrition(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            features: {
              tenureMonths: optionalNumber(body, "tenureMonths") ?? 0,
              recentTransfers: optionalNumber(body, "recentTransfers") ?? 0,
              leaveUtilisationPct: optionalNumber(body, "leaveUtilisationPct") ?? 0,
              promotionGapMonths: optionalNumber(body, "promotionGapMonths") ?? 0,
            },
          })
        );
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/fairness-report",
      operationId: "ps14.fairnessReport",
      protected: true,
      permission: "ps14.predict.fairness",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return ok(
          context.services.predictiveAnalytics.fairnessReport(context.actor, {
            attribute: requiredString(body, "attribute"),
            observations: Array.isArray(body.observations) ? (body.observations as Array<{ group: string; riskScore: number }>) : [],
          })
        );
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/bi-kpis",
      operationId: "ps14.listBiKpis",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => ok({ items: context.services.analytics.listBiKpis(context.scope), limit: 25, next_cursor: null }),
    },
    // PH-43A — PS14 analytics-engine reads + KPI target-setting + predictive-score reads (route exposure
    // for already-tested backing: kpiSeries, listDatamarts, setKpiTarget, drillCohort, listScopePolicies,
    // predictiveAnalytics.listScores).
    {
      method: "GET",
      path: "/api/v1/analytics/kpis/{code}/series",
      operationId: "ps14.kpiSeries",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) =>
        ok(
          context.services.analyticsEngine.kpiSeries(context.scope, {
            kpiCode: requiredParam(context.params, "code"),
            periodKeys: (context.request.query?.periodKeys ?? "").split(",").map((k) => k.trim()).filter((k) => k.length > 0),
            acknowledgeCrossVersion: context.request.query?.acknowledgeCrossVersion === "true",
          })
        ),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/datamarts",
      operationId: "ps14.listDatamarts",
      protected: true,
      permission: "ps14.analytics.read",
      handler: (context) => ok({ items: context.services.analyticsEngine.listDatamarts(context.scope) }),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/datamarts/{martCode}/cohort",
      operationId: "ps14.drillCohort",
      protected: true,
      permission: "ps14.analytics.drill_through",
      handler: (context) => {
        const dimension = context.request.query?.dimension;
        const key = context.request.query?.key;
        if (!dimension || !key) {
          throw new FoundationError("VALIDATION_FAILED", "dimension and key query parameters are required", { field: "dimension" });
        }
        return ok(context.services.analyticsEngine.drillCohort(context.actor, { martCode: requiredParam(context.params, "martCode"), dimension, key }));
      },
    },
    {
      method: "POST",
      path: "/api/v1/analytics/kpis/{code}/targets",
      operationId: "ps14.setKpiTarget",
      protected: true,
      permission: "ps14.kpi.manage",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          target: context.services.analyticsEngine.setKpiTarget(context.actor, {
            kpiCode: requiredParam(context.params, "code"),
            scopeType: optionalString(body, "scopeType") as PS14ScopeType | undefined,
            scopeId: optionalString(body, "scopeId"),
            targetValue: requiredNumber(body, "targetValue"),
            effectiveFrom: requiredString(body, "effectiveFrom"),
            effectiveTo: optionalString(body, "effectiveTo"),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/analytics/scope-policies",
      operationId: "ps14.listScopePolicies",
      protected: true,
      permission: "ps14.scope.manage",
      handler: (context) => ok({ items: context.services.analyticsEngine.listScopePolicies(context.scope) }),
    },
    {
      method: "GET",
      path: "/api/v1/analytics/attrition-scores",
      operationId: "ps14.listAttritionScores",
      protected: true,
      permission: "ps14.predict.attrition",
      handler: (context) => ok({ items: context.services.predictiveAnalytics.listScores(context.scope) }),
    },
  ];
  routes.forEach((route) => kernel.register(route));
}

function requiredParam(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing route parameter ${key}`);
  }
  return value;
}

/** A required numeric body field accepting a JSON number or a numeric string. */
function requiredNumber(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(n)) {
    throw new Error(`${key} must be a number`);
  }
  return n;
}
