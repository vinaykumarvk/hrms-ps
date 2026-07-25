# URF-00R — Baseline repair and web-test triage

**Phase:** URF-00R (inserted after URF-00 on user approval, 2026-07-25)
**Scope approved:** fix the useForm generic and its downstream errors; triage the 26 failing web
tests separating stale assertions from real defects; port the ui-remediation checks off `rg`;
make the e2e gate fail fast on an occupied port.

---

## 0. Headline finding — this work already exists on an unmerged branch

`origin/feature/dev` contains commit **`4335641` "Fix useForm allTouched bug + clear pre-existing
web:test debt"** (2026-07-15), which fixed the same defect class and took the web suite to
153/153. It is **not** an ancestor of HEAD.

```
merge-base(origin/feature/dev, HEAD) = 15f0a7b   "polish G06 G07 G09"
origin/feature/dev = 6 commits ahead   HEAD = 3 commits ahead
```

The two lines diverged at the workspace-polish commit:

- **`feature/dev`** fixed the tests, on the **pre-rebrand** `g01…g14` tree.
- **`main` → HEAD** did the PrimeSoft rebrand (`g*` → `ps*`, `ad02ea5`) and never took the fixes.

So the 26 failures were not new breakage — they are `feature/dev`'s already-solved problem
reappearing on the branch that skipped it. A clean cherry-pick is not possible: every path was
renamed by the rebrand, and the polish commits landed after.

**Recommendation:** reconcile `origin/feature/dev` into the mainline as a deliberate merge rather
than letting the two lines keep diverging. This phase reproduced its fixes where they were needed,
and deliberately adopted its public API (`loadAnalyticsDashboard`, `isMartStale`,
`MART_DRILL_DIMENSIONS`, `MART_FRESHNESS_SLA_MINUTES`) and its wording so the branches converge
rather than conflict. `feature/dev` also carries `f53f706` (Cloud Run demo fixes) which this branch
does not have and which was not evaluated here.

---

## 1. The typecheck failure — one root cause, 80 errors

`apps/web/src/lib/useForm.ts` had two independent type defects:

```ts
// before
export interface FormFields { [key: string]: FieldConfig; }          // = FieldConfig<string>
export type FormValues<T> = { [K in keyof T]: T[K] extends FieldConfig<infer V> ? V : never };
```

1. `FormFields` pinned every field to `FieldConfig<string>`, so any boolean, number, or
   object-valued field failed the constraint.
2. `FormValues` inferred through a conditional type, which collapsed to `never` whenever the
   constraint failed — and, where a field supplied `validate`, gave `V` a second inference site in
   a *contravariant* parameter position, so a helper typed `(value: unknown) => …` could widen the
   field's type.

```ts
// after
export interface FormFields { [key: string]: FieldConfig<any>; }     // admits non-string fields
export type FormValues<T> = { [K in keyof T]: T[K]["initial"] };     // direct read, no inference
```

`any` rather than `unknown` is required: `validate` is a function-typed property, so under
`strictFunctionTypes` a `FieldConfig<string>` is not assignable to a `FieldConfig<unknown>`.

Three call sites in `AparTierForms.tsx` also passed a **values** shape where the hook is generic
over the **field-config map** (`useForm<{ phase: SubmitPhase }>`); those type arguments were
removed so the value types infer from each field's `initial`.

**Result: 80 → 0 errors; `web:build` green.**

## 2. A latent runtime bug found in the same file

`handleSubmit` built an `allTouched` map and then discarded it, dispatching
`TOUCH_FIELD` with `field: null as unknown as keyof T` — writing a `null` key into the touched map
and leaving every real field untouched, so validation errors did not surface on unvisited fields
at submit. Fixed with a `TOUCH_ALL` action. This is the same defect and the same fix as
`origin/feature/dev@4335641`.

## 3. Triage of the 26 failing web tests

