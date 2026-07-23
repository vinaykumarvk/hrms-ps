import { ApiKernel, accepted, created, ok } from "../http/apiKernel";
import { optionalBoolean, optionalNumber, optionalRecord, optionalString, optionalStringArray, readBodyRecord, requiredString } from "../http/body";
import { pageItems } from "../http/pagination";
import { ApiContext, ApiResponse } from "../http/apiTypes";
import { SrEvent, SrSourceModule } from "../modules/ps12/serviceRegisterService";
import { VerificationBundle } from "../modules/ps12/offlineVerificationService";
import { JOB_PS12_ANCHOR, JOB_PS12_GAPSCAN, JOB_PS12_INTEGRITY } from "../modules/ps12/srIntegrityService";
import type { SrAttestationKind, SrExtractScope, SrGapStatus, SrRedactionPolicy, SrRuleStatus, SrSeverity, SrSignatureMethod } from "../modules/ps12/srIntegrityRepository";
import type { SrLtvRenewalKind, SrLtvSubject, SrLtvTrigger, SrSubscriptionMode } from "../modules/ps12/srAdmissibilityRepository";
import { FoundationError } from "../platform/types";

export const ps12RouteEvidence = {
  ingest: "/api/v1/sr/ingest",
  reversal: "ingest/reversal",
  timeline: "timeline",
  corrigendum: "corrigendum",
  dispute: "dispute",
  resolve: "resolve",
  headers: ["X-Correlation-Id", "Idempotency-Key"],
  ledger: "append-only reversal semantic dedup idempotency",
  // PH-10B integrity pillars (BRD PS12 FR-04/07/10/17)
  integrityVerify: "/api/v1/sr/employees/{id}/integrity/verify",
  integrityJob: JOB_PS12_INTEGRITY,
  anchorJob: JOB_PS12_ANCHOR,
  gapScanJob: JOB_PS12_GAPSCAN,
  attestations: "/api/v1/sr/attestations",
  certifiedExtracts: "/api/v1/sr/extracts",
  // PH-15D admissibility + longevity (BRD PS12 FR-18/13/19)
  authenticityCertificates: "/api/v1/sr/authenticity-certificates",
  subscriptions: "/api/v1/sr/subscriptions",
  feed: "/api/v1/sr/feed?since_seq=",
  ltvRenewals: "/api/v1/sr/ltv/renewals",
};

