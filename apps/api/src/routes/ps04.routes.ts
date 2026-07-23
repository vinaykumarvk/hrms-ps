import { ApiKernel, accepted, created, ok } from "../http/apiKernel";
import { optionalNumber, optionalString, readBodyRecord, requiredString } from "../http/body";
import { RouteDefinition } from "../http/apiTypes";
import type { SrMappingDisposition, SrMappingEventType, StraddleHandling, QualifyingServiceRule } from "../modules/ps04/leaveSrCatalogService";

export const ps04RouteEvidence = {
  outbox: "/api/v1/leave-sr/outbox",
  relay: "relay",
  replay: "dead-letter replay",
  discard: "dead-letter discard",
  reconciliation: "reconciliation",
  // PH-16C: FR-PS04-02 sr_event_mapping catalog, FR-PS04-15 relay_partition_lease +
  // JOB-PS04-REAPER, FR-PS04-18 prepension_certificate.
  mappings: "/api/v1/leave-sr/mappings",
  partitions: "/api/v1/leave-sr/partitions:claim",
  reaper: "/api/v1/leave-sr/reaper:run",
  certificates: "/api/v1/leave-sr/prepension-certificates",
};

export function registerPS04Routes(kernel: ApiKernel): void {
  const routes: RouteDefinition[] = [
    {
      method: "GET",
      path: "/api/v1/leave-sr/outbox",
      operationId: "ps04.listLeaveServiceRegisterOutbox",
      protected: true,
      permission: "ps04.relay.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const pagination = context.pagination ?? { limit: 25 };
        const items = context.services.leaveSrRelay.list(context.scope);
        return ok({ items: items.slice(0, pagination.limit), limit: pagination.limit, next_cursor: null });
      },
    },
    {
      method: "GET",
      path: "/api/v1/leave-sr/reconciliation",
      operationId: "ps04.getLeaveServiceRegisterReconciliation",
      protected: true,
      permission: "ps04.relay.read",
      handler: (context) => ok({ report: context.services.leaveSrRelay.reconcile(context.scope) }),
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/outbox/{id}:relay",
      operationId: "ps04.relayLeaveServiceRegisterOutbox",
      protected: true,
      permission: "ps04.relay.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({
          outboxEvent: context.services.leaveSrRelay.relayEvent(context.actor, requiredParam(context.params, "id"), {
            simulateFailure: optionalString(body, "simulateFailure") === "true",
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/outbox/{id}:replay",
      operationId: "ps04.replayLeaveServiceRegisterDeadLetter",
      protected: true,
      permission: "ps04.relay.replay",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ outboxEvent: context.services.leaveSrRelay.replayDeadLetter(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/outbox/{id}:discard",
      operationId: "ps04.discardLeaveServiceRegisterDeadLetter",
      protected: true,
      permission: "ps04.relay.discard",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({ outboxEvent: context.services.leaveSrRelay.discardDeadLetter(context.actor, requiredParam(context.params, "id"), requiredString(body, "reason")) });
      },
    },
    // ---------------------------------------------------------------------------------
    // PH-16C — FR-PS04-02 versioned sr_event_mapping catalog
    // ---------------------------------------------------------------------------------
    {
      method: "GET",
      path: "/api/v1/leave-sr/mappings",
      operationId: "ps04.listSrEventMappings",
      protected: true,
      permission: "ps04.mapping.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const pagination = context.pagination ?? { limit: 25 };
        const items = context.services.leaveSrCatalog.listMappings(context.scope);
        return ok({ items: items.slice(0, pagination.limit), limit: pagination.limit, next_cursor: null });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/mappings",
      operationId: "ps04.createSrEventMappingDraft",
      protected: true,
      permission: "ps04.mapping.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          mapping: context.services.leaveSrCatalog.createMappingDraft(context.actor, {
            leaveTypeCode: requiredString(body, "leaveTypeCode"),
            eventType: requiredString(body, "eventType") as SrMappingEventType,
            disposition: requiredString(body, "disposition") as SrMappingDisposition,
            srEntryType: optionalString(body, "srEntryType"),
            qualifyingServiceRule: optionalString(body, "qualifyingServiceRule") as QualifyingServiceRule | undefined,
            statutoryRuleRef: optionalString(body, "statutoryRuleRef"),
            straddleHandling: optionalString(body, "straddleHandling") as StraddleHandling | undefined,
            annotationTemplate: optionalString(body, "annotationTemplate"),
            effectiveFrom: requiredString(body, "effectiveFrom"),
            effectiveTo: optionalString(body, "effectiveTo"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/mappings/{id}:publish",
      operationId: "ps04.publishSrEventMapping",
      protected: true,
      permission: "ps04.mapping.publish",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ mapping: context.services.leaveSrCatalog.publishMapping(context.actor, requiredParam(context.params, "id")) }),
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/mappings/{id}:retire",
      operationId: "ps04.retireSrEventMapping",
      protected: true,
      permission: "ps04.mapping.publish",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => accepted({ mapping: context.services.leaveSrCatalog.retireMapping(context.actor, requiredParam(context.params, "id")) }),
    },
    // ---------------------------------------------------------------------------------
    // PH-16C — FR-PS04-15 relay_partition_lease claims + JOB-PS04-REAPER
    // ---------------------------------------------------------------------------------
    {
      method: "POST",
      path: "/api/v1/leave-sr/partitions:claim",
      operationId: "ps04.claimRelayPartition",
      protected: true,
      permission: "ps04.relay.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted(
          context.services.leaveSrCatalog.claimPartition(context.actor, {
            partitionKey: requiredString(body, "partitionKey"),
            workerId: requiredString(body, "workerId"),
          })
        );
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/reaper:run",
      operationId: "ps04.runLeaseReaperSweep",
      protected: true,
      permission: "ps04.relay.reap",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted(context.services.leaveSrCatalog.runReaperSweep(context.actor, { runKey: optionalString(body, "runKey") }));
      },
    },
    // ---------------------------------------------------------------------------------
    // PH-16C — FR-PS04-18 prepension_certificate (PS11 gate input)
    // ---------------------------------------------------------------------------------
    {
      method: "GET",
      path: "/api/v1/leave-sr/prepension-certificates",
      operationId: "ps04.listPrepensionCertificates",
      protected: true,
      permission: "ps04.prepension.read",
      list: { defaultLimit: 25, maxLimit: 100 },
      handler: (context) => {
        const pagination = context.pagination ?? { limit: 25 };
        const employeeId = optionalString(context.request.query ?? {}, "employeeId");
        const items = context.services.leaveSrCatalog.listCertificates(context.scope, employeeId);
        return ok({ items: items.slice(0, pagination.limit), limit: pagination.limit, next_cursor: null });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/prepension-certificates",
      operationId: "ps04.issuePrepensionCertificate",
      protected: true,
      permission: "ps04.prepension.sign",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          certificate: context.services.leaveSrCatalog.issuePrepensionCertificate(context.actor, {
            employeeId: requiredString(body, "employeeId"),
            runId: requiredString(body, "runId"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/prepension-certificates/{id}:consume",
      operationId: "ps04.consumePrepensionCertificate",
      protected: true,
      permission: "ps04.prepension.consume",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) =>
        accepted({ certificate: context.services.leaveSrCatalog.consumeCertificateForPS11(context.actor, requiredParam(context.params, "id")) }),
    },
    // PH-51A — PS04 X.3 outbound-integration connector lifecycle (register -> send -> conformance; read) +
    // leave->SR relay enqueue/dead-letter reads. Route exposure for tested outboundIntegration / leaveSrRelay.
    {
      method: "POST",
      path: "/api/v1/integration/connectors",
      operationId: "ps04.registerConnector",
      protected: true,
      permission: "ps04.outbound.register",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          connector: context.services.outboundIntegration.registerConnector(context.actor, {
            name: requiredString(body, "name"),
            endpoint: requiredString(body, "endpoint"),
            payloadVersion: optionalNumber(body, "payloadVersion"),
            failureThreshold: optionalNumber(body, "failureThreshold"),
            maxAttempts: optionalNumber(body, "maxAttempts"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/integration/connectors/{id}:send",
      operationId: "ps04.outboundSend",
      protected: true,
      permission: "ps04.outbound.send",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return accepted({ send: context.services.outboundIntegration.send(context.actor, requiredParam(context.params, "id"), { payload: body.payload ?? {} }) });
      },
    },
    {
      method: "POST",
      path: "/api/v1/integration/connectors/{id}:conformance",
      operationId: "ps04.runConformance",
      protected: true,
      permission: "ps04.outbound.conformance",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => ok(context.services.outboundIntegration.runConformance(context.actor, requiredParam(context.params, "id"))),
    },
    {
      method: "GET",
      path: "/api/v1/integration/connectors/{id}",
      operationId: "ps04.getConnector",
      protected: true,
      permission: "ps04.relay.read",
      handler: (context) => ok({ connector: context.services.outboundIntegration.getConnector(context.scope, requiredParam(context.params, "id")) ?? null }),
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/enqueue-approved",
      operationId: "ps04.enqueueApprovedLeave",
      protected: true,
      permission: "ps04.relay.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          event: context.services.leaveSrRelay.enqueueApprovedLeave(context.scope, {
            leaveApplicationId: requiredString(body, "leaveApplicationId"),
            employeeId: requiredString(body, "employeeId"),
            eventDate: requiredString(body, "eventDate"),
            payload: (body.payload as Record<string, unknown>) ?? {},
            leaveTypeCode: optionalString(body, "leaveTypeCode"),
          }),
        });
      },
    },
    {
      method: "POST",
      path: "/api/v1/leave-sr/enqueue-cancellation",
      operationId: "ps04.enqueueLeaveCancellation",
      protected: true,
      permission: "ps04.relay.write",
      unsafe: true,
      requiresIdempotencyKey: true,
      handler: (context) => {
        const body = readBodyRecord(context.request.body);
        return created({
          event: context.services.leaveSrRelay.enqueueLeaveCancellation(context.scope, {
            leaveApplicationId: requiredString(body, "leaveApplicationId"),
            employeeId: requiredString(body, "employeeId"),
            eventDate: requiredString(body, "eventDate"),
            payload: (body.payload as Record<string, unknown>) ?? {},
            leaveTypeCode: optionalString(body, "leaveTypeCode"),
          }),
        });
      },
    },
    {
      method: "GET",
      path: "/api/v1/leave-sr/dead-letters",
      operationId: "ps04.listDeadLetters",
      protected: true,
      permission: "ps04.relay.read",
      handler: (context) => ok({ items: context.services.leaveSrRelay.listDeadLetters(context.scope) }),
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
