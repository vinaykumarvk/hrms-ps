# Visual Design System

The visual layer that makes a correct flow also feel modern and intentional. Read this for step 6 of the workflow on any user-facing work. The output of this reference is a **design-token set** plus hierarchy, theming, and motion decisions that go into the handoff `design_system` block and, when implementation is requested, into the actual frontend.

Principle: **decide tokens once, reference them everywhere.** Ad-hoc colors, spacing, and type are the single biggest cause of an interface looking amateur. Modern UI is mostly disciplined application of a small, coherent token set — not visual tricks.

## Contents

1. Color
2. Typography
3. Spacing & layout grid
4. Radius
5. Elevation & depth
6. Borders & dividers
7. Motion tokens
8. Visual hierarchy
9. Theming & dark mode
10. Emitting tokens for developers
11. Token checklist

---

## 1. Color

Define color as **roles**, not raw hex scattered through screens. A modern palette is small and purposeful.

Build these groups:

- **Neutrals** — a ramp of ~9–12 steps from background to strongest text. This is 80% of most interfaces. Don't use pure `#000`/`#FFF` for large surfaces; slightly warm or cool neutrals read as more considered.
- **Brand / primary accent** — one accent that owns the primary action and key emphasis. Provide a base, a hover/active (darker or more saturated), and a subtle tint (for selected/hover backgrounds).
- **Semantic state colors** — success, warning, danger, info. Each needs a strong (text/icon/border) and a soft (background) variant.
- **Surface roles** — `background` (app canvas), `surface` (cards/sheets), `surface-raised` (popovers/menus). In light mode these get progressively lighter or carry elevation; in dark mode they get progressively *lighter*, not darker.

Name by role so the intent survives into code:

```
color.bg            color.surface          color.surface-raised
color.text          color.text-muted       color.text-subtle
color.border        color.border-strong
color.primary       color.primary-hover    color.primary-tint    color.on-primary
color.success / success-bg   color.warning / warning-bg
color.danger  / danger-bg    color.info / info-bg
color.focus-ring
```

Rules:

- **Contrast is non-negotiable and is also an aesthetic asset.** Body text ≥ 4.5:1 against its surface; large text and UI/icons ≥ 3:1 (WCAG AA). Don't sacrifice legibility for a trendy low-contrast look.
- **60-30-10**: ~60% neutral surface, ~30% secondary/supporting, ~10% accent. Accent everywhere = accent nowhere.
- Convey state with **more than color** (icon + text + color), so color-blind and grayscale viewers aren't excluded.
- Prefer one accent. A second accent is a deliberate decision (e.g., a distinct "new/AI" affordance), not decoration.

## 2. Typography

Typography carries most of the perceived quality and most of the hierarchy.

- **Families.** One workhorse sans for UI is enough for most products (system stack or a modern grotesque/geometric like Inter, Geist, or similar). Add a second family only for intentional contrast — e.g., a serif or display face for editorial/marketing headings. Keep total families ≤ 2 for product UI.
- **Type scale.** Use a consistent ratio, not arbitrary sizes. A modular scale (≈1.2 minor third for dense UI, ≈1.25 major third for marketing) keeps sizes harmonious. Define named steps and stick to them:

  ```
  text.xs 12  ·  text.sm 14  ·  text.base 16  ·  text.lg 18
  text.xl 20  ·  text.2xl 24 ·  text.3xl 30  ·  text.4xl 36  ·  text.display 48+
  ```

- **Weights.** Establish a small set (e.g., 400 body, 500 medium for labels/emphasis, 600–700 for headings). Weight is a cheaper, cleaner hierarchy tool than size alone.
- **Line-height.** Body ≈ 1.5; headings tighter ≈ 1.1–1.25. Tighten tracking slightly on large headings; never letterspace body text.
- **Measure.** Keep body line length ≈ 50–75 characters for readability; constrain content columns.
- **Numerics.** Use tabular figures for tables, dashboards, and anything where digits must align.

## 3. Spacing & layout grid

- Use a **base unit** (4px or 8px) and derive a scale: `0, 1(4), 2(8), 3(12), 4(16), 6(24), 8(32), 12(48), 16(64), 24(96)`. Every margin, padding, and gap snaps to this scale. This single rule does more for "looks designed" than anything else.
- Spacing communicates grouping (proximity). Related items get tight spacing; separate groups get generous spacing. Whitespace is structure, not waste.
- Define container max-widths and gutters. Common content max-width for reading is ~640–760px; app shells use a sidebar + fluid content region.
- Define **breakpoints** as tokens (e.g., `sm 640 · md 768 · lg 1024 · xl 1280`) and design mobile-first: single column, primary action reachable, no hover-only affordances.

