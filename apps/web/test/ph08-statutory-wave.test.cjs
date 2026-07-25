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
  // URF-00R: PS06_PAY_IMPACT_SIGNAL only ever existed inside the developer-facing
  // `<p className="evidence-line">` debug paragraph, which commit 15f0a7b removed from every
  // workspace in favour of SummaryStat cards. PH-10E now asserts the opposite of the old
  // expectation — that no `evidence-line` marker card survives — so asserting the marker string
  // here would require re-introducing what that test forbids. Re-anchored to the pay-signal
  // datum the workspace actually renders.
  for (const marker of ["PS06", "DPC_QUORUM", "slice.paySignalsReady"]) {
    assert.equal(ps06Source.includes(marker), true, marker);
  }
  assert.equal(ps06Source.includes("evidence-line"), false, "PromotionWorkspace re-introduced the evidence-line marker card");
  for (const marker of ["PS07", "WF-PS07-NOMINATION", "TRAINING_CERTIFICATION_POSTED"]) {
    assert.equal(ps07Source.includes(marker), true, marker);
  }
  // URF-00R: these marker strings are no longer hardcoded in the workspace. The evidence-line
  // paragraph that held them was removed (15f0a7b) and the workspace now renders the marker
  // VALUES reported by the API slice — a stronger guarantee, since a wrong server marker now
  // shows up in the UI instead of being masked by a literal.
  for (const marker of ["PS08", "slice.srEventType", "slice.sealedMarker", "slice.feedMarker"]) {
    assert.equal(ps08Source.includes(marker), true, marker);
  }
  // URF-00R: re-anchored to the rendered marker values (see the PS08 note above).
  for (const marker of ["PS09", "slice.competenceMarker", "slice.penaltyEventType", "slice.appealMarker"]) {
    assert.equal(ps09Source.includes(marker), true, marker);
  }
  for (const marker of ["PromotionWorkspace", "TrainingWorkspace", "AparWorkspace", "DisciplinaryWorkspace"]) {
    assert.equal(appSource.includes(marker), true, marker);
  }
});
