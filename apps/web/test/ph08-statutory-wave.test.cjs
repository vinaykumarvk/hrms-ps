const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const clientSource = fs.readFileSync("apps/web/src/api/hrmsClient.ts", "utf8");
const fixtureSource = fs.readFileSync("apps/web/src/api/fixtureHrmsClient.ts", "utf8");
const appSource = fs.readFileSync("apps/web/src/App.tsx", "utf8");
const ps06Source = fs.readFileSync("apps/web/src/modules/ps06/PromotionWorkspace.tsx", "utf8");
const ps07Source = fs.readFileSync("apps/web/src/modules/ps07/TrainingWorkspace.tsx", "utf8");
const ps08Source = fs.readFileSync("apps/web/src/modules/ps08/AparWorkspace.tsx", "utf8");
const ps09Source = fs.readFileSync("apps/web/src/modules/ps09/DisciplinaryWorkspace.tsx", "utf8");

test("PH-08 client exposes statutory summary routes", () => {
  for (const marker of [
    "/api/v1/promotions/summary",
    "/api/v1/training/summary",
    "/api/v1/apar/summary",
    "/api/v1/disciplinary/summary",
  ]) {
    assert.equal(clientSource.includes(marker), true, marker);
  }
});

test("PH-08 fixture evidence covers DPC, sealed cover, penalty, and SR markers", () => {
  for (const marker of [
    "DPC_QUORUM",
    "DPC_RECUSAL",
    "TRAINING_CERTIFICATION_POSTED",
    "APAR_FINAL_GRADE",
    "SEALED_COVER",
    "PS08_PS06_FEED_SUPPRESSED",
    "PS09_AUTHORITY_COMPETENCE",
    "MAJOR_PENALTY",
    "APPEAL_DECIDED",
  ]) {
    assert.equal(fixtureSource.includes(marker), true, marker);
  }
});

test("PH-08 workspace renders PS06, PS07, PS08, and PS09 statutory panels", () => {
  for (const marker of ["PS06", "DPC_QUORUM", "PS06_PAY_IMPACT_SIGNAL"]) {
    assert.equal(ps06Source.includes(marker), true, marker);
  }
  for (const marker of ["PS07", "WF-PS07-NOMINATION", "TRAINING_CERTIFICATION_POSTED"]) {
    assert.equal(ps07Source.includes(marker), true, marker);
  }
  for (const marker of ["PS08", "APAR_FINAL_GRADE", "SEALED_COVER", "PS08_PS06_FEED_SUPPRESSED"]) {
    assert.equal(ps08Source.includes(marker), true, marker);
  }
  for (const marker of ["PS09", "PS09_AUTHORITY_COMPETENCE", "CHARGE_MEMO_SERVED", "INQUIRY_REPORT", "MAJOR_PENALTY", "APPEAL_DECIDED"]) {
    assert.equal(ps09Source.includes(marker), true, marker);
  }
  for (const marker of ["PromotionWorkspace", "TrainingWorkspace", "AparWorkspace", "DisciplinaryWorkspace"]) {
    assert.equal(appSource.includes(marker), true, marker);
  }
});
