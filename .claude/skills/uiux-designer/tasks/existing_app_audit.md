# Existing Application UX Audit and Redesign

Use this task when the user wants to assess an existing application and identify modifications that improve usability, navigation, accessibility, or conversion.

## Objective

Reconstruct the current experience, evaluate it using UX/accessibility heuristics, and produce a prioritized target-state redesign that developers can implement.

## Inputs to request or use when available

- Screenshots of key screens.
- Current user flow or route map.
- User roles and permissions.
- Most common tasks.
- Known pain points, support tickets, or user complaints.
- Analytics/drop-off data.
- Current design system/components.
- Technical constraints.

If only screenshots are available, still perform a screen-level audit and mark flow-level assumptions.

## Audit workflow

### 1. Reconstruct the current-state flow

For each screen, identify:

- Screen name and purpose.
- Entry and exit points.
- Primary and secondary actions.
- Navigation model.
- Form fields and validations visible or implied.
- Data displayed.
- Feedback/status messages.
- Error/empty/loading states if visible or absent.
- Accessibility concerns.

Create a current-state Mermaid diagram and screen inventory.

### 2. Identify user tasks and friction

For each important task, estimate:

- Number of screens.
- Number of user decisions.
- Number of required fields.
- Number of repeated inputs.
- Navigation depth.
- Places where the user may not know what to do next.
- Places where the user may make an irreversible or costly mistake.
- Places where the system fails to explain status or progress.

### 3. Run heuristic evaluation

Evaluate each screen and flow against:

- Visibility of system status.
- Match with user language and real-world workflow.
- User control and freedom.
- Consistency and standards.
- Error prevention.
- Recognition rather than recall.
- Efficiency and shortcuts for frequent users.
- Aesthetic and minimalist design.
- Error diagnosis and recovery.
- Help and contextual guidance.
- Accessibility and inclusive interaction.
- Mobile/responsive behavior when applicable.

### 4. Run accessibility review

Check at minimum:

- Color contrast risk.
- Keyboard path and focus visibility.
- Logical heading and landmark structure.
- Accessible names for controls.
- Error messages close to and programmatically associated with fields.
- Target size and spacing for touch controls.
- No color-only meaning.
- Forms have labels, helper text, examples, and required/optional clarity.
- Dynamic updates and status changes are announced.
- Complex gestures have alternatives.
- Authentication and verification flows do not rely only on memory puzzles or inaccessible challenges.

### 5. Create findings backlog

Each finding must include:

- Finding ID.
- Screen/flow affected.
- Issue.
- Evidence.
- User impact.
- Severity `P0` to `P3`.
- Recommendation.
- Development impact: low/medium/high.
- Requirement or design principle affected.

Use this format:

| ID | Area | Issue | User impact | Severity | Recommendation | Dev impact |
|---|---|---|---|---|---|---|
| UX-001 | SCR-004 Review | Submit button appears before error summary | Users may miss failed validation | P1 | Add inline errors and summary with focus management | Medium |

### 6. Redesign the target-state flow

Create an improved flow by:

- Removing unnecessary screens.
- Reordering steps around user decisions.
- Improving navigation labels.
- Introducing progress, save/resume, review, undo, or confirmation where appropriate.
- Grouping related fields.
- Replacing ambiguous controls with clearer components.
- Adding missing states.
- Improving content and microcopy.
- Aligning with the design system.

### 7. Prioritize implementation

Create three implementation bands:

- **Quick wins**: low effort, high clarity/accessibility value.
- **Core redesign**: changes needed to improve the main task flow.
- **Strategic improvements**: larger IA, component, or platform changes.

Use impact/effort/risk scoring.

## Required output

1. Current-state summary.
2. Current-state flow diagram.
3. Screen inventory.
4. UX findings backlog.
5. Accessibility findings.
6. Target-state flow diagram.
7. Screen-by-screen target-state spec.
8. Before/after comparison.
9. Implementation roadmap.
10. Developer handoff for target state.

## Before/after comparison format

| Area | Current experience | Recommended experience | Why it improves UX |
|---|---|---|---|
| Request creation | 7 screens, no save draft | 4-step wizard with autosave | Reduces cognitive load and protects progress |

## Audit rules

- Do not recommend a redesign only because the UI looks old. Tie recommendations to user outcomes.
- Avoid vague feedback such as “make it modern.” Specify the component, behavior, content, or state change.
- Identify when an issue is visual polish versus a task-completion blocker.
- If screenshots omit hover/focus/error states, mark them as unverified rather than assuming they are correct.
- Separate product decisions from UX execution issues.
