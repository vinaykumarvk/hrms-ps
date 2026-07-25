const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const clientSource = fs.readFileSync("apps/web/src/api/hrmsClient.ts", "utf8");
const fixtureSource = fs.readFileSync("apps/web/src/api/fixtureHrmsClient.ts", "utf8");
const appSource = fs.readFileSync("apps/web/src/App.tsx", "utf8");
const contactsSource = fs.readFileSync("apps/web/src/modules/ps01/EmployeeContactsPanel.tsx", "utf8");
const dependentsSource = fs.readFileSync("apps/web/src/modules/ps01/EmployeeDependentsPanel.tsx", "utf8");
const editorSource = fs.readFileSync("apps/web/src/modules/ps02/ChangeRequestEditor.tsx", "utf8");
const queueSource = fs.readFileSync("apps/web/src/modules/ps02/ChangeRequestApproverQueue.tsx", "utf8");
const diffSource = fs.readFileSync("apps/web/src/modules/ps02/ChangeRequestDiffView.tsx", "utf8");
const selfServiceSource = fs.readFileSync("apps/web/src/modules/ps03/SelfServiceSummary.tsx", "utf8");

test("PH-07E PS01 contact and dependent panels are real controlled forms with submit handlers", () => {
  for (const [name, source, method] of [
    ["EmployeeContactsPanel", contactsSource, "addEmployeeContact"],
    ["EmployeeDependentsPanel", dependentsSource, "addEmployeeDependent"],
  ]) {
    for (const marker of ["<form", "<input", method, "crypto.randomUUID()"]) {
      assert.equal(source.includes(marker), true, `${name} missing ${marker}`);
    }
    // URF-00R: these two panels now use different idioms — EmployeeContactsPanel is still on
    // useState + an explicit preventDefault, EmployeeDependentsPanel was migrated to useForm,
    // whose handleSubmit calls preventDefault internally. Assert the property both must hold
    // (a bound submit handler that suppresses the native submit) rather than one spelling.
    assert.match(source, /onSubmit=\{handle\w*\}/, `${name} has no bound submit handler`);
    assert.match(
      source,
      /event\.preventDefault\(\)|form\.handleSubmit\(/,
      `${name} does not suppress native submission`
    );
    assert.match(source, /useState|useForm\(/, `${name} holds no field state`);
    for (const marker of ['"loading"', '"error"', '"empty"', "OperationalState"]) {
      assert.equal(source.includes(marker), true, `${name} missing canonical state ${marker}`);
    }
  }
});

test("PH-07E PS02 change-request editor submits through the client and surfaces error envelopes", () => {
  for (const marker of [
    "<form",
    // URF-00R: re-anchored after the useForm migration. form.handleSubmit() owns preventDefault
    // and the submitting phase, so the component no longer spells either one itself.
    "onSubmit={handleFormSubmit}",
    "form.handleSubmit(",
    "createPersonalDetailChangeRequest",
    "crypto.randomUUID()",
    "form.isSubmitting",
    '"error"',
    '"success"',
    'role="alert"',
  ]) {
    assert.equal(editorSource.includes(marker), true, `ChangeRequestEditor missing ${marker}`);
  }
});

test("PH-07E PS02 approver queue wires approve/reject/send-back with a mandatory comment", () => {
  for (const marker of [
    "listPersonalDetailChangeRequests",
    "decidePersonalDetailChangeRequest",
    '"approve"',
    '"reject"',
    '"send-back"',
    "ERR-REASON-REQ",   // client-side validation message, legitimately spelled in the component
    "<button",
    "onClick",
  ]) {
    assert.equal(queueSource.includes(marker), true, `ChangeRequestApproverQueue missing ${marker}`);
  }
  // URF-00R: ERR-PS02-SOD is emitted by the API (apps/api/src/modules/ps02/changeGovernanceService.ts),
  // not authored in the component. The only occurrence here was a doc comment, removed by 5bf0e8e.
  // Assert the mechanism that actually surfaces it — the server's displayCode is rendered rather
  // than swallowed — which also covers every other governance code the API can return.
  assert.match(
    queueSource,
    /HrmsApiError\s*\?\s*\w+\.displayCode/,
    "ChangeRequestApproverQueue no longer surfaces the API error code (ERR-PS02-SOD reaches the user through displayCode)"
  );
  assert.match(queueSource, /state\.errorCode/, "ChangeRequestApproverQueue does not render the error code it captured");
  for (const marker of ['"loading"', '"error"', '"empty"', "OperationalState"]) {
    assert.equal(queueSource.includes(marker), true, `ChangeRequestApproverQueue missing canonical state ${marker}`);
  }
});

test("PH-07E PS02 diff view renders the masked field-level diff exactly as the API returns it", () => {
  for (const marker of ["getPersonalDetailChangeRequestDiff", "field.masked", "field.oldValue", "field.newValue", '"loading"', '"error"', '"empty"']) {
    assert.equal(diffSource.includes(marker), true, `ChangeRequestDiffView missing ${marker}`);
  }
  assert.equal(queueSource.includes("ChangeRequestDiffView"), true, "approver queue does not mount the diff view");
});

test("PH-07E PS03 SelfServiceSummary fetches balances and applications via the client", () => {
  for (const marker of ["SelfServiceSummary", "getLeaveBalance", "listLeaveApplications", '"loading"', '"error"', '"empty"', "OperationalState"]) {
    assert.equal(selfServiceSource.includes(marker), true, `SelfServiceSummary missing ${marker}`);
  }
});

test("PH-07E App mounts the interactive employee-wave surfaces behind route guards", () => {
  for (const marker of [
    "EmployeeContactsPanel",
    "EmployeeDependentsPanel",
    "ChangeRequestEditor",
    "ChangeRequestApproverQueue",
    "SelfServiceSummary",
  ]) {
    assert.equal(appSource.includes(marker), true, `App missing ${marker}`);
  }
});

test("PH-07E fixture client implements the new interactive methods statefully", () => {
  for (const marker of [
    "listEmployeeContacts",
    "addEmployeeContact",
    "listEmployeeDependents",
    "addEmployeeDependent",
    "listPersonalDetailChangeRequests",
    "createPersonalDetailChangeRequest",
    "decidePersonalDetailChangeRequest",
    "getPersonalDetailChangeRequestDiff",
    "getLeaveBalance",
    "ERR-REASON-REQ",
  ]) {
    assert.equal(fixtureSource.includes(marker), true, `fixture missing ${marker}`);
  }
});

// --- Behavioural coverage: transpile the real TS client and exercise the new methods against a stubbed fetch ---

function loadHrmsClientModule() {
  const ts = require("typescript");
  const transpiled = ts.transpileModule(clientSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const moduleShim = { exports: {} };
  new Function("exports", "module", "require", transpiled)(moduleShim.exports, moduleShim, require);
  return moduleShim.exports;
}

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("PH-07E addEmployeeContact POSTs the PH-07A contacts route with an Idempotency-Key", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method, headers: new Headers(init.headers), body: JSON.parse(init.body) });
      return jsonResponse(201, { contact: { id: "cont-1", contactType: "MOBILE", contactValue: "+91-1", isPrimary: true } });
    },
  });

  const result = await client.addEmployeeContact("emp-1", { contactType: "MOBILE", contactValue: "+91-1", isPrimary: true }, "idem-ph07e-001");
  assert.equal(result.contact.id, "cont-1");
  assert.equal(calls[0].url, "/api/v1/employees/emp-1/contacts");
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.get("Idempotency-Key"), "idem-ph07e-001");
  assert.equal(calls[0].body.contactType, "MOBILE");
});

