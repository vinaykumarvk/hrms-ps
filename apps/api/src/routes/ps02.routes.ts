import { ApiKernel, accepted, created, ok } from "../http/apiKernel";
import { optionalString, readBodyRecord, requiredString } from "../http/body";
import { RouteDefinition } from "../http/apiTypes";
import { PersonalDetailFieldCode } from "../modules/ps02/personalDetailsService";

export const ps02RouteEvidence = {
  base: "/api/v1/personal-details/change-requests",
  commit: "commit-through-PS01",
  reversal: "reverse-through-PS01",
  resolver: "REPORTING_CHAIN",
  evidenceDocs: "PS13 evidence documents",
  // PH-07C BRD-contract lifecycle routes (docs/brd/v3/PS02 §8): withdraw, resubmit, masked diff.
  lifecycle: "/api/v1/change-requests/{id}/withdraw|resubmit|diff",
  // PH-16B FR-PS02-009/018/019: bulk corrections, risk signals + fraud review, status gate.
  bulk: "/api/v1/bulk-corrections|{id}/validate|submit|approve|report",
  risk: "/api/v1/change-requests/{id}/risk|{signalId}/review + /api/v1/fraud/queue",
};

export function registerPS02Routes(kernel: ApiKernel): void {
  const routes: RouteDefinition[] = [
    {
      method: "POST",
      path: "/api/v1/personal-details/change-requests",
      operationId: "ps02.createPersonalDetailChangeRequest",
      protected: true,
      permission: "ps02.change.submit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created(
          context.services.personalDetails.createRequest(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            fieldCode: readFieldCode(body),
            newValue: requiredString(body, "newValue"),
            reason: requiredString(body, "reason"),
            evidenceTitle: optionalString(body, "evidenceTitle"),
          })
        );
      },
    },
    {
      method: "GET",
      path: "/api/v1/personal-details/change-requests",
      operationId: "ps02.listPersonalDetailChangeRequests",
      protected: true,
      permission: "ps02.change.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const pagination = context.pagination ?? { limit: 25 };
        const items = context.services.personalDetails.list(context.scope);
        return ok({ items: items.slice(0, pagination.limit), limit: pagination.limit, next_cursor: null });
      },
    },
    actionRoute("approve", "ps02.change.approve", (context, requestId) => accepted({ request: context.services.personalDetails.approve(context.actor, requestId) })),
    actionRoute("reject", "ps02.change.reject", (context, requestId) =>
      accepted({ request: context.services.personalDetails.reject(context.actor, requestId, optionalString(readBodyRecord(context.request.body), "comment")) })
    ),
    // FR-PS02-006 return-for-correction: P01 sendBack -> RETURNED with a mandatory comment (ERR-REASON-REQ).
    actionRoute("send-back", "ps02.change.reject", (context, requestId) =>
      accepted({ request: context.services.personalDetails.sendBack(context.actor, requestId, optionalString(readBodyRecord(context.request.body), "comment")) })
    ),
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}/resubmit",
      operationId: "ps02.resubmitPersonalDetailChangeRequest",
      protected: true,
      permission: "ps02.change.submit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          request: context.services.personalDetails.resubmit(context.actor, requiredParam(context.params, "id"), {
            newValue: optionalString(body, "newValue"),
            reason: requiredString(body, "reason"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}/withdraw",
      operationId: "ps02.withdrawPersonalDetailChangeRequest",
      protected: true,
      permission: "ps02.change.submit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          request: context.services.personalDetails.withdraw(context.actor, requiredParam(context.params, "id"), optionalString(body, "reason")),
        });
      },
    },
    {
      // FR-PS02-005: P02-aware per-field diff; sensitive values are masked for readers without the field grant.
      method: "GET",
      path: "/api/v1/change-requests/{id}/diff",
      operationId: "ps02.getPersonalDetailChangeRequestDiff",
      protected: true,
      permission: "ps02.change.read",
      handler: (context) => ok(context.services.personalDetails.getDiff(context.actor, requiredParam(context.params, "id"))),
    },
    {
      method: "POST",
      path: "/api/v1/personal-details/change-requests/{id}:commit",
      operationId: "ps02.commitPersonalDetailChangeRequest",
      protected: true,
      permission: "ps02.change.commit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          request: context.services.personalDetails.commit(
            context.actor,
            requiredParam(context.params, "id"),
            requiredString({ key: context.idempotencyKey }, "key"),
            optionalString(body, "effectiveDate") ?? "2026-07-02"
          ),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/personal-details/change-requests/{id}:reverse",
      operationId: "ps02.reversePersonalDetailChangeRequest",
      protected: true,
      permission: "ps02.change.reverse",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          request: context.services.personalDetails.reverse(
            context.actor,
            requiredParam(context.params, "id"),
            requiredString({ key: context.idempotencyKey }, "key"),
            optionalString(body, "effectiveDate") ?? "2026-07-03"
          ),
        });
      },
    },
    // ------------------------------------------------------------------------------
    // PH-16B — FR-PS02-018/019 governed change with status gate + risk evaluation
    // ------------------------------------------------------------------------------
    {
      method: "POST",
      path: "/api/v1/change-requests",
      operationId: "ps02.submitGovernedChangeRequest",
      protected: true,
      permission: "ps02.change.submit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          request: context.services.changeGovernance.submitChange(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            fieldKey: requiredString(body, "fieldKey"),
            newValue: requiredString(body, "newValue"),
            reason: requiredString(body, "reason"),
            origin: readOrigin(body),
            changeType: readChangeType(body),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}:approve",
      operationId: "ps02.approveGovernedChangeRequest",
      protected: true,
      permission: "ps02.change.approve",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) =>
        accepted({ request: context.services.changeGovernance.approveChange(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}:commit",
      operationId: "ps02.commitGovernedChangeRequest",
      protected: true,
      permission: "ps02.change.commit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) =>
        accepted({
          request: context.services.changeGovernance.commitChange(
            context.actor,
            requiredParam(context.params, "id"),
            requiredString({ key: context.idempotencyKey }, "key")
          ),
        }),
    },
    {
      // FR-PS02-019: risk signals + aggregated score/band for one change request.
      method: "GET",
      path: "/api/v1/change-requests/{id}/risk",
      operationId: "ps02.getChangeRequestRisk",
      protected: true,
      permission: "ps02.change.read",
      handler: (context) => ok(context.services.changeGovernance.getRisk(context.scope, requiredParam(context.params, "id"))),
    },
    {
      // FR-PS02-019 AC6: Fraud Reviewer clear/confirm/escalate (capability-flag permission).
      method: "POST",
      path: "/api/v1/change-requests/{id}/risk/{signalId}/review",
      operationId: "ps02.reviewChangeRequestRiskSignal",
      protected: true,
      permission: "ps02.risk.review",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted(
          context.services.changeGovernance.reviewRiskSignal(
            context.actor,
            requiredParam(context.params, "id"),
            requiredParam(context.params, "signalId"),
            { outcome: readReviewOutcome(body), comment: optionalString(body, "comment") }
          )
        );
      },
    },
    {
      // FR-PS02-019 AC6: fraud-review queue (HIGH/BLOCKED bands), cursor-bounded.
      method: "GET",
      path: "/api/v1/fraud/queue",
      operationId: "ps02.listFraudQueue",
      protected: true,
      permission: "ps02.risk.review",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const pagination = context.pagination ?? { limit: 25 };
        const items = context.services.changeGovernance.listFraudQueue(context.scope);
        return ok({ items: items.slice(0, pagination.limit), limit: pagination.limit, next_cursor: null });
      },
    },
    // ------------------------------------------------------------------------------
    // PH-16B — FR-PS02-009 bulk HR-initiated corrections (E12 lifecycle verbatim)
    // ------------------------------------------------------------------------------
    {
      method: "POST",
      path: "/api/v1/bulk-corrections",
      operationId: "ps02.createBulkCorrectionBatch",
      protected: true,
      permission: "ps02.bulk.manage",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          batch: context.services.changeGovernance.createBatch(context.actor, {
            rows: readBulkRows(body),
            reason: optionalString(body, "reason"),
          }),
        });
      },
    },
    bulkActionRoute("validate", "ps02.bulk.manage", (context, batchId) =>
      ok(context.services.changeGovernance.validateBatch(context.actor, batchId))
    ),
    bulkActionRoute("submit", "ps02.bulk.manage", (context, batchId) =>
      accepted({ batch: context.services.changeGovernance.submitBatch(context.actor, batchId) })
    ),
    bulkActionRoute("approve", "ps02.change.approve", (context, batchId) =>
      accepted({ batch: context.services.changeGovernance.approveBatch(context.actor, batchId) })
    ),
    bulkActionRoute("commit", "ps02.change.commit", (context, batchId) =>
      accepted({ batch: context.services.changeGovernance.commitBatch(context.actor, batchId) })
    ),
    {
      // FR-PS02-009 AC1: validation/commit report with row-level reasons.
      method: "GET",
      path: "/api/v1/bulk-corrections/{id}/report",
      operationId: "ps02.getBulkCorrectionBatchReport",
      protected: true,
      permission: "ps02.change.read",
      handler: (context) => ok({ batch: context.services.changeGovernance.getBatchReport(context.scope, requiredParam(context.params, "id")) }),
    },
    // PH-31A — PS02 retro-impact downstream fan-out (route exposure for the PH-25B engine).
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}/retro-impact:fan-out",
      operationId: "ps02.retroImpactFanOut",
      protected: true,
      permission: "ps02.retro.fanout",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          events: context.services.retroImpact.fanOut(context.actor, {
            changeRequestId: requiredParam(context.params, "id"),
            effectiveDate: requiredString(body, "effectiveDate"),
            targets: Array.isArray(body.targets) ? (body.targets as Array<"PS10" | "PS11" | "PS06">) : [],
          }),
        });
      },
    },
    // PH-33A — PS02 strong e-signature + change-request templates (route exposure).
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}/e-signatures",
      operationId: "ps02.signChange",
      protected: true,
      permission: "ps02.esign.sign",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          signature: context.services.changeEsignStepUp.signChange(context.actor, {
            changeRequestId: requiredParam(context.params, "id"),
            method: requiredString(body, "method") as "AADHAAR_OTP" | "DSC" | "HSM",
            payload: body.payload ?? {},
            signedAt: requiredString(body, "signedAt"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/change-request-templates",
      operationId: "ps02.createChangeRequestTemplate",
      protected: true,
      permission: "ps02.template.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          template: context.services.changeRequestTemplate.createTemplate(context.actor, {
            templateCode: requiredString(body, "templateCode"),
            name: requiredString(body, "name"),
            fields: Array.isArray(body.fields) ? (body.fields as Array<{ fieldCode: string; defaultValue?: string }>) : [],
          }),
        });
      },
    },
    // PH-49A — PS02 step-up MFA lifecycle (challenge -> verify with expiry guard; reads) + change-request
    // template management. Route exposure for already-tested changeEsignStepUp / changeRequestTemplate.
    {
      method: "POST",
      path: "/api/v1/change-requests/{id}:challenge-stepup",
      operationId: "ps02.challengeStepUp",
      protected: true,
      permission: "ps02.stepup.challenge",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          stepUp: context.services.changeEsignStepUp.challengeStepUp(context.actor, {
            changeRequestId: requiredParam(context.params, "id"),
            issuedAt: requiredString(body, "issuedAt"),
            expiresAt: requiredString(body, "expiresAt"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/change-requests/stepups/{stepUpId}:verify",
      operationId: "ps02.verifyStepUp",
      protected: true,
      permission: "ps02.stepup.verify",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({ stepUp: context.services.changeEsignStepUp.verifyStepUp(context.actor, requiredParam(context.params, "stepUpId"), { verifiedAt: requiredString(body, "verifiedAt") }) });
      },
    },
    {
      method: "GET",
      path: "/api/v1/change-requests/{id}/esignatures",
      operationId: "ps02.listEsignatures",
      protected: true,
      permission: "ps02.change.read",
      handler: (context) => ok({ items: context.services.changeEsignStepUp.listEsignatures(context.scope, requiredParam(context.params, "id")) }),
    },
    {
      method: "GET",
      path: "/api/v1/change-request-templates",
      operationId: "ps02.listChangeRequestTemplates",
      protected: true,
      permission: "ps02.change.read",
      handler: (context) => ok({ items: context.services.changeRequestTemplate.listTemplates(context.scope) }),
    },
    {
      method: "POST",
      path: "/api/v1/change-request-templates/{id}:deactivate",
      operationId: "ps02.deactivateChangeRequestTemplate",
      protected: true,
      permission: "ps02.template.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ template: context.services.changeRequestTemplate.deactivateTemplate(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/change-request-templates/{id}:start",
      operationId: "ps02.startFromTemplate",
      protected: true,
      permission: "ps02.change.submit",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          prefill: context.services.changeRequestTemplate.startFromTemplate(context.actor, requiredParam(context.params, "id"), {
            allowedFields: Array.isArray(body.allowedFields) ? body.allowedFields.map((f) => String(f)) : [],
          }),
        });
      },
    },
  ];
  routes.forEach((route) => kernel.register(route));
}

