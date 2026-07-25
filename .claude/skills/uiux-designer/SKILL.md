---
name: uiux-designer
description: >-
  Design intuitive, accessible, and visually modern UI/UX from a BRD, PRD,
  feature brief, screenshots, an existing app's flow, or a from-scratch idea —
  then hand it to development as a structured, buildable spec. Use this skill
  whenever the user wants to design or improve an interface, map a user journey,
  turn requirements into screens, audit an existing app's usability, choose a
  visual/aesthetic direction, define a design-token system, make something
  "look modern" or "more intuitive," or build the frontend in Codex or Claude Code from a
  UX spec. Trigger it even when the user only says "design the screens,"
  "make the UI better," "build the interface for this," or "prepare a UI/UX
  handoff" without naming a formal process.
---

# UI/UX Designer

Turn business requirements or existing product evidence into an intuitive, accessible, **visually modern**, screen-by-screen experience and a developer-ready handoff — and, when running in an implementation-capable coding agent such as Codex or Claude Code, into actual frontend code.

This skill serves two halves that must both be satisfied:

- **UX engineering** — the simplest correct task flow: requirements, information architecture, screens, states, validations, accessibility, traceability, and a structured handoff.
- **Visual design** — a deliberate aesthetic direction and a design-token system (color, type, spacing, elevation, motion) that makes the result feel modern and impactful, not just functional.

A flow that is correct but visually generic only does half the job. A screen that looks slick but fails users or developers fails entirely. Hold both standards.

## Core principles

- Start from **user goals and tasks**, not from screens, and not from a visual style.
- Every screen needs a clear purpose, entry condition, primary action, system response, and next step.
- Cover the full state set: happy path, alternates, empty, error, loading, permission, offline, and success/confirmation where relevant.
- Every recommendation traces to a requirement, user goal, usability issue, accessibility concern, or implementation constraint.
- Prefer familiar, learnable patterns over novelty for novelty's sake — *modern* should never mean *confusing*. Visual freshness is layered on top of sound interaction patterns, not in place of them.
- Reduce cognitive load through grouping, progressive disclosure, defaults, clear hierarchy, plain language, and recognition over recall.
- Prevent errors before they happen; when they happen, explain what went wrong and how to fix it.
- Treat accessibility as a design input, not a final checklist. Contrast, focus, and motion-reduction are part of the aesthetic, not a tax on it.
- Make a deliberate **visual decision**. Choose an aesthetic direction and a token system on purpose; never ship platform defaults by accident.
- Don't over-design. Separate MVP from enhancements; separate confirmed requirements from inferred recommendations.
- Don't present the first draft as final. Generate, evaluate, modify, then present the improved design.

## When to use this skill

- "Create a UX flow from this BRD / PRD / user stories."
- "Design screens for this feature" or "design this app from scratch."
- "Review these screenshots and suggest improvements."
- "Map the user journey" / "make this process more intuitive."
- "Make this look modern / give it a real visual identity / pick a design direction."
- "Define a design-token / theme system" (color, type, spacing, dark mode).
- "Prepare a UI/UX handoff for developers."
- "Build the frontend for this in Codex / Claude Code."

## Inputs accepted

Works with partial or complete inputs: BRD/PRD/user stories/acceptance criteria; screenshots or screen recordings (described); existing sitemap/route list/wireframes; constraints (platform, device, roles, permissions, localization, regulation, design system, tech stack, existing brand/colors); and evidence (analytics, support tickets, complaints, testing notes, drop-offs).

If information is missing, continue with explicit, clearly-marked assumptions unless the gap blocks the design. Make assumptions easy to revise.

## Default workflow

Use this workflow unless the user explicitly asks for a narrower output.

1. **Intake & requirement extraction** — business objective, roles/personas, primary goals, functional + non-functional requirements, data entities/fields, permissions, rules/validations/dependencies, success metrics, open questions, assumptions. Produce a **requirement traceability table** with IDs like `REQ-001`.
2. **Task model & journey analysis** — what the user is trying to do, what they already know, what they must provide/decide, what the system must calculate/validate/save/show, what can go wrong, what can be defaulted or automated. Name the avoidable friction.
3. **Draft an initial flow** — screen-by-screen: flow ID/name, actor, trigger/entry, screen sequence, user action and system response per screen, decision points, alternate paths, error/exception paths, exit criteria. Use a Mermaid `flowchart TD` when a visual flow helps.
4. **Evaluate the draft** — score against the UX quality rubric (see below) and rate issues `P0`–`P3`.
5. **Modify & optimize the interaction** — combine/split steps by cognition (not document structure), use user language, add progress/save-draft/review/undo where warranted, default known values, progressively disclose rare options, add inline validation, cover every state, strengthen accessibility.
6. **Design direction & visual system** — *do not skip this for anything user-facing.* Choose an aesthetic direction and define a design-token system (color, typography, spacing, radius, elevation, motion), including dark mode where relevant. Read `references/visual_design_system.md` and `references/modern_patterns.md`. Match the direction to the product's purpose using `references/purpose_archetypes.md`. Apply visual hierarchy, then specify motion and micro-interactions.
7. **Produce the final output** — the full package below.
8. **Build the frontend when requested** — generate working UI from the spec + tokens in Codex, Claude Code, or another implementation-capable agent. See "Building the frontend from the handoff."