test("PH-07E addEmployeeDependent POSTs the PH-07A dependents route", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
      return jsonResponse(201, { dependent: { id: "dep-1", fullName: "Meera Rao", relationship: "SPOUSE" } });
    },
  });

  const result = await client.addEmployeeDependent("emp-1", { fullName: "Meera Rao", relationship: "SPOUSE", isLegalHeir: true }, "idem-ph07e-002");
  assert.equal(result.dependent.fullName, "Meera Rao");
  assert.equal(calls[0].url, "/api/v1/employees/emp-1/dependents");
  assert.equal(calls[0].body.isLegalHeir, true);
});

test("PH-07E createPersonalDetailChangeRequest POSTs the PS02 create route", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
      return jsonResponse(201, { request: { id: "ps02-1", requestNo: "PS02/00002", status: "IN_REVIEW", sensitivity: "LOW" } });
    },
  });

  const result = await client.createPersonalDetailChangeRequest(
    { employeeId: "emp-1", fieldCode: "displayName", newValue: "Ananya R. Rao", reason: "Gazette correction" },
    "idem-ph07e-003"
  );
  assert.equal(result.request.requestNo, "PS02/00002");
  assert.equal(calls[0].url, "/api/v1/personal-details/change-requests");
  assert.equal(calls[0].body.fieldCode, "displayName");
});

