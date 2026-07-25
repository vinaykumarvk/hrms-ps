const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createFoundationServices,
  ph03Ids,
} = require("../../../dist/apps/api/src");

/**
 * CC-019 — PS07 duplicate-nomination guard (uq_training_nominations).
 * CC-021 — PS13 grantSecurityClearance idempotency (ck_clearance_unique_active).
 *
 * Both were re-opened on main by ADR-005; the fixes existed only on the retired
 * origin/feature/dev branch.
 */

function actor(extra = {}) {
  return {
    tenantId: ph03Ids.tenant,
    entityId: ph03Ids.entity,
    userId: "user-cc019",
    actorUserId: "user-cc019",
    permissions: ["*"],
    roles: ["hr_admin"],
    fieldGrants: [],
    correlationId: "corr-cc019",
    ...extra,
  };
}

/* ── CC-019 ─────────────────────────────────────────────────────────────── */

function openSession(services, capacity = 5) {
  return services.training.createSession(actor(), {
    programCode: "PROG-CC019",
    title: "CC-019 duplicate nomination fixture",
    capacity,
  });
}

test("CC-019 nominating the same employee to the same session twice is rejected", () => {
  const services = createFoundationServices();
  const session = openSession(services);

  const first = services.training.nominate(actor(), { sessionId: session.id, employeeId: ph03Ids.employee });
  assert.equal(first.status, "PENDING_L1");

  assert.throws(
    () => services.training.nominate(actor(), { sessionId: session.id, employeeId: ph03Ids.employee }),
    (error) => {
      assert.equal(error.code, "CONFLICT", "a duplicate nomination is a 409 CONFLICT");
      assert.equal(error.details?.messageId, "ERR-PS07-DUPLICATE-NOMINATION");
      return true;
    },
    "the second nomination for the same (session, employee) must fail closed"
  );
});

test("CC-019 the rejected duplicate creates no nomination and no second workflow instance", () => {
  const services = createFoundationServices();
  const session = openSession(services);

  services.training.nominate(actor(), { sessionId: session.id, employeeId: ph03Ids.employee });
  const tasksAfterFirst = services.workflow.listTasks(actor()).length;

  assert.throws(() => services.training.nominate(actor(), { sessionId: session.id, employeeId: ph03Ids.employee }));

  // The duplicate must not leave a second WF-PS07-NOMINATION instance behind. Before the fix it
  // did, so the duplicate could be approved independently and consume a second capacity seat.
  // The guard runs before workflow.start, so no new approval task may appear.
  assert.equal(
    services.workflow.listTasks(actor()).length,
    tasksAfterFirst,
    "the rejected duplicate must not start a second nomination workflow"
  );
});

test("CC-019 the same employee may still be nominated to a different session", () => {
  const services = createFoundationServices();
  const first = openSession(services);
  const other = services.training.createSession(actor(), {
    programCode: "PROG-CC019-B",
    title: "CC-019 second session",
    capacity: 5,
  });

  services.training.nominate(actor(), { sessionId: first.id, employeeId: ph03Ids.employee });
  const second = services.training.nominate(actor(), { sessionId: other.id, employeeId: ph03Ids.employee });

  assert.equal(second.status, "PENDING_L1");
  assert.notEqual(second.sessionId, first.id, "the guard is scoped to (session, employee), not to the employee alone");
});

/* ── CC-021 ─────────────────────────────────────────────────────────────── */

function grant(services, overrides = {}) {
  return services.documentVault.grantSecurityClearance(actor(), {
    principalType: "USER",
    principalRef: "user-cc021-subject",
    clearanceLevel: "CONFIDENTIAL",
    justification: "CC-021 idempotency fixture",
    approvedBy: "user-cc021-checker",
    ...overrides,
  });
}

test("CC-021 re-granting an ACTIVE clearance returns the existing row instead of duplicating it", () => {
  const services = createFoundationServices();

  const first = grant(services);
  assert.equal(first.status, "ACTIVE");

  // Repeated grants must all resolve to the same row. saveClearance mints a fresh id per call, so
  // an identical id across attempts is proof that no duplicate ACTIVE row was written.
  const second = grant(services);
  const third = grant(services);
  assert.equal(second.id, first.id, "the re-grant returns the existing clearance");
  assert.equal(third.id, first.id, "the guard holds across repeated re-grants, not just the second");
  assert.equal(second.status, "ACTIVE");
  assert.equal(second.validFrom, first.validFrom, "the existing row is returned untouched, not re-stamped");
});

test("CC-021 a different clearance level is still a distinct grant", () => {
  const services = createFoundationServices();

  const confidential = grant(services);
  const secret = grant(services, { clearanceLevel: "SECRET" });

  assert.notEqual(secret.id, confidential.id, "the guard is scoped to (principal, level), not to the principal");
  assert.equal(secret.status, "ACTIVE");
});

test("CC-021 the maker/checker rule still fails closed and is not bypassed by the idempotency guard", () => {
  const services = createFoundationServices();

  assert.throws(
    () => grant(services, { approvedBy: actor().actorUserId }),
    (error) => {
      assert.equal(error.code, "ERR-PS13-SOD_VIOLATION");
      return true;
    },
    "self-approval must still be rejected before any idempotency short-circuit"
  );
});
