import { test, expect, type Page } from "@playwright/test"

/**
 * B7. The battlesim tool, driven in a browser against a real build.
 *
 * WHAT THIS COVERS, and why it is worth the runtime: everything here goes
 * through the package as a BUNDLE — the lazy screen chunks, the local battle
 * engine, the Web Worker it runs in, `@pkmn/sim`, and the DOM field layer. The
 * 259 vitest tests cover units; nothing before this ran the tool as a program.
 * A local AI battle is the ideal subject because it is entirely deterministic
 * from the browser's point of view: no relay, no API, no network at all.
 *
 * WHAT THIS DOES NOT COVER, stated plainly so a green run is not read as more
 * than it is:
 *   - PvP and the Showdown relay. Those need the socket transport, and a
 *     hand-written mock of it proves nothing about the real protocol. An
 *     earlier version of this file shipped exactly that — invented
 *     `42/showdown,["|move",…]` frames that the client would never have
 *     accepted — and every scenario built on it was decoration.
 *   - apps/web's Next.js integration. The host mounts `BsimRoot` with the
 *     MEMORY nav (the same backing the desktop uses), so `BsimRouted`, the
 *     Next router and the real URLs are outside this suite.
 *
 * ON THE SELECTORS. The host does not call `configureUi()` with a translator,
 * so `@boffmedia/ui`'s runtime returns the message KEY as the rendered string —
 * which is why assertions read `tools.battlesim.app.lobby.launch.ia` rather
 * than "Jugar contra la IA". That is deliberate: the key is a stable
 * identifier that a copy change cannot break, while the Spanish string is
 * edited routinely. Where the DOM offers a role or a data attribute, that is
 * used instead.
 *
 * ON TIMING. A random battle picks different teams every run, so nothing here
 * asserts on a species, a move name or a turn number. The observable that IS
 * stable is the room tab's state suffix: `state.running` while the engine is
 * thinking, `state.yourTurn` when it wants a choice. Every wait below is a
 * web-first assertion on one of those; there is no `waitForTimeout` used as a
 * synchronisation primitive.
 */

const LAUNCH_AI = "tools.battlesim.app.lobby.launch.ia"
const TAB_HOME = "tools.battlesim.tabs.home"
const TAB_TEAMS = "tools.battlesim.tabs.teams"
const TAB_REPLAYS = "tools.battlesim.tabs.replays"

/** The engine wants a choice from the player. */
const YOUR_TURN = /tabs\.state\.yourTurn/
/** The engine is resolving a turn. */
const RUNNING = /tabs\.state\.running/

/** A battle can legitimately end mid-scenario; treat that as "not stuck". */
const BATTLE_OVER = /tabs\.state\.(finished|ended|over)/

/**
 * Start a local AI battle and wait until it is asking for a move.
 * 60s because the first click pays for the lazy engine chunk AND worker boot.
 */
async function startAiBattle(page: Page) {
  await page.getByRole("button", { name: LAUNCH_AI }).click()
  await expect(page.getByRole("tab", { name: YOUR_TURN })).toBeVisible({ timeout: 60_000 })
}

/**
 * The move keys in the battle dock.
 *
 * Scoped to the dock REGION and matched on the PP counter (`24/24`), not on the
 * type badge. Filtering the whole page by `battle.types.` also matches the
 * Pokémon-details cards, which carry the same type badges — Playwright then
 * resolved `.first()` to a details card sitting under the field art, and the
 * click failed with "img intercepts pointer events" rather than with anything
 * that pointed at the real mistake.
 */
function moveButtons(page: Page) {
  return page
    .getByRole("region", { name: "tools.battlesim.battle.dock.aria" })
    .locator("button")
    .filter({ hasText: /\d+\/\d+/ })
}

