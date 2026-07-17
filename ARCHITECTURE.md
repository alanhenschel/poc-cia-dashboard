# CIA Dashboards — Architecture Review & Improvement Plan

**Status:** review + proposal only. Nothing here is executed except the test-folder move
(Session 10, already done). Everything below awaits a go-ahead before implementation.

**Context:** M2 frontend, 10 sessions of incremental build + QA/review, currently verified-correct
(tsc/eslint/build clean, 54 tests passing, Docker healthy on :3100). The bar for change is high — this
plan favors small, isolated, reversible edits over broad refactors.

---

## 1. What's healthy (leave alone)

- **Clean layering.** `components/` (by domain) · `services/` (mock isolated behind 2 facades) ·
  `hooks/` · `lib/` · `stores/` · `providers/` · `types/` · `constants/`. Matches the intended structure.
- **Mock-swap story holds.** Only `dashboard.service.ts` / `chart.service.ts` reach into `services/mock`;
  `ApiError` and the session seam live outside it. Going live = rewrite 2 files, delete `mock/`.
- **Server vs UI state discipline.** TanStack Query owns server state; Zustand holds only editor UI state.
- **Component sizes in budget.** Largest non-generated component is 269 lines (`chart-form`), under the
  300 cap. No god-components.
- **Widget-result state model** is a single exhaustive discriminated union rendered by one switch — the
  reason state-handling has stayed consistent.

---

## 2. Quick, safe cleanups — *recommend doing* (low risk, high confidence)

| # | Finding | Evidence | Proposed change | Risk |
|---|---------|----------|-----------------|------|
| A1 | **`@testing-library/jest-dom` is a dead dependency** — installed but never imported; tests use `toBeTruthy`/`toBeNull`/`getByText`, not jest-dom matchers. | only in `package.json`; zero `jest-dom` refs in `tests/`/`vitest.config.ts` | `npm uninstall -D @testing-library/jest-dom`. | None. |
| A2 | **`useChartsByIds` title-skeleton flash on add/remove.** Adding/removing a widget changes `chartIds` → changes the query key → `isPending` flips true → `chartNamePending` true for **every** widget → all titles flash to skeleton, even unchanged ones. | `hooks/use-charts.ts` (`byIds(sortedIds)` key), `dashboard-view.tsx:206` | Add `placeholderData: (prev) => prev` to `useChartsByIds` so `isPending` stays false and prior names show while the by-id query refetches. | Very low — same pattern already used in `use-dashboard-results`. |
| A3 | **Duplicated widget-size fallback.** `dashboard-view.tsx` hardcodes `{ x:0, y:0, w:6, h:4 }` as `positionOf`'s last-resort; the `w/h` half already exists as `DEFAULT_WIDGET_SIZE`. | `dashboard-view.tsx:112`, `constants/grid.ts:17` | Add a `DEFAULT_WIDGET_POSITION` constant and use it in both spots. | None. |

---

## 3. Clarify / document — *recommend a note, not a code change*

| # | Finding | Reality | Proposed action |
|---|---------|---------|-----------------|
| B1 | Prior review flagged `reconcileWithCompaction` for **skipping `correctBounds()`**. | `correctBounds` is **not** a public `react-grid-layout` export (internal only — can't import it). And the keyboard target is already edge-clamped by `clampedMove`/`clampedResize` *before* compaction; the vertical compactor only moves items **up** (never changes `x`/`w`), so bounds stay valid. The concern is effectively moot for our usage. | Add a one-line comment in `grid-layout.ts` explaining why bounds are already guaranteed; no logic change. |
| B2 | Grid drag/resize wiring (`onDragStop`/`onResizeStop` → dirty) is **not unit-tested**. | jsdom has no layout box for RGL to measure; the underlying logic *is* covered (`grid-layout.test.ts`, editor-store test). Verified via Playwright in Sessions 4/8. | Keep on manual/Playwright verification; note it as a deliberate coverage boundary (already in work.log). |

---

## 4. Known stubs (already tracked in work.log — backend-dependent, not drift)

These are intentional M2 boundaries, not regressions. Listed for completeness / sequencing.

- **List pagination is page-1 only.** Services + hooks honor `cursor`/`next_cursor`/`limit`; the list UIs
  render the first page. → add `useInfiniteQuery` + "load more"/scroll when volume warrants.
- **Auth/identity is a hardcoded seam** (`lib/session.ts` `CURRENT_USER_ID`). → swap for the Okta
  `cia-user` session; components already read from `getCurrentUserId()`.
- **`cia-analytics-admin` super-owner not modeled** — `can_mutate = owner === principal` only. → add the
  admin-group check in `store.canMutate()` when roles exist.
- **Single-widget refresh endpoint unused** — only the batch `/results` path is consumed; "Retry now"
  refetches the whole batch. → wire `/widgets/:wid/result` if per-widget refresh is wanted.
- **Change-log / versioning UI not built** — backend read-model, out of Epic 9 scope.

---

## 5. Larger enhancements — *need a product decision before scoping* (do NOT start)

| # | Idea | Why it matters | Cost |
|---|------|----------------|------|
| C1 | **Route-level `error.tsx` / `not-found.tsx` / `loading.tsx`.** None exist today. A thrown render error bubbles to Next's default page; `/dashboards/[id]` has no `not-found.tsx` (the view handles bad ids inline, which is fine, but there's no error boundary for unexpected throws). | Robustness / polish; standard Next App Router hygiene. | Small–medium. Additive, low risk, but it's new surface area on a QA'd app — hence approval. |
| C2 | **Sync the global filter to the URL** (`?platform=…&country=…`). Filters live only in Zustand, so a shared dashboard URL carries the *saved default* filter, not the viewer's current ad-hoc selection. | Epic 9's headline is "canonical URL as the sharing mechanism"; shareable *filtered* views (Amplitude-style) are a natural extension. | Medium. Touches filter-bar + view wiring — deliberately out of a "token/cleanup" pass. |
| C3 | **Broaden unit-test coverage.** Currently tested: `grid-layout`, `result-engine`, mock `store`, `chart.service` (`getChartsByIds` only), editor store, `widget-result-view`. Untested: the hooks, the RHF+zod forms/schemas, the rest of the service facades (list/get/create/update/delete, widget + chart CRUD, pagination helper). | The bugs found across sessions were mostly in logic that *now* has tests; the untested facade CRUD + form validation are the remaining silent-regression surface. | Medium; purely additive. Good candidate but sizeable — sequence explicitly. |

---

## 6. Recommended sequencing

1. **Now, if approved:** A1–A3 (dead dep, flash fix, dedup constant) + B1 comment — all tiny, isolated,
   individually revertible, each re-verified against the full gate set.
2. **Next, if wanted:** C1 (route error/not-found/loading files) — additive robustness.
3. **Then, product-gated:** C2 (filter-in-URL) and C3 (facade/form test coverage), each its own session.
4. **Backend-gated (Section 4):** as the real `cia-backend` lands.

*Everything in Sections 2–5 is a proposal. Say which items to proceed with and I'll implement them one at
a time, gated on tsc/eslint/build/test + Docker, same discipline as prior sessions.*
