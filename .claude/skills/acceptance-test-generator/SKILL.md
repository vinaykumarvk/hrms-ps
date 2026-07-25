---
name: acceptance-test-generator
description: "Generate black-box acceptance and E2E cases directly from requirements. Use after LLD or whenever the independent oracle is missing."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Acceptance Test Generator

Produce requirement-derived tests independent of the LLD:
- happy paths;
- failure paths;
- authorization matrix coverage;
- boundary/data integrity cases;
- cross-requirement workflows;
- UI/E2E flows where applicable.

Do not invent vague acceptance criteria. If requirements are not testable, route back to Gate A remediation. These tests are oracle artefacts and are blocked in repair mode.

## Real-fixture binding (MANDATORY)

**Background.** Parsers and integrations that pass every synthetic test routinely crash on the first real customer file — real-world files carry format quirks (e.g. empty inline-string cells a spreadsheet library rejects) that hand-built minimum fixtures never exercise. Example (from a past project): 12 synthetic parser tests all passed while the first real uploaded workbook crashed the importer. This section closes that gap.

Rule: when the user provides exemplar artefacts during Stage 1, they MUST be consumed by at least one acceptance case.

1. **Locate fixtures.** Read `docs/spec/fixtures/<feature>/` for any files the user supplied at Stage 1 — sample XLSX, JSON payloads, PDF templates, screenshots, etc. The `feature-life-cycle` skill is responsible for prompting the user and saving these at run start; this skill consumes them.

2. **Generate at least one "real-fixture round-trip" case per affected FR.** For every FR whose `Backend Flow` or `Data Operations` touches an external file format, payment payload, API integration, or report generation, emit a case shaped like:
   ```yaml
   - id: AC-FR-XXX-001-real-fixture
     fr: FR-XXX-001
     given: The operator uploads docs/spec/fixtures/<feature>/<real_sample_file>
     when:  An authorized user hits the feature's validate/upload endpoint
     then:
       - response.statusCode === 200
       - response.validation.rowCount > 0
       - response.validation.issueCodes does NOT include the generic parse-failure code
       - response.validation.issueCodes does NOT include the empty-input code
       - the actual error from the parser library is captured if a fallback fires
   ```
   The case is a **mandatory failure-mode probe** — if it fails, the parser is wrong or the validator is mis-aligned, and Stage 8 must hold until fixed.

3. **Negative cases on the same fixture.** For every real-fixture round-trip case, emit a paired negative case where the fixture is corrupted (truncated, wrong magic bytes, oversized) to confirm the error message is captured and structured.

4. **No silent skips.** If `docs/spec/fixtures/<feature>/` is empty AND the feature involves file/payload/integration work, emit a WARN in the test plan: "No real fixture provided for FR-XXX; happy path covered by synthetic-only test." This forces the gap to be visible to the human reviewer at Stage 6a.

5. **Fixture coverage report.** Emit `docs/tests/fixture-coverage.md` listing every fixture and the test cases that consume it. Stage 9 quality-gate-checker reads this file.
