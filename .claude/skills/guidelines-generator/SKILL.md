---
name: guidelines-generator
description: "Create the coding, UI, security, and performance guidelines used by LLD generation and review. Use after architecture is defined or when standards change."
allowed-tools: Read Write Edit Bash Glob Grep
---

# Guidelines Generator

Produce `docs/spec/guidelines.yaml` and optional rendered reports.

Guidelines must be build-time inputs, not review-only advice. Include exact patterns for layering, imports, error handling, logging, async work, UI states, accessibility, security controls, pagination, indexes, response-time targets, and forbidden shortcuts.

Every guideline rule should have an ID so LLDs and reviews can cite it.
