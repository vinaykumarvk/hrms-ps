# Purpose Archetypes

The user asked for modern design "for different purposes." Different product purposes have different jobs, conventions, and failure modes. Identify the archetype first, then inherit its modern conventions, signature components, and pitfalls. A screen is "intuitive" largely because it matches what users already expect for that *kind* of product.

Most real products are a blend (e.g., a SaaS app with a marketing landing page and an onboarding flow). Apply the relevant archetype per surface.

## How to use

1. Classify the surface into one or more archetypes below.
2. Pull its **primary job**, **key screens**, **modern conventions**, and **pitfalls**.
3. Pair with an aesthetic direction from `modern_patterns.md` and tokens from `visual_design_system.md`.

---

## Marketing / landing page

- **Primary job:** communicate value fast and drive one conversion action.
- **Key screens:** hero, value props/features, social proof, pricing, FAQ, CTA, footer.
- **Modern conventions:** strong typographic hierarchy and a clear headline; one dominant CTA repeated down the page; generous whitespace; bento/feature grids; subtle scroll-reveal motion; real product imagery over stock; fast load.
- **Pitfalls:** burying the value proposition; multiple competing CTAs; walls of text; oversized hero that hides the offer; motion that delays comprehension.

## SaaS dashboard / overview

- **Primary job:** show status and exceptions at a glance and route to the next task.
- **Key screens:** overview, object lists, detail pages, settings.
- **Modern conventions:** summary cards with a single clear metric each; "what needs attention" surfaced first; persistent task-oriented sidebar; tabular figures; restrained palette with accent reserved for primary actions; skeleton loading; helpful empty states.
- **Pitfalls:** dashboard as a dumping ground of unrelated charts; vanity metrics with no action; color overload; no empty/loading states.

## Data table / admin / internal tool

- **Primary job:** find, scan, compare, and act on many records efficiently.
- **Key screens:** filterable table/list, record detail, bulk actions, create/edit.
- **Modern conventions:** sticky header row and toolbar; column sorting + faceted filters + search; clear row-level actions (visible or in an accessible menu, not tiny icons only); inline or side-panel editing; bulk select with a clear action bar; density that stays aligned; tabular numerics; pagination or virtualized scrolling.
- **Pitfalls:** hiding actions behind hover or microscopic icons; no empty/filtered-empty state; modal for complex multi-field edits; losing list context when editing; unscannable density.

## Consumer mobile app

- **Primary job:** quick, focused, thumb-friendly task completion.
- **Key screens:** home/feed, detail, create, profile, settings; tab bar navigation.
- **Modern conventions:** single-column, large touch targets, bottom-reachable primary actions; sheets/drawers instead of modals; gestures with visible alternatives; skeletons; optimistic UI for low-risk taps; system-consistent components.
- **Pitfalls:** desktop layouts squeezed onto mobile; hover-only interactions; tiny targets; critical actions stranded at the top of the screen; gesture-only with no fallback.

## Onboarding / activation

- **Primary job:** get the user to first value with minimum friction.
- **Key screens:** signup, minimal setup, contextual first-run, success/first-win.
- **Modern conventions:** ask for the least possible upfront; progressive/contextual guidance over long tours; sensible defaults and sample data; a visible path to the "first win"; progress indication for multi-step setup; skip/resume options.
- **Pitfalls:** long forms before any value; blocking tours; demanding data you could infer or defer; no clear sense of progress or payoff.

## E-commerce / checkout

- **Primary job:** browse to purchase with confidence and minimal abandonment.
- **Key screens:** listing/category, product detail, cart, checkout, confirmation.
- **Modern conventions:** strong product imagery and scannable detail; persistent/clear cart; guest checkout; minimal, well-grouped checkout fields with inline validation; visible trust signals (price breakdown, security, returns); express payment options; clear order review and confirmation.
- **Pitfalls:** forced account creation; surprise costs late in checkout; long single-page forms with no grouping; errors only revealed at submit; unclear shipping/returns.

## Settings / account

- **Primary job:** find and change a specific setting safely.
- **Key screens:** settings home, category pages, profile, security, billing.
- **Modern conventions:** grouped categories with clear labels and search; safe, reversible changes with autosave or explicit save; confirmation only for destructive/irreversible actions; sensible defaults; clear current-state display.
- **Pitfalls:** deep unsearchable nesting; ambiguous toggles; destructive actions next to routine ones with no guardrail; jargon labels.

## Content / editorial / docs

- **Primary job:** read, navigate, and find content comfortably.
- **Key screens:** article/page, index/landing, search, navigation/TOC.
- **Modern conventions:** comfortable reading measure (~50–75 chars) and line-height; strong heading hierarchy; sticky table of contents for long pages; good search; responsive typography; restrained color so content leads.
- **Pitfalls:** full-width body text; weak heading hierarchy; intrusive interstitials; poor in-page navigation for long content.

## AI / chat / assistant UI

- **Primary job:** let users converse with and steer an assistant, with trust and control.
- **Key screens:** conversation thread, input/composer, history, settings, sources/citations.
- **Modern conventions:** clear turn structure; streaming responses with a visible in-progress state; stop/regenerate/edit controls; transparency (sources, model/mode, limits); easy copy/share; graceful handling of long output and errors; reduced-motion-safe streaming.
- **Pitfalls:** no way to stop or correct; hiding uncertainty or sources; unreadable long outputs; losing user input on error; over-animated streaming.

## Forms & wizards (cross-cutting)

- **Primary job:** capture accurate input with the least effort and error.
- **Modern conventions:** group fields by mental model; clear required/optional; helper text and examples where formats are unfamiliar; inline, immediate validation; one primary action whose label names the result; a review step before high-stakes submit; save-draft/resume for long forms; progress for multi-step; every state (default/validation-error/system-error/success) designed.
- **Pitfalls:** asking the same data twice; validation only at submit; dropdowns for tiny obvious sets; no review before consequential submit; no save/resume on long flows.
