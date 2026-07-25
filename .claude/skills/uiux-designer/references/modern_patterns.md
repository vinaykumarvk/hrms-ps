# Modern Patterns

What "modern" actually means in practice, and how to get there without trading away usability. Read this alongside `visual_design_system.md` for step 6. The goal is *modern and impactful*, never *trendy and unusable*.

## The discipline first

"Modern" is not a style you bolt on. It is the result of: a disciplined token system, strong typographic hierarchy, generous and consistent spacing, restraint with color and effects, responsive behavior, and motion used as feedback rather than decoration. A plain interface with those properties looks more modern than a heavily-styled one without them.

The fastest ways to look *dated*: ad-hoc spacing, too many competing colors, weak/flat type hierarchy, hard drop shadows, dense unstructured forms, spinner-everywhere loading, and hover-dependent interactions on touch.

The fastest ways to look *trendy-but-broken*: low-contrast text for "minimalism," heavy glassmorphism/blur over busy content, animation on everything, oversized hero text that pushes the actual task below the fold, and novelty navigation that users can't predict.

When a trend conflicts with the usability or accessibility gates in SKILL.md, the gates win.

## Aesthetic directions

Pick one direction deliberately and let the tokens express it. Match it to the product purpose (see `purpose_archetypes.md`).

| Direction | Feels like | Tokens that express it | Best for | Watch out for |
|---|---|---|---|---|
| **Functional minimal** | Calm, precise, content-first | Neutral-heavy, one accent, hairline borders, small radius, subtle shadows, tight type scale | SaaS, dashboards, productivity, admin | Can feel sterile — use type hierarchy + a confident accent to add life |
| **Soft / friendly** | Approachable, rounded, warm | Larger radius, softer neutrals, gentle shadows, slightly larger type, warm accent | Consumer apps, onboarding, fintech-for-humans, health | Over-rounding + pastels can read childish; keep contrast strong |
| **Editorial** | Magazine-like, expressive | Serif/display headings, generous whitespace, strong type contrast, large imagery | Marketing, content, landing pages, portfolios | Don't bring editorial flourish into dense task UIs |
| **Dense / professional** | Information-rich, efficient | Compact spacing, tabular figures, smaller type, subtle dividers, muted palette | Trading, analytics, enterprise tools, data tables | Density must stay scannable — rely on alignment and grouping |
| **Elevated / premium** | Refined, layered, tactile | Layered soft shadows, refined neutrals, restrained accent, careful motion | Premium consumer, brand-forward products | Effects must be subtle; overdone = gaudy, not premium |
| **Expressive / bold** | High-energy, distinctive | Saturated color, big type, strong shapes, playful motion | Brand sites, campaigns, creative tools | Reserve for low-density, low-stakes surfaces; protect contrast |

Most products are well served by **functional minimal** or **soft/friendly** with a confident accent and excellent type. Reach for bolder directions only when the purpose justifies it.

## Contemporary layout patterns

- **App shell**: persistent sidebar (or top nav) + fluid content; collapsible nav on smaller screens. Keep the primary nav shallow and task-oriented.
- **Responsive grid / cards** that reflow from multi-column to single column; consistent gutters from the spacing scale.
- **Bento layout** for overviews and marketing: modular tiles of varying size in a tidy grid — modern when aligned to a grid, messy when not.
- **Split / two-pane** (list + detail): efficient for browse-then-act workflows; collapses to stacked navigation on mobile.
- **Sticky header / toolbar** keeping primary actions and context in reach as content scrolls.
- **Right-side detail panel / sheet** for editing without losing list context.
- **Empty states** that teach and offer the next action (not a blank screen). Treat them as first-class.

## Contemporary interaction patterns

- **Skeletons over spinners** for content loading; spinners only for short, indeterminate waits. Show structure while data arrives.
- **Optimistic UI** for low-risk actions (e.g., toggles, likes): reflect the result immediately, reconcile on response, roll back on error.
- **Toasts / inline confirmations** for transient feedback; reserve modals for decisions and destructive confirmation.
- **Inline editing** and autosave for low-friction data changes; show save status.
- **Command palette (⌘K)** for power users in tool-heavy apps — as an accelerator, never the only path.
- **Progressive onboarding** (contextual tips, sample data, checklists) instead of long upfront tours.
- **Segmented controls / radio cards** instead of dropdowns for small, visible choice sets.
- **Sheets / drawers** on mobile in place of cramped modals.
- **Search-as-you-type with structure** (filters, recent, grouped results) for large datasets.

## Micro-interactions (the "impactful" texture)

Used well, small motion makes an interface feel responsive and premium. Use the motion tokens from `visual_design_system.md`.

- Hover/press feedback on interactive elements (subtle background/elevation/scale).
- Smooth enter/exit for menus, sheets, toasts (transform + opacity, ease-out in / ease-in out).
- State transitions (e.g., button → loading → success) that reassure rather than distract.
- Focus rings that are clearly visible and tokenized — accessibility and polish at once.
- Always honor `prefers-reduced-motion`: keep essential feedback, drop the decorative movement.

Keep each interaction short (≤ ~300ms), purposeful, and consistent. If motion doesn't communicate something, cut it.

## A quick "is it modern?" check

- Is spacing on a single scale, and is whitespace doing the grouping?
- Is there a clear typographic hierarchy (size + weight), with a sensible reading measure?
- Is color restrained (neutral-led, one confident accent, semantic states), and does contrast pass AA?
- Are surfaces separated by hairlines or soft layered shadows — not hard drop shadows?
- Do loading, empty, and error states feel designed (skeletons, helpful empties, clear errors)?
- Does it adapt cleanly to mobile with no hover-only traps?
- Is motion present but subtle, tokenized, and reduced-motion-safe?

If those are all yes, it will read as modern — regardless of which aesthetic direction you chose.
