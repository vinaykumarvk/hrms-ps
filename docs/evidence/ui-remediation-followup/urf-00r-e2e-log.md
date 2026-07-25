# URF-00R — E2E execution evidence

**Executed:** 2026-07-25 · **Command:** `E2E_WEB_PORT=5199 E2E_API_PORT=8799 npm run web:test:e2e`
**Result:** `16 passed (8.0s)` · exit 0

This is the first executed browser evidence in the follow-up programme. URF-00 could not obtain
any: the gate hung on an occupied port (FR-11a), and Playwright's browser binaries were not
installed on this machine at all.

## Two blockers cleared to get here

1. **Port collision.** `reuseExistingServer: false` with hardcoded ports made the gate unrunnable
   whenever anything held 5173/8787. Now parameterised — this run used 5199/8799 and did not
   disturb the developer's environment.
2. **No browsers installed.** Every one of the 16 tests failed with
   `browserType.launch: Executable doesn't exist at .../chromium_headless_shell-1193`. Resolved by
   `npx playwright install chromium`.

   This matters for the record: the source review states **"Browser tests | yes | 14/14 pass"**.
   That result is not reproducible on this machine, and the suite contains 16 tests, not 14.

## A stale locator that had been failing silently

The first successful launch produced **14 passed, 2 failed**. Both failures were the drawer tests:

```
Error: locator.click: Test timeout of 30000ms exceeded.
  - waiting for getByRole('button', { name: 'Open menu' })
  at apps/web/test/e2e/critical.spec.ts:23
```

The disclosure button's accessible name is `"Open navigation menu"` (`AppShell.tsx:94`). Playwright's
`name` option matches a substring, and `"Open menu"` is not a substring of `"Open navigation menu"`,
so both locators had been dead since the label was refined. The drawer control itself was verified
present and correctly wired (`aria-expanded`, focus restoration via `restoreMenuFocusRef`) before
the locators were re-anchored — same triage rule as the unit tests.

**These two tests are exactly what FR-12's closure rested on** ("keyboard drawer/dialog paths
execute in Chromium"). They could not have passed since the label change.

## What the 16 passing tests actually prove

| Test | Proves |
|---|---|
| login foundation, no document overflow — phone / tablet / desktop | no horizontal overflow at 360×800, 768×1024, 1280×800 |
| login has no axe violations | `expect(results.violations).toEqual([])` — **fails on every violation, no impact filter** |
| visible login controls expose a focus indicator | focus visibility on login |
| employee navigation and mobile drawer are operable | drawer opens, navigates, URL updates at 360×800 |
| employee direct admin route fails closed | client route guard denies the unauthorised deep link |
| workflow configuration controls have outcomes and publish confirmation | action → outcome → confirmation |
| authenticated shell has no axe violations | axe clean on the authenticated shell, same strict posture |
| authenticated shell reachable without horizontal overflow across viewports | authenticated overflow across the viewport matrix |
| drawer and dialog support keyboard open close and focus return | **Enter** opens, **Escape** closes, focus returns to the trigger — for both the nav drawer and the publish dialog |
| workflow network failure is recoverable | recovery path after a network error |
| expired session clears protected state and shows a generic message | FR-03 regression guard, executed |
| evidence screenshot matrix ×3 | screenshots regenerated at all three viewports |

## What it does NOT prove — FR-12 and FR-13 stay partial

Do not read a green suite as closure of either finding. Against the review's stated asks:

**FR-12** — "fail on all unwaived axe violations **and add Tab/Shift+Tab/Enter/Escape journey
coverage**".

- Axe posture: **satisfied.** `toEqual([])` fails on every violation with no impact filtering, which
  is what the finding asked for after the earlier version discarded moderate violations.
- Keyboard journey: **partially satisfied.** Enter, Escape, and focus return are asserted on both
  the drawer and the dialog. **Tab and Shift+Tab traversal are not exercised** — the test moves
  focus programmatically with `.focus()` rather than traversing. The finding named Tab/Shift+Tab
  explicitly.

**FR-13** — "add authenticated viewport, drawer, long-content, and safe-area assertions".

- Authenticated viewport: **satisfied.**
- Drawer: **satisfied.**
- Long-content: **not covered** — no test renders an overflowing page and asserts behaviour.
- Safe-area: **not covered** — no `env(safe-area-inset-*)` assertion exists in the specs, and no
  safe-area rule was found in `apps/web/src/styles.css`.

Both findings therefore move from `open` (unverifiable) to `partial` (verified in part, with the
named gaps outstanding). Closing them is URF-07's and URF-08's work, not URF-00R's.
