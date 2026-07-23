import { createHash } from "node:crypto";

export type CanonicalErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

/**
 * BRD PS01 named domain error codes (docs/brd/v3/PS01-employee-profile-management.md,
 * FR-EPM-015/017/018 failure handling): 403 maker==checker on a 4-eyes merge or separation
 * approval; 409 merge of conflicting ACTIVE statutory states without override; 409 merge
 * undo past the configurable window; 409 invalid §10.1 status transition (also reused for
 * promote-active with remaining STRICT gaps — the BRD registers only the 409 status there);
 * 409 archive attempted under an ACTIVE legal hold; 409 separation with open blocking
 * obligations and no override.
 */
export type PS01DomainErrorCode =
  | "SOD_VIOLATION"
  | "MERGE_CONFLICT"
  | "UNDO_EXPIRED"
  | "INVALID_STATE"
  | "LEGAL_HOLD_ACTIVE"
  | "BLOCKING_OBLIGATIONS"
  // FR-EPM-004: nominee benefit shares must sum to <= 100 per benefit type (422).
  | "VAL-NOMINEE"
  // FR-EPM-008: bank IFSC must match the RBI format (422).
  | "VAL-IFSC";

/** BRD PS03 §8 named domain error codes (docs/brd/v3/PS03-attendance-and-leave-management.md). */
export type PS03DomainErrorCode =
  | "LEAVE_OVERLAP"
  | "INSUFFICIENT_BALANCE"
  | "OPTIMISTIC_LOCK_CONFLICT"
  | "ELIGIBILITY_FAILED"
  | "ENTITLEMENT_EXCEEDED"
  | "PERIOD_ALREADY_LOCKED"
  | "WINDOW_EXPIRED"
  | "REGULARISATION_LIMIT"
  // PH-15C operational attendance core (BRD PS03 FR-01/FR-03/FR-09).
  | "VAL-PS03-SHIFT-TIMES"
  | "VAL-PS03-ROSTER-OVERLAP"
  | "DEVICE_NOT_AUTHORIZED"
  | "INVALID_PUNCH_TIME"
  | "COMP_OFF_INSUFFICIENT"
  | "COMP_OFF_EXPIRED"
  // PH-17A leave-year close + encashment (BRD PS03 FR-15/FR-16).
  | "YEAR_ALREADY_CLOSED"
  | "PENDING_LEAVE_BLOCKS_CLOSE"
  | "ENCASHMENT_CAP_EXCEEDED"
  | "NOT_ENCASHABLE"
  // PH-18B WFH / on-duty attendance exceptions (BRD PS03 FR-07/FR-08).
  | "EXCEPTION_OVERLAP"
  | "WFH_CAP_EXCEEDED"
  | "DOCUMENT_REQUIRED"
  // PH-19A blackout periods + mass-leave (BRD PS03 FR-23).
  | "BLACKOUT_PERIOD"
  | "RETURN_TO_WORK_PENDING";

/** BRD PS06 §9.4 named domain error codes (docs/brd/v3/PS06-promotion-posting-progression.md). */
export type PS06DomainErrorCode =
  | "STRENGTH_INCONSISTENT"
  | "QUOTA_SPLIT_INVALID"
  | "VACANCY_NOT_RECONCILED"
  | "SENIORITY_LIST_NOT_FINAL"
  | "QUORUM_NOT_MET"
  | "PANEL_CONFLICT_OF_INTEREST"
  | "APAR_NOT_USABLE"
  | "OWN_MERIT_MIGRATION_REQUIRED"
  | "ROSTER_POINT_OCCUPIED"
  | "ROSTER_CATEGORY_MISMATCH"
  | "EMPLOYEE_DEBARRED"
  | "ENTITY_SUB_JUDICE"
  // FR-PPP-020 rota-quota construction guards: a population entry without its recruitment-stream
  // tag and an invalid ratio/rotation-method fail closed (422, never a silent partial build).
  | "STREAM_TAG_MISSING"
  | "QUOTA_RULE_INVALID";

