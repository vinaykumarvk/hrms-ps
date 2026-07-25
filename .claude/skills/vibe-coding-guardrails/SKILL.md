---
name: vibe-coding-guardrails
description: Fast post-coding scan that catches common anti-patterns introduced during rapid AI-assisted coding sessions. Runs pattern-matching checks against project conventions before code leaves the working tree. If a repository-scoped project skill (for example a `<project>-*` skill committed in that repo's .claude/skills/) covers this area, its commands, ports, thresholds, and policies override the generic guidance here.
argument-hint: "[scope] [options]"
user_invocable: true
---

# Vibe-Coding Guardrails

Fast, automated convention-compliance scan for changes in the working tree. Catches the mistakes that AI coding assistants commonly introduce — wrong i18n patterns, CSS violations, accessibility gaps, security anti-patterns, and project-specific convention breaks — before they reach review or deployment.

**Design goal**: Complete in under 60 seconds. No builds, no tests, no servers — pure static pattern matching on changed files.

## Scoping

Parse the user's arguments:

- **No arguments**: scan all uncommitted changes (`git diff --name-only HEAD` + untracked files).
- **App target**: `/vibe-coding-guardrails apps/<app>` (e.g. `apps/portal`) — restrict scan to files under that directory.
- **File list**: `/vibe-coding-guardrails src/Dashboard.tsx src/Login.tsx` — scan specific files only.
- **`--staged`**: scan only staged files (`git diff --cached --name-only`).
- **`--all`**: scan entire codebase, not just changed files (slower but thorough).

Options:
- `no-fix` — report findings only, do not apply fixes.
- `fix` — auto-fix trivially fixable violations (default: report only).
- `strict` — treat P2 findings as blockers (default: only P0/P1 block).

## Operating Rules

- **Speed over depth**: this is a fast guardrail, not a full review. Prefer false negatives over slow execution.
- **Evidence-first**: every finding must cite `file:line` and the matched text.
- **Changed-files focus**: by default, only scan files that have uncommitted changes. This keeps the scan fast and relevant.
- **No builds**: never run `npm run build`, `tsc`, or `vite build`. Use `rg`/`grep`/`glob` only.
- **No network**: never `curl`, `fetch`, or start servers.
- **Fix-forward**: when `fix` mode is active, apply the simplest correct fix. If the fix is ambiguous, report instead of guessing.
- **One pass**: do not re-scan after fixes. Report what was found and what was fixed in a single pass.
- **Deduplication**: if the same pattern appears N times in one file, report once with count, not N separate findings.

## Severity Definitions

| Level | Meaning | Examples |
|-------|---------|---------|
| **P0** | Breaks compliance or causes runtime failure | i18n label-contract bypass in a public-facing app (e.g. `label={t()}` where a bilingual component is mandated), SQL string interpolation, hardcoded secret |
| **P1** | Functional/UX problem on target devices | `100vh`, missing `credentials: "include"`, hover-only interaction |
| **P2** | Convention violation, code quality issue | Hardcoded spacing, `any` type on new code, missing `aria-expanded` |
| **P3** | Style/consistency nit | Key naming convention, import path preference |

## Verdict

| Verdict | Condition |
|---------|-----------|
| **CLEAN** | Zero P0/P1 findings |
| **WARN** | Zero P0, some P1 findings |
| **BLOCKED** | Any P0 finding remains unfixed |

## Guard Override Etiquette

Applies whenever this scan — or any pre-write guard hook the project wires — blocks a change. An override is an audited exception, not a bypass.

- **Surface first, then WAIT.** State in a user-visible message what was blocked, why the change is still believed correct, and which override you intend to use. Do not proceed until the user responds.
- **Only the user approves an override.** "The spec says so" or another agent's opinion is NOT approval.
- **Prefer a diffable allowlist file over an ephemeral env var.** An allowlist file is reviewable, self-documenting, and survives in the diff; an env-var override applies invisibly to the next call and leaves no trace beyond hook logs.
- **Log every override.** Record what was overridden, who approved it, and why — in the change summary or review doc.
- **Never override a secrets guard.** There is no legitimate case for writing a secret into the repo.

## New-Dependency Quarantine

Applies when the changed files add a NEW package to a dependency manifest.

- **Check the package's age before adding it**: `npm view <pkg> time.created` (or the ecosystem equivalent). This registry query is the one permitted exception to the no-network rule, and only when a dependency addition is in scope.
- **Packages first published fewer than ~14 days ago are quarantined by default** (supply-chain defense against typosquats and hijacked publishes). Adding one anyway is a P1 finding unless explicit justification is recorded.
- **A legitimate bypass** (e.g., an emergency CVE patch) uses a documented bypass tag with the reason — same etiquette as guard overrides: surface it, get user approval, record it.

## Test Integrity

- **Never delete a failing test to go green.** A failing test is a finding, not an obstacle; deleting it converts a visible defect into an invisible one. Any deleted test in the diff alongside the code it covered is a P0 finding.
- **Never skip a flake without a tracked issue reference.** A new `skip`/`todo` without a citation to a tracked issue is a P1 finding; a skip citing one is acceptable.

Both shortcuts have repeatedly hidden real defects behind green suites — see `failure-archaeology` for the pattern, and `verification-doctrine` for what counts as passing evidence.

## Scope Boundary — What the Domain Reviews Own

This scan deliberately stays shallow. Categories that need repo-wide analysis, builds, servers, or judgment live in the deep reviews and are NOT duplicated here:

- **security-review** — auth middleware coverage, authorization/IDOR, password hashing, token storage, command injection (`eval`/`exec`), path traversal, stack traces in API responses, rate limiting, Docker/container hardening, audit logging.
- **ui-review** — full accessibility audit, dark-mode completeness, data tables, forms, modals, navigation, login screen, empty/loading/error states, responsive design, frontend performance.
- **quality-review** — N+1 queries, pagination, transactions, file/function size, dead code, commented-out code, test quality, build/type-check verification, graceful degradation and shutdown.

If a candidate check needs a build, a running server, or cross-repo tracing to evaluate, route it to the relevant review above instead of adding it here.

---

## Phase 0: Preflight — Identify Changed Files

```bash
# Determine file set based on scope
git diff --name-only HEAD
git diff --cached --name-only
git ls-files --others --exclude-standard
```

**Detect the repo's app layout first** — do not assume directory names. Read workspace globs from the root `package.json` (`workspaces`) or `pnpm-workspace.yaml`, and any app roles declared in `project.config.yaml`. Classify each frontend app by role:

- **public-facing app**: end-user UI — gets the strictest i18n and UX checks.
- **internal app**: staff/admin/back-office UI — same checks minus any public-only i18n contract.

If roles are not declared in config, infer them from app names (e.g. `web`, `portal`, `customer` → public-facing; `admin`, `staff`, `backoffice` → internal) and state the inference in the report header. Example: a repo with `apps/portal` (public-facing) and `apps/admin` (internal) maps `apps/portal/src/*.tsx` → public-tsx and `apps/admin/src/*.tsx` → internal-tsx.

Classify changed files into buckets:

| Bucket | Pattern | Checks Applied |
|--------|---------|----------------|
| **public-tsx** | `apps/<public-app>/src/*.tsx` | Phases 1-7, 9 (all) |
| **public-css** | `apps/<public-app>/src/*.css` | Phase 2 |
| **public-ts** | `apps/<public-app>/src/*.ts` (non-tsx) | Phases 1, 4, 5 |
| **internal-tsx** | `apps/<internal-app>/src/*.tsx` | Phases 2-7, 9 (skip Phase 1.1 unless the i18n contract covers this app) |
| **internal-css** | `apps/<internal-app>/src/*.css` | Phase 2 |
| **api-ts** | `apps/*/src/*.ts` (API dirs) | Phases 4, 5, 6 |
| **package-ts** | `packages/*/src/*.ts` | Phases 4, 5, 8 |
| **locale** | `*/locales/*.ts` | Phase 1.3 |
| **schema** | `**/schema.ts` (e.g. `packages/shared/src/schema.ts`, `src/db/schema.ts`) | Phase 8 |
| **migration** | `**/migrations/*.sql` (e.g. `db/migrations/`, `supabase/migrations/`, `drizzle/migrations/`) | Phase 8 |
| **css** | `*.css` | Phase 2 |
| **config** | `*.json`, `*.yaml`, `Dockerfile*`, `.env*` | Phase 4.4 |
| **other** | Everything else | Skip |

If no changed files match any bucket, report "No scannable changes found" and exit CLEAN.

Record the file count per bucket for the report header.

---

## Phase 1: Internationalization Compliance

**Applies to**: public-tsx, public-ts, locale files

**Precondition**: run this phase only if the project has an i18n requirement — check `project.config.yaml` for an i18n/locale section, look for `locales/` directories, or an i18n library in dependencies. If the project is single-language with no i18n setup, skip Phase 1 and record "i18n: not applicable" in the report.

### 1.1: Field Label Anti-Pattern (P0)

**Applies only if the project has a bilingual display contract** — two languages shown simultaneously, signalled by a bilingual label component in the shared UI package or an explicit bilingual requirement in `project.config.yaml`. Where that contract exists, this is the #1 compliance violation: `<Field>` labels in apps covered by the contract MUST use the project's bilingual component (e.g. `<Bilingual>`), never plain `t()` (which renders only the active language).

```bash
# P0: Field labels using t() instead of the bilingual component
rg 'label=\{t\(' <changed-public-tsx-files>
```

**Expected**: zero matches. Every match is a P0 finding.

**Auto-fix** (when `fix` mode):
```
label={t("section.key")}  →  label={<Bilingual tKey="section.key" />}
```

### 1.2: Hardcoded English Strings (P0)

User-visible text in public-facing app JSX must go through i18n.

```bash
# P0: Hardcoded English in headings
rg '<h[1-6][^>]*>[A-Z][a-z]' <changed-public-tsx-files>

# P0: Hardcoded English in paragraphs and spans used as labels
rg '<(p|span)\s+className="[^"]*label[^"]*">[A-Z]' <changed-public-tsx-files>

# P1: Hardcoded English in button text (not using t())
rg '<button[^>]*>[A-Z][a-z]{2,}' <changed-public-tsx-files>
rg '<Button[^>]*>[A-Z][a-z]{2,}' <changed-public-tsx-files>
```

**Exceptions** (not findings):
- Code comments and JSDoc
- `className` string values
- `console.log` / `console.error` messages
- `aria-label` values that are English-only by design (screen readers)
- Test files (`*.test.tsx`, `*.spec.tsx`)

### 1.3: Missing Locale Keys (P0)

Every i18n key used in an i18n-covered app must exist in ALL of the project's locale files. Determine the locale set from the app's locales directory (e.g. `apps/<public-app>/src/locales/*.ts` — one file per configured locale).

```bash
# Extract keys used in changed app TSX files
rg 'tKey="([^"]+)"' <changed-public-tsx-files> -o --no-filename | sort -u
rg "t\(['\"]([^'\"]+)['\"]" <changed-public-tsx-files> -o --no-filename | sort -u

# For each key, verify presence in every locale file
rg '<key>' apps/<public-app>/src/locales/<locale>.ts   # repeat for each locale file present
```

If a key exists in the default locale file but is missing from any other locale file, that is a P0 finding.

If locale files themselves were changed, cross-check that all locale files have the same set of top-level keys.

### 1.4: Key Naming Convention (P3)

Keys should follow `section.descriptor` pattern with snake_case descriptors.

```bash
# P3: camelCase keys (should be snake_case)
rg 'tKey="[a-z]+\.[a-z]+[A-Z]' <changed-public-tsx-files>
rg "t\(['\"][a-z]+\.[a-z]+[A-Z]" <changed-public-tsx-files>
```

---

## Phase 2: CSS & Responsive Compliance

**Applies to**: all changed CSS files + inline styles in TSX files

### 2.1: Viewport Height (P0)

```bash
# P0: 100vh (must use dvh)
rg '100vh' <changed-css-files> <changed-tsx-files>
# Exclude: comments, strings in JS that aren't style-related
```

**Auto-fix**: `100vh` → `100dvh`

### 2.2: Pixel Breakpoints (P0)

```bash
# P0: px values in @media queries (must use rem)
rg '@media[^{]*\d+px' <changed-css-files>
```

Verify matches are actually breakpoint values (width/height), not properties inside the media block. If the match is inside a property declaration (e.g., `border: 1px solid`), it is NOT a finding.

### 2.3: Ad-hoc Breakpoints (P1)

```bash
# P1: Breakpoints not matching the three defined tokens
# Valid values: 22.5rem (360px), 48rem (768px), 80rem (1280px)
rg '@media[^{]*(min-width|max-width):\s*\d' <changed-css-files>
```

For each match, verify the value is one of `22.5rem`, `48rem`, or `80rem`. Any other value is a P1 finding.

### 2.4: Hardcoded Spacing in Inline Styles (P1)

```bash
# P1: Inline styles with hardcoded spacing (should use CSS tokens)
rg 'style=\{\{[^}]*(padding|margin|gap):\s*"?\d+(px|rem)' <changed-tsx-files>
```

**Exception**: `style={{ gap: "var(--space-4)" }}` (using CSS variable in inline style) is acceptable.

### 2.5: Fixed Widths (P1)

```bash
# P1: Fixed pixel widths that will overflow on mobile
rg 'width:\s*\d{3,}px' <changed-css-files> <changed-tsx-files>
```

Widths >= 100px hardcoded in pixels are suspect. Should use `min()`, `max-width`, or percentage/rem values.

### 2.6: Hover Without Active (P1)

```bash
# P1: :hover styles without corresponding :active
rg ':hover' <changed-css-files> -l
```

For each file with `:hover`, verify a corresponding `:active` rule exists for the same selector. Missing `:active` is a P1 finding.

### 2.7: Hardcoded Colors (P2)

```bash
# P2: Hardcoded hex/rgb colors instead of CSS custom properties
rg '(color|background|border).*#[0-9a-fA-F]{3,8}' <changed-css-files>
rg '(color|background|border).*rgb\(' <changed-css-files>
```

**Exceptions**: Inside CSS custom property definitions (`:root { --color-x: #abc; }`) and SVG `fill`/`stroke` attributes.

### 2.8: Standalone vw Units (P2)

```bash
# P2: vw not inside clamp() — causes horizontal scroll
rg '\d+vw' <changed-css-files> <changed-tsx-files>
```

`vw` is acceptable inside `clamp()`. Outside `clamp()`, it is a P2 finding.

---

## Phase 3: Accessibility Compliance

**Applies to**: changed TSX files (all frontend apps, public-facing and internal)

### 3.1: Touch Targets (P1)

```bash
# P1: Small interactive elements without min-height
# Look for button/a/clickable elements defined without size constraints
rg '<button\b' <changed-tsx-files> -l
rg 'onClick=\{' <changed-tsx-files> -l
```

For each file, verify that clickable elements have CSS rules with `min-height: 2.75rem` or use the shared `<Button>` component (which enforces this).

Raw `<button>` or `<div onClick>` elements without a size-enforcing class are P1 findings.

### 3.2: Missing aria-label on Icon Buttons (P1)

```bash
# P1: Buttons with only SVG/icon content and no aria-label
rg '<button[^>]*>\s*<svg' <changed-tsx-files>
rg '<Button[^>]*>\s*<svg' <changed-tsx-files>
```

If the button has no `aria-label` prop, it is a P1 finding. Screen readers will announce nothing.

### 3.3: div-as-button Anti-Pattern (P1)

```bash
# P1: div/span with onClick but no role="button" or tabIndex
rg '<(div|span)[^>]*onClick=' <changed-tsx-files>
```

For each match, verify `role="button"` and `tabIndex={0}` are present. Missing either is a P1. Better fix: convert to `<button>`.

### 3.4: Missing aria-expanded on Toggles (P2)

```bash
# P2: Toggle patterns without aria-expanded
rg '(setIsOpen|setExpanded|setShow|toggle)' <changed-tsx-files> -l
```

For each file with toggle state, verify the trigger element has `aria-expanded={isOpen}`. Missing is P2.

### 3.5: Images Without alt (P2)

```bash
# P2: img tags without alt attribute
rg '<img\b(?![^>]*\balt=)' <changed-tsx-files>
```

Every `<img>` must have `alt`. Decorative images use `alt=""`. Missing `alt` is P2.

### 3.6: Safe-Area Insets on Fixed/Sticky Elements (P1)

```bash
# P1: position fixed/sticky without safe-area-inset
rg 'position:\s*(fixed|sticky)' <changed-css-files> -l
```

For each fixed/sticky rule in changed CSS, verify `env(safe-area-inset-*)` or `max(..., env(...))` is present on the appropriate side. Missing is P1 (breaks on iOS notch devices).

---

## Phase 4: Security Quick Scan

**Applies to**: all changed TS/TSX files

### 4.1: SQL Injection (P0)

```bash
# P0: String interpolation in SQL queries
rg 'query\s*\(\s*`' <changed-ts-files>
rg "query\s*\(\s*['\"].*\\\$\{" <changed-ts-files>
rg 'query\s*\(.*\+\s*(req|request|body|params|query)' <changed-ts-files>
```

Any SQL query using template literals with `${}` interpolation or string concatenation with user input is P0. Must use parameterized queries (`$1`, `$2`).

**Exception**: Template literals that ONLY interpolate table/column names from constants (not user input) are acceptable but should be flagged as P2 for review.

### 4.2: Hardcoded Secrets (P0)

```bash
# P0: Secrets/keys/passwords in source code
rg '(password|secret|api_key|apiKey|token)\s*[:=]\s*["\x27][^"\x27]{8,}' <changed-ts-files> --glob '!*.test.*' --glob '!*.spec.*' --glob '!locales/*'
```

**False positive filters**:
- Type definitions (`password: string`)
- Variable names without values (`const secret = process.env.SECRET`)
- Test fixtures in `*.test.*` files
- Locale string values containing "password" as a label

### 4.3: Console.log in Production Code (P2)

```bash
# P2: console.log left in production code
rg 'console\.(log|debug|info)' <changed-ts-files> --glob '!*.test.*' --glob '!*.spec.*'
```

**Exceptions**: `ErrorBoundary` components may use `console.error`. API code should use the project logger (e.g. pino's `logError`/`logWarn` wrappers).

### 4.4: Secrets in Config Files (P0)

```bash
# P0: Secrets in committed config files
rg '(password|secret|key|token)\s*[:=]\s*["\x27][A-Za-z0-9+/=]{16,}' <changed-config-files> --glob '!package-lock.json' --glob '!*.example'
```

Additionally: if the changed-file set contains a `.env` file that is not an example/template (`.env.example`, `.env.template`), that is a P0 finding on its own — real env files must never be committed. Verify `.env` is listed in `.gitignore` (`rg '^\.env' .gitignore`).

### 4.5: Raw reply.send for Errors (P2)

```bash
# P2: Raw reply.send with error objects instead of sendError()
rg 'reply\.(code|status)\(\d+\)\.send\(\{' <changed-api-files>
rg 'reply\.send\(\{\s*error' <changed-api-files>
```

Should use `sendError()`, `send400()`, `send401()`, etc. from the errors module.

### 4.6: CORS Origin Hardcoding (P1)

```bash
# P1: Hardcoded origin URLs in CORS config instead of reading from env var
rg -n 'origin:\s*\[' <changed-api-files>
rg -n "allowedOrigins.*=.*\[.*https?://" <changed-api-files>
rg -n "Access-Control-Allow-Origin.*https?://" <changed-api-files>

# P1: CORS origin set to wildcard
rg -n "origin.*['\"]\*['\"]" <changed-api-files>
```

CORS origins MUST come from an environment variable (e.g., `ALLOWED_ORIGINS`), never hardcoded. Hardcoded origins break when new frontends are added or URLs change. A wildcard `*` origin on an authenticated API is also a P1 — it disables the browser's origin protection (and is invalid alongside `credentials` anyway).

### 4.7: Missing Startup Env Var Validation (P1)

When a changed file introduces a new `process.env.X` read that the app requires at runtime:

```bash
# Find new env var reads in changed files
git diff HEAD -- <changed-api-files> | rg '^\+.*process\.env\.\w+'
```

Verify the env var has:
1. A startup validation check (fail fast if missing in production).
2. An entry in `.env.example`.
3. Documentation in deployment configs or the project's environment/ops documentation.

Missing startup validation for required env vars causes silent runtime failures that are hard to debug in production.

### 4.8: Hardcoded localhost in Production Paths (P2)

```bash
# P2: localhost/127.0.0.1 baked into non-test source
rg -n 'localhost|127\.0\.0\.1' <changed-ts-files> --glob '!*.test.*' --glob '!*.spec.*'
```

URLs pointing at `localhost` must come from configuration (an env var, optionally with a local-dev default), never hardcoded in production code paths. **Exceptions**: dev-server config files (`vite.config.ts`, `*.config.*`), test files, and env-var fallback defaults (`process.env.API_URL ?? "http://localhost:3000"`) are acceptable.

---

## Phase 5: TypeScript Hygiene

**Applies to**: all changed TS/TSX files

### 5.1: New `any` Types (P2)

```bash
# P2: any type annotations in new/changed code
rg ':\s*any\b' <changed-ts-files>
rg 'as\s+any\b' <changed-ts-files>
```

Count occurrences. Existing `any` in unchanged code is not flagged. New `any` in changed lines is P2.

To detect only NEW `any` usage:
```bash
git diff HEAD -- <file> | rg '^\+.*:\s*any\b'
git diff HEAD -- <file> | rg '^\+.*as\s+any\b'
```

### 5.2: Missing Type on Button Elements (P1)

```bash
# P1: Raw <button> without explicit type attribute
rg '<button\b(?![^>]*\btype=)' <changed-tsx-files>
```

Raw `<button>` elements default to `type="submit"` which accidentally submits forms. Must specify `type="button"` or `type="submit"` explicitly. The shared `<Button>` component handles this (defaults to `type="button"`).

### 5.3: Import Path Conventions (P3)

```bash
# P3: Direct relative imports from packages instead of workspace aliases
rg "from ['\"]\.\.\/\.\.\/packages\/" <changed-ts-files>
rg "from ['\"]\.\.\/\.\.\/\.\.\/packages\/" <changed-ts-files>
```

Should use the project's workspace aliases (e.g. `@<scope>/shared`, `@<scope>/api-core` — read the actual scope from the root `package.json` workspaces or `tsconfig.json` paths).

```bash
# P3: Importing utilities from the shared package root instead of a sub-path
rg "from ['\"]@<scope>/shared['\"]" <changed-ts-files> -A 1
```

Check if the import includes utility functions that the package exposes under a sub-path (e.g. `@<scope>/shared/utils`) and should be imported from there.

### 5.4: Swallowed Errors (P1)

```bash
# P1: Empty catch blocks
rg -n 'catch\s*\(\s*\w*\s*\)\s*\{\s*\}' <changed-ts-files>

# P1: Catch bodies that discard the error — list and inspect
rg -n -A 3 'catch\s*(\(\s*\w*\s*\)\s*)?\{' <changed-ts-files> --glob '!*.test.*' --glob '!*.spec.*'
```

For each catch block in changed code, the body must reference the caught identifier (log it, wrap it, surface `error.message`), rethrow, or carry an explicit `// intentional discard — <reason>` comment. A generic `catch { return GENERIC_CODE }` that drops the underlying error is a P1 — the error must reach the user, the logs, or the issue ledger. Where the project wires the `error_swallow_guard.py` hook, that guard enforces this at write time; this scan is the audit.

### 5.5: Suppression Directives Without Explanation (P2)

```bash
# P2: @ts-ignore / @ts-expect-error without a reason
rg -n '@ts-ignore|@ts-expect-error' <changed-ts-files>
```

Prefer `@ts-expect-error` over `@ts-ignore`, and require a trailing explanation on the same line (e.g. `// @ts-expect-error — lib types lag behind runtime`). A bare suppression directive on a changed line is P2.

---

## Phase 6: API Pattern Compliance

**Applies to**: changed API TS files (`apps/*/src/*.ts` for API directories)

### 6.1: Missing Credentials Include (P0)

```bash
# P0: fetch() calls without credentials: "include" (breaks cookie auth)
rg 'fetch\(' <changed-public-tsx-files> <changed-internal-tsx-files> -A 5
```

For each `fetch()` call, verify `credentials: "include"` is present either in the options object or via a shared `authHeaders()` call that includes it. Missing credentials means the request won't send cookies, causing silent 401 failures.

**Exception**: Fetches to external URLs (not the app's own API) may intentionally omit credentials.

### 6.2: Missing Auth Headers (P1)

```bash
# P1: fetch without authHeaders() in authenticated components
rg 'fetch\(' <changed-app-tsx-files> -B 5 -A 10
```

Verify that API calls in authenticated contexts use `authHeaders()` from the auth hook. Direct `fetch()` without auth headers to protected endpoints is P1.

### 6.3: Missing Offline Guard on Mutations (P1)

**Applies only if the project has an offline-support contract** — check `project.config.yaml` or look for an offline hook / `isOffline` pattern in the shared code. Skip (and note) if the project has no offline requirement.

```bash
# P1: Form submit or mutation button without isOffline check
rg '(onSubmit|handleSubmit|handleDelete|handleUpdate|handleSave)' <changed-tsx-files> -l
```

For each mutation handler, verify:
1. The component receives `isOffline` prop or uses an offline hook
2. The submit/mutation button has `disabled={isOffline}` or equivalent guard
3. An offline banner is shown when offline

Missing any of these is P1.

---

## Phase 7: Component Pattern Compliance

**Applies to**: changed TSX files

### 7.1: Missing useCallback on Fetch Functions (P2)

```bash
# P2: Functions used in useEffect deps without useCallback
rg 'useEffect\(\s*\(\)\s*=>\s*\{[^}]*\b(fetch|load|get)[A-Z]' <changed-tsx-files>
```

If a `fetchXxx` or `loadXxx` function is called inside `useEffect` and defined in the component body without `useCallback`, it will cause infinite re-renders when listed in the dependency array (or a stale closure if omitted).

### 7.2: Missing Error State UI (P2)

```bash
# P2: Components with fetch but no error state rendering
rg 'catch\s*\(' <changed-tsx-files> -l
```

For each file with a catch block, verify there's an error state variable and corresponding UI (`<Alert variant="error">` or equivalent). Silent error swallowing is P2.

### 7.3: Skeleton vs Spinner Loading (P3)

```bash
# P3: Spinner loading instead of skeleton
rg '(Loading\.\.\.|spinner|Spinner|CircularProgress)' <changed-tsx-files>
```

Project convention is skeleton blocks (`<div className="skeleton ...">`) for loading states, not spinners. P3 finding.

### 7.4: Missing Cache Write After Fetch (P3)

**Applies only if the project has an offline-caching layer** (e.g. a `writeCached()` helper or equivalent). Skip if there is no offline requirement.

```bash
# P3: fetch without corresponding cache write
rg 'fetch\(' <changed-public-tsx-files> -l
```

For public-facing app components that fetch API data, verify the project's cache-write helper (e.g. `writeCached()`) is called with the response data. Missing cache write means the data isn't available offline. P3 for non-critical data, P2 for core dashboard data.

---

## Phase 8: ORM Schema-to-Database Consistency

**Applies to**: changed schema files, migration files, or any file that adds new `pgTable()` definitions

First locate the project's layout: `<schema-file>` is wherever the ORM table definitions live (e.g. `packages/shared/src/schema.ts`, `src/db/schema.ts`), and `<migrations-dir>` is any directory matching `**/migrations/*.sql` (e.g. `db/migrations/`, `supabase/migrations/`, `drizzle/migrations/`).

**Trigger condition**: This phase runs when any of these are true:
- `<schema-file>` was modified
- Files in a `<migrations-dir>` were modified
- Any changed `.ts` file contains a new `pgTable(` definition

### 8.1: New Tables Without Migrations (P0)

When a new `pgTable()` definition is added to the schema, verify a corresponding `CREATE TABLE` migration exists.

```bash
# Extract all table names from schema
grep 'pgTable("' <schema-file> | sed 's/.*pgTable("//' | sed 's/".*//' | sort -u > /tmp/orm_tables.txt

# Extract all CREATE TABLE names from migrations
grep -i 'CREATE TABLE' <migrations-dir>/*.sql | sed 's/.*CREATE TABLE[^"]*"\?//' | sed 's/[" (].*//' | sort -u > /tmp/migration_tables.txt

# Find ORM tables with no migration
comm -23 /tmp/orm_tables.txt /tmp/migration_tables.txt
```

Any table in the ORM schema without a corresponding CREATE TABLE in any migration is a **P0** finding — it will cause a "relation does not exist" 500 error in production.

### 8.2: Column Type Mismatches (P1)

When FK references are added, verify the referencing column type matches the referenced table's PK type.

```bash
# Find pgTable definitions with .references(() => users.id) where user_id is integer
# but users.id in the DB might be varchar
rg 'integer\("user_id"\).*references.*users' <schema-file>
```

Common mismatch: Drizzle says `integer("user_id").references(() => users.id)` but the DB `users.id` is actually `varchar`. This causes FK constraint errors at table creation time.

### 8.3: Migration-Schema Name Sync (P2)

If a migration renames or drops a table, verify the ORM schema was also updated:

```bash
# Find DROP TABLE or ALTER TABLE RENAME in new migrations
rg 'DROP TABLE|ALTER TABLE.*RENAME' <migrations-dir>/*.sql
```

Cross-reference against the ORM schema to ensure the old name is removed and the new name is present.

### 8.4: New Columns Without Migrations (P0)

**Most common regression in AI-assisted development.** When a new column is added to a `pgTable()` definition in the schema, but no `ALTER TABLE ADD COLUMN` migration exists, Drizzle's `db.select().from(table)` will generate `SELECT ..., missing_col FROM table` → PostgreSQL throws "column does not exist" → endpoint returns 500 → UI shows 0 rows.

**Detection:**
```bash
# Get columns added in this branch's schema changes
git diff main -- <schema-file> | grep '^+' | grep -oP '(?<=\(")[a-z_]+(?="\))' | sort -u > /tmp/new_schema_cols.txt

# Check if any of these columns have a corresponding ALTER TABLE ADD COLUMN in the migrations dir(s)
for col in $(cat /tmp/new_schema_cols.txt); do
  if ! grep -rqi "add column.*${col}" <migrations-dirs> 2>/dev/null; then
    echo "P0: Column '$col' added to schema but NO migration found"
  fi
done
```

**Why this is P0:** Unlike missing tables (which fail immediately on app startup), missing columns only fail when the specific endpoint is hit — often only discovered by users in production. Any generic CRUD/list path that uses `db.select().from(table)` selects ALL columns, making it the first path to break.

**Fix:** For every new column in the schema file, require a matching `ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <type>;` in the migrations directory.

### 8.5: Non-Idempotent Migrations (P2)

```bash
# P2: CREATE/ADD statements in changed migrations without IF NOT EXISTS
rg -in 'CREATE TABLE|CREATE INDEX|ADD COLUMN' <changed-migration-files>
```

For each match in a changed migration file, verify `IF NOT EXISTS` is present. New DDL without it is P2 — re-running the migration set against an existing database must be safe.

---

## Phase 9: Skeleton Component Detection

**Applies to**: changed TSX files that import mutation or query hooks

This phase catches the most dangerous anti-pattern in AI-assisted codebases: components that have correct imports and structure but no functional content.

### 9.1: Mutation Hook Without Form Inputs (P0)

```bash
# P0: Component imports mutation hook but has zero form input elements
for file in <changed-tsx-files>; do
  HAS_MUTATION=$(rg -c 'useApiMutation|useMutation|useFormState' "$file" 2>/dev/null || echo 0)
  if [ "$HAS_MUTATION" -gt "0" ]; then
    INPUTS=$(rg -c '<(input|select|textarea|FormField|FormSelect|FormCheckbox|FormDateInput|FormCurrencyInput|TextField|Input|Switch|Slider)\b' "$file" 2>/dev/null || echo 0)
    if [ "$INPUTS" -eq "0" ]; then
      echo "P0 SKELETON: $file — imports mutation hook but has 0 form inputs"
    fi
  fi
done
```

A component that imports a mutation hook clearly intends to write data, but if it has no form inputs, it cannot collect that data from the user. This is always a P0 skeleton.

### 9.2: Query Hook Without Data Rendering (P1)

```bash
# P1: Component imports query hook but doesn't render fetched data
for file in <changed-tsx-files>; do
  HAS_QUERY=$(rg -c 'useApiQuery|useQuery|useSWR' "$file" 2>/dev/null || echo 0)
  if [ "$HAS_QUERY" -gt "0" ]; then
    MAPS=$(rg -c '\.map\(' "$file" 2>/dev/null || echo 0)
    DATA_REFS=$(rg -c 'data\.\w+|item\.\w+|record\.\w+|\.\w+\}' "$file" 2>/dev/null || echo 0)
    if [ "$MAPS" -eq "0" ] && [ "$DATA_REFS" -lt "3" ]; then
      echo "P1 SKELETON: $file — imports query hook but minimal data rendering"
    fi
  fi
done
```

### 9.3: Form onSubmit Without API Call (P0)

```bash
# P0: Form has onSubmit handler but it doesn't call any API
for file in <changed-tsx-files>; do
  HAS_FORM=$(rg -c '<form\b.*onSubmit|handleSubmit' "$file" 2>/dev/null || echo 0)
  if [ "$HAS_FORM" -gt "0" ]; then
    HAS_API_CALL=$(rg -c 'mutate\(|mutation\.|fetch\(|api\.' "$file" 2>/dev/null || echo 0)
    if [ "$HAS_API_CALL" -eq "0" ]; then
      echo "P0 SKELETON: $file — form has onSubmit but no API call"
    fi
  fi
done
```

### 9.4: Stepper/Wizard With Empty Steps (P0)

```bash
# P0: Component has stepper/wizard but step content is suspiciously small
for file in <changed-tsx-files>; do
  HAS_STEPPER=$(rg -c 'Stepper|wizard|step.*===|activeStep|currentStep' "$file" 2>/dev/null || echo 0)
  if [ "$HAS_STEPPER" -gt "0" ]; then
    TOTAL_LINES=$(wc -l < "$file" | tr -d ' ')
    STEPS=$(rg -c 'step.*===|case.*:' "$file" 2>/dev/null || echo 0)
    # If a wizard has 5+ steps but less than 100 lines, it's likely a skeleton
    if [ "$STEPS" -gt "4" ] && [ "$TOTAL_LINES" -lt "100" ]; then
      echo "P0 SKELETON: $file — wizard with $STEPS steps but only $TOTAL_LINES lines (likely empty step bodies)"
    fi
  fi
done
```

### 9.5: Unused Hook Imports (P1)

```bash
# P1: Component imports hooks but never calls them in JSX or handlers
for file in <changed-tsx-files>; do
  # Check if imported mutation hook is actually used
  IMPORTS_MUTATION=$(rg 'useApiMutation|useMutation' "$file" | head -1)
  if [ -n "$IMPORTS_MUTATION" ]; then
    USES_MUTATION=$(rg 'mutate\(|mutation\.' "$file" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$USES_MUTATION" -eq "0" ]; then
      echo "P1: $file — imports mutation hook but never calls mutate()"
    fi
  fi
done
```

---

## Phase 10: Report

### 10.1: Finding Summary

Produce a summary table:

```text
VIBE-CODING GUARDRAILS REPORT
==============================

Scope:          <files scanned / git diff range>
Files scanned:  <count by bucket>
Scan time:      <seconds>

FINDINGS:
  P0 (Blocker):     <count>
  P1 (High):        <count>
  P2 (Medium):      <count>
  P3 (Low):         <count>
  Fixed (auto):     <count>

VERDICT:       <CLEAN | WARN | BLOCKED>
```

### 10.2: Findings Detail Table

```markdown
| # | Sev | Phase | File:Line | Finding | Status |
|---|-----|-------|-----------|---------|--------|
| 1 | P0  | 1.1   | App.tsx:42 | `label={t("login.id")}` — must use the bilingual label component (example from a bilingual-contract project) | OPEN / FIXED |
```

Group by severity (P0 first), then by phase.

### 10.3: Auto-Fix Summary (if `fix` mode)

```markdown
| # | File:Line | Before | After |
|---|-----------|--------|-------|
| 1 | App.tsx:42 | `label={t("login.id")}` | `label={<Bilingual tKey="login.id" />}` |
```

### 10.4: Next Steps

Based on verdict:
- **CLEAN**: "No guardrail violations. Ready for commit."
- **WARN**: "P1 findings should be addressed before merge. Use `/vibe-coding-guardrails fix` to auto-fix where possible."
- **BLOCKED**: "P0 violations must be resolved. These will break compliance or cause runtime failures."

---

## Common Fix Patterns

Quick-reference for auto-fixable violations:

| Finding | Before | After | Auto-fixable? |
|---------|--------|-------|---------------|
| Field label anti-pattern (bilingual-contract projects) | `label={t("k")}` | `label={<Bilingual tKey="k" />}` (or the project's bilingual component) | Yes |
| 100vh | `height: 100vh` | `height: 100dvh` | Yes |
| px in breakpoint | `@media (max-width: 768px)` | `@media (max-width: 48rem)` | Yes (if standard value) |
| Missing button type | `<button onClick={fn}>` | `<button type="button" onClick={fn}>` | Yes |
| console.log | `console.log("debug")` | *(remove line)* | Yes |
| Inline px spacing | `style={{ padding: "16px" }}` | `style={{ padding: "var(--space-4)" }}` | No (ambiguous token) |
| div onClick | `<div onClick={fn}>` | `<button type="button" onClick={fn}>` | No (needs class migration) |
| Missing credentials | `fetch(url)` | `fetch(url, { credentials: "include" })` | No (need to verify context) |
| Hardcoded English | `<h2>My Apps</h2>` | `<h2>{t("nav.my_apps")}</h2>` (or the bilingual component where the contract requires it) | No (need to create keys) |
| Missing locale key | Key in default locale only | Add to every other locale file | No (need translation) |

## Troubleshooting

### "Too many findings — where do I start?"

Focus on P0 first (they block compliance). Common triage order:
1. SQL injection / hardcoded secrets (P0 security) — fix immediately
2. Missing locale keys (P0 i18n) — add stubs to the other locale files
3. Field label anti-pattern (P0, bilingual-contract projects) — mechanical find-replace
4. 100vh / px breakpoints (P0 CSS) — mechanical find-replace
5. P1 findings — address before merge
6. P2/P3 — address opportunistically

### "False positive on SQL injection"

The SQL injection check (`query(\`...`)`) triggers on template literals. If the interpolated values are constants (table names, column names from code — not user input), downgrade to P2 with a note. Verify by tracing the variable to its source.

### "False positive on hardcoded English"

Common false positives:
- JSX attribute string values (e.g., `className="My-Component"`)
- Variable names that look like English words
- SVG text content
- Code inside `{/* comments */}`

If a heading genuinely needs no translation (e.g., a brand name), add a comment: `{/* i18n-ignore: brand name */}`.

### "I changed packages/* but nothing was scanned"

Package files are only scanned for Phases 4 (security) and 5 (TypeScript). They don't have UI, so i18n/CSS/accessibility/component checks are skipped.

### "My changes pass guardrails but build fails"

This skill does NOT compile or build — it's a pattern-matching pre-check. Run `npm run build:<app>` or use the `/local-deployment` skill for build verification. Guardrails and builds are complementary checks.