test("PH-07E decidePersonalDetailChangeRequest POSTs :send-back with the mandatory comment", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
      return jsonResponse(202, { request: { id: "ps02-1", requestNo: "PS02/00002", status: "RETURNED" } });
    },
  });

  const result = await client.decidePersonalDetailChangeRequest("ps02-1", "send-back", "Attach the gazette copy", "idem-ph07e-004");
  assert.equal(result.request.status, "RETURNED");
  assert.equal(calls[0].url, "/api/v1/personal-details/change-requests/ps02-1:send-back");
  assert.equal(calls[0].body.comment, "Attach the gazette copy");
});

test("PH-07E a missing decision comment surfaces the ERR-REASON-REQ envelope via messageId", async () => {
  const { createHrmsClient, HrmsApiError } = loadHrmsClientModule();
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async () =>
      jsonResponse(400, {
        error: { code: "VALIDATION_FAILED", message: "A decision comment is required", details: { messageId: "ERR-REASON-REQ" } },
      }),
  });

  await assert.rejects(
    () => client.decidePersonalDetailChangeRequest("ps02-1", "reject", undefined, "idem-ph07e-005"),
    (error) => {
      assert.equal(error instanceof HrmsApiError, true);
      assert.equal(error.code, "VALIDATION_FAILED");
      assert.equal(error.messageId, "ERR-REASON-REQ");
      assert.equal(error.displayCode, "ERR-REASON-REQ");
      return true;
    }
  );
});

test("PH-07E getPersonalDetailChangeRequestDiff GETs the diff route and keeps masked values as returned", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), method: init?.method });
      return jsonResponse(200, {
        changeRequestId: "ps02-1",
        requestNo: "PS02/00002",
        status: "IN_REVIEW",
        revisionNo: 1,
        fields: [{ fieldCode: "pan", displayLabel: "PAN", sensitivity: "HIGH", oldValue: "[HIDDEN]", newValue: "[HIDDEN]", masked: true }],
      });
    },
  });

  const diff = await client.getPersonalDetailChangeRequestDiff("ps02-1");
  assert.equal(calls[0].url, "/api/v1/change-requests/ps02-1/diff");
  assert.equal(diff.fields[0].masked, true);
  assert.equal(diff.fields[0].oldValue, "[HIDDEN]");
  assert.equal(diff.fields[0].newValue, "[HIDDEN]");
});

test("PH-07E getLeaveBalance GETs the leave-balances route with query filters", async () => {
  const { createHrmsClient } = loadHrmsClientModule();
  const calls = [];
  const client = createHrmsClient({
    tokenProvider: () => "session-token-123",
    fetcher: async (url) => {
      calls.push({ url: String(url) });
      return jsonResponse(200, { balance: { employeeId: "emp-1", leaveTypeId: "EL", leaveYear: 2026, availableBalance: 27 } });
    },
  });

  const balance = await client.getLeaveBalance("emp-1", "EL");
  assert.equal(calls[0].url, "/api/v1/atl/leave-balances?employeeId=emp-1&leaveTypeId=EL");
  assert.equal(balance.availableBalance, 27);
});
