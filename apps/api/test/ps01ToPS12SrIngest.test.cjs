// PH-03B: executes the compiled PS01 -> PS12 SR ingest integration cases under `npm test`.
// Typed source of truth: apps/api/src/modules/ps01/ps01ToPS12SrIngest.test.ts (typechecked + compiled by the build).
const test = require("node:test");

const { ps01ToPS12SrIngestCases } = require("../../../dist/apps/api/src/modules/ps01/ps01ToPS12SrIngest.test");

for (const testCase of ps01ToPS12SrIngestCases) {
  test(`PS01->PS12 SR ingest: ${testCase.name}`, () => {
    testCase.run();
  });
}
