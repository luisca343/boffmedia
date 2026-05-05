# Manga Library UX — Spec & Implementation Status

## Objective

Refactor the manga converter's navigation and page removal flow to:
- Preserve user state across navigation
- Enable per-chapter page selection
- Eliminate full library reloads when navigating back
- Provide a smoother, more efficient UX

## Implementation

**Completed 2026-05-05.**

### Files Changed

| File | Change |
|---|---|
| `apps/web/src/stores/useMangaStore.ts` | Added `library`, `chapterPages` caching; updated `partialize` to persist both |
| `apps/web/src/app/(boffmedia)/(herramientas)/otros/manga-library/_components/MangaLibrary.tsx` | Full refactor — URL state, two-panel layout, Zustand wiring, scroll preservation |
| `apps/web/locales/en/boffmedia.json` | Added `selectChapter` key |
| `apps/web/locales/es/boffmedia.json` | Added `selectChapter` key |

---

## Requirements Status

### 1. Global State Management ✅

Zustand store at `stores/useMangaStore.ts` with `persist` middleware (localStorage).

State shape implemented:

```ts
type Store = {
  // Cached API data
  library: LocalMangaLibrary | null
  setLibrary: (lib: LocalMangaLibrary) => void

  chapterPages: Record<string, ChapterPageInfo[]>
  setChapterPages: (chapterId: string, pages: ChapterPageInfo[]) => void

  // Navigation state (secondary — URL is authoritative)
  currentMangaId: string | null
  currentChapterId: string | null

  // Discarded pages per chapter (persisted)
  pageSelections: Record<string, number[]>
  togglePage: (chapterId: string, page: number) => void
  setPages: (chapterId: string, pages: number[]) => void
  resetSelections: () => void
}
```

**Note on `pageSelections`:** stores pages to *discard* (exclude from EPUB), not pages to include.

Persisted to localStorage: `currentMangaId`, `currentChapterId`, `pageSelections`, `library`, `chapterPages`.

### 2. Routing & Navigation ✅

- URL structure: `/manga-library?series=[seriesSlug]&chapter=[chapterSlug]`
- `useSearchParams` + `useRouter` + `usePathname` (Next.js App Router)
- `router.push(..., { scroll: false })` on all internal navigations — no full reloads
- Component wrapped in `<Suspense>` (required for `useSearchParams`)
- Back button restores URL state automatically

### 3. Layout Structure ✅

Two views:

**Library view** (`?` — no params): full-width series grid (unchanged from before).

**Series+Chapter view** (`?series=X` or `?series=X&chapter=Y`): two-panel layout:
- Left panel (`lg:w-72 xl:w-80`, sticky, independently scrollable): chapter list with checkboxes
- Right panel (`flex-1`): page grid for selected chapter, or empty state if no chapter selected
- Active chapter highlighted with left border + color accent

### 4. Page Selection Logic ✅

- Per-chapter discarded pages persisted in `pageSelections[chapterSlug]`
- `togglePage` / `setPages` actions handle add/remove
- Selections survive navigation and page refresh
- Clear button resets via `setPages(slug, [])`
- Bulk bar and single-chapter bar are mutually exclusive (bulk takes priority when chapters selected)

### 5. Scroll Position Preservation ✅

- Library grid scroll: saved to `_libraryScrollY` (module-level) on departure, restored via `requestAnimationFrame` on return
- Chapter list panel scroll: preserved automatically (panel never unmounts within series view)
- Window scroll within series view: preserved by `{ scroll: false }` on `router.push`

### 6. Data Fetching Optimization ✅

- Library data: fetched once, cached in Zustand store + localStorage. Subsequent mounts skip the fetch.
- Chapter pages: fetched once per chapter, cached in `chapterPages` map + localStorage. Navigating back to a chapter is instant.
- Cache check uses `useMangaStore.getState()` inside effects to avoid stale closure dependencies.

### 7. Back Navigation Behavior ✅

Browser back/forward restores URL params → restores view state. No full reload. Library and page data served from cache.

---

## Design Decisions

- **URL is the source of truth** for which series/chapter is displayed. Store holds data cache and page selections only.
- **`MangaDownloader.tsx` excluded** — scope was limited to the library viewer.
- **No SWR/React Query** — simple Zustand store cache is sufficient for a local-first tool.
- **Bulk bar and single-chapter bar are mutually exclusive** — bulk takes priority when chapters are checked, preventing two overlapping floating bars.
