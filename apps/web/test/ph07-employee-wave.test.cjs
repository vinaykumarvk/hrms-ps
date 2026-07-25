const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const clientSource = fs.readFileSync("apps/web/src/api/hrmsClient.ts", "utf8");
const fixtureSource = fs.readFileSync("apps/web/src/api/fixtureHrmsClient.ts", "utf8");
const appSource = fs.readFileSync("apps/web/src/App.tsx", "utf8");
const ps02Source = fs.readFileSync("apps/web/src/modules/ps02/PersonalDetailsWorkspace.tsx", "utf8");
const ps03Source = fs.readFileSync("apps/web/src/modules/ps03/LeaveWorkspace.tsx", "utf8");
const ps04Source = fs.readFileSync("apps/web/src/modules/ps04/LeaveSrRelayWorkspace.tsx", "utf8");

test("PH-07 client exposes PS02, PS03 payroll, and PS04 relay routes", () => {
  for (const marker of [
    "/api/v1/personal-details/change-requests",
    "/api/v1/atl/payroll-signals",
    "/api/v1/leave-sr/outbox",
    "/api/v1/leave-sr/reconciliation",
  ]) {
    assert.equal(clientSource.includes(marker), true, marker);
  }
});

test("PH-07 fixture evidence covers PS01 ownership, READY_FOR_PS10, and PS04 DLQ", () => {
  for (const marker of ["PS01", "READY_FOR_PS10", "PS04", "deadLettered"]) {
    assert.equal(fixtureSource.includes(marker), true, marker);
  }
});

test("PH-07 workspace renders PS02, PS03, and PS04 wave panels", () => {
  for (const marker of ["WF-PS02-PERSONAL-DETAILS", "PS13", "PS01"]) {
    assert.equal(ps02Source.includes(marker), true, marker);
  }
  assert.equal(ps03Source.includes("READY_FOR_PS10"), true);
  // URF-00R: DEAD_LETTERED lived only in the removed `evidence-line` debug paragraph (see the
  // note in ph08-statutory-wave). The workspace now renders the dead-letter count and rate as
  // first-class UI, which is a stronger guarantee than the debug string ever was.
  for (const marker of ["PS04", "slice.deadLettered", "PS12 append"]) {
    assert.equal(ps04Source.includes(marker), true, marker);
  }
  assert.equal(ps04Source.includes("evidence-line"), false, "LeaveSrRelayWorkspace re-introduced the evidence-line marker card");
  for (const marker of ["PersonalDetailsWorkspace", "LeaveSrRelayWorkspace"]) {
    assert.equal(appSource.includes(marker), true, marker);
  }
});