/**
 * BRD PS02 registered domain error codes (docs/brd/v3/PS02-personal-details-modification-workflow.md):
 * FR-PS02-019 AC3 — risk_band=BLOCKED holds any commit attempt pending fraud review
 * (412 ERR-PS02-RISKBLOCK); FR-PS02-018 AC1 — self-service on any non-ACTIVE target is
 * rejected fail-closed (403 ERR-PS02-STATUSGATE).
 */
export type PS02DomainErrorCode =
  | "ERR-PS02-RISKBLOCK"
  | "ERR-PS02-STATUSGATE"
  // PH-17B FR-015/023: apply/commit without a valid strong e-signature (409); an e-sign whose
  // method is not permitted by policy (422); a HIGH/STATUTORY self-service submit without a
  // completed step-up challenge (403).
  | "ERR-PS02-ESIGN"
  | "ERR-PS02-ESIGN-METHOD"
  | "ERR-PS02-STEPUP";

/**
 * BRD PS04 registered codes (docs/brd/v3/PS04-leave-sr-integration.md):
 * FR-PS04-02 AC3 — two PUBLISHED sr_event_mapping versions for the same
 * (leave_type_code, event_type) may never overlap effective ranges; publish is rejected
 * 409 ERR-PS04-MAPPING-OVERLAP (VAL-PS04-MAPCOVER). FR-PS04-02 AC6 — a POST_SR mapping
 * without a statutory_rule_ref citation is rejected fail-closed 422; the registered
 * validation id VAL-PS04-CITATION surfaces as the error code.
 */
export type PS04DomainErrorCode = "ERR-PS04-MAPPING-OVERLAP" | "VAL-PS04-CITATION";

/** BRD PS05 §8.2 named domain error codes (docs/brd/v3/PS05-transfer-relieving-joining-workflow.md FR-003/007/011/019/020/022 + rules 5/6). */
export type PS05DomainErrorCode =
  | "ERR-PS05-HANDOVER-DISPUTED"
  | "ERR-PS05-DEPUTATION-CAP"
  | "ERR-PS05-NOT-SERVED"
  | "ERR-PS05-QUARTER-OVERSTAY"
  // PH-16D — BRD PS05 §8.2: allotment/join to a filled vacancy (incl. join-time re-check),
  // out-of-turn counselling choice, and asymmetric mutual completion are 409 CONFLICT.
  | "ERR-PS05-VACANCY-FULL"
  | "ERR-PS05-COUNSEL-TURN"
  | "ERR-PS05-MUTUAL-PAIR";

/**
 * BRD PS07 registered validation ids surfaced as error codes (docs/brd/v3/PS07-training-skill-development.md §11):
 * FR-PS07-018 — duplicate external_reference_no for the same employee is 409 VAL-PS07-CREDREF;
 * FR-PS07-020 / integrity rule 17 — a BREACHED training_sponsorships row must emit a BOND_RECOVERY
 * cost (PS10 feed) before it can move to RECOVERED, else 409 VAL-PS07-BOND (fail closed).
 */
export type PS07DomainErrorCode = "VAL-PS07-CREDREF" | "VAL-PS07-BOND";

/** BRD PS08 §9 named domain error codes (docs/brd/v3/PS08-performance-appraisal-management.md error catalogue). */
export type PS08DomainErrorCode =
  | "ERR-PS08-WEIGHTAGE"
  | "ERR-PS08-REPWINDOW"
  // FR-PS08-09 (R1): applying a calibration recommendation that is not RATIFIED is 409 CONFLICT.
  | "ERR-PS08-RATIFY";

