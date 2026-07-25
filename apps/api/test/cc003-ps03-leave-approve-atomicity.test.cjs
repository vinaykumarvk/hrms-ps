const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createFoundationServices,
  ph03Ids,
} = require("../../../dist/apps/api/src");

/**
 * CC-003 — PS03 leave-approve atomicity.
 *
 * The PS04 relay must run BEFORE any balance, ledger or status mutation.
 *
 * The defect: repository.findApplication returns a live reference into the store, so setting
 * `application.status = "APPROVED"` was visible immediately. With the relay running afterwards, a
 * relay failure left the employee's balance debited, a DEBIT ledger entry appended, and the
 * application marked APPROVED with no ps04OutboxEventId — which then failed the
 * `status !== "SUBMITTED"` guard on retry and threw PRECONDITION_FAILED, stranding the
 * application permanently with the balance already spent.
 *
 * There is no transaction here, so ordering is the control. These tests pin the ordering by
 * observing state after a forced relay failure.
 *
 * Re-opened on main by ADR-005 (the fix existed only on the retired origin/feature/dev).
 */

function actor(extra = {}) {
  return {
    tenantId: ph03Ids.tenant,
    entityId: ph03Ids.entity,
    userId: "user-cc003",
    actorUserId: "user-cc003",
    permissions: ["*"],
    roles: ["hr_admin"],
    fieldGrants: [],
    correlationId: "corr-cc003",
    ...extra,
  };
}

function submitLeave(services) {
  return services.leave.submit(actor(), {
    employeeId: ph03Ids.employee,
    leaveTypeId: "EL",
    fromDate: "2026-07-13",
    toDate: "2026-07-15",
    reason: "CC-003 atomicity fixture",
  });
}

function snapshot(services) {
  const balance = services.leave.getBalance(actor(), ph03Ids.employee, "EL", 2026);
  return {
    reserved: balance.reserved,
    debited: balance.debited,
    availableBalance: balance.availableBalance,
    version: balance.version,
    ledgerEntries: services.leave.listLedger(actor()).length,
    debitEntries: services.leave.listLedger(actor()).filter((e) => e.entryType === "DEBIT").length,
    statuses: services.leave.listApplications(actor()).map((a) => a.status),
  };
}

test("CC-003 a PS04 relay failure leaves balance, ledger and application status untouched", () => {
  const services = createFoundationServices();
  const submitted = submitLeave(services);
  const applicationId = submitted.application.id;

  const before = snapshot(services);
  assert.equal(before.debited, 0, "precondition: nothing debited yet");
  assert.deepEqual(before.statuses, ["SUBMITTED"], "precondition: application is SUBMITTED");

  services.leaveSrRelay.relayEvent = () => {
    throw new Error("PS04 relay unavailable");
  };

  assert.throws(
    () => services.leave.approve(actor(), applicationId, "idem-cc003-1"),
    /PS04 relay unavailable/,
    "the relay failure must propagate rather than being swallowed"
  );

  const after = snapshot(services);
  assert.equal(after.debited, before.debited, "balance must not be debited when the relay fails");
  assert.equal(after.reserved, before.reserved, "reservation must be left intact when the relay fails");
  assert.equal(after.availableBalance, before.availableBalance, "available balance must not move");
  assert.equal(after.version, before.version, "balance version must not be bumped");
  assert.equal(after.ledgerEntries, before.ledgerEntries, "no ledger entry may be appended");
  assert.equal(after.debitEntries, 0, "no DEBIT ledger entry may be appended when the relay fails");
  assert.deepEqual(after.statuses, ["SUBMITTED"], "the application must remain SUBMITTED");
});

test("CC-003 the approve is still retryable after a relay failure, and settles correctly", () => {
  const services = createFoundationServices();
  const submitted = submitLeave(services);
  const applicationId = submitted.application.id;

  const originalRelay = services.leaveSrRelay.relayEvent.bind(services.leaveSrRelay);
  services.leaveSrRelay.relayEvent = () => {
    throw new Error("PS04 relay unavailable");
  };
  assert.throws(() => services.leave.approve(actor(), applicationId, "idem-cc003-2"), /PS04 relay unavailable/);

  // This is the regression that mattered: before the fix the retry threw PRECONDITION_FAILED
  // ("Only submitted leave can be approved") because the status had already been flipped, leaving
  // the application unapprovable with its balance already spent.
  services.leaveSrRelay.relayEvent = originalRelay;
  const approved = services.leave.approve(actor(), applicationId, "idem-cc003-2");

  assert.equal(approved.application.status, "APPROVED");
  assert.ok(approved.srEventId, "the SR event id is recorded on the retried approve");
  assert.ok(approved.application.ps04OutboxEventId, "the PS04 outbox event id is recorded");

  const after = snapshot(services);
  assert.equal(after.debited, 3, "the retry debits exactly once");
  assert.equal(after.reserved, 0, "the reservation is released exactly once");
  assert.equal(after.debitEntries, 1, "exactly one DEBIT ledger entry exists after the retry — the failed attempt appended none");
});

test("CC-003 a successful approve is unchanged by the reordering", () => {
  const services = createFoundationServices();
  const submitted = submitLeave(services);

  const approved = services.leave.approve(actor(), submitted.application.id, "idem-cc003-3");

  assert.equal(approved.application.status, "APPROVED");
  assert.ok(approved.srEventId);
  assert.equal(approved.outboxEvent.srEventId, approved.srEventId);

  const after = snapshot(services);
  assert.equal(after.debited, 3);
  assert.equal(after.reserved, 0);
  assert.equal(after.availableBalance, 27);
  assert.equal(after.debitEntries, 1);

  // submit appends RESERVATION, approve appends DEBIT.
  const ledger = services.leave.listLedger(actor());
  assert.deepEqual(ledger.map((e) => e.entryType), ["RESERVATION", "DEBIT"]);
  const debit = ledger.find((e) => e.entryType === "DEBIT");
  assert.equal(debit.units, 3);
  assert.equal(debit.balanceAfter, 27, "the ledger still records the post-debit balance");
});
