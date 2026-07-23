const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const files = [
  "apps/web/src/app/AppShell.tsx",
  "apps/web/src/app/WorkspaceSwitcher.tsx",
  "apps/web/src/app/navigation.ts",
  "apps/web/src/app/RouteGuard.tsx",
  "apps/web/src/app/OperationalStates.tsx",
  "apps/web/src/app/LoginPanel.tsx",
  "apps/web/src/app/session.ts",
];

const shellSource = files.map((path) => fs.readFileSync(path, "utf8")).join("\n");
const appSource = fs.readFileSync("apps/web/src/App.tsx", "utf8");

test("PH-05B shell exposes workspaces and primary navigation", () => {
  for (const marker of ["Me", "My Team", "Admin", "Inbox", "Employees", "Service Register", "Documents", "Workflow Config"]) {
    assert.equal(shellSource.includes(marker), true, marker);
  }
});

test("PH-05B shell includes guarded operational states", () => {
  for (const marker of ["loading", "empty", "error", "no-permission", "partial-data", "route guard"]) {
    assert.equal(shellSource.toLowerCase().includes(marker), true, marker);
  }
});

test("PH-05B route guard records entitlement metadata", () => {
  for (const marker of ["data-required-permission", "data-route-access", "p01.workflow.read", "required entitlement"]) {
    assert.equal(shellSource.includes(marker), true, marker);
  }
});

test("PH-05B workspace switcher is operable by buttons", () => {
  for (const marker of ["<button", "aria-current", "onWorkspaceChange", "permissions.includes"]) {
    assert.equal(shellSource.includes(marker), true, marker);
  }
  assert.equal(shellSource.includes('role="tab"'), false, "workspace controls are buttons, not incomplete ARIA tabs");
});

test("PH-05B navigation reaches all 14 module workspaces with distinct permissions", () => {
  const navSource = fs.readFileSync("apps/web/src/app/navigation.ts", "utf8");
  const modulePermissions = [
    "ps01.employee.read",
    "ps02.change.read",
    "ps03.leave.read",
    "ps04.relay.read",
    "ps05.transfer.read",
    "ps06.promotion.read",
    "ps07.training.read",
    "ps08.apar.read",
    "ps09.case.read",
    "ps10.payroll.read",
    "ps11.pension.read",
    "ps12.sr.read",
    "ps13.document.read",
    "ps14.analytics.read",
  ];
  for (const permission of modulePermissions) {
    assert.equal(navSource.includes(permission), true, `navigation missing ${permission}`);
  }
});

test("PH-05B unauthenticated visitor gets the login/sign-in state, not the shell", () => {
  for (const marker of ["readStoredSession", "if (!session)", "<LoginPanel", "onSignIn={handleSignIn}"]) {
    assert.equal(appSource.includes(marker), true, marker);
  }
  for (const marker of ["Welcome back", "Employee ID", "Password", "startEmployeeSession", "parseSessionToken", "return null"]) {
    assert.equal(shellSource.includes(marker), true, marker);
  }
});

test("PH-05B guard denies workspaces without a session grant (no wildcard, no-permission render)", () => {
  assert.equal(appSource.includes('permissions={["*"]}'), false, "App must not hardcode a wildcard grant");
  const guardedSurfaces = appSource.match(/routePage\("/g) ?? [];
  assert.equal(
    guardedSurfaces.length >= 14,
    true,
    `expected >=14 guarded surfaces, found ${guardedSurfaces.length}`
  );
  assert.equal(appSource.includes("<RouteGuard permissions={permissions} requiredPermission={permission}"), true, "route helper must enforce each permission");
  for (const marker of ["canAccess", "no-permission"]) {
    assert.equal(shellSource.includes(marker), true, `denied path missing ${marker}`);
  }
});
