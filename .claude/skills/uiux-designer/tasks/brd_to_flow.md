# BRD to Screen-by-Screen Flow

Use this task when a user provides a business requirement document, PRD, product note, user story set, or feature description and wants a UI/UX flow.

## Objective

Convert business requirements into an optimized screen-by-screen user action flow with a developer-ready UX handoff.

## Steps

### 1. Parse the document

Extract and assign stable IDs:

| Item | ID pattern | Notes |
|---|---|---|
| Business objectives | `OBJ-001` | Why the feature exists |
| User roles/personas | `ROLE-001` | Who uses it |
| User goals/tasks | `GOAL-001` | What users need to accomplish |
| Functional requirements | `REQ-001` | What the system must do |
| Business rules | `RULE-001` | Calculations, approvals, thresholds, sequencing |
| Data fields/entities | `DATA-001` | Inputs, outputs, records |
| Validations | `VAL-001` | Field and business validations |
| Non-functional requirements | `NFR-001` | Performance, security, accessibility, audit, compliance |
| Open questions | `Q-001` | Missing facts that may affect design |

### 2. Distinguish requirement types

Classify each requirement as:

- User-facing UI requirement.
- System workflow requirement.
- Data/API requirement.
- Role/permission requirement.
- Notification requirement.
- Reporting/admin requirement.
- Compliance/audit requirement.
- Non-UI requirement.

Do not force every requirement into a screen. Some requirements belong to backend processing, audit logs, notifications, data validation, or permissions.

### 3. Define the user task model

For each major task, answer:

- What is the user trying to accomplish?
- What is the trigger?
- What information does the user need before acting?
- What information does the system already have?
- What data must the user provide?
- What decisions must the user make?
- What confirmation or proof does the user need?
- What are the risks of a mistake?
- What is the shortest safe path?

### 4. Create the initial screen inventory

Each candidate screen must have:

- Screen ID.
- Screen name.
- Primary user goal.
- Primary action.
- Required data.
- Next screen.
- Requirement IDs.

Merge or split candidate screens based on user cognition, not document sections.

### 5. Create flow alternatives

For important features, consider at least two approaches:

- **Linear wizard**: best for high-stakes, sequential, long, or unfamiliar tasks.
- **Single-page/editable form**: best for short or familiar tasks.
- **Dashboard + detail pages**: best for monitoring and managing many records.
- **Search/list + detail + action**: best for workflows that start by locating an item.
- **Progressive disclosure**: best when advanced options are rare.

Choose the approach that minimizes user effort while protecting against errors.

### 6. Evaluate and optimize

Use the scorecard in `templates/heuristic_scorecard.csv`.

Common optimization moves:

- Put the most common path first.
- Hide irrelevant fields until needed.
- Default known values.
- Replace free text with structured choices only when it improves accuracy.
- Replace long dropdowns with search/autocomplete when lists are large.
- Add a review screen before final submit for high-risk data.
- Add autosave or save draft for long flows.
- Put destructive actions away from primary flows.
- Use inline validation and immediate feedback.
- Surface system status after every action.
- Make error recovery obvious.

### 7. Produce the final BRD-to-flow output

Required sections:

1. Summary recommendation.
2. Requirement extraction table.
3. Assumptions and open questions.
4. User roles and primary tasks.
5. Optimized information architecture.
6. Screen-by-screen flow diagram.
7. Screen specifications.
8. States and validations.
9. Accessibility and usability notes.
10. Developer handoff JSON/YAML.
11. Acceptance criteria and test scenarios.

## Required traceability table

Use this format:

| Requirement ID | Requirement summary | UX handling | Screen/flow IDs | Notes |
|---|---|---|---|---|
| REQ-001 | User can create a request | New request flow | FLOW-001, SCR-002 to SCR-005 | Includes save draft |

## Required flow table

Use this format:

| Step | Screen ID | User action | System response | Next screen | Requirements | Edge cases |
|---:|---|---|---|---|---|---|
| 1 | SCR-001 | Selects “New request” | Shows request type options | SCR-002 | REQ-001 | Permission denied |

## Required screen table

Use this format:

| Screen ID | Name | Purpose | Primary action | Key components | States | Validations | Accessibility | Dev notes |
|---|---|---|---|---|---|---|---|---|
| SCR-003 | Request details | Capture required details | Continue | Form fields, attachments | default, error, loading | Required fields, file size | Labels, focus order, error association | POST draft, upload endpoint |

## BRD interpretation rules

- Treat ambiguous BRD statements as design risks, not final requirements.
- Keep business jargon out of UI labels unless users use the same language.
- If the BRD describes organization departments or back-office steps, translate them into user-facing statuses and task outcomes.
- Do not create a separate screen for every paragraph in the BRD.
- Avoid exposing backend workflow complexity to end users.
- Use task-based navigation rather than module-based navigation when possible.
