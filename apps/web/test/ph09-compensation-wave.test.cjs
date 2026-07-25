const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const clientSource = fs.readFileSync("apps/web/src/api/hrmsClient.ts", "utf8");
const fixtureSource = fs.readFileSync("apps/web/src/api/fixtureHrmsClient.ts", "utf8");
const appSource = fs.readFileSync("apps/web/src/App.tsx", "utf8");
const ps10Source = fs.readFileSync("apps/web/src/modules/ps10/PayrollWorkspace.tsx", "utf8");
const ps11Source = fs.readFileSync("apps/web/src/modules/ps11/PensionWorkspace.tsx", "utf8");
// URF-00R: PAYROLL_TRACE moved out of the workspace's removed evidence-line paragraph and is now
// rendered as a real payslip table caption by PayslipView (reached via PayrollRunConsole).
const payslipSource = fs.readFileSync("apps/web/src/modules/ps10/PayslipView.tsx", "utf8");

test("PH-09 client exposes compensation summary routes", () => {
  for (const marker of ["/api/v1/payroll/summary", "/api/v1/pension/summary"]) {
    assert.equal(clientSource.includes(marker), true, marker);
  }
});

test("PH-09 fixture evidence covers payroll and pension controls", () => {
  for (const marker of [
    "PAYROLL_TRACE",
    "RULE_VERSION_SNAPSHOT",
    "INPUT_LOCKED",
    "BANK_X3_EXPORT",
    "LAST_PAY_DRAWN",
    "SR_VERIFICATION_GATE",
    "QUALIFYING_SERVICE_LOCKED",
    "PENSION_CALC_TRACE",
    "PPO_ISSUED",
    "PS11_SR_POSTED",
  ]) {
    assert.equal(fixtureSource.includes(marker), true, marker);
  }
});

test("PH-09 workspace renders PS10 and PS11 compensation panels", () => {
  // URF-00R: every marker in these two lists lived inside the single developer-facing
  // `<p className="evidence-line">` paragraph that commit ce56af2 removed from both workspaces
  // in favour of SummaryStat cards. PH-10E asserts that no evidence-line marker card survives,
  // so restoring the strings would violate that test. Re-anchored to the data each workspace
  // now renders, plus the component that took ownership of the payroll trace.
  for (const marker of ["PS10", "slice.runs", "slice.disbursedRuns", "slice.lastPayDrawnFeeds"]) {
    assert.equal(ps10Source.includes(marker), true, marker);
  }
  assert.equal(payslipSource.includes("PAYROLL_TRACE"), true, "PayslipView no longer surfaces the PAYROLL_TRACE component lines");
  for (const marker of ["PS11", "slice.cases", "slice.serviceVerified"]) {
    assert.equal(ps11Source.includes(marker), true, marker);
  }
  for (const source of [ps10Source, ps11Source]) {
    assert.equal(source.includes("evidence-line"), false, "a compensation workspace re-introduced the evidence-line marker card");
  }
  for (const marker of ["PayrollWorkspace", "PensionWorkspace", 'case "/admin/payroll"', 'case "/admin/pension-retirement"']) {
    assert.equal(appSource.includes(marker), true, marker);
  }
});
