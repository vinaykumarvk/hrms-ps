const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

/**
 * W0 — persona catalogue and persona-driven navigation (ADR-006 / D-COV-04).
 *
 * The prototype declares 22 personas and drives navigation from NAV[role]. These tests pin the
 * catalogue against that measured ground truth and pin the two rules that make the model safe:
 * navigation is permission-filtered, and admin personas do not get the Self section.
 */

const moduleCache = new Map();
function loadTsModule(candidate) {
  const resolved = path.resolve(
    ["", ".ts", ".tsx"].map((s) => `${candidate}${s}`).find((p) => fs.existsSync(p) && fs.statSync(p).isFile())
  );
  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;
  const transpiled = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const shim = { exports: {} };
  moduleCache.set(resolved, shim);
  const localRequire = (spec) =>
    spec.startsWith(".") ? loadTsModule(path.join(path.dirname(resolved), spec)) : require(spec);
  new Function("exports", "module", "require", transpiled)(shim.exports, shim, localRequire);
  return shim.exports;
}

const { personaCatalogue, personaForRoles, navigationForPersona, findPersona } = loadTsModule(
  "apps/web/src/app/personas.ts"
);
const { primaryNavigation } = loadTsModule("apps/web/src/app/navigation.ts");

/** The 22 personas the prototype's NAV declares — extracted from it, not transcribed by hand. */
const PROTOTYPE_PERSONAS = [
  "employee", "manager_l1", "hod", "hr_admin", "separation_admin", "hrbp", "office_admin",
  "finance_admin", "onboarding_admin", "leave_admin", "attendance_admin", "performance_admin",
  "document_admin", "recruiter", "recruitment_admin", "org_admin", "platform_super_admin",
  "candidate", "it_admin", "service_desk_admin", "service_desk_agent", "ceo",
];

test("W0 the persona catalogue covers every persona the prototype declares", () => {
  assert.equal(personaCatalogue.length, 22, "the prototype declares 22 personas");
  assert.deepEqual(
    personaCatalogue.map((p) => p.id),
    PROTOTYPE_PERSONAS,
    "catalogue must match the prototype's NAV keys, in order"
  );
  for (const persona of personaCatalogue) {
    assert.ok(persona.label && persona.label.length > 1, `${persona.id} needs a human label`);
  }
});

test("W0 a persona resolves from session roles, and an unknown role does not invent one", () => {
  assert.equal(personaForRoles(["leave_admin"]).id, "leave_admin");
  assert.equal(personaForRoles(["not_a_persona", "hod"]).id, "hod", "the first recognised role wins");
  assert.equal(personaForRoles(["not_a_persona"]), undefined, "an unknown role yields no persona");
  assert.equal(personaForRoles([]), undefined);
  assert.equal(findPersona("nope"), undefined);
});

test("W0 navigation is filtered by permission, not by persona alone", () => {
  const persona = findPersona("employee");
  const withNothing = navigationForPersona(primaryNavigation, [], persona);
  assert.deepEqual(withNothing, [], "no permissions must offer no destinations");

  const withOne = navigationForPersona(primaryNavigation, ["ps01.employee.read"], persona);
  const offered = withOne.flatMap((s) => s.items.map((i) => i.id));
  assert.deepEqual(offered, ["employees"], "only the permitted destination is offered");
});

test("W0 an item tagged for other personas is not offered, even with the permission", () => {
  const items = [
    { id: "a", label: "A", href: "/a", workspace: "admin", icon: "x", requiredPermission: "*", personas: ["org_admin"] },
    { id: "b", label: "B", href: "/b", workspace: "admin", icon: "x", requiredPermission: "*" },
  ];
  const asRecruiter = navigationForPersona(items, ["*"], findPersona("recruiter"));
  assert.deepEqual(asRecruiter.flatMap((s) => s.items.map((i) => i.id)), ["b"], "untagged items stay universal");

  const asOrgAdmin = navigationForPersona(items, ["*"], findPersona("org_admin"));
  assert.deepEqual(asOrgAdmin.flatMap((s) => s.items.map((i) => i.id)), ["a", "b"]);
});

test("W0 admin personas do not receive the Self section (prototype OPEN-FS-FND-05)", () => {
  const items = [
    { id: "self", label: "My profile", href: "/me/x", workspace: "me", icon: "x", requiredPermission: "*", section: "Self" },
    { id: "ops", label: "Ops", href: "/admin/x", workspace: "admin", icon: "x", requiredPermission: "*", section: "Operations" },
  ];
  const employee = navigationForPersona(items, ["*"], findPersona("employee"));
  assert.ok(employee.some((s) => s.section === "Self"), "a self-service persona keeps Self");

  const orgAdmin = navigationForPersona(items, ["*"], findPersona("org_admin"));
  assert.equal(orgAdmin.some((s) => s.section === "Self"), false, "an admin persona drops Self");
  assert.ok(orgAdmin.some((s) => s.section === "Operations"), "but keeps its own sections");
});

test("W0 the existing 16-item navigation is unchanged when no persona is known", () => {
  const all = navigationForPersona(primaryNavigation, ["*"], undefined);
  const offered = all.flatMap((s) => s.items.map((i) => i.id));
  assert.equal(offered.length, primaryNavigation.length, "every existing item still resolves");
  assert.deepEqual(offered, primaryNavigation.map((i) => i.id), "and in the same order");
});
