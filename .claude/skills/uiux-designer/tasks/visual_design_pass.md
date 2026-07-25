# Visual Design Pass

Use this task when the interaction/flow is settled but the look isn't, or when the request is primarily visual — "make it look modern," "give it a real identity," "design a token/theme system," "this works but looks plain." It takes an existing flow + screen specs and produces a deliberate aesthetic direction, a complete design-token set, applied visual hierarchy, and motion — ready for the handoff `design_system` block and implementation.

This is step 6 of the default workflow, extracted so it can run on its own.

## Objective

Make a correct experience also feel modern, intentional, and on-purpose — without weakening usability or accessibility.

## Inputs

- Existing flow and/or screen specs (from this skill or provided).
- Product purpose, audience, platform.
- Any existing brand: logo, colors, fonts, tone, or an existing design system to extend.
- Constraints: tech stack, dark-mode requirement, density needs, accessibility targets.

If brand assets exist, **extend them** rather than inventing a parallel system.

## Steps

### 1. Classify the purpose and pick an aesthetic direction

Identify the archetype(s) in `references/purpose_archetypes.md`. Choose one aesthetic direction from `references/modern_patterns.md` (functional minimal, soft/friendly, editorial, dense/professional, elevated/premium, expressive/bold) that fits the purpose and audience. State the choice and a one-line rationale. Don't default to a style by accident.

### 2. Define the token system

Following `references/visual_design_system.md`, define every token group:

- Color: neutral ramp, surface roles, one primary accent (base/hover/tint/on-accent), semantic states (strong + soft) — with **light and dark** values.
- Typography: families, modular scale, weights, line-heights, reading measure.
- Spacing scale (4/8px base), breakpoints, container widths.
- Radius scale, elevation/shadow scale, border treatment.
- Motion: durations, easings, and the reduced-motion plan.

Verify contrast (AA) as you choose colors — it's a constraint, not an afterthought.

### 3. Apply visual hierarchy per screen

For each screen, decide what the eye hits 1st/2nd/3rd and express it with size, weight, color/contrast, spacing, and elevation. Make the primary action the most prominent interactive element; demote secondary actions. Record this as the screen's `visual` intent.

### 4. Specify motion and micro-interactions

Define the meaningful transitions and feedback (hover/press, menu/sheet/toast enter-exit, state transitions, loading treatment — skeletons over spinners). Keep each short and purposeful; specify the `prefers-reduced-motion` fallback. Record per screen as `motion`.

### 5. Style the component inventory

For each reusable component, define its token-based styling, variants, and visual states (default/hover/active/focus/disabled/selected/error/loading as applicable). Note that state must never be conveyed by color alone.

### 6. Produce the visual output

1. **Aesthetic direction** — the chosen direction and rationale; reference points if useful.
2. **Design tokens** — the full set (color/type/spacing/radius/elevation/motion), light + dark, in a form devs can consume (CSS variables / theme config) and placed in the handoff `design_system` block.
3. **Per-screen visual + motion notes** — hierarchy intent, key token usage, density, transitions, reduced-motion behavior.
4. **Component styling** — token-based styling and states for each reusable component.
5. **Before/after (if restyling)** — what changed visually and why it reads as more modern (cite concrete token/component changes, not "cleaner").
6. **Visual QA** — score the *Visual hierarchy & modern aesthetic* and *Motion & feedback* rows of `templates/heuristic_scorecard.csv`; list residual risks (e.g., needs real brand assets, needs contrast check on imagery).

## Rules

- Be concrete. "Make it modern" is not an output — name the tokens, hierarchy, and components that change.
- Contrast (AA) and `prefers-reduced-motion` are hard requirements, not trade-offs.
- One confident accent; semantic states beyond color; spacing on a single scale; soft layered shadows over hard drops.
- Match the direction to the purpose archetype; don't bring editorial flourish into a dense task tool, or enterprise density into a marketing page.
- Extend an existing brand/design system if one exists; only invent a system when there isn't one.
- If the flow has a usability problem, fix it (or flag it) — don't paint over it. Visual polish on a broken flow still fails the gates in SKILL.md.
