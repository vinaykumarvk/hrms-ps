// PH-16E — PS07 credential verification + service bonds, PS08 calibration/PIP/probation at BRD depth.
//   PS07 FR-018: credential_verifications is an append-only ledger; VAL-PS07-CREDREF rejects a
//     duplicate external_reference_no for the same employee; verifier SoD bars the submitter.
//   PS07 FR-020: training_sponsorships bonds — BREACHED computes bond_recovery_amount and a
//     BREACHED bond only moves to RECOVERED once its BOND_RECOVERY cost (the PS10 feed) exists
//     (VAL-PS07-BOND, fail closed).
//   PS08 FR-09: calibration is a RATIFIED recommendation — the certified grade changes only via a
//     RATIFIED calibration_recommendations row; applying an unratified one fails ERR-PS08-RATIFY;
//     VAL-DISTRIB is a diagnostic, never a quota.
//   PS08 FR-13: performance_improvement_plans header + pip_milestones lifecycle to an outcome.
//   PS08 FR-21: probation_confirmations decision lifecycle; cumulative extension is capped by
//     probation_extension_max_months.
const test = require("node:test");
const assert = require("node:assert/strict");

const { createFoundationServices, ph03Ids } = require("../../../dist/apps/api/src");

const SUBMITTER = "user-ph16e-submitter";
const VERIFIER = "user-ph16e-verifier";
const COMMITTEE = "user-ph16e-committee";
const RATIFIER = "user-ph16e-ratifier";

function actor(userId, extra = {}) {
  return {
    tenantId: ph03Ids.tenant,
    entityId: ph03Ids.entity,
    userId,
    actorUserId: userId,
    permissions: ["*"],
    roles: ["hr_admin"],
    fieldGrants: ["*"],
    correlationId: "corr-ph16e",
    ...extra,
  };
}

// ── PS07 credentials ──────────────────────────────────────────────────────────

test("PS07 credential_verifications: duplicate external ref fails closed (VAL-PS07-CREDREF)", () => {
  const s = createFoundationServices();
  const base = {
    employeeId: ph03Ids.employee,
    title: "PMP",
    issuingBody: "PMI",
    externalReferenceNo: "PMI-12345",
    issueDate: "2026-01-10",
  };
  s.training.captureExternalCredential(actor(SUBMITTER), base);
  assert.throws(
    () => s.training.captureExternalCredential(actor(SUBMITTER), { ...base, title: "PMP (dup)" }),
    (err) => err.code === "VAL-PS07-CREDREF"
  );
});

test("PS07 credential_verifications: verifier SoD bars the submitter", () => {
  const s = createFoundationServices();
  const { credential } = s.training.captureExternalCredential(actor(SUBMITTER), {
    employeeId: ph03Ids.employee,
    title: "CISA",
    issuingBody: "ISACA",
    externalReferenceNo: "ISACA-777",
    issueDate: "2026-02-01",
  });
  // A distinct principal reviews, then the SUBMITTER attempts to verify their own capture -> SoD denial.
  s.training.reviewCredentialEvidence(actor(VERIFIER), credential.id, { reviewedOn: "2026-02-03" });
  assert.throws(
    () => s.training.verifyExternalCredential(actor(SUBMITTER), credential.id, { verifiedOn: "2026-02-05", idempotencyKey: "idem-ph16e-sod" }),
    (err) => err.code === "FORBIDDEN"
  );
  // The authorized verifier succeeds and the ledger records the terminal action.
  const ok = s.training.verifyExternalCredential(actor(VERIFIER), credential.id, { verifiedOn: "2026-02-05", idempotencyKey: "idem-ph16e-ok" });
  assert.equal(ok.credential.verificationStatus, "VERIFIED");
  const ledger = s.training.listCredentialVerifications(actor(VERIFIER), credential.id);
  assert.ok(ledger.some((row) => row.verificationAction === "VERIFIED"));
});

// ── PS07 service bonds ────────────────────────────────────────────────────────

function activeBond(s) {
  const sp = s.training.createSponsorship(actor(SUBMITTER), {
    employeeId: ph03Ids.employee,
    sponsoredAmountPaise: 12_00_000,
    startDate: "2026-01-01",
    serviceBondMonths: 24,
    externalCourseName: "MSc Public Policy",
  });
  s.training.sanctionSponsorship(actor(RATIFIER), sp.id);
  s.training.activateSponsorshipBond(actor(RATIFIER), sp.id, { completionDate: "2026-03-01" });
  return sp;
}

