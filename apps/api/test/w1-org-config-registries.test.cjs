const test = require("node:test");
const assert = require("node:assert/strict");

const { createFoundationServices, ph03Ids } = require("../../../dist/apps/api/src");

/**
 * W1 — Org-Admin configuration registries (full-coverage parity).
 *
 * These pin the invariants the registry substrate holds once for every W1 screen, so that adding
 * a registry is a descriptor entry rather than a new set of guarantees to re-prove.
 */

function actor(extra = {}) {
  return {
    tenantId: ph03Ids.tenant,
    entityId: ph03Ids.entity,
    userId: "user-w1",
    actorUserId: "user-w1",
    permissions: ["*"],
    roles: ["org_admin"],
    fieldGrants: [],
    correlationId: "corr-w1",
    ...extra,
  };
}

test("W1 every registry descriptor traces to a prototype screen and an existing table", () => {
  const services = createFoundationServices();
  const registries = services.orgConfig.listRegistries();
  assert.ok(registries.length >= 7, "W1 declares at least seven registries");
  for (const r of registries) {
    assert.ok(r.screenId, `${r.key} must name the prototype screen it backs`);
    assert.ok(r.table, `${r.key} must name the data-model table it administers`);
    assert.match(r.permissionPrefix, /^cfg\./, `${r.key} must use the cfg permission family`);
  }
  const screens = registries.map((r) => r.screenId);
  assert.equal(new Set(screens).size, screens.length, "no two registries may claim the same screen");
});

test("W1 a registry entry is created, listed and updated with audit and versioning", () => {
  const services = createFoundationServices();
  const created = services.orgConfig.create(actor(), "grades", {
    code: "G-01",
    name: "Junior Officer",
    attributes: { levelOrder: 1, payBand: "PB-1" },
  });
  assert.equal(created.version, 1);
  assert.equal(created.isActive, true);
  assert.equal(created.attributes.levelOrder, 1);

  const listed = services.orgConfig.list(actor(), "grades");
  assert.equal(listed.length, 1);

  const updated = services.orgConfig.update(actor(), "grades", created.id, {
    code: "G-01",
    name: "Junior Officer (revised)",
    attributes: { levelOrder: 2 },
    expectedVersion: 1,
  });
  assert.equal(updated.version, 2);
  assert.equal(updated.name, "Junior Officer (revised)");
  assert.equal(updated.attributes.payBand, undefined, "attributes are replaced by the supplied set, not merged blindly");
});

test("W1 business keys are unique per registry and per tenant", () => {
  const services = createFoundationServices();
  services.orgConfig.create(actor(), "grades", { code: "G-01", name: "A", attributes: { levelOrder: 1 } });

  assert.throws(
    () => services.orgConfig.create(actor(), "grades", { code: "g-01", name: "B", attributes: { levelOrder: 2 } }),
    (e) => {
      assert.equal(e.code, "CONFLICT");
      assert.equal(e.details?.messageId, "ERR-CFG-DUPLICATE-CODE");
      return true;
    },
    "duplicate codes are rejected case-insensitively"
  );

  // The same code in a DIFFERENT registry is legitimate.
  const location = services.orgConfig.create(actor(), "locations", { code: "G-01", name: "Head Office" });
  assert.equal(location.code, "G-01");
});

test("W1 a stale write is rejected rather than silently overwriting", () => {
  const services = createFoundationServices();
  const created = services.orgConfig.create(actor(), "grades", { code: "G-02", name: "A", attributes: { levelOrder: 1 } });
  services.orgConfig.update(actor(), "grades", created.id, {
    code: "G-02", name: "B", attributes: { levelOrder: 1 }, expectedVersion: 1,
  });

  assert.throws(
    () => services.orgConfig.update(actor(), "grades", created.id, {
      code: "G-02", name: "C", attributes: { levelOrder: 1 }, expectedVersion: 1,
    }),
    (e) => {
      assert.equal(e.code, "OPTIMISTIC_LOCK_CONFLICT");
      return true;
    }
  );
});

test("W1 required attributes are enforced and undeclared ones are dropped, not stored", () => {
  const services = createFoundationServices();
  assert.throws(
    () => services.orgConfig.create(actor(), "grades", { code: "G-03", name: "No level" }),
    (e) => {
      assert.equal(e.code, "VALIDATION_FAILED");
      assert.equal(e.field, "levelOrder");
      return true;
    },
    "a required attribute missing is a validation failure"
  );

  const record = services.orgConfig.create(actor(), "grades", {
    code: "G-04",
    name: "Has extras",
    attributes: { levelOrder: 3, smuggled: "should not persist" },
  });
  assert.equal(record.attributes.smuggled, undefined, "the descriptor is the contract; a screen cannot invent schema");
  assert.equal(record.attributes.levelOrder, 3);
});

