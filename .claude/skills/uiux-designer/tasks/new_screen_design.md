# New Screen or Application UX Design

Use this task when the user is planning a new application, feature, or set of screens.

## Objective

Design an intuitive and accessible user flow from scratch, then produce screen-level specifications and a developer-ready handoff.

## Design workflow

### 1. Define scope and roles

Capture:

- Product/module name.
- User roles.
- Role permissions.
- Primary jobs-to-be-done.
- Business goals.
- Success metrics.
- Platform: web, responsive web, iOS, Android, desktop, internal tool, kiosk, etc.
- Known design system or component library.
- Technical and regulatory constraints.

### 2. Define information architecture

Create a simple IA:

- Main navigation sections.
- Object types and detail pages.
- Task entry points.
- Search/list views.
- Settings/admin areas.
- Notification center or activity log if relevant.

Prefer task-oriented labels over department or database labels.

### 3. Choose flow pattern

Choose based on task characteristics:

| Pattern | Use when | Avoid when |
|---|---|---|
| Wizard | Sequential, high-stakes, unfamiliar, many validations | Expert users need rapid editing across many fields |
| Single-page form | Short, familiar, low-risk data entry | Many unrelated sections or heavy validation |
| List-detail-action | Users start by finding a record | Users always create new records and rarely browse |
| Dashboard | Users monitor status and exceptions | The page becomes a dumping ground for unrelated metrics |
| Guided decision tree | Users need help selecting an option | Expert users already know the answer |
| Review-submit | Submission has consequences | Task is reversible and low-risk |

### 4. Create the screen set

For each screen, define:

- Purpose.
- User goal.
- Primary action.
- Secondary actions.
- Layout hierarchy.
- Component list.
- Content/microcopy.
- States.
- Validations.
- Accessibility.
- Analytics.
- Data/API dependencies.

### 5. Design for progressive states

Include where relevant:

- First-time/empty state.
- Loading/skeleton state.
- Partial data state.
- Validation error state.
- System error state.
- Permission denied state.
- Offline/timeout state.
- Submitted/success state.
- Draft/resume state.
- Archived/deleted state.

### 6. Design responsive behavior

For responsive web and mobile:

- Prioritize single-column layout on small screens.
- Keep primary actions visible and reachable.
- Avoid dense tables on small screens; use cards or responsive tables where appropriate.
- Ensure touch targets and spacing are adequate.
- Avoid hover-only interactions.
- Keep forms manageable with grouping and progress.

### 7. Define component inventory

List reusable components:

- Component name.
- Where used.
- Props/variants.
- States.
- Accessibility behavior.
- Design-system mapping.

Example:

| Component | Used on | Variants | States | Notes |
|---|---|---|---|---|
| Status badge | Dashboard, detail | Draft, pending, approved, rejected | default | Must not rely on color alone |

### 8. Produce final design package

Required output:

1. Product UX summary.
2. Roles and permissions.
3. Information architecture.
4. Optimized user flows.
5. Screen-by-screen specifications.
6. Component inventory.
7. States and validations.
8. Accessibility requirements.
9. Analytics/events.
10. Developer handoff JSON/YAML.
11. Acceptance criteria.

## Design rules

- One primary action per screen or screen region.
- Primary action labels should describe the result, not just “Submit.”
- Use meaningful empty states that guide the user to the next action.
- Use review screens for high-stakes submissions.
- Use inline validation for preventable errors.
- Use warning/confirmation patterns only where consequences justify them.
- Prefer system-recognized components when available.
- Design all states before handoff.
- Avoid relying on tooltip-only instructions.
- Avoid hiding required information behind hover-only controls.
