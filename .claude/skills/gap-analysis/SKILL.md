---
name: gap-analysis
description: "Map signed-off specification to an existing codebase. Use before LLD on brownfield systems to classify requirements as EXISTS, PARTIAL, MISSING, or CONFLICT."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Gap Analysis

Produce `docs/spec/gap-analysis.yaml`.

For every requirement:
- EXISTS: implemented; cite files/tests.
- PARTIAL: implemented but needs change; cite gap.
- MISSING: new work.
- CONFLICT: existing code contradicts the signed spec.

Update `docs/spec/spec-graph.json` with discovered code/test nodes. Do not re-implement EXISTS items. Put CONFLICT items before new work in the phased plan.