**Verdict: 26 stale assertions, 0 behavioural regressions.** Every failure traced to a UI change
made deliberately after the review (design tokens, DataTable/useForm migration, workspace polish,
rebrand) while a source-substring assertion continued to assert the pre-change spelling. In each
case the behaviour was independently verified present before the assertion was re-anchored.

| # | Tests | Asserted (stale) | Verified present as | Class |
|---|---|---|---|---|
| 1 | ph06d ×2, ph07e ×2, ph08f ×1, ph27a, ph34b, ph34c | `onSubmit={handleSubmit}` + `event.preventDefault()` | `onSubmit={handleFormSubmit}` wrapping `form.handleSubmit(...)`, which calls `preventDefault` internally | migration rename |
| 2 | ph06d | `"submitting"` phase literal | `form.isSubmitting` (state moved into the hook) | migration rename |
| 3 | ph06d | `useState` in TransferInitiateForm | `useForm(` | migration rename |
| 4 | ph05-records ×2 | `legal hold (fail-closed)` prose | DataTable `LEGAL HOLD` / `WORM` / `v4` badges + "Disposal disabled while legal hold or WORM retention is active" | presentation change |
| 5 | ph07 | `DEAD_LETTERED` | `slice.deadLettered` count **and rate**, rendered | evidence-line removal |
| 6 | ph08 ×1 | `PS06_PAY_IMPACT_SIGNAL` | `slice.paySignalsReady` SummaryStat | evidence-line removal |
| 7 | ph08 ×1 | `APAR_FINAL_GRADE`, `SEALED_COVER`, `PS08_PS06_FEED_SUPPRESSED`, `PS09_AUTHORITY_COMPETENCE`, `MAJOR_PENALTY`, `APPEAL_DECIDED` | `slice.srEventType`, `slice.sealedMarker`, `slice.feedMarker`, `slice.competenceMarker`, `slice.penaltyEventType`, `slice.appealMarker` — marker **values** from the API | evidence-line removal |
| 8 | ph09 | `PAYROLL_TRACE` + 4 more | `slice.runs` / `slice.disbursedRuns` / `slice.lastPayDrawnFeeds`; `PAYROLL_TRACE` now owned by `PayslipView` | evidence-line removal |
| 9 | ph07e | `ERR-PS02-SOD` | server-emitted code surfaced generically via `HrmsApiError.displayCode` → `state.errorCode`; only a doc comment naming it was removed (5bf0e8e) | comment removal |
| 10 | ph27c | `onClick=` | DataTable `callbacks={tableCallbacks}` + form submit | migration rename |
| 11 | ph08f ×1 | `/Reporting officer assessment/` | "Reporting Officer Assessment" — title-cased by the design pass | casing |
| 12 | ui-remediation-critical | `aria-label="Open menu"` | `aria-label="Open navigation menu"` | label refinement |
| 13 | ui-remediation-modules | `min-height: 2.75rem` | `min-height: var(--min-touch)` with `--min-touch: 2.75rem` in tokens.css | tokenization |
| 14 | ph10 ×7 | `loadAnalyticsDashboard`, `data-suppressed`, `Freshness (datamart_refresh_logs)` | see §4 — real testability regression | **export/hook loss** |

### The `evidence-line` cluster is not arbitrary

Items 5–8 all asserted marker strings that existed **only inside** a developer-facing debug
paragraph:

```tsx
<p className="evidence-line">{`DPC_QUORUM / DPC_RECUSAL / ${slice.srEventType} / G06_PAY_IMPACT_SIGNAL`}</p>
```

The polish commits (`ce56af2`, `15f0a7b`) removed that paragraph from every workspace — and
`ph10-analytics-release` **asserts the opposite of the old expectation**, requiring that no
`evidence-line` marker card survive:

```js
assert.equal(ps14Source.includes("evidence-line"), false, "…still carries the evidence-line marker card");
```

Restoring those strings to satisfy PH-07/08/09 would therefore have broken PH-10E. The tests
contradicted each other; the assertions were re-anchored to the data each workspace now renders,
and each re-anchored test now also asserts the marker card stays gone.