test.describe("battlesim (local AI path)", () => {
  // Collected per test and asserted at the end of each one, so a scenario that
  // "passes" while the console is full of React errors still fails.
  let pageErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    pageErrors = []
    page.on("pageerror", (e) => pageErrors.push(e.message))
    await page.goto("/")
    // The tool has mounted when its tab bar exists.
    await expect(page.getByRole("tab", { name: TAB_HOME })).toBeVisible({ timeout: 30_000 })
  })

  test.afterEach(() => {
    expect(pageErrors, `uncaught page errors: ${pageErrors.join(" | ")}`).toHaveLength(0)
  })

  test("1. the hub mounts with its tab bar and lobby tiles", async ({ page }) => {
    await expect(page.getByRole("tab", { name: TAB_HOME })).toBeVisible()
    await expect(page.getByRole("tab", { name: TAB_TEAMS })).toBeVisible()
    await expect(page.getByRole("tab", { name: TAB_REPLAYS })).toBeVisible()
    // The lobby's launch affordance — the entry point every other scenario uses.
    await expect(page.getByRole("button", { name: LAUNCH_AI })).toBeEnabled()
    // Exactly one layer is mounted before any room is opened.
    await expect(page.locator("[data-bsim-layer]")).toHaveCount(1)
  })

  test("2. hub -> teams -> replays -> hub leaves the tool alive", async ({ page }) => {
    await page.getByRole("tab", { name: TAB_TEAMS }).click()
    await expect(page.getByRole("tab", { name: TAB_TEAMS })).toHaveAttribute("aria-selected", "true")

    await page.getByRole("tab", { name: TAB_REPLAYS }).click()
    await expect(page.getByRole("tab", { name: TAB_REPLAYS })).toHaveAttribute("aria-selected", "true")

    await page.getByRole("tab", { name: TAB_HOME }).click()
    // Back at the lobby, still able to start a battle: the tool is not a husk.
    await expect(page.getByRole("button", { name: LAUNCH_AI })).toBeEnabled()
  })

  test("3. starting an AI battle opens a room and renders the field", async ({ page }) => {
    await startAiBattle(page)

    // A room layer is added ALONGSIDE the base layer rather than replacing it —
    // that is the architecture BsimRoot's header describes, and scenario 6
    // depends on it.
    await expect(page.locator("[data-bsim-layer]")).toHaveCount(2)

    // The field is a DOM layer, not a <canvas>. It must have a real box: a
    // zero-sized field is the failure that hands the sprite engine a zero
    // scale (see BsimRoot's note on visibility:hidden).
    const field = page.locator("[data-bsim-field-layer]")
    await expect(field).toHaveCount(1)
    const box = await field.boundingBox()
    expect(box, "the field layer has no box at all").not.toBeNull()
    expect(box!.width).toBeGreaterThan(100)
    expect(box!.height).toBeGreaterThan(100)
  })

  test("4. the battle reaches a playable turn with usable moves", async ({ page }) => {
    await startAiBattle(page)

    const moves = moveButtons(page)
    // A Gen 9 random battle always gives the active Pokémon at least one move.
    await expect
      .poll(async () => moves.count(), { timeout: 30_000 })
      .toBeGreaterThan(0)
    await expect(moves.first()).toBeEnabled()
  })

  test("5. choosing a move advances the battle", async ({ page }) => {
    await startAiBattle(page)

    const moves = moveButtons(page)
    await expect.poll(async () => moves.count(), { timeout: 30_000 }).toBeGreaterThan(0)
    await moves.first().click()

    // The request is consumed: the room stops asking for a choice.
    await expect(page.getByRole("tab", { name: YOUR_TURN })).toHaveCount(0, { timeout: 30_000 })

    // ...and the engine picks the turn up.
    //
    // MEASURED, NOT ASSUMED: deleting `this.revision++` from
    // `BattleSession.notify()` does NOT turn this red. The room tab's state
    // suffix is driven by the rooms registry, not by the memo'd render path
    // that `revision` exists to poke, so this scenario proves the ENGINE
    // advances and says nothing about whether the field re-paints. A regression
    // test for the frozen-canvas bug would have to assert on rendered field
    // content (sprite positions, HP bars) and does not exist yet — see the
    // header's "does not cover" list rather than assuming this covers it.
    await expect
      .poll(
        async () => {
          const tabs = await page.getByRole("tab").allTextContents()
          return tabs.some((t) => RUNNING.test(t) || YOUR_TURN.test(t) || BATTLE_OVER.test(t))
        },
        { timeout: 30_000 },
      )
      .toBe(true)
  })

  test("6. leaving the room and coming back does not destroy the battle", async ({ page }) => {
    await startAiBattle(page)

    const roomTab = page.getByRole("tab").filter({ hasText: /Gen 9/ })
    await expect(roomTab).toHaveCount(1)
    const roomLabel = (await roomTab.textContent())!

    // Go back to the lobby and return. A battle is a Web Worker owned by this
    // tree; if the layer were unmounted the room would be gone, which is the
    // whole reason BsimRoot renders a layer per room.
    await page.getByRole("tab", { name: TAB_HOME }).click()
    await expect(page.getByRole("button", { name: LAUNCH_AI })).toBeVisible()
    // The room layer survives the trip, hidden rather than unmounted.
    await expect(page.locator("[data-bsim-layer]")).toHaveCount(2)

    // ...and it is hidden with `visibility`, NOT with `display`. This is the
    // assertion that earns its place: `hidden` would also keep the element in
    // the DOM and keep the count at 2, so a count alone cannot tell the two
    // apart. A display:none layer measures 0x0, and the sprite engine is a
    // module singleton shared by every room — one zero-sized measurement hands
    // every room a zero scale and the canvas comes back collapsed. BsimRoot's
    // header calls this out as load-bearing; nothing verified it until here.
    // `getBoundingClientRect` via evaluate, NOT Playwright's `boundingBox()`:
    // the latter returns null for anything it considers not visible, and a
    // `visibility:hidden` element is exactly that — so it cannot tell the
    // healthy case from the broken one. The DOM rect can: `invisible` keeps
    // layout, `hidden` collapses it to zero.
    //
    // `[data-bsim-layer][inert]` is THE selector for "the layer that is off
    // screen": BsimRoot sets `inert={!visible}`. Selecting by key does not
    // work — the visible layer here is keyed `pin:lobby`, not `base`, so
    // `:not([data-bsim-layer="base"])` matched the VISIBLE layer first and the
    // assertion passed against a healthy element while the broken one sat
    // untouched behind it. Caught by breaking the code and finding the test
    // still green.
    const hiddenRect = await page.evaluate(() => {
      const el = document.querySelector("[data-bsim-layer][inert]")
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { width: r.width, height: r.height, display: getComputedStyle(el).display }
    })
    expect(hiddenRect, "the hidden room layer is not in the DOM at all").not.toBeNull()
    expect(hiddenRect!.display, "the hidden layer is display:none").not.toBe("none")
    expect(hiddenRect!.height).toBeGreaterThan(0)

    await roomTab.click()
    // The SAME room, not a new one: the label carries the room id.
    await expect(page.getByRole("tab").filter({ hasText: /Gen 9/ })).toHaveText(roomLabel)
    await expect(page.locator("[data-bsim-field-layer]")).toHaveCount(1)
  })

  test("7. the replays screen loads", async ({ page }) => {
    await page.getByRole("tab", { name: TAB_REPLAYS }).click()
    await expect(page.getByRole("tab", { name: TAB_REPLAYS })).toHaveAttribute("aria-selected", "true")
    // It renders something rather than an empty layer or an error boundary.
    await expect(page.locator("[data-bsim-layer]").first()).not.toBeEmpty()
  })
})
