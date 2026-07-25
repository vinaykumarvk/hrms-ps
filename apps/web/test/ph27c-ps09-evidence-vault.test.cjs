// PH-27C — PS09 disciplinary evidence-vault listing UI (FR-014).
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const comp = fs.readFileSync("apps/web/src/modules/ps09/EvidenceVaultList.tsx", "utf8");
const client = fs.readFileSync("apps/web/src/api/hrmsClient.ts", "utf8");
const fixture = fs.readFileSync("apps/web/src/api/fixtureHrmsClient.ts", "utf8");
const app = fs.readFileSync("apps/web/src/App.tsx", "utf8");
test("PH-27C evidence-vault list is a real controlled surface using the client with canonical states", () => {
  // URF-00R: the bare `onClick=` marker is re-anchored to the DataTable interaction wiring. The
  // list moved to the shared DataTable, so row interaction (sort/page) is delivered through
  // `callbacks={tableCallbacks}` rather than a hand-rolled click handler. Form submission and
  // preventDefault are unchanged in this component.
  for (const m of ["<form", "onSubmit={handleSubmit}", "callbacks={tableCallbacks}", "event.preventDefault()", "useState", "listCaseEvidence"]) {
    assert.equal(comp.includes(m), true, `list missing ${m}`);
  }
  for (const m of ['"loading"', '"error"', '"empty"', "OperationalState"]) {
    assert.equal(comp.includes(m), true, `list missing state ${m}`);
  }
});
test("PH-27C client + fixture expose listCaseEvidence and the list is mounted", () => {
  assert.equal(client.includes("listCaseEvidence"), true);
  assert.equal(fixture.includes("listCaseEvidence"), true);
  assert.equal(app.includes("EvidenceVaultList"), true);
});