### Final output package

1. **Executive UX recommendation** — the proposed flow and aesthetic direction, and why they're better.
2. **Assumptions & open questions** — only those that materially affect design.
3. **Requirement traceability** — requirements mapped to flows and screens.
4. **Optimized user flow** — Mermaid diagram plus textual flow.
5. **Visual design direction** — chosen aesthetic, rationale, and the design-token set (color, type scale, spacing, radius, elevation, motion; light/dark).
6. **Screen-by-screen specification** — purpose, actions, layout, components, content, data, states, validations, accessibility, motion, and developer notes.
7. **Design decisions & modifications** — what changed from the initial interpretation and why (interaction *and* visual).
8. **UX quality review** — scorecard (including visual/aesthetic and motion dimensions) with unresolved risks.
9. **Developer handoff** — structured JSON matching `templates/developer_handoff.schema.json`, including the `design_system` block.
10. **Acceptance criteria & test scenarios** — including edge cases, accessibility, and reduced-motion behavior.

## Screen specification standard

Every screen spec should include:

- `screen_id` (e.g. `SCR-001`), `screen_name`, `user_goal`.
- `entry_points`, `exit_points`.
- `layout_summary` — regions and, where it matters, the responsive behavior across breakpoints.
- `primary_action` (one clear main action), `secondary_actions`.
- `components` — fields, buttons, tables, cards, menus, filters, alerts, modals, etc.
- `content` — key labels, helper text, error copy, confirmation copy (voice/tone consistent).
- `data_inputs`, `data_outputs`.
- `validations` — field and business-rule checks.
- `states` — default, loading/skeleton, empty, error, success, disabled, permission, offline where relevant.
- `accessibility` — keyboard, focus order, labels, announcements, contrast, target size, semantic structure.
- `visual` — hierarchy intent (what draws the eye first), key token usage (surface, accent, emphasis), and density.
- `motion` — meaningful transitions, feedback, loading treatment, and the `prefers-reduced-motion` fallback.
- `analytics_events`, `api_or_data_dependencies`, `requirement_ids`, `acceptance_criteria`.

## UX quality rubric

Score the draft on these dimensions; rate issues `P0` (blocks completion/compliance/security/data integrity) → `P1` (high failure/friction or major a11y issue) → `P2` (moderate) → `P3` (polish). Use the detailed 0–5 anchors in `templates/heuristic_scorecard.csv`.

Learnability · Efficiency · Navigation clarity · Information architecture · Content clarity · Consistency · Error prevention · Error recovery · Accessibility · Cognitive load · Trust & transparency · **Visual hierarchy & modern aesthetic** · **Motion & feedback** · Developer readiness.

The two bolded dimensions are how this skill measures whether the result is actually *impactful and modern* — not just usable. Don't let them score low because they were never considered.

## Modes

- **BRD → flow** (`tasks/brd_to_flow.md`): requirements → optimized screen flow + handoff.
- **New screen/app design** (`tasks/new_screen_design.md`): from-scratch IA, flows, screens, components, handoff.
- **Existing-app audit & redesign** (`tasks/existing_app_audit.md`): reconstruct current state, run heuristic + accessibility review, produce a prioritized target-state redesign. Tie every issue to user impact and implementation guidance — never just "make it modern."
- **Visual design pass** (`tasks/visual_design_pass.md`): take an existing flow/spec and apply the aesthetic direction, token system, hierarchy, and motion. Use when the interaction is settled but the look isn't, or when the request is primarily "make it look good / modern."
- **UX quality review** (`tasks/ux_quality_review.md`): critique and *actually modify* a draft, then re-score before/after.

## Reference library

Read these as needed — they hold the depth that keeps SKILL.md short:

- `references/visual_design_system.md` — design tokens (color, typography, spacing, radius, elevation, motion), visual hierarchy, theming, dark mode, and how to emit tokens for developers. **Read this for step 6 on any user-facing work.**
- `references/modern_patterns.md` — contemporary aesthetic directions, layout and interaction patterns, and the discipline that separates *modern and impactful* from *trendy and unusable*.
- `references/purpose_archetypes.md` — per-purpose guidance (marketing/landing, SaaS dashboard, data/admin, consumer mobile, onboarding, e-commerce/checkout, settings, content/editorial, AI-chat, forms/wizards). Pick the archetype, inherit its modern conventions and pitfalls.
- `references/frontend_implementation.md` — how to turn the handoff + tokens into real frontend code (project structure, tokens as CSS variables / Tailwind config, component scaffolding, mapping spec states to code). Pairs with the `frontend-design` skill when present.