export function registerPS12Routes(kernel: ApiKernel): void {
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/ingest",
    operationId: "ps12.ingestServiceRegisterEvent",
    protected: true,
    permission: "ps12.sr.ingest",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created(
        context.services.serviceRegister.ingest(context.scope, requiredString({ key: context.idempotencyKey }, "key"), {
          sourceModule: readSourceModule(body),
          sourceReferenceId: requiredString(body, "sourceReferenceId"),
          sourceEventVersion: optionalNumber(body, "sourceEventVersion") ?? 1,
          employeeId: requiredString(body, "employeeId"),
          eventTypeCode: requiredString(body, "eventTypeCode"),
          eventDate: requiredString(body, "eventDate"),
          factKey: optionalString(body, "factKey"),
          orderNo: optionalString(body, "orderNo"),
          payload: optionalRecord(body, "payload") ?? {},
          documentIds: optionalStringArray(body, "documentIds") ?? [],
          reversalOfEventId: optionalString(body, "reversalOfEventId"),
        })
      );
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/ingest/reversal",
    operationId: "ps12.reverseServiceRegisterEvent",
    protected: true,
    permission: "ps12.sr.ingest.reversal",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      const idempotencyKey = requiredString({ key: context.idempotencyKey }, "key");
      const reason = requiredString(body, "reason");
      // BRD PS12 FR-02 v2 reversal envelope: is_reversal + reverses_source_reference_id locate the
      // reversed ledger entry by its source_reference_id; unknown targets raise SR_REVERSAL_TARGET_NOT_FOUND.
      if (optionalBoolean(body, "is_reversal")) {
        return created(
          context.services.serviceRegister.reverseBySourceReference(
            context.scope,
            idempotencyKey,
            requiredString(body, "reverses_source_reference_id"),
            reason
          )
        );
      }
      return created(
        context.services.serviceRegister.reverseFromSource(context.scope, idempotencyKey, requiredString(body, "originalEventId"), reason)
      );
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/ingest/{ingestion_request_id}",
    operationId: "ps12.getIngestResult",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ event: requireSrEvent(context, requiredParam(context.params, "ingestion_request_id")) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/timeline",
    operationId: "ps12.getEmployeeServiceRegisterTimeline",
    protected: true,
    permission: "ps12.sr.read",
    list: { defaultLimit: 25, maxLimit: 100 },
    handler: (context) => {
      // Cursor paging via the kernel helper: stable sequenceNo ordering from getTimeline,
      // limit clamped to 100 by parsePagination, next_cursor computed from the window end.
      const timeline = context.services.serviceRegister.getTimeline(context.scope, requiredParam(context.params, "id"));
      return ok(pageItems(timeline, context.pagination ?? { limit: 25 }));
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/events/{id}",
    operationId: "ps12.getServiceRegisterEvent",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ event: requireSrEvent(context, requiredParam(context.params, "id")) }),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/events/{id}/corrigendum",
    operationId: "ps12.createServiceRegisterCorrigendum",
    protected: true,
    permission: "ps12.sr.corrigendum",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => appendAnnotation(context, requiredParam(context.params, "id"), "CORRIGENDUM"),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/events/{id}/dispute",
    operationId: "ps12.createServiceRegisterDispute",
    protected: true,
    permission: "ps12.sr.dispute",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => appendAnnotation(context, requiredParam(context.params, "id"), "DISPUTE"),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/disputes/{id}/resolve",
    operationId: "ps12.resolveServiceRegisterDispute",
    protected: true,
    permission: "ps12.sr.dispute.resolve",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => appendAnnotation(context, requiredParam(context.params, "id"), "DISPUTE_RESOLUTION"),
  });

  // ------------------------------------------------------------------------------------
  // PH-10B integrity pillars (BRD PS12 FR-04/07/10/17)
  // ------------------------------------------------------------------------------------
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/integrity/verify",
    operationId: "ps12.verifyServiceRegisterIntegrity",
    protected: true,
    permission: "ps12.sr.integrity.verify",
    handler: (context) =>
      // FR-04: recompute the content chain + status sub-chain from stored content and
      // report OK/FAIL with the first broken link.
      ok(context.services.srIntegrity.verifyEmployee(context.scope, requiredParam(context.params, "id"))),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/integrity/run",
    operationId: "ps12.runServiceRegisterIntegrityJob",
    protected: true,
    permission: "ps12.sr.integrity.run",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) =>
      // JOB-PS12-INTEGRITY: the scheduled recompute drives the same verify code path.
      accepted(context.services.srIntegrity.runIntegrityJob(context.scope, requiredString({ key: context.idempotencyKey }, "key"))),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/anchors/run",
    operationId: "ps12.runServiceRegisterAnchorJob",
    protected: true,
    permission: "ps12.sr.anchor.run",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created(
        context.services.srIntegrity.runAnchorJob(context.scope, requiredString({ key: context.idempotencyKey }, "key"), {
          periodFrom: optionalString(body, "periodFrom"),
          periodTo: optionalString(body, "periodTo"),
        })
      );
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/anchors",
    operationId: "ps12.listServiceRegisterAnchors",
    protected: true,
    permission: "ps12.sr.anchor.read",
    list: { defaultLimit: 25, maxLimit: 100 },
    handler: (context) => ok(pageItems(context.services.srIntegrity.listAnchors(context.scope), context.pagination ?? { limit: 25 })),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/expected-event-rules",
    operationId: "ps12.createSrExpectedEventRule",
    protected: true,
    permission: "ps12.sr.gap.rule.manage",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created(
        context.services.srIntegrity.createExpectedEventRule(context.scope, {
          ruleCode: requiredString(body, "ruleCode"),
          expectedEventCategory: requiredString(body, "expectedEventCategory"),
          cadence: optionalRecord(body, "cadence"),
          suppressedByCategories: optionalStringArray(body, "suppressedByCategories"),
          appliesToCadre: optionalStringArray(body, "appliesToCadre"),
          sourceRuleRef: optionalString(body, "sourceRuleRef"),
          severity: optionalString(body, "severity") as SrSeverity | undefined,
          status: optionalString(body, "status") as SrRuleStatus | undefined,
          effectiveFrom: requiredString(body, "effectiveFrom"),
          effectiveTo: optionalString(body, "effectiveTo"),
        })
      );
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/gap-scan/run",
    operationId: "ps12.runSrGapScanJob",
    protected: true,
    permission: "ps12.sr.gap.scan",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      // JOB-PS12-GAPSCAN: expected-vs-recorded reconciliation appends GAP_FLAGGED rows.
      return accepted(
        context.services.srIntegrity.runGapScan(context.scope, requiredString({ key: context.idempotencyKey }, "key"), {
          periodFrom: requiredString(body, "periodFrom"),
          periodTo: requiredString(body, "periodTo"),
        })
      );
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/gaps",
    operationId: "ps12.listSrGapRegister",
    protected: true,
    permission: "ps12.sr.gap.read",
    list: { defaultLimit: 25, maxLimit: 100 },
    handler: (context) =>
      ok(pageItems(context.services.srIntegrity.listGaps(context.scope, requiredParam(context.params, "id")), context.pagination ?? { limit: 25 })),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/gaps/{id}/resolve",
    operationId: "ps12.resolveSrGap",
    protected: true,
    permission: "ps12.sr.gap.resolve",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return ok(
        context.services.srIntegrity.resolveGap(context.scope, requiredParam(context.params, "id"), {
          gapStatus: requiredString(body, "gapStatus") as SrGapStatus,
          explanationCode: optionalString(body, "explanationCode"),
          resolvedEventId: optionalString(body, "resolvedEventId"),
          corroboratedBy: optionalString(body, "corroboratedBy"),
        })
      );
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/attestations",
    operationId: "ps12.createSrAttestation",
    protected: true,
    permission: "ps12.sr.attest",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created(
        context.services.srIntegrity.attestChainHead(context.scope, {
          employeeId: requiredString(body, "employeeId"),
          attestationKind: requiredString(body, "attestationKind") as SrAttestationKind,
          attestedRole: requiredString(body, "attestedRole"),
          signatureMethod: requiredString(body, "signatureMethod") as SrSignatureMethod,
          certificateSerial: optionalString(body, "certificateSerial"),
        })
      );
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/extracts",
    operationId: "ps12.issueSrCertifiedExtract",
    protected: true,
    permission: "ps12.sr.extract.issue",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      // FR-10: certified extract with purpose-driven redaction via the P02 field mask.
      return created(
        context.services.srIntegrity.issueCertifiedExtract(context.actor, context.scope, {
          employeeId: requiredString(body, "employeeId"),
          scope: optionalString(body, "scope") as SrExtractScope | undefined,
          redactionPolicy: optionalString(body, "redactionPolicy") as SrRedactionPolicy | undefined,
          issuedTo: requiredString(body, "issuedTo"),
          purpose: optionalString(body, "purpose"),
          periodFrom: optionalString(body, "periodFrom"),
          periodTo: optionalString(body, "periodTo"),
        })
      );
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/extracts/{id}",
    operationId: "ps12.getSrCertifiedExtract",
    protected: true,
    permission: "ps12.sr.extract.read",
    handler: (context) => {
      const extract = context.services.srIntegrity.getExtract(context.scope, requiredParam(context.params, "id"));
      if (!extract) {
        throw new FoundationError("NOT_FOUND", "Certified extract not found");
      }
      return ok({ extract });
    },
  });

  // ------------------------------------------------------------------------------------
  // PH-15D admissibility + longevity (BRD PS12 FR-18/13/19)
  // ------------------------------------------------------------------------------------
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/extracts/{id}/authenticity-certificate",
    operationId: "ps12.issueSrAuthenticityCertificate",
    protected: true,
    permission: "ps12.sr.cert.generate",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) =>
      // FR-18: §65B/BSA certificate over the VERIFIED chain; the handler passes no custody
      // narrative — the chain-of-custody block is generated from stored data (BR-18.2).
      created(context.services.srAdmissibility.issueAuthenticityCertificate(context.scope, requiredParam(context.params, "id"))),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/authenticity-certificates/{id}",
    operationId: "ps12.getSrAuthenticityCertificate",
    protected: true,
    permission: "ps12.sr.cert.read",
    handler: (context) => {
      const certificate = context.services.srAdmissibility.getCertificate(context.scope, requiredParam(context.params, "id"));
      if (!certificate) {
        throw new FoundationError("NOT_FOUND", "Authenticity certificate not found");
      }
      return ok({ certificate });
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/subscriptions",
    operationId: "ps12.registerSrSubscription",
    protected: true,
    permission: "ps12.sr.subscription.manage",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      // FR-13: PULL_FEED only at launch — WEBHOOK/MESSAGE_BUS rejected (SR_DELIVERY_MODE_DEFERRED).
      return created(
        context.services.srAdmissibility.registerSubscription(context.scope, {
          subscriberModule: requiredString(body, "subscriberModule"),
          eventCategories: optionalStringArray(body, "eventCategories") ?? [],
          deliveryMode: optionalString(body, "deliveryMode") as SrSubscriptionMode | undefined,
          secretRef: optionalString(body, "secretRef"),
        })
      );
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/subscriptions/{id}/activate",
    operationId: "ps12.activateSrSubscription",
    protected: true,
    permission: "ps12.sr.subscription.activate",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => ok(context.services.srAdmissibility.activateSubscription(context.scope, requiredParam(context.params, "id"))),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/feed",
    operationId: "ps12.pullSrFeed",
    protected: true,
    permission: "ps12.sr.feed.read",
    handler: (context) => {
      // FR-13: authenticated pull feed resumable by ?since_seq=; cursor state lives on the
      // subscription (last_delivered_seq) and the read is scoped to the caller's tenant.
      const query = context.request.query ?? {};
      const subscriptionId = query.subscription_id;
      if (!subscriptionId) {
        throw new FoundationError("VALIDATION_FAILED", "subscription_id is required", { field: "subscription_id" });
      }
      const sinceSeqRaw = query.since_seq;
      const sinceSeq = sinceSeqRaw !== undefined ? Number(sinceSeqRaw) : undefined;
      if (sinceSeq !== undefined && !Number.isInteger(sinceSeq)) {
        throw new FoundationError("VALIDATION_FAILED", "since_seq must be an integer", { field: "since_seq" });
      }
      return ok(context.services.srAdmissibility.pullFeed(context.scope, subscriptionId, sinceSeq));
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/ltv/renew",
    operationId: "ps12.recordSrLtvRenewal",
    protected: true,
    permission: "ps12.sr.ltv.renew",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      // FR-19: additive renewal evidence — RE_ANCHOR/ALGORITHM_MIGRATION re-anchor over
      // existing chain heads; stored hashes are never recomputed or overwritten.
      return created(
        context.services.srAdmissibility.recordLtvRenewal(context.scope, requiredString({ key: context.idempotencyKey }, "key"), {
          subjectType: requiredString(body, "subjectType") as SrLtvSubject,
          subjectId: requiredString(body, "subjectId"),
          renewalKind: requiredString(body, "renewalKind") as SrLtvRenewalKind,
          priorAlgorithm: optionalString(body, "priorAlgorithm"),
          newAlgorithm: optionalString(body, "newAlgorithm"),
          triggeredBy: optionalString(body, "triggeredBy") as SrLtvTrigger | undefined,
        })
      );
    },
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/ltv/renewals",
    operationId: "ps12.listSrLtvRenewals",
    protected: true,
    permission: "ps12.sr.ltv.read",
    list: { defaultLimit: 25, maxLimit: 100 },
    handler: (context) =>
      ok(
        pageItems(
          context.services.srAdmissibility.listLtvRenewals(context.scope, context.request.query?.subject_id),
          context.pagination ?? { limit: 25 }
        )
      ),
  });

  // PH-32B — PS12 RFC-3161 timestamp issue + offline-QR bundle issue (route exposure).
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/timestamp",
    operationId: "ps12.issueTimestamp",
    protected: true,
    permission: "ps12.tsa.issue",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created(context.services.timestampAuthority.issueTimestamp(context.actor, { payload: body.payload ?? {} }));
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/verification-bundle",
    operationId: "ps12.issueVerificationBundle",
    protected: true,
    permission: "ps12.qr.issue",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return created({
        bundle: context.services.offlineVerification.issueBundle(context.actor, {
          subjectRef: requiredString(body, "subjectRef"),
          entryHash: requiredString(body, "entryHash"),
          anchorRef: requiredString(body, "anchorRef"),
          issuedAt: requiredString(body, "issuedAt"),
        }),
      });
    },
  });

  // PH-48A — PS12 SR-ledger chain reads + timestamp/bundle verification (route exposure for tested backing).
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/entry-chain",
    operationId: "ps12.getEntryChain",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.serviceRegister.getEntryChain(context.scope, requiredParam(context.params, "id")) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/status-chain",
    operationId: "ps12.getStatusChain",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.serviceRegister.getStatusChain(context.scope, requiredParam(context.params, "id")) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{id}/status-events",
    operationId: "ps12.getStatusEvents",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.serviceRegister.getStatusEvents(context.scope, requiredParam(context.params, "id")) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/chain-employees",
    operationId: "ps12.listChainEmployees",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.serviceRegister.listChainEmployees(context.scope) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/feed-events",
    operationId: "ps12.listFeedEvents",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.serviceRegister.listFeedEvents(context.scope) }),
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/timestamp:verify",
    operationId: "ps12.verifyTimestamp",
    protected: true,
    permission: "ps12.tsa.issue",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => {
      const body = readBodyRecord(context.request.body);
      return ok(context.services.timestampAuthority.verifyTimestamp(context.actor, { payload: body.payload ?? {}, token: requiredString(body, "token") }));
    },
  });
  kernel.register({
    method: "POST",
    path: "/api/v1/sr/verification-bundle:verify",
    operationId: "ps12.verifyBundle",
    protected: true,
    permission: "ps12.qr.issue",
    unsafe: true,
    requiresIdempotencyKey: true,
    handler: (context) => ok(context.services.offlineVerification.verifyBundle(readBodyRecord(context.request.body) as unknown as VerificationBundle)),
  });

  // PH-61A — PS12 SR admissibility/integrity reads (subscriptions, attestations). Route exposure for tested
  // srAdmissibility / srIntegrity backing.
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/subscriptions",
    operationId: "ps12.listSubscriptions",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.srAdmissibility.listSubscriptions(context.scope) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/employees/{employeeId}/attestations",
    operationId: "ps12.listAttestations",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ items: context.services.srIntegrity.listAttestations(context.scope, requiredParam(context.params, "employeeId")) }),
  });
  kernel.register({
    method: "GET",
    path: "/api/v1/sr/attestations/{attestationId}",
    operationId: "ps12.getAttestation",
    protected: true,
    permission: "ps12.sr.read",
    handler: (context) => ok({ attestation: context.services.srIntegrity.getAttestation(context.scope, requiredParam(context.params, "attestationId")) ?? null }),
  });
}

