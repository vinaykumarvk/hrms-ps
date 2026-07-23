import { ErrorEnvelope, FoundationError, WireErrorCode, toPublicError } from "../platform/types";

export const canonicalApiErrorCodes: WireErrorCode[] = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "PRECONDITION_FAILED",
  "RATE_LIMITED",
  "INTERNAL",
];

export function statusForError(code: WireErrorCode): number {
  switch (code) {
    case "VALIDATION_FAILED":
      return 400;
    case "UNAUTHENTICATED":
      return 401;
    case "FORBIDDEN":
    // BRD PS13 §10.3: deny-by-default clearance gate miss (FR-006) and maker==checker
    // SoD violations on disposition/clearance approval (FR-009/FR-017) are 403.
    case "ERR-PS13-CLEARANCE_INSUFFICIENT":
    case "ERR-PS13-SOD_VIOLATION":
    // BRD PS01 FR-EPM-015/018: maker == checker on a 4-eyes merge or separation approval is 403.
    case "SOD_VIOLATION":
    // BRD PS03 FR-03: punches from unregistered/inactive devices fail closed as 403.
    case "DEVICE_NOT_AUTHORIZED":
    // BRD PS14 §8.3: a below-k cohort read (FR-17 k-anonymity, incl. its complementary
    // suppression) and a maker==checker scope-policy activation (FR-04 AC7) are 403.
    case "ERR-PS14-SMALL-CELL":
    case "ERR-PS14-COMP-SUPPRESS":
    case "ERR-PS14-SCOPE-CHECKER":
    // BRD PS02 FR-018 AC1: self-service on any non-ACTIVE employment_status_at_submit is 403.
    case "ERR-PS02-STATUSGATE":
    // BRD PS02 FR-023: a HIGH/STATUTORY self-service submit without a completed step-up is 403.
    case "ERR-PS02-STEPUP":
      return 403;
    case "NOT_FOUND":
    // BRD PS14 FR-23: no snapshot known at the requested knowledge_time is 404.
    case "ERR-PS14-ASOF-NA":
      return 404;
    case "CONFLICT":
    // BRD PS01 FR-EPM-015/017/018 failure handling: conflicting-ACTIVE-state merge without
    // override, merge undo past the window, invalid §10.1 lifecycle transition (incl.
    // promote-active with gaps), archive under an ACTIVE legal hold, and separation with
    // open blocking obligations are all 409 CONFLICT.
    case "MERGE_CONFLICT":
    case "UNDO_EXPIRED":
    case "INVALID_STATE":
    case "LEGAL_HOLD_ACTIVE":
    case "BLOCKING_OBLIGATIONS":
    case "LEAVE_OVERLAP":
    // BRD PS03 FR-01/FR-09: overlapping PUBLISHED rosters and comp-off over-balance are 409 CONFLICT.
    case "VAL-PS03-ROSTER-OVERLAP":
    case "COMP_OFF_INSUFFICIENT":
    case "INSUFFICIENT_BALANCE":
    case "OPTIMISTIC_LOCK_CONFLICT":
    case "ENTITLEMENT_EXCEEDED":
    case "PERIOD_ALREADY_LOCKED":
    case "REGULARISATION_LIMIT":
    // BRD PS03 FR-15/FR-16: closing an already-closed leave year, a close blocked by pending
    // leave, and an over-cap / non-encashable encashment are 409 CONFLICT.
    case "YEAR_ALREADY_CLOSED":
    case "PENDING_LEAVE_BLOCKS_CLOSE":
    case "ENCASHMENT_CAP_EXCEEDED":
    case "NOT_ENCASHABLE":
    // BRD PS03 FR-07/FR-08: an overlapping attendance exception and a WFH over-cap are 409 CONFLICT.
    case "EXCEPTION_OVERLAP":
    case "WFH_CAP_EXCEEDED":
    // BRD PS03 FR-23: leave inside a blackout window and an unresolved return-to-work are 409.
    case "BLACKOUT_PERIOD":
    case "RETURN_TO_WORK_PENDING":
    // BRD PS02 FR-015: applying/committing a change without a valid strong e-signature is 409.
    case "ERR-PS02-ESIGN":
    case "STRENGTH_INCONSISTENT":
    case "QUOTA_SPLIT_INVALID":
    case "VACANCY_NOT_RECONCILED":
    // BRD PS06 §9.4: DPC/roster/refusal domain failures are 409 CONFLICT.
    case "SENIORITY_LIST_NOT_FINAL":
    case "QUORUM_NOT_MET":
    case "PANEL_CONFLICT_OF_INTEREST":
    case "APAR_NOT_USABLE":
    case "OWN_MERIT_MIGRATION_REQUIRED":
    case "ROSTER_POINT_OCCUPIED":
    case "ROSTER_CATEGORY_MISMATCH":
    case "EMPLOYEE_DEBARRED":
    // BRD PS05 §8.2: handover not accepted/under-protest and relieving before proof-of-service are 409 CONFLICT.
    case "ERR-PS05-HANDOVER-DISPUTED":
    case "ERR-PS05-NOT-SERVED":
    // BRD PS05 §8.2 (PH-16D, rules 5/6 + FR-019): allotment/join to a filled vacancy (incl. the
    // join-time transactional re-check), a counselling choice attempted out of turn, and
    // asymmetric mutual completion are 409 CONFLICT.
    case "ERR-PS05-VACANCY-FULL":
    case "ERR-PS05-COUNSEL-TURN":
    case "ERR-PS05-MUTUAL-PAIR":
    // BRD PS07 FR-018/020 (PH-16E): duplicate external credential reference per employee and
    // a BREACHED bond moved to RECOVERED without its BOND_RECOVERY cost are 409 CONFLICT.
    case "VAL-PS07-CREDREF":
    case "VAL-PS07-BOND":
    // BRD PS08 §9: representation window elapsed (condonation required) is 409 CONFLICT.
    case "ERR-PS08-REPWINDOW":
    // BRD PS08 FR-09 (R1): applying an unratified calibration recommendation is 409 CONFLICT.
    case "ERR-PS08-RATIFY":
    // BRD PS09 §10.3: due-process gate violations (Art. 311(1) competence, pending consultation,
    // DI-4 penalty enhancement, abated case, broken timeline chain, actor conflict) are 409 CONFLICT.
    case "ERR-PS09-AUTHORITY-NOT-COMPETENT":
    case "ERR-PS09-CONSULTATION-PENDING":
    case "ERR-PS09-PENALTY-EXCEEDS-PROPOSED":
    case "ERR-PS09-CASE-ABATED":
    case "ERR-PS09-AUDIT-CHAIN-BROKEN":
    case "ERR-PS09-ACTOR-CONFLICT":
    case "ERR-PS09-DUE-PROCESS-INCOMPLETE":
    // BRD PS09 FR-023: POSH case without a validly composed ICC cannot proceed (fail closed).
    case "ERR-PS09-ICC-PROCEDURE-REQUIRED":
    // BRD PS09 FR-024: SLA resume without an open pause is 409 (edge case: "Resume before pause (rejected)").
    case "ERR-PS09-SLA-PAUSE-INVALID":
    // BRD PS09 FR-026: a retiree proceeding beyond the Rule-9 four-year bar (no sanction) is 409.
    case "ERR-PS09-RETIREE-PROCEEDING-BARRED":
    // BRD PS10 FR-02: overlapping effective rate rows (VAL-PS10-RATE-NONOVERLAP) are 409 CONFLICT.
    case "ERR-PS10-RATE-OVERLAP":
    // BRD PS10 §12: run/payslip lifecycle collisions are 409 CONFLICT — a second in-flight
    // FINAL run, a write to a locked run/payslip, a reopen after bank transmission, and a
    // recovery that would breach the protected net-pay floor (excess -> carryforward).
    case "ERR-PS10-RUN-INFLIGHT":
    case "ERR-PS10-RUN-IMMUTABLE":
    case "ERR-PS10-REOPEN-BLOCKED":
    case "ERR-PS10-RECOVERY-NET":
    // BRD PS10 §12: control totals that do not tie out (incl. disbursed+held+failed),
    // approval/disbursement before reconciliation sign-off, and a legally-barred recovery
    // (FR-09 AC5) are 409 CONFLICT.
    case "ERR-PS10-RECON-TIEOUT":
    case "ERR-PS10-RECON-UNSIGNED":
    case "ERR-PS10-RECOVERY-BARRED":
    // BRD PS10 §12: mutation after snapshot/cutoff freeze (incl. tax-declaration mutation
    // after the FY proof cutoff, FR-07 AC3) is 409 CONFLICT.
    case "ERR-PS10-SNAPSHOT-FROZEN":
    // BRD PS11 FR-05/FR-22: cross-scheme benefit requests and DCRG release attempts while the
    // Rule 9 proceeding is still ACTIVE are 409 CONFLICT.
    case "ERR-PS11-SCHEME-MISMATCH":
    case "ERR-PS11-PROVISIONAL-PENDING":
    // BRD PS11 §12: disbursement held for a lapsed life certificate (FR-12 AC1) and mutation
    // of an APPLIED revision batch (FR-13 AC4/P05) are 409 CONFLICT.
    case "ERR-PS11-LC-SUSPENDED":
    case "ERR-PS11-REVISION-IMMUTABLE":
    // BRD PS13 error catalogue: document checked out by another user is 409 CONFLICT.
    case "ERR-PS13-DOCUMENT_LOCKED":
    // BRD PS13 §10.3 (R8): DPDP erasure overridden by statutory retention / legal hold / WORM.
    case "ERR-PS13-ERASURE_EXEMPTED":
    // BRD PS14 FR-02 AC7: cross-version KPI aggregation without acknowledgement is 409 CONFLICT.
    case "ERR-PS14-XVER-AGG":
    // BRD PS04 FR-02 AC3 (VAL-PS04-MAPCOVER): overlapping PUBLISHED sr_event_mapping effective
    // ranges for the same (leave_type_code, event_type) are rejected at publish as 409.
    case "ERR-PS04-MAPPING-OVERLAP":
      return 409;
    case "ELIGIBILITY_FAILED":
    case "WINDOW_EXPIRED":
    // BRD PS03 FR-01/FR-03/FR-09: malformed shift timings, future-dated punches, and
    // redemption targeting an expired comp-off credit are 422 (fail closed).
    case "VAL-PS03-SHIFT-TIMES":
    case "INVALID_PUNCH_TIME":
    case "COMP_OFF_EXPIRED":
    // BRD PS05 §8.2: deputation tenure cap and quarter retention beyond limit are 422 VALIDATION_FAILED.
    case "ERR-PS05-DEPUTATION-CAP":
    case "ERR-PS05-QUARTER-OVERSTAY":
    // BRD PS08 §9: performance goal weightages != 100% at lock (VAL-WEIGHTAGE/WSUM) is 422.
    case "ERR-PS08-WEIGHTAGE":
    // BRD PS09 §10.3: subsistence rate outside template bounds (DI-8) and payment without NEC (DI-16) are 422.
    case "ERR-PS09-SUBSISTENCE-OUT-OF-BOUNDS":
    case "ERR-PS09-NON-EMPLOYMENT-CERT-REQUIRED":
    // BRD PS01 FR-EPM-004: nominee benefit shares exceeding 100% per benefit type is 422 (VAL-NOMINEE).
    case "VAL-NOMINEE":
    // BRD PS01 FR-EPM-008: a bank IFSC not matching the RBI format is 422 (VAL-IFSC).
    case "VAL-IFSC":
    // BRD PS09 FR-025 (DI-29): "Deny without reason ⇒ 422 ERR-PS09-PERSONAL-HEARING-DENIED".
    case "ERR-PS09-PERSONAL-HEARING-DENIED":
    // BRD PS09 FR-023 (BR-2): POSH conciliation resting on a monetary settlement ⇒ 422.
    case "ERR-PS09-CONCILIATION-MONETARY":
    // BRD PS06 FR-PPP-020: rota-quota input guards fail closed as 422.
    case "STREAM_TAG_MISSING":
    case "QUOTA_RULE_INVALID":
    // BRD PS10 §12: bad DSL expression (VAL-PS10-DSL-TOKEN), as-of resolution miss, and missing
    // PT state-of-posting mapping are all 422.
    case "ERR-PS10-RULE-EXPR":
    case "ERR-PS10-RATE-NOTFOUND":
    case "ERR-PS10-PT-STATE":
    // BRD PS10 FR-07: no TAX_SLAB rows for the regime/FY resolves 422 (fail closed).
    case "ERR-PS10-TAXSLAB-NOTFOUND":
    // BRD PS10 FR-21: a concessional perquisite with no effective reference-rate row is 422.
    case "ERR-PS10-PERQ-REFRATE":
    // BRD PS02 FR-015: an e-signature whose method is not permitted by policy is 422.
    case "ERR-PS02-ESIGN-METHOD":
    // BRD PS03 FR-08: an on-duty/tour exception without its mandatory order document is 422.
    case "DOCUMENT_REQUIRED":
    // BRD PS11 §12: rule-row/commutation-factor resolution misses are 422 (fail closed);
    // FR-06 AC1: an over-limit commuted fraction is 422, rejected — never clamped.
    case "ERR-PS11-RULE-NOT-EFFECTIVE":
    case "ERR-PS11-FACTOR-NOT-FOUND":
    case "ERR-PS11-COMMUTATION-LIMIT":
    // BRD PS11 FR-14: invalid destination account and a failed/absent pre-credit account
    // verification (IR16 fail-closed gate) are 422.
    case "ERR-PS11-INVALID-ACCOUNT":
    case "ERR-PS11-ACCOUNT-VERIFY":
    // BRD PS13 §10.3: infected content (FR-007, quarantined) and a stored-bytes SHA-256
    // mismatch on fetch (FR-015, content withheld + quarantined) are 422.
    case "ERR-PS13-MALWARE_DETECTED":
    case "ERR-PS13-INTEGRITY_FAILED":
    // BRD PS04 FR-02 AC6: a POST_SR mapping without its mandatory statutory_rule_ref citation
    // is rejected fail-closed; the registered validation id is the error code (422).
    case "VAL-PS04-CITATION":
      return 422;
    case "PRECONDITION_FAILED":
    // BRD PS06 §9.4: effecting blocked by an active interim stay is a 412 precondition failure.
    case "ENTITY_SUB_JUDICE":
    // BRD PS02 FR-019 AC3: risk_band=BLOCKED holds commit pending fraud review (412).
    case "ERR-PS02-RISKBLOCK":
      return 412;
    case "RATE_LIMITED":
      return 429;
    case "INTERNAL":
      return 500;
  }
}

export function publicError(error: unknown): { status: number; body: ErrorEnvelope } {
  const envelope = toPublicError(error);
  return {
    status: statusForError(envelope.error.code),
    body: envelope,
  };
}

export function unauthenticatedError(): FoundationError {
  return new FoundationError("UNAUTHENTICATED", "Authentication is required");
}
