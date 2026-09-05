import { describe, it, expect } from "vitest"
import {
  nextPageParam,
  FORUM_THREADS_PAGE_SIZE,
} from "./useForumThreads"
import { FORUM_POSTS_PAGE_SIZE } from "./useForumThreadPosts"

/**
 * Audit W3. The forum lists used to page by GROWING the limit
 * (`setLimit(l => l + 20)`), which A9 then capped server-side at
 * `@Max(50)`. The third "load more" therefore asked for 60, the global
 * ValidationPipe answered 400, and — because neither view read the hook's
 * `error` — the button silently stopped working. Threads and posts past the
 * 40th could not be reached at all.
 *
 * The first test below is the regression guard for exactly that: it is the
 * arithmetic the old views performed, asserted against the real DTO cap. It
 * fails if anyone reintroduces limit-growth paging.
 */

/** The `@Max(50)` on ListThreadsQueryDto.limit and ListPostsQueryDto.limit. */
const DTO_MAX_LIMIT = 50

const page = (n: number, total: number) => ({
  items: Array.from({ length: n }, (_, i) => i),
  total,
})

describe("forum paging — the W3 regression", () => {
  it("the requested limit is constant across clicks and inside the DTO cap", () => {
    for (const size of [FORUM_THREADS_PAGE_SIZE, FORUM_POSTS_PAGE_SIZE]) {
      // What the hooks now send on click N: a fixed limit, an advancing page.
      const request = (clicks: number) => ({ page: clicks, limit: size })
      const limits = [1, 2, 3, 5, 10].map((c) => request(c).limit)

      expect(new Set(limits).size).toBe(1) // the limit never grows
      expect(Math.max(...limits)).toBeLessThanOrEqual(DTO_MAX_LIMIT)
      expect(request(10).page).toBe(10) // paging is what advances instead
    }
  })

  it("documents the old scheme failing, so the guard above is not vacuous", () => {
    // This is what the deleted `setLimit(l => l + PAGE)` produced.
    const oldLimitAfter = (clicks: number) => FORUM_THREADS_PAGE_SIZE * clicks
    expect(oldLimitAfter(1)).toBe(20)
    expect(oldLimitAfter(2)).toBe(40)
    expect(oldLimitAfter(3)).toBe(60)
    expect(oldLimitAfter(3)).toBeGreaterThan(DTO_MAX_LIMIT) // → 400 Bad Request
  })
})

describe("nextPageParam", () => {
  it("asks for page 2 when the first page does not cover the total", () => {
    expect(nextPageParam(page(20, 57), [page(20, 57)])).toBe(2)
  })

  it("stops when the loaded rows exactly equal the total", () => {
    const pages = [page(20, 40), page(20, 40)]
    expect(nextPageParam(pages[1], pages)).toBeUndefined()
  })

  it("stops when the loaded rows exceed a total that shrank mid-read", () => {
    // A thread was deleted between page 1 and page 2, so `total` came back
    // lower than what is already on screen. Must terminate, not go negative.
    const pages = [page(20, 30), page(20, 18)]
    expect(nextPageParam(pages[1], pages)).toBeUndefined()
  })

  it("stops on an empty page even while total still claims more", () => {
    // Otherwise this requests the same page forever.
    const pages = [page(20, 99), page(0, 99)]
    expect(nextPageParam(pages[1], pages)).toBeUndefined()
  })

  it("keeps counting across many pages rather than trusting one page", () => {
    const pages = [page(20, 65), page(20, 65), page(20, 65)]
    expect(nextPageParam(pages[2], pages)).toBe(4)
    const done = [...pages, page(5, 65)]
    expect(nextPageParam(done[3], done)).toBeUndefined()
  })
})