function appendAnnotation(context: ApiContext, eventId: string, eventTypeCode: string): ApiResponse {
  const original = requireSrEvent(context, eventId);
  const body = readBodyRecord(context.request.body);
  const reason = requiredString(body, "reason");
  return created(
    context.services.serviceRegister.ingest(context.scope, requiredString({ key: context.idempotencyKey }, "key"), {
      sourceModule: "PS12_MANUAL",
      sourceReferenceId: `sr:${original.id}:${eventTypeCode}`,
      sourceEventVersion: original.sourceEventVersion + 1,
      employeeId: original.employeeId,
      eventTypeCode,
      eventDate: optionalString(body, "eventDate") ?? original.eventDate,
      factKey: `SR:${original.id}|${eventTypeCode}|${requiredString({ key: context.idempotencyKey }, "key")}`,
      payload: { reason, originalEventId: original.id, details: optionalRecord(body, "details") ?? {} },
      documentIds: optionalStringArray(body, "documentIds") ?? [],
    })
  );
}

function readSourceModule(body: Record<string, unknown>): SrSourceModule {
  const value = requiredString(body, "sourceModule");
  switch (value) {
    case "PS01":
    case "PS04":
    case "PS05":
    case "PS06":
    case "PS08":
    case "PS09":
    case "PS10":
    case "PS11":
    case "PS12_MANUAL":
      return value;
    default:
      throw new FoundationError("VALIDATION_FAILED", "Unsupported SR source module", { field: "sourceModule" });
  }
}

function requireSrEvent(context: ApiContext, eventId: string): SrEvent {
  const event = context.services.serviceRegister.getEvent(context.scope, eventId);
  if (!event) {
    throw new FoundationError("NOT_FOUND", "SR event not found");
  }
  return event;
}

function requiredParam(params: Record<string, string>, key: string): string {
  const value = params[key];
  if (!value) {
    throw new Error(`Missing route parameter ${key}`);
  }
  return value;
}