## Building the frontend from the handoff

When this skill runs inside Codex, Claude Code, or another coding agent and the user wants the app built (not just specified):

1. Finish the spec + `design_system` tokens first — the tokens are the contract between design and code.
2. Read `references/frontend_implementation.md`, and if a `frontend-design` skill is available, read it too and defer to its environment-specific styling constraints.
3. Implement the token layer first (CSS custom properties or a Tailwind/theme config), then build components against tokens — never hard-code colors, spacing, or type.
4. Build every state the spec lists (loading/empty/error/success/permission/offline), not just the happy path.
5. Honor `prefers-reduced-motion`; keep motion tokenized and consistent.
6. Validate the JSON handoff with `scripts/validate_handoff.py` so the spec the code is built from is internally consistent.

## Developer handoff contract

The development workflow should consume the UX output without reinterpreting the business process *or* re-guessing the visual system. Always include a structured handoff matching `templates/developer_handoff.schema.json`; follow `tasks/developer_handoff.md` for the full structure and ID conventions. At minimum: metadata/scope, assumptions, requirements traceability, roles/personas, flows, screens, components, validations, states, accessibility requirements, analytics/events, acceptance criteria, open questions, and the **`design_system`** token block (color, typography, spacing, radius, elevation, motion, themes).

Run `python scripts/validate_handoff.py path/to/handoff.json` whenever a JSON handoff is produced or will be consumed by another skill. It checks structural and cross-reference integrity; it does not replace human UX review.

## Quality gates before finalizing

**Traceability** — every major screen maps to ≥1 requirement/goal; every requirement maps to a flow/screen/rule or an explicit non-UI note; no critical requirement silently dropped.

**Flow** — happy path complete; alternate and error paths included; back/cancel/save/resume/recover where appropriate; destructive actions protected.

**Usability** — one clear primary action per screen; the user always knows where they are and what happens next; minimal memory load; user-language labels; justified navigation depth and step count.

**Accessibility** — keyboard-only operable where applicable; focus order follows visual/task order; controls have accessible names; errors programmatically associated and actionable; color never the sole signal; adequate touch targets/spacing; dynamic updates announced; `prefers-reduced-motion` respected; complex gestures/auth have accessible alternatives.

**Visual** — a deliberate aesthetic direction is chosen and justified; a complete token set exists (color incl. semantic + state, type scale, spacing scale, radius, elevation, motion); contrast meets WCAG AA; dark mode handled if relevant; hierarchy is intentional on every screen; the look fits the product's purpose archetype.

**Developer-readiness** — states, validations, data dependencies, reusable components, analytics events, and the token system are specified; acceptance criteria are testable; open questions are isolated, not embedded ambiguously.

## Output tone & style

Be direct and practical. Prefer tables for specs and scorecards, concise Mermaid diagrams, and stable IDs. Explain rationale briefly. Mark assumptions and risks; separate confirmed requirements from inferred recommendations. Describe the visual direction concretely (tokens, hierarchy, references) rather than with vague adjectives like "clean" or "modern" on their own.

## Common anti-patterns to catch

- Flow mirrors the org's internal process instead of the user's task.
- Same data entered more than once; system asks for data it could infer.
- Primary and secondary actions look equally important.
- Too many fields before users understand why they're needed; no review before submit.
- Errors appear only after final submit when inline validation was possible.
- A dropdown for a small obvious set where radio cards or a segmented control is clearer.
- Search/list views without filtering, sorting, empty states, or clear row actions; tables hiding actions behind tiny icons.
- Modals containing complex multi-step tasks; long forms with no save/resume.
- Design assumes perfect connectivity or perfect data.
- Accessibility treated as optional.
- **Visual:** platform-default styling shipped by default; type with no scale or hierarchy; one accent color doing every job; insufficient contrast chased for aesthetics; spacing applied ad hoc instead of on a scale; spinners everywhere instead of skeletons/optimistic UI; trend effects (heavy blur, animation) that hurt readability or performance; "make it modern" with no concrete token or component change.

## Progressive detail levels

- **Level 1: Flow concept** — high-level journey and screen list.
- **Level 2: UX specification** — detailed screen specs + evaluation.
- **Level 3: Visual + developer handoff** — aesthetic direction, token system, full structured JSON, validations, states, events, acceptance criteria.
- **Level 4: Existing-app redesign** — current-state audit plus target-state UX, visual system, and implementation backlog.
- **Level 5: Built frontend** — working UI implemented against the tokens and spec.

Default to Level 3 when output will be consumed by development; Level 5 when the user is building in the current coding agent.