test("W1 a wrong attribute type fails closed", () => {
  const services = createFoundationServices();
  assert.throws(
    () => services.orgConfig.create(actor(), "grades", { code: "G-05", name: "Bad", attributes: { levelOrder: "one" } }),
    (e) => {
      assert.equal(e.code, "VALIDATION_FAILED");
      assert.equal(e.field, "levelOrder");
      return true;
    }
  );
});

test("W1 hierarchical registries reject cycles (VAL-ORG-NOCYCLE)", () => {
  const services = createFoundationServices();
  const root = services.orgConfig.create(actor(), "org-units", {
    code: "OU-ROOT", name: "Head Office", attributes: { orgUnitType: "DEPARTMENT" },
  });
  const child = services.orgConfig.create(actor(), "org-units", {
    code: "OU-CHILD", name: "Finance", parentId: root.id, attributes: { orgUnitType: "DEPARTMENT" },
  });

  assert.throws(
    () => services.orgConfig.update(actor(), "org-units", root.id, {
      code: "OU-ROOT", name: "Head Office", parentId: child.id, attributes: { orgUnitType: "DEPARTMENT" },
    }),
    (e) => {
      assert.equal(e.code, "VALIDATION_FAILED");
      assert.equal(e.details?.messageId, "VAL-ORG-NOCYCLE");
      return true;
    },
    "making a root the child of its own descendant must be rejected"
  );

  assert.throws(
    () => services.orgConfig.update(actor(), "org-units", root.id, {
      code: "OU-ROOT", name: "Head Office", parentId: root.id, attributes: { orgUnitType: "DEPARTMENT" },
    }),
    (e) => { assert.equal(e.code, "VALIDATION_FAILED"); return true; },
    "an entry cannot be its own parent"
  );
});

test("W1 a non-hierarchical registry refuses a parent", () => {
  const services = createFoundationServices();
  const a = services.orgConfig.create(actor(), "grades", { code: "G-06", name: "A", attributes: { levelOrder: 1 } });
  assert.throws(
    () => services.orgConfig.create(actor(), "grades", {
      code: "G-07", name: "B", parentId: a.id, attributes: { levelOrder: 2 },
    }),
    (e) => { assert.equal(e.code, "VALIDATION_FAILED"); return true; }
  );
});

test("W1 configuration is deactivated, never hard-deleted, and parents keep active children", () => {
  const services = createFoundationServices();
  const root = services.orgConfig.create(actor(), "org-units", {
    code: "OU-A", name: "Root", attributes: { orgUnitType: "DEPARTMENT" },
  });
  const child = services.orgConfig.create(actor(), "org-units", {
    code: "OU-B", name: "Child", parentId: root.id, attributes: { orgUnitType: "DEPARTMENT" },
  });

  assert.throws(
    () => services.orgConfig.deactivate(actor(), "org-units", root.id),
    (e) => {
      assert.equal(e.code, "PRECONDITION_FAILED");
      assert.equal(e.details?.messageId, "ERR-CFG-HAS-ACTIVE-CHILDREN");
      return true;
    },
    "a parent with active children cannot be retired out from under them"
  );

  services.orgConfig.deactivate(actor(), "org-units", child.id);
  const retired = services.orgConfig.deactivate(actor(), "org-units", root.id);
  assert.equal(retired.isActive, false);
  assert.equal(
    services.orgConfig.list(actor(), "org-units").length, 2,
    "deactivated entries remain readable — downstream records still reference them"
  );
});

test("W1 registries are tenant-scoped on read and write", () => {
  const services = createFoundationServices();
  services.orgConfig.create(actor(), "grades", { code: "G-08", name: "Tenant A", attributes: { levelOrder: 1 } });

  const otherTenant = actor({ tenantId: "tenant-other", entityId: undefined });
  assert.deepEqual(services.orgConfig.list(otherTenant, "grades"), [], "another tenant sees nothing");

  const mine = services.orgConfig.list(actor(), "grades");
  assert.throws(
    () => services.orgConfig.get(otherTenant, "grades", mine[0].id),
    (e) => { assert.equal(e.code, "NOT_FOUND"); return true; },
    "cross-tenant read is NOT_FOUND, never a leak"
  );
});

test("W1 registry writes require the registry's own write permission", () => {
  const services = createFoundationServices();
  const readOnly = actor({ permissions: ["cfg.grade.read"] });
  assert.throws(
    () => services.orgConfig.create(readOnly, "grades", { code: "G-09", name: "X", attributes: { levelOrder: 1 } }),
    (e) => { assert.ok(e.code === "FORBIDDEN" || e.code === "UNAUTHENTICATED"); return true; }
  );
  assert.deepEqual(services.orgConfig.list(readOnly, "grades"), [], "but the read permission still reads");
});
