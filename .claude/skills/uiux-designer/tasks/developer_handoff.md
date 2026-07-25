# Developer Handoff

Use this task when the UX design must be consumed by a development skill, engineering team, or implementation workflow.

## Objective

Create a structured handoff that removes ambiguity and preserves design intent.

## Required handoff outputs

A complete handoff includes both human-readable specs and a machine-readable JSON/YAML file.

### Human-readable sections

1. Scope and assumptions.
2. Requirements traceability.
3. User roles and permissions.
4. Flow diagrams.
5. Screen specifications.
6. Component inventory.
7. States and validations.
8. Accessibility requirements.
9. Analytics/events.
10. Acceptance criteria.
11. Open questions.

### Machine-readable sections

Use `templates/developer_handoff.schema.json` as the target structure.

Top-level fields:

- `version`
- `product`
- `scope`
- `platforms`
- `assumptions`
- `open_questions`
- `roles`
- `requirements`
- `flows`
- `screens`
- `components`
- `global_accessibility`
- `analytics_events`
- `acceptance_criteria`

## ID conventions

Use stable IDs:

| Entity | Pattern |
|---|---|
| Objective | `OBJ-001` |
| Requirement | `REQ-001` |
| Rule | `RULE-001` |
| Validation | `VAL-001` |
| Flow | `FLOW-001` |
| Screen | `SCR-001` |
| Component | `CMP-001` |
| State | `STATE-001` |
| Analytics event | `EVT-001` |
| Acceptance criterion | `AC-001` |
| Open question | `Q-001` |

## Screen handoff details

Every screen should define:

```yaml
id: SCR-001
name: Dashboard
purpose: Help users see work status and start common tasks.
user_goal: Understand what needs attention and begin a request.
entry_points:
  - Login success
exit_points:
  - SCR-002
primary_action:
  label: New request
  destination: SCR-002
secondary_actions:
  - label: View all requests
    destination: SCR-006
layout:
  regions:
    - Header with page title and primary action
    - Status summary cards
    - Recent requests table
components:
  - CMP-001
  - CMP-002
states:
  - default
  - loading
  - empty
  - error
validations: []
accessibility:
  focus_order: Header, New request, status cards, table filters, table rows
  announcements:
    - Loading status updates should be announced politely.
analytics_events:
  - EVT-001
requirements:
  - REQ-001
acceptance_criteria:
  - AC-001
```

## Flow handoff details

Each flow must include:

- Entry trigger.
- Actor.
- Ordered steps.
- Screen IDs.
- User action.
- System response.
- Next screen.
- Alternate paths.
- Exception paths.
- Exit criteria.

Example:

```yaml
id: FLOW-001
name: Create request
actor_role_id: ROLE-001
trigger: User needs to create a request.
entry_screen: SCR-001
steps:
  - order: 1
    screen_id: SCR-001
    user_action: Select New request.
    system_response: Display request type selection.
    next_screen_id: SCR-002
    requirement_ids: [REQ-001]
alternate_paths:
  - name: Save draft
    starts_at_screen_id: SCR-003
    result: Draft is saved and user returns to dashboard.
exception_paths:
  - name: Permission denied
    starts_at_screen_id: SCR-001
    result: User sees permission guidance and cannot start flow.
```

## Acceptance criteria format

Each criterion should be testable:

```yaml
id: AC-001
screen_id: SCR-003
requirement_ids: [REQ-002]
statement: When a required field is blank and the user selects Continue, the field shows an inline error and focus moves to the error summary.
priority: must
```

## Handoff verification checklist

Before finalizing:

- All flow screen references exist.
- All screen requirement references exist.
- Every screen has at least one entry point and one exit point, unless it is a terminal screen.
- Every interactive screen has at least one state.
- Every form has validation and error handling.
- Every destructive action has confirmation or undo.
- Accessibility notes are specific, not generic.
- Acceptance criteria are testable.
- Open questions are isolated and do not block implementation without being called out.

## Validator

When producing a JSON file, run:

```bash
python scripts/validate_handoff.py path/to/handoff.json
```

The validator checks common structural issues but does not replace human UX review.
