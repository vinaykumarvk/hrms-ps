# Frontend Implementation

How to turn the UX spec + `design_system` tokens into working frontend code when this skill runs in Codex, Claude Code, or another implementation-capable coding agent. The spec is the *what*; this is the *how to build it without losing design intent*.

If a `frontend-design` skill is available in the environment, read it too and defer to its environment-specific styling constraints (available libraries, component conventions, rendering quirks). This reference is framework-agnostic guidance that complements it.

## Order of operations

1. **Confirm the spec is consistent.** Run `python scripts/validate_handoff.py path/to/handoff.json` on the JSON handoff first. Fix structural and cross-reference errors before writing UI — building from an inconsistent spec just moves the rework downstream.
2. **Implement the token layer before any component.** Tokens are the contract; everything references them.
3. **Build a small component foundation** (buttons, inputs, surfaces/cards, etc.) against tokens.
4. **Assemble screens** per the screen specs, implementing every listed state.
5. **Wire flows** (navigation/routing) to match the flow tables.
6. **Verify** against the acceptance criteria and the accessibility + visual gates.

## 1. Token layer first

Translate the handoff `design_system` block into the project's theming mechanism. Never hard-code colors, spacing, type sizes, radii, or durations in components — reference tokens so theming and consistency are free.

CSS custom properties (framework-agnostic), with light/dark via attribute or media query:

```css
:root {
  --color-bg: <light value>;
  --color-surface: <...>;
  --color-text: <...>;
  --color-text-muted: <...>;
  --color-border: <...>;
  --color-primary: <...>;
  --color-primary-hover: <...>;
  --color-on-primary: <...>;
  --color-danger: <...>;
  --space-1: 4px; --space-2: 8px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
  --radius-md: 8px; --radius-lg: 12px;
  --text-base: 16px; --text-lg: 18px; --text-2xl: 24px;
  --font-sans: <stack>;
  --shadow-sm: <...>; --shadow-md: <...>;
  --motion-fast: 120ms; --motion-base: 200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}
[data-theme="dark"] {
  --color-bg: <dark value>;
  --color-surface: <lifted dark>;
  /* override only what changes; surfaces lift via lightness, not shadow */
}
```

If the project uses **Tailwind**, map the same tokens into the theme config (colors, spacing, borderRadius, fontFamily, fontSize, boxShadow, transitionTimingFunction) so utility classes stay on-scale. If it uses a CSS-in-JS or component-library theme, populate that theme object from the tokens. Whatever the mechanism, **one source of truth**.

## 2. Component foundation

Build the reusable components named in the component inventory, each:

- Driven by tokens (no literal colors/spacing/sizes).
- Implementing its variants and states from the spec (default, hover, active, focus, disabled, loading, error, selected as applicable).
- Accessible by construction: real semantic elements (`button`, `a`, `label`+input association, headings in order), visible tokenized focus ring, accessible names, adequate target size.

Buttons should reflect emphasis levels (primary/secondary/ghost/danger) matching the spec's primary vs secondary action treatment — only one primary emphasis per screen region.

## 3. Screen assembly with all states

For each `SCR-***`, implement the layout regions and then **every state the spec lists** — not just the happy path:

- **loading** → skeletons that mirror the content structure (not a bare spinner), per `motion`/visual notes.
- **empty** → the helpful empty state with its guiding next action.
- **error** / **validation_error** → inline, field-associated messages plus a summary where specified; preserve user input.
- **system_error** / **offline** → recoverable messaging; don't lose work.
- **permission** → the guidance state, not a dead end.
- **success** → confirmation, announced to assistive tech where noted.

Map each state to real component state, and keep the visual treatment tokenized and consistent across screens.

## 4. Flows and navigation

Implement routing/navigation to match the flow tables: entry points, primary-action destinations, alternate paths (e.g., save-draft), and exception paths (e.g., permission denied). Back/cancel must be safe and predictable; protect destructive actions with confirmation or undo as the spec dictates.

## 5. Motion

- Use the motion tokens; animate transform/opacity, ease-out for entrances.
- Wrap non-essential motion so it's removed/reduced under `prefers-reduced-motion`:

  ```css
  @media (prefers-reduced-motion: reduce) {
    * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```

  Keep essential feedback (e.g., a state change) legible without motion.

## 6. Verification checklist

Before calling the frontend done:

- [ ] No hard-coded colors/spacing/type/radius/duration — all via tokens.
- [ ] Every screen state from the spec is implemented and reachable.
- [ ] Keyboard-only path works; focus order matches visual/task order; focus is visible.
- [ ] Contrast meets AA in both themes (if dark mode is in scope).
- [ ] Touch targets and spacing adequate; no hover-only critical interactions.
- [ ] Forms: inline validation, associated errors, preserved input, review before high-stakes submit.
- [ ] Loading uses skeletons/optimistic UI where specified, not spinners-everywhere.
- [ ] `prefers-reduced-motion` honored.
- [ ] Acceptance criteria (`AC-***`) pass.
- [ ] Visual hierarchy on each screen matches the spec's `visual` intent (right thing draws the eye first).

Building the token layer first and implementing every state are the two steps most often skipped — and the two that most determine whether the built UI matches the design.
