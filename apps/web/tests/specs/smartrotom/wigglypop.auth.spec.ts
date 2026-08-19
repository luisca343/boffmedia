import { expect, request as playwrightRequest, test } from "@playwright/test"
import type { APIRequestContext, Browser, Page, Request } from "@playwright/test"
import path from "path"
import enWigglypop from "../../../locales/en/smartrotom/wigglypop.json"
import esWigglypop from "../../../locales/es/smartrotom/wigglypop.json"

/**
 * Wigglypop — does the SESSION actually reach the API?
 *
 * Every mutation on this controller sits behind `GameOrUserAuthGuard`, and since
 * `ENFORCE_MONEY_AUTH` defaults to true the legacy `body.server === MC_WORLD`
 * tripwire no longer admits anybody. So the marketplace works if and only if the
 * production chain works:
 *
 *   rotomAuthedPATCH → sessionToken() → next-auth getSession() → authedRequest()
 *
 * That chain had only ever been checked with curl and a hand-minted JWT, which
 * proves the API accepts a token and says nothing about whether the browser
 * produces one. If `getSession()` came back empty in a real page, `sessionToken()`
 * would return `""`, `authedRequest` would send `Authorization: Bearer ` and every
 * mutation would 401 — with the curl test still green.
 *
 * THIS SUITE MUST NOT MOCK. Every other spec under tests/specs/smartrotom uses
 * mockGet/mockPost, which `route.fulfill()` the response; such a spec passes with
 * authentication completely removed, because the request never leaves the browser.
 * Here the assertions are on the real wire: the Authorization header Playwright
 * observed on the outgoing request, and the status the real API answered with.
 *
 * The mutation driven is PATCH /wigglypop/listings/:id (the "pause listing" button
 * on Mis anuncios) — the least destructive one the UI can reach. It moves no
 * money, creates no order and is undone by the sibling "resume" button; the
 * fixture it acts on is created and deleted by this suite.
 *
 * Runs against the ficuslab.es DEV environment, which is what playwright.config.ts
 * already defaults baseURL to; credentials and NEXT_PUBLIC_* come from
 * apps/web/.env.development.local, which that config loads.
 *
 *   npx playwright test --project=chromium:auth wigglypop.auth
 *
 * A local stack works too — point BASE_URL/NEXT_PUBLIC_API at it — but note that
 * main.ts lists only http://localhost:3000 among the local CORS origins, so on any
 * other port the browser blocks the mutation before the guard ever sees it, which
 * looks like a failure of this suite and is not one:
 *
 *   BASE_URL=http://localhost:3000 \
 *   NEXT_PUBLIC_API=http://127.0.0.1:<api port> \
 *   NEXT_PUBLIC_MC_WORLD=<the API's MC_WORLD, a v4 uuid> \
 *   TEST_USERNAME=... TEST_PASSWORD=... \
 *   npx playwright test --project=chromium:auth wigglypop.auth
 *
 */

// ─── Safety: never against production ─────────────────────────────────────────
// These are REAL mutations — they create a real listing and really change its
// status. ficuslab.es is the dev environment and is the intended target; the
// production apex is boffmedia.es and must never be touched, so a NEXT_PUBLIC_API
// pointing there aborts the run instead of proceeding.

const PRODUCTION_HOST = /(^|\.)boffmedia\.es$/i

function assertNotProduction(label: string, url: string | undefined): string {
  if (!url) {
    throw new Error(
      `[wigglypop.auth] refusing to run: ${label} is unset. ` +
        `Set it to the dev API (https://api.ficuslab.es) or a local stack.`,
    )
  }
  if (PRODUCTION_HOST.test(new URL(url).hostname)) {
    throw new Error(
      `[wigglypop.auth] refusing to run: ${label} is "${url}", which is PRODUCTION. ` +
        `This suite performs REAL Wigglypop mutations. Point it at the dev ` +
        `environment (https://api.ficuslab.es) or a local stack.`,
    )
  }
  return url.replace(/\/$/, "")
}

const API = assertNotProduction("NEXT_PUBLIC_API", process.env.NEXT_PUBLIC_API)
const MC_WORLD = process.env.NEXT_PUBLIC_MC_WORLD ?? ""
const LISTINGS = `${API}/smartrotom/wigglypop/listings`

// ─── Locators that survive a locale switch ───────────────────────────────────
// The button is labelled `t("anuncios.pauseAria")`. Reading both catalogues keeps
// the locator correct whichever locale the app renders, and keeps it from drifting
// when the copy is edited.
const PAUSE_LABEL = new RegExp(
  [enWigglypop.wigglypop.anuncios.pauseAria, esWigglypop.wigglypop.anuncios.pauseAria]
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
)

/**
 * Where tests/auth.setup.ts leaves the signed-in state, as `playwright.config.ts`
 * names it (`storageState: ".auth/user.json"`, relative to apps/web). Spelled out
 * rather than imported: Playwright refuses to let one test file import another.
 */
const AUTH_FILE = path.resolve(__dirname, "../../../.auth/user.json")

type SessionUser = {
  accessToken?: string
  smartRotomUser?: { uuid?: string }
}

/**
 * Unique per run. The suite shares the dev environment with real listings, and
 * "pause the first row" would happily pause somebody's actual sale — so the row is
 * located by this title and nothing else.
 */
const FIXTURE_TITLE = `wigglypop.auth.spec fixture ${Date.now()}`

/** A Wigglypop mutation, as Playwright saw it leave the browser. */
const isPauseMutation = (req: Request) =>
  req.method() === "PATCH" && req.url().startsWith(LISTINGS)

