import { test, expect } from "../../fixtures"

/**
 * PC (Storage) pointer drag and drop.
 *
 * THIS FILE USED TO BE UNABLE TO FAIL, and it is worth recording how, because the
 * shape recurs. Every uncertainty was a bare `test.skip()` — not on /pc, zero
 * slots, no visible slot, fewer than two slots — so an account with an empty PC,
 * a session that never carried, or a page that 500'd all produced the same green
 * tick as a working drag. On top of that the ghost locator (`[class*='drag-ghost']`)
 * matched a class that has never existed in this app, and the assertions were
 * tautologies: `if (ghostVisible) expect(ghost).toBeVisible()` cannot fail, and
 * `expect(ghostVisible).toBe(false)` passes trivially when the locator matches
 * nothing — which is exactly what the pointercancel test, the one guarding the
 * bug this suite was written for (d675e5d81), was doing.
 *
 * The rule now, borrowed from admin.setup.ts: SKIP ONLY ON ABSENT CREDENTIALS.
 * That is the one condition CI legitimately hits, it is announced, and it is
 * outside the app's control. Everything else — bounced to sign-in, an empty PC,
 * a missing ghost — is a FAILURE with a message saying what to fix. A test
 * environment that is not set up should say so loudly; it must never mimic a pass.
 *
 * Requires TEST_USERNAME / TEST_PASSWORD pointing at an account whose PC holds at
 * least two Pokemon. Nothing here mutates storage: every drag is released over
 * empty space or aborted, so no drop is ever committed.
 */

const HAVE_CREDENTIALS = !!process.env.TEST_USERNAME && !!process.env.TEST_PASSWORD

test.describe("SmartRotom PC — pointer drag and drop", () => {
  test.skip(
    !HAVE_CREDENTIALS,
    "TEST_USERNAME / TEST_PASSWORD are unset, so no player session can be minted. " +
      "This is the ONLY condition under which this suite skips.",
  )

  test.beforeEach(async ({ pcPage, page }) => {
    await pcPage.goto()

    // Being bounced to sign-in means the storage state did not carry a session.
    // Skipping here is what let the whole suite pass while running anonymously.
    await expect(
      page,
      "Expected /smartrotom/pc, got bounced — the saved session did not carry. " +
        "Check tests/auth.setup.ts and that TEST_USERNAME is a real account.",
    ).toHaveURL(/\/smartrotom\/pc/)

    await expect(
      pcPage.occupiedSlots.first(),
      "The PC rendered no occupied slot. Either the page failed to load its boxes, " +
        "or TEST_USERNAME's PC is empty — these tests need an account holding at " +
        "least two Pokemon. Seed it rather than letting this suite skip.",
    ).toBeVisible({ timeout: 15_000 })
  })

  test("PC page loads at /smartrotom/pc", { tag: "@smoke" }, async ({ pcPage }) => {
    await expect(pcPage.title).toBeVisible()
  })

  test("the ghost appears past the threshold and follows the pointer", { tag: "@touch" }, async ({
    pcPage,
    page,
  }) => {
    const slot = pcPage.occupiedSlots.first()

    // Below DRAG_THRESHOLD_PX (7) this is a click, not a drag: no ghost.
    const box = await slot.boundingBox()
    expect(box, "the first occupied slot has no bounding box").not.toBeNull()
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 + 3, box!.y + box!.height / 2 + 3)
    await expect(
      pcPage.dragGhost,
      "a 4px move is under the 7px threshold and must not start a drag",
    ).toHaveCount(0)

    // Past it, the ghost exists...
    await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2 + 60, { steps: 8 })
    await expect(pcPage.dragGhost).toBeVisible()
    const first = await pcPage.ghostPosition()
    expect(first).not.toBeNull()

    // ...and tracks the pointer. Asserting only that it is visible would pass
    // against a ghost pinned at 0,0, which is the interesting way for this to break.
    await page.mouse.move(box!.x + box!.width / 2 + 200, box!.y + box!.height / 2 + 140, { steps: 8 })
    const second = await pcPage.ghostPosition()
    expect(second).not.toBeNull()
    expect(
      Math.hypot(second!.x - first!.x, second!.y - first!.y),
      "the ghost did not move with the pointer",
    ).toBeGreaterThan(50)

    // Release over the slot it came from: validate() sees an unchanged position,
    // so nothing is written even if a drop is registered.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2, { steps: 4 })
    await page.mouse.up()
    await expect(pcPage.dragGhost).toHaveCount(0)
  })

  test("pointercancel aborts the drag", { tag: "@touch" }, async ({ pcPage, page }) => {
    const slot = pcPage.occupiedSlots.first()
    await pcPage.startDragFrom(slot)

    // Proving the drag STARTED is the half the old test skipped, and without it
    // "the ghost is gone" is true of a gesture that never began — so the test
    // passed with the pointercancel handler deleted, which is the bug it guards.
    await expect(pcPage.dragGhost, "the drag never started, so the abort proves nothing").toBeVisible()

    // The browser revokes a pointer to scroll or zoom and no pointerup follows.
    // DragProvider listens on window, so dispatching anywhere reaches it.
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }))
    })

    await expect(pcPage.dragGhost, "a cancelled gesture left the ghost on screen").toHaveCount(0)

    // An abort is not a drop: releasing afterwards must not commit anything.
    await page.mouse.up()
    await expect(pcPage.dragGhost).toHaveCount(0)
  })

  test("a secondary button does not start a drag", { tag: "@touch" }, async ({ pcPage, page }) => {
    const slot = pcPage.occupiedSlots.first()
    const box = await slot.boundingBox()
    expect(box).not.toBeNull()

    // The old version pressed the right button and never moved, so no drag could
    // have started whatever the guard did. The move past the threshold is what
    // makes this a test of startsDrag() rather than of arithmetic.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.down({ button: "right" })
    await page.mouse.move(box!.x + box!.width / 2 + 80, box!.y + box!.height / 2 + 80, { steps: 8 })

    await expect(pcPage.dragGhost, "a right-button press started a drag").toHaveCount(0)
    await page.mouse.up({ button: "right" })
  })
})