test("PS07 VAL-PS07-BOND: a BREACHED bond cannot move to RECOVERED without its BOND_RECOVERY cost", () => {
  const s = createFoundationServices();
  const sp = activeBond(s);
  s.training.markSponsorshipBreached(actor(RATIFIER), sp.id, { breachDate: "2026-09-01" });
  // No BOND_RECOVERY cost emitted yet -> fail closed.
  assert.throws(
    () => s.training.markSponsorshipRecovered(actor(RATIFIER), sp.id),
    (err) => err.code === "VAL-PS07-BOND"
  );
  // After emitting the PS10 feed cost, RECOVERED is allowed.
  const cost = s.training.emitBondRecoveryCost(actor(RATIFIER), sp.id);
  assert.equal(cost.costType, "BOND_RECOVERY");
  const recovered = s.training.markSponsorshipRecovered(actor(RATIFIER), sp.id);
  assert.equal(recovered.obligationStatus, "RECOVERED");
});

// ── PS08 calibration ──────────────────────────────────────────────────────────

test("PS08 ERR-PS08-RATIFY: an unratified calibration recommendation cannot be applied", () => {
  const s = createFoundationServices();
  const session = s.apar.createCalibrationSession(actor(RATIFIER), {
    cycleId: "cycle-ph16e",
    orgUnitScope: ph03Ids.orgRevenue,
    method: "COMMITTEE_REVIEW",
    committeeMemberIds: [COMMITTEE],
    targetDistribution: { "3": 60, "4": 30, "5": 10 },
  });
  const rec = s.apar.proposeCalibrationRecommendation(actor(COMMITTEE), session.id, {
    formId: "form-ph16e-1",
    currentGrade: 3,
    recommendedGrade: 4,
    rationale: "Sustained over-target delivery across the review window.",
  });
  // Applying before ratification is fail-closed.
  assert.throws(
    () => s.apar.applyCalibrationAdjustment(actor(RATIFIER), session.id, rec.id),
    (err) => err.code === "ERR-PS08-RATIFY"
  );
  // A committee member cannot ratify their own recommendation (SoD).
  assert.throws(
    () => s.apar.ratifyCalibrationRecommendation(actor(COMMITTEE), session.id, rec.id),
    (err) => err.code === "FORBIDDEN"
  );
  // The authority ratifies; the adjustment then applies.
  s.apar.ratifyCalibrationRecommendation(actor(RATIFIER), session.id, rec.id);
  const adj = s.apar.applyCalibrationAdjustment(actor(RATIFIER), session.id, rec.id);
  assert.equal(adj.appliedGrade, 4);
  assert.equal(adj.status, "APPLIED");
  // VAL-DISTRIB stays diagnostic-only.
  const diag = s.apar.calibrationDistributionDiagnostic(actor(RATIFIER), session.id);
  assert.equal(diag.diagnostic, "VAL-DISTRIB");
});

// ── PS08 PIP ──────────────────────────────────────────────────────────────────

test("PS08 performance_improvement_plans: milestone lifecycle to an outcome", () => {
  const s = createFoundationServices();
  const { pip, milestones } = s.apar.createPip(actor(RATIFIER), {
    appraiseeId: ph03Ids.employee,
    reason: "Below-benchmark delivery in H1.",
    successCriteria: "Meet all H2 milestones.",
    startDate: "2026-07-01",
    targetEndDate: "2026-10-01",
    milestones: [{ title: "Clear backlog", dueDate: "2026-08-01", metric: "0 open items" }],
  });
  assert.equal(pip.status, "ACTIVE");
  assert.equal(milestones.length, 1);
  s.apar.updatePipMilestone(actor(RATIFIER), pip.id, milestones[0].id, { status: "MET", progressNote: "Backlog cleared." });
  const closed = s.apar.closePip(actor(RATIFIER), pip.id, { outcome: "SUCCESSFUL", outcomeSummary: "All milestones met." });
  assert.equal(closed.status, "CLOSED");
  assert.equal(closed.outcome, "SUCCESSFUL");
});

// ── PS08 probation ─────────────────────────────────────────────────────────────

test("PS08 probation_confirmations: extension respects probation_extension_max_months cap", () => {
  const s = createFoundationServices();
  // Cap of 6 months (service default). First 4-month extension is allowed; a further 4 breaches the cap.
  const conf = s.apar.openProbationConfirmation(actor(RATIFIER), {
    appraiseeId: ph03Ids.employee,
    probationEndDate: "2026-12-31",
    probationPeriodMonths: 24,
  });
  const extended = s.apar.decideProbation(actor(RATIFIER), conf.id, { outcome: "EXTENDED", extensionMonths: 4 });
  assert.equal(extended.extensionMonthsTotal, 4);
  assert.throws(
    () => s.apar.decideProbation(actor(RATIFIER), conf.id, { outcome: "EXTENDED", extensionMonths: 4 }),
    (err) => err.code === "VALIDATION_FAILED"
  );
  // A confirming decision is terminal.
  const confirmed = s.apar.decideProbation(actor(RATIFIER), conf.id, { outcome: "CONFIRMED", effectiveDate: "2027-01-01" });
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal(confirmed.probationOutcome, "CONFIRMED");
});
