# UX Quality Review

Use this task to critique and improve a proposed flow before final delivery.

## Objective

Turn an initial UI/UX flow into a more intuitive, accessible, and development-ready design.

## Review process

### 1. Score the current or draft flow

Use a 0 to 5 scale:

- `0`: Missing or unusable.
- `1`: Severe issues; high failure risk.
- `2`: Usable only with friction or support.
- `3`: Adequate but needs refinement.
- `4`: Good; minor improvements.
- `5`: Excellent; clear, efficient, inclusive, and ready.

Dimensions:

- Learnability.
- Efficiency.
- Navigation clarity.
- Information architecture.
- Content clarity.
- Consistency.
- Error prevention.
- Error recovery.
- Accessibility.
- Cognitive load.
- Trust and transparency.
- Developer readiness.

### 2. Identify issues

For each issue, capture:

- Issue ID.
- Screen/flow.
- Evidence.
- User impact.
- Severity.
- Recommended modification.
- Expected improvement.
- Development impact.

### 3. Apply modifications

Modify the design. Do not just recommend changes. Produce the updated flow and updated screen specs.

### 4. Re-score

Provide a before/after summary:

| Dimension | Initial score | Final score | Reason for improvement |
|---|---:|---:|---|
| Error prevention | 2 | 4 | Added inline validation, review step, and duplicate detection |

### 5. Final risks

List residual risks:

- Requires user research.
- Requires technical feasibility check.
- Requires legal/compliance review.
- Requires design-system component update.
- Requires analytics validation.

## Heuristic prompts

Ask these questions during review:

### Flow clarity

- Can users predict the next step?
- Is the primary action clear at each point?
- Can users recover from mistakes?
- Can users save progress for long tasks?
- Does the flow reveal only what is needed at each step?

### Forms

- Are fields grouped by mental model?
- Are required and optional fields clear?
- Is helper text placed where the user needs it?
- Are examples provided for unfamiliar input formats?
- Are validations immediate and actionable?
- Is there a review step for high-stakes submissions?

### Navigation

- Does the navigation match the user’s task hierarchy?
- Are breadcrumbs, progress indicators, or step labels needed?
- Is back/cancel behavior safe and predictable?
- Are exits and resumptions supported?

### Lists and dashboards

- Can users find the right record quickly?
- Are filters, sorting, and search appropriate?
- Are statuses understandable without color alone?
- Are row-level actions clear and reachable?
- Does the empty state guide the next action?

### Accessibility

- Can the task be completed without a mouse?
- Is focus visible and logical?
- Are labels and errors programmatically tied to controls?
- Are target sizes sufficient?
- Is color never the only indicator?
- Are dynamic updates announced?
- Are alternative inputs available for gestures, drag-and-drop, or authentication steps?