test.describe("SmartRotom PC — multi-select drag", () => {
  test.skip(!HAVE_CREDENTIALS, "TEST_USERNAME / TEST_PASSWORD are unset.")

  test.beforeEach(async ({ pcPage, page }) => {
    await pcPage.goto()
    await expect(page).toHaveURL(/\/smartrotom\/pc/)
    await expect(
      pcPage.occupiedSlots.nth(1),
      "these tests need TEST_USERNAME's PC to hold at least two Pokemon.",
    ).toBeVisible({ timeout: 15_000 })
  })

  test("dragging a selection carries its count", { tag: "@touch" }, async ({ pcPage, page }) => {
    // Multi-select is a real mode, not an optional nicety: without it the
    // selection is empty and the badge can never render, so a missing button is
    // a failure rather than a reason to proceed and assert nothing.
    await expect(
      pcPage.multiSelectButton,
      "no multi-select control on the PC — the badge below cannot be reached without it",
    ).toBeVisible()
    await pcPage.multiSelectButton.click()

    await pcPage.occupiedSlots.nth(0).click()
    await pcPage.occupiedSlots.nth(1).click()

    await pcPage.startDragFrom(pcPage.occupiedSlots.nth(0))

    await expect(pcPage.dragGhost).toBeVisible()
    await expect(
      pcPage.dragCount,
      "a multi-drag showed no count badge, so the selection was not carried",
    ).toHaveText("2")

    // Abort rather than drop: a committed multi-move would rearrange the account.
    await page.evaluate(() => {
      window.dispatchEvent(new PointerEvent("pointercancel", { bubbles: true }))
    })
    await page.mouse.up()
    await expect(pcPage.dragGhost).toHaveCount(0)
  })
})
