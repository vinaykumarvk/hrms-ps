---
name: phased-planner
description: "Create a dependency-ordered build plan. Use after LLD and acceptance generation."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Phased Planner

Produce `docs/spec/phased-plan.yaml`.

Order work as: CONFLICT/migration → PARTIAL modifications → MISSING data → service → API → UI → integration. Record dependencies and parallelizable groups. Each phase must list requirements, files expected, generated tests, review criteria, and rollback/retry policy.