function bulkActionRoute(
  action: "validate" | "submit" | "approve" | "commit",
  permission: string,
  handler: (context: Parameters<RouteDefinition["handler"]>[0], batchId: string) => ReturnType<RouteDefinition["handler"]>
): RouteDefinition {
  return {
    method: "POST",
    path: `/api/v1/bulk-corrections/{id}/${action}`,
    operationId: `ps02.${action}BulkCorrectionBatch`,
    protected: true,
    permission,
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => handler(context, requiredParam(context.params, "id")),
  };
}

function readOrigin(body: Record<string, unknown>): "SELF_SERVICE" | "HR_ON_BEHALF" {
  const value = optionalString(body, "origin") ?? "SELF_SERVICE";
  if (value === "SELF_SERVICE" || value === "HR_ON_BEHALF") {
    return value;
  }
  throw new Error(`Unsupported origin ${value}`);
}

function readChangeType(body: Record<string, unknown>): "UPDATE" | "CORRECTION" | undefined {
  const value = optionalString(body, "changeType");
  if (value === undefined || value === "UPDATE" || value === "CORRECTION") {
    return value;
  }
  throw new Error(`Unsupported changeType ${value}`);
}

function readReviewOutcome(body: Record<string, unknown>): "CLEARED" | "CONFIRMED_FRAUD" | "ESCALATED" {
  const value = requiredString(body, "outcome");
  if (value === "CLEARED" || value === "CONFIRMED_FRAUD" || value === "ESCALATED") {
    return value;
  }
  throw new Error(`Unsupported review outcome ${value}`);
}