/** BRD PS09 §10.3 named domain error codes (docs/brd/v3/PS09-disciplinary-cases-punishment.md error catalogue). */
export type PS09DomainErrorCode =
  | "ERR-PS09-AUTHORITY-NOT-COMPETENT"
  | "ERR-PS09-CONSULTATION-PENDING"
  | "ERR-PS09-PENALTY-EXCEEDS-PROPOSED"
  | "ERR-PS09-SUBSISTENCE-OUT-OF-BOUNDS"
  | "ERR-PS09-NON-EMPLOYMENT-CERT-REQUIRED"
  | "ERR-PS09-CASE-ABATED"
  | "ERR-PS09-AUDIT-CHAIN-BROKEN"
  | "ERR-PS09-ACTOR-CONFLICT"
  | "ERR-PS09-DUE-PROCESS-INCOMPLETE"
  // FR-PS09-023: a POSH (HARASSMENT) case without a validly composed ICC cannot proceed (409).
  | "ERR-PS09-ICC-PROCEDURE-REQUIRED"
  // FR-PS09-025/DI-29: denial of a requested personal hearing without a recorded reason (422).
  | "ERR-PS09-PERSONAL-HEARING-DENIED"
  // FR-PS09-024/DI-18: resume without an open pause / malformed pause window (409).
  | "ERR-PS09-SLA-PAUSE-INVALID"
  // PH-21C FR-026: a proceeding against a retiree beyond the Rule-9 four-year bar, without the
  // required sanction, is barred (409, fail closed).
  | "ERR-PS09-RETIREE-PROCEEDING-BARRED"
  // PH-36A FR-023 BR-2: POSH conciliation may not rest on a monetary settlement (422).
  | "ERR-PS09-CONCILIATION-MONETARY";

/** BRD PS10 §12 named domain error codes (docs/brd/v3/PS10-payroll-and-benefits.md FR-01/02/04/07/09/13/14/15/16/22 error catalogue). */
export type PS10DomainErrorCode =
  | "ERR-PS10-RULE-EXPR"
  | "ERR-PS10-RATE-OVERLAP"
  | "ERR-PS10-RATE-NOTFOUND"
  | "ERR-PS10-PT-STATE"
  | "ERR-PS10-RUN-INFLIGHT"
  | "ERR-PS10-RUN-IMMUTABLE"
  | "ERR-PS10-REOPEN-BLOCKED"
  | "ERR-PS10-RECOVERY-NET"
  | "ERR-PS10-RECON-TIEOUT"
  | "ERR-PS10-RECON-UNSIGNED"
  | "ERR-PS10-RECOVERY-BARRED"
  // FR-07: missing TAX_SLAB rate rows for the regime/FY fail closed (422).
  | "ERR-PS10-TAXSLAB-NOTFOUND"
  // FR-22/§12: mutation attempted after a snapshot/cutoff freeze (409) — also thrown for
  // tax-declaration mutation after the FY proof cutoff (FR-07 AC3; no declaration-specific
  // code is registered, so the registered freeze code is reused, never a new identifier).
  | "ERR-PS10-SNAPSHOT-FROZEN"
  // FR-21: a concessional (is_concessional) perquisite valuation with no effective SBI
  // reference-rate row fails closed (422) rather than valuing the perquisite at zero.
  | "ERR-PS10-PERQ-REFRATE";

/** BRD PS11 §12 named domain error codes (docs/brd/v3/PS11-retirement-and-pension.md FR-05/06/14/19/22 error catalogue). */
export type PS11DomainErrorCode =
  | "ERR-PS11-RULE-NOT-EFFECTIVE"
  | "ERR-PS11-FACTOR-NOT-FOUND"
  | "ERR-PS11-SCHEME-MISMATCH"
  | "ERR-PS11-COMMUTATION-LIMIT"
  | "ERR-PS11-PROVISIONAL-PENDING"
  | "ERR-PS11-INVALID-ACCOUNT"
  | "ERR-PS11-ACCOUNT-VERIFY"
  // FR-12 AC1: disbursement to a SUSPENDED_NO_LC pensioner is held (409, fail closed).
  | "ERR-PS11-LC-SUSPENDED"
  // FR-13 AC4/P05: applied revision batches are immutable; corrections create a new batch.
  | "ERR-PS11-REVISION-IMMUTABLE";

/**
 * BRD PS13 §10.3 named domain error codes (docs/brd/v3/PS13-document-management-secure-storage.md):
 * 409 checked out by another user; 422 stored-bytes SHA-256 mismatch on fetch (FR-015, content
 * withheld + quarantined); 422 infected upload (FR-007/DI-11, QUARANTINED); 403 deny-by-default
 * classification gate miss (FR-006, E21 security_clearances); 403 maker==checker SoD breach on
 * disposition/clearance approval (FR-009/FR-017, DI-10/DI-16); 409 DPDP erasure overridden by
 * statutory retention / legal hold / WORM basis (FR-018, R8 precedence lattice).
 */