## 4. The one genuine regression: analytics testability

`AnalyticsWorkspace.tsx` stopped exporting `loadAnalyticsDashboard`, `isMartStale`,
`MART_DRILL_DIMENSIONS`, and `MART_FRESHNESS_SLA_MINUTES` (all still defined, all now module-
private), and dropped the `data-suppressed` / `data-stale` render hooks.

Seven behavioural tests — which transpile the real TSX and execute it — could no longer reach the
logic they audit. What went unenforced:

- **k-anonymity suppression**, including the NEGATIVE test proving raw small-cohort counts (3 and
  8) never reach the DOM — a privacy control
- complementary suppression
- the 60-minute mart staleness SLA and its fail-closed behaviour on non-success runs
- `FORBIDDEN` → no-permission and `NOT_FOUND` → empty mapping

**The privacy behaviour itself was intact throughout** — suppression was still computed and applied.
What was lost was the ability to *prove* it. Repaired by exporting the four symbols and restoring
the hooks and wording, matching `feature/dev@4335641`:

- `data-suppressed="true"` on suppressed KPI tiles and drill cells
- `data-stale="true"` on freshness rows
- "Suppressed — cohort below k=N", "(complementary suppression)", "Withheld — N suppressed
  cohort(s)", "FAILED — <detail>"
- one contiguous accessible name per KPI tile ("16 applications") via an `sr-only` node, with the
  split visual number/unit marked `aria-hidden`

## 5. Oracle repairs

**`rg` removal.** No ripgrep binary exists on this machine — inside an interactive Claude Code
shell `rg` resolves to a shell function, but the pipeline driver runs checks in plain bash. The
inherited negative scan was:

```bash
run bash -c '! rg -F "Welcome@123" dist/apps/web'    # exits 127 → negated → PASS
```

It reported PASS **without reading a file**, and it was the sole evidence behind FR-01's closure.
Ported `uir-01.sh` and `uir-08.sh` to `grep`, and made the scan fail when `dist/apps/web` is absent
— a negative assertion against a bundle that was never built proves nothing. Verified against three
cases: missing bundle → RED, planted credential → RED, clean bundle → ok.

**E2E fail-fast.** `reuseExistingServer: false` (the FR-11 repair) makes the gate hang silently for
two 120-second timeouts whenever anything holds 5173 or 8787 — which is what cost URF-00 its e2e
evidence. Added `tools/e2e-preflight.mjs`, wired into `npm run web:test:e2e`: it now fails in
**0.19s** naming the port, the process that needs it, and the `lsof` command to find the holder.

## 6. Verification

| Command | Before URF-00R | After |
|---|---|---|
| `npm run web:typecheck` | 80 errors | **0 errors** |
| `npm run web:build` | never ran (blocked) | **green, 476ms** |
| `npm run web:test` | 127/153, 26 fail | **153/153** |
| `npm run web:check` | RED | **GREEN** |
| `npm run check` (API) | 581/582, exit 0 | **581/582, exit 0** (unchanged) |
| `bash docs/spec/pipeline/checks/ph-05e.sh` | RED | **GREEN** |
| `npm run web:test:e2e` with 5173 held | silent hang, ~8 min | **fails in 0.19s with a diagnostic** |

## 7. What this does not close

- **FR-12 / FR-13 remain open.** The e2e suite still has not run — the preflight now reports the
  blocker instead of hanging, but a clean run needs port 5173 free. Neither accessibility nor
  responsive evidence was regenerated.
- **Test design.** These remain source-substring tests, which is the weakness FR-04 identified. The
  re-anchoring makes them accurate, not strong. Converting them to behavioural assertions is
  follow-on work; `ph10-analytics-release` shows the better pattern.
- **Branch divergence.** Reconciling `origin/feature/dev` is a decision, not a repair, and is left
  to a human.