test.describe("Wigglypop — the session Bearer reaches the API", () => {
  let api: APIRequestContext
  let accessToken: string
  let sellerUuid: string
  let listingId: number

  /**
   * Reads the session the browser actually holds. This is the same document
   * `getSession()` consumes, fetched with the same cookies — so an empty
   * `accessToken` here is the exact failure this suite exists to catch, and it
   * fails in setup with a clear message rather than as a mystery 401 later.
   */
  async function readSession(browser: Browser) {
    const context = await browser.newContext({ storageState: AUTH_FILE })
    try {
      const res = await context.request.get("/api/auth/session")
      expect(res.ok(), "GET /api/auth/session must succeed for a signed-in context").toBe(true)
      const body = (await res.json()) as { user?: SessionUser }
      return body.user ?? {}
    } finally {
      await context.close()
    }
  }

  test.beforeAll(async ({ browser }) => {
    const user = await readSession(browser)

    expect(
      user.accessToken,
      "next-auth session carries no accessToken — sessionToken() would return \"\" and every Wigglypop mutation would 401",
    ).toBeTruthy()
    expect(
      user.smartRotomUser?.uuid,
      "session carries no smartRotomUser.uuid — useWpUuid() would be null and the UI would never fire the mutation",
    ).toBeTruthy()

    accessToken = user.accessToken as string
    sellerUuid = user.smartRotomUser?.uuid as string

    // The fixture. Created out-of-band with the same session Bearer so the UI test
    // below has something of its own to act on; `kind: "item"` because an item
    // listing is not verified against the seller's live PC.
    api = await playwrightRequest.newContext({ storageState: undefined })
    const created = await api.post(LISTINGS, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        sellerUuid,
        kind: "item",
        price: 1234,
        title: FIXTURE_TITLE,
        item: { itemId: "pixelmon:master_ball", qty: 1, itemName: "Master Ball" },
        server: MC_WORLD,
      },
    })
    expect(
      created.status(),
      `fixture listing could not be created: ${await created.text()}`,
    ).toBe(201)
    listingId = ((await created.json()) as { data: { id: number } }).data.id
  })

  test.afterAll(async () => {
    if (listingId) {
      await api.delete(`${LISTINGS}/${listingId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: { actorUuid: sellerUuid, server: MC_WORLD },
      })
    }
    await api.dispose()
  })

  /**
   * Opens Mis anuncios and returns the pause control OF THIS SUITE'S FIXTURE.
   * Scoped to the row carrying FIXTURE_TITLE: on the dev environment the seller
   * may own real listings, and a `.first()` here would pause one of those and
   * leave it paused.
   */
  async function openMyListings(page: Page) {
    await page.goto("/smartrotom/wigglypop/anuncios")
    const row = page.getByRole("row").filter({ hasText: FIXTURE_TITLE })
    await expect(
      row,
      "Mis anuncios never rendered the fixture's row — the listing did not load",
    ).toBeVisible({ timeout: 20_000 })
    return row.getByRole("button", { name: PAUSE_LABEL })
  }

  test("the UI's PATCH carries the session Bearer and is not rejected", async ({ page }) => {
    const pause = await openMyListings(page)

    // Both are armed BEFORE the click: the request tells us what the browser sent,
    // the response tells us what the API made of it. Neither is intercepted.
    const requestPromise = page.waitForRequest(isPauseMutation)
    const responsePromise = page.waitForResponse((res) => isPauseMutation(res.request()))

    await pause.click()

    const request = await requestPromise
    const response = await responsePromise

    // 1. The header exists at all.
    const authorization = (await request.allHeaders())["authorization"]
    expect(
      authorization,
      "the mutation left the browser with no Authorization header — sessionToken() returned empty",
    ).toBeTruthy()
    expect(authorization).toMatch(/^Bearer \S+$/)

    // 2. It is the session's own token, not some other credential. This is what
    //    proves getSession() resolved inside a real page context.
    expect(authorization).toBe(`Bearer ${accessToken}`)

    // 3. It acted on THIS suite's fixture and nothing else.
    expect(request.url()).toBe(`${LISTINGS}/${listingId}`)

    // 4. The API admitted it. 401 = the Bearer never arrived or did not verify;
    //    403 = it verified but the actor uuid was not the caller's own.
    expect(
      [401, 403],
      `the guard rejected the session: ${response.status()} ${await response.text()}`,
    ).not.toContain(response.status())
    expect(response.status()).toBe(200)

    // The request really was answered by the API, not by a route handler in-process.
    expect(response.url()).toContain("/smartrotom/wigglypop/listings/")
  })

  test("the same call from an anonymous context is 401, tripwire and all", async () => {
    // No storageState, so no cookies and no session — and the body carries the
    // legacy `server` tripwire that used to admit exactly this request.
    const anonymous = await playwrightRequest.newContext({ storageState: undefined })
    try {
      const res = await anonymous.patch(`${LISTINGS}/${listingId}`, {
        data: { status: "pausado", actorUuid: sellerUuid, server: MC_WORLD },
      })

      expect(
        res.status(),
        "an anonymous caller reached a Wigglypop mutation — the tripwire is still open",
      ).toBe(401)
    } finally {
      await anonymous.dispose()
    }
  })

  test("a session acting on another player's uuid is 403 ACTOR_NOT_SELF", async () => {
    // The Bearer is valid; only the claimed actor is wrong. Proves the token is
    // carrying an identity the server enforces against, not merely opening a door.
    const res = await api.patch(`${LISTINGS}/${listingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        status: "activo",
        actorUuid: "a1b2c3d4-1111-4222-8333-444455556666",
        server: MC_WORLD,
      },
    })

    expect(res.status()).toBe(403)
    expect(((await res.json()) as { code?: string }).code).toBe("ACTOR_NOT_SELF")
  })
})