export type PS13DomainErrorCode =
  | "ERR-PS13-DOCUMENT_LOCKED"
  | "ERR-PS13-INTEGRITY_FAILED"
  | "ERR-PS13-MALWARE_DETECTED"
  | "ERR-PS13-CLEARANCE_INSUFFICIENT"
  | "ERR-PS13-SOD_VIOLATION"
  | "ERR-PS13-ERASURE_EXEMPTED";

/**
 * BRD PS14 §8.3 named domain error codes (docs/brd/v3/PS14-dashboard-and-analytics.md
 * FR-02/04/16/17/23): 403 small-cell suppression on a below-k cohort (FR-17, k-anonymity)
 * and its complementary suppression; 403 maker==checker scope-policy activation (FR-04 AC7);
 * 409 cross-version KPI aggregation without acknowledgement (FR-02 AC7); 404 as-of-knowledge
 * read with no snapshot known at the requested knowledge_time (FR-23).
 */
export type PS14DomainErrorCode =
  | "ERR-PS14-SMALL-CELL"
  | "ERR-PS14-COMP-SUPPRESS"
  | "ERR-PS14-SCOPE-CHECKER"
  | "ERR-PS14-XVER-AGG"
  | "ERR-PS14-ASOF-NA";

export type WireErrorCode =
  | CanonicalErrorCode
  | PS01DomainErrorCode
  | PS02DomainErrorCode
  | PS03DomainErrorCode
  | PS04DomainErrorCode
  | PS06DomainErrorCode
  | PS05DomainErrorCode
  | PS07DomainErrorCode
  | PS08DomainErrorCode
  | PS09DomainErrorCode
  | PS10DomainErrorCode
  | PS11DomainErrorCode
  | PS13DomainErrorCode
  | PS14DomainErrorCode;

export interface TenantScope {
  tenantId: string;
  entityId?: string;
  actorUserId?: string;
  correlationId?: string;
}

export interface ActorContext extends TenantScope {
  userId: string;
  roles: string[];
  permissions: string[];
  fieldGrants?: string[];
}

export interface TenantScopedRow {
  tenantId: string;
  entityId?: string;
}

export interface ErrorEnvelope {
  error: {
    code: WireErrorCode;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

export class FoundationError extends Error {
  readonly code: WireErrorCode;
  readonly field?: string;
  readonly details?: Record<string, unknown>;

  constructor(code: WireErrorCode, message: string, options: { field?: string; details?: Record<string, unknown> } = {}) {
    super(message);
    this.name = "FoundationError";
    this.code = code;
    this.field = options.field;
    this.details = options.details;
  }
}

export function requireTenantScope(scope: TenantScope): void {
  if (!scope.tenantId) {
    throw new FoundationError("UNAUTHENTICATED", "Tenant scope is required");
  }
}

export function inScope<T extends TenantScopedRow>(row: T, scope: TenantScope): boolean {
  if (row.tenantId !== scope.tenantId) {
    return false;
  }
  return !scope.entityId || !row.entityId || row.entityId === scope.entityId;
}

export function toPublicError(error: unknown): ErrorEnvelope {
  if (error instanceof FoundationError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
        details: error.details,
      },
    };
  }
  return {
    error: {
      code: "INTERNAL",
      message: "Request failed",
    },
  };
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

/**
 * Real SHA-256 (node:crypto createHash) over the exact input bytes, hex-encoded.
 * This is the integrity-substrate hash for the PS12 ledger chains and PS13 tokens (PH-10A):
 * sha256Hex("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad".
 */
export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Real SHA-256 over raw bytes (PS13 FR-005: content_hash is computed by the service from the
 * actual stored bytes — never trusted from the caller — and re-verified on every fetch).
 */
export function sha256HexBytes(input: Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

export function pseudoHash64(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const seed = (hash >>> 0).toString(16).padStart(8, "0");
  return seed.repeat(8).slice(0, 64);
}

export function nextId(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
}

export function assertNever(value: never): never {
  throw new FoundationError("INTERNAL", `Unhandled value ${String(value)}`);
}
