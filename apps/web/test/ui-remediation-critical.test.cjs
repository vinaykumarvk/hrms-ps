const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "../../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("UIR-06 every navigation destination has route workspace icon and permission", () => {
  const nav = read("apps/web/src/app/navigation.ts");
  const routes = read("apps/web/src/App.tsx");
  const destinations = [...nav.matchAll(/href: "([^"]+)"/g)].map((match) => match[1]);
  // W1: the count is DERIVED, not hardcoded. The full-coverage programme adds destinations wave
  // by wave (226 prototype screens), so a literal here would break on every wave and teach us to
  // bump it reflexively. The property that matters is the invariant: every declared destination
  // has a route, a workspace and an icon — whatever the count.
  assert.ok(destinations.length >= 16, "the shell must not lose destinations");
  assert.equal(new Set(destinations).size, destinations.length, "no duplicate hrefs");
  for (const destination of destinations) assert.ok(routes.includes(`case "${destination}"`), destination);
  // Scope the field counts to the primaryNavigation array: workspaceOptions also declares
  // requiredPermission, so counting across the whole file overcounts.
  const navBlock = nav.slice(nav.indexOf("export const primaryNavigation"));
  const block = navBlock.slice(0, navBlock.indexOf("\n];") + 3);
  assert.equal((block.match(/workspace: "/g) ?? []).length, destinations.length, "every destination declares a workspace");
  assert.equal((block.match(/icon: "/g) ?? []).length, destinations.length, "every destination declares an icon");
  assert.equal((block.match(/requiredPermission: "/g) ?? []).length, destinations.length, "every destination declares a permission");
});

test("UIR-06 shell has accessible mobile disclosure and active navigation", () => {
  const shell = read("apps/web/src/app/AppShell.tsx");
  // URF-00R: the disclosure button's label was made more specific ("Open navigation menu").
  for (const marker of ["aria-expanded", 'aria-label="Open navigation menu"', "<Drawer", 'aria-current={item.href === activePath', 'aria-label="Main navigation"']) assert.ok(shell.includes(marker), marker);
});

test("UIR-06 login blocks double submit clears errors and has no unsupported reset control", () => {
  const login = read("apps/web/src/app/LoginPanel.tsx");
  for (const marker of ["if (submitting) return", "disabled={submitting}", "Signing in…", "setRejected(false)", "aria-describedby", "aria-invalid"]) assert.ok(login.includes(marker), marker);
  assert.doesNotMatch(login, /Forgot password/);
});

test("UIR-06 terminal workflow and payroll actions have explicit dialogs", () => {
  const workflow = read("apps/web/src/workflow/TaskActionPanel.tsx");
  const config = read("apps/web/src/workflow/WorkflowConfigConsole.tsx");
  const payroll = read("apps/web/src/modules/ps10/PayrollRunConsole.tsx");
  assert.match(workflow, /Cancel this workflow/);
  assert.match(config, /Publish workflow configuration/);
  assert.match(config, /exportEvidence/);
  assert.match(payroll, /Confirm payroll lifecycle action/);
  assert.match(payroll, /\["lock-inputs", "lock", "disburse"\]/);
});