/** FR-PS02-009 VAL-FILE: the CSV-shaped row set arrives parsed as an array of row objects. */
function readBulkRows(body: Record<string, unknown>): Array<{ employeeId: string; fieldKey: string; newValue: string; changeType?: "UPDATE" | "CORRECTION"; reason?: string }> {
  const rows = body.rows;
  if (!Array.isArray(rows)) {
    throw new Error("rows must be an array");
  }
  return rows.map((row) => {
    const record = readBodyRecord(row);
    return {
      employeeId: requiredString(record, "employeeId"),
      fieldKey: requiredString(record, "fieldKey"),
      newValue: requiredString(record, "newValue"),
      changeType: readChangeType(record),
      reason: optionalString(record, "reason"),
    };
  });
}

function actionRoute(
  action: "approve" | "reject" | "send-back",
  permission: string,
  handler: (context: Parameters<RouteDefinition["handler"]>[0], requestId: string) => ReturnType<RouteDefinition["handler"]>
): RouteDefinition {
  return {
    method: "POST",
    path: `/api/v1/personal-details/change-requests/{id}:${action}`,
    operationId: `ps02.${action === "send-back" ? "sendBack" : action}PersonalDetailChangeRequest`,
    protected: true,
    permission,
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => handler(context, requiredParam(context.params, "id")),
  };
}

function readFieldCode(body: Record<string, unknown>): PersonalDetailFieldCode {
  const value = requiredString(body, "fieldCode");
  if (value === "displayName" || value === "pan" || value === "aadhaarMasked") {
    return value;
  }
  throw new Error(`Unsupported fieldCode ${value}`);
}

function requiredParam(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing route parameter ${key}`);
  }
  return value;
}
