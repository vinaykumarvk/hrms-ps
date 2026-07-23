// PH-03B: executes the compiled PS12 SR semantic-dedup cases under `npm test`.
// Typed source of truth: apps/api/src/modules/ps12/srSemanticDedup.test.ts (typechecked + compiled by the build).
const test = require("node:test");

const { srSemanticDedupCases } = require("../../../dist/apps/api/src/modules/ps12/srSemanticDedup.test");

for (const testCase of srSemanticDedupCases) {
  test(`PS12 SR semantic-dedup: ${testCase.name}`, () => {
    testCase.run();
  });
}
