const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// W8 — the role-composed home shell composes persona + permissions into a landing page.
const cache = new Map();
function load(c){
  const r=path.resolve(["",".ts",".tsx"].map(x=>c+x).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile()));
  if(cache.has(r))return cache.get(r).exports;
  const out=ts.transpileModule(fs.readFileSync(r,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const sh={exports:{}};cache.set(r,sh);
  const req=s=>s.startsWith(".")?load(path.join(path.dirname(r),s)):require(s);
  new Function("exports","module","require",out)(sh.exports,sh,req);return sh.exports;
}
const { composeHome } = load("apps/web/src/modules/home/HomeWorkspace.tsx");
const { primaryNavigation } = load("apps/web/src/app/navigation.ts");

test("W8 home composes only the destinations the permissions grant", () => {
  const { sections } = composeHome(primaryNavigation, ["ps01.employee.read"], []);
  const ids = sections.flatMap(s => s.items.map(i => i.id));
  assert.deepEqual(ids, ["employees"], "only the permitted destination appears");
});

test("W8 home resolves the persona from roles and drops Self for admin personas", () => {
  const asOrgAdmin = composeHome(primaryNavigation, ["*"], ["org_admin"]);
  assert.equal(asOrgAdmin.persona.id, "org_admin");
  assert.equal(asOrgAdmin.sections.some(s => s.section === "Self"), false, "admin persona drops Self");

  const asEmployee = composeHome(primaryNavigation, ["*"], ["employee"]);
  assert.equal(asEmployee.persona.id, "employee");
  assert.ok(asEmployee.sections.some(s => s.section === "Self"), "self-service persona keeps Self");
});

test("W8 home lists the workspaces the session can enter", () => {
  const { workspaces } = composeHome(primaryNavigation, ["workspace.me", "workspace.admin"], []);
  assert.deepEqual(workspaces, ["me", "admin"], "only entered workspaces, in canonical order");
});

test("W8 home is empty when nothing is permitted", () => {
  const { sections } = composeHome(primaryNavigation, [], []);
  assert.deepEqual(sections, []);
});