## 4. Radius

- Pick a radius scale (`none · sm 4 · md 8 · lg 12 · xl 16 · full`) and apply it consistently. Radius is a strong style signal: small/none reads precise and technical; large/pill reads friendly and consumer. Choose to match the purpose archetype, then be consistent.

## 5. Elevation & depth

- Define an elevation scale via shadow tokens (`shadow.sm` for cards, `shadow.md` for dropdowns/popovers, `shadow.lg` for modals). Modern shadows are soft, low-opacity, and layered (a tight ambient + a longer cast), not a single hard drop shadow.
- In **dark mode**, prefer lighter surfaces over heavy shadows to express elevation — shadows are nearly invisible on dark backgrounds.
- Use depth sparingly and meaningfully (raise what's interactive or transient); flat-by-default with selective elevation reads more modern than everything floating.

## 6. Borders & dividers

- Hairline borders (1px) in a low-contrast neutral are the modern default for separating surfaces and structuring tables/forms. Use borders *or* elevation to separate, rarely both at once.
- Use a slightly stronger border for focus/selected and for inputs on hover, tied to tokens.

## 7. Motion tokens

Tokenize motion so it's consistent and tasteful:

- **Durations:** `motion.fast 120ms` (hovers, small state), `motion.base 200ms` (most transitions), `motion.slow 320ms` (larger surfaces, modals). Anything over ~400ms for UI feedback feels sluggish.
- **Easing:** use ease-out for entrances (`cubic-bezier(0.2, 0, 0, 1)`), ease-in for exits, a standard curve for movement. Avoid linear for UI (feels robotic) except for continuous spinners.
- Animate **transform and opacity** (cheap, smooth); avoid animating layout properties (width/height/top) where possible.
- Always provide a `prefers-reduced-motion` path that reduces or removes non-essential animation. See `motion` notes in each screen spec.

## 8. Visual hierarchy

On every screen, decide what the eye hits 1st, 2nd, 3rd. Tools, in rough order of power:

1. **Size & weight** of type.
2. **Color & contrast** (accent vs muted; strong vs subtle text).
3. **Spacing & position** (isolation and top-left/center placement draw attention).
4. **Elevation** (raised = important/interactive).

The primary action should be the most visually prominent interactive element; secondary actions are lower-emphasis (outline/ghost/text). Don't let three things compete for "most important."

## 9. Theming & dark mode

- Express every color as a **role token** and provide light and dark values for each role. Components reference the role, so theming is just swapping the token values.
- Dark mode is not inverted light mode: lift surfaces with lightness (not shadow), slightly desaturate accents to reduce vibration, keep text contrast in range, and avoid pure black backgrounds (use a very dark neutral).
- Respect the user's system preference by default; if you offer a toggle, persist it.

## 10. Emitting tokens for developers

Tokens are the contract between design and code. Emit them in a form the stack can consume:

- **CSS custom properties** (framework-agnostic), themed via a `[data-theme]` or `prefers-color-scheme`:

  ```css
  :root {
    --color-bg: #0b0c0e_or_light_value;
    --color-primary: ...;
    --space-4: 16px;
    --radius-md: 8px;
    --text-base: 16px;
    --motion-base: 200ms;
  }
  ```

- **Tailwind / config theme** — map the same tokens into the theme config so utilities stay on-scale.
- Put the token set into the handoff `design_system` block (see `templates/developer_handoff.schema.json`) so it travels with the spec.

## 11. Token checklist

Before finishing the visual pass, confirm you have defined:

- [ ] Neutral ramp + surface roles (bg / surface / raised), light **and** dark.
- [ ] Text roles (default / muted / subtle) meeting AA contrast.
- [ ] One primary accent with hover/active/tint and an on-accent text color.
- [ ] Semantic states (success/warning/danger/info), strong + soft each.
- [ ] Type families, a modular scale, weight set, line-heights.
- [ ] Spacing scale on a 4/8px base, plus breakpoints and container widths.
- [ ] Radius scale and elevation/shadow scale.
- [ ] Motion durations + easings, with a reduced-motion plan.
- [ ] Tokens emitted as CSS vars / theme config and placed in the handoff.
