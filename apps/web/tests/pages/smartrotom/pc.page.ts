import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

/**
 * The PC (Storage) app.
 *
 * `dragGhost` used to read `[class*='drag-ghost']` OR the first `[class*='drop-shadow']`
 * on the page. No element in this app has ever carried a `drag-ghost` class, and
 * `drop-shadow-*` is a Tailwind utility that ordinary sprites and cards use — so the
 * locator resolved either to nothing or to something that was not the ghost. Every
 * "the ghost is gone" assertion therefore passed without observing the ghost at all,
 * including the one that exists to prove a cancelled gesture aborts the drag.
 *
 * `data-pc-drag-ghost` is now rendered by DragProvider and only while `drag.active`,
 * so its presence is the drag state rather than a proxy for it.
 */
export class PCPage extends BasePage {
  readonly title: Locator
  readonly pokemonSlots: Locator
  readonly occupiedSlots: Locator
  readonly boxOverviewButton: Locator
  readonly multiSelectButton: Locator
  readonly dragGhost: Locator
  readonly dragCount: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: /SmartRotom PC/ })
    this.pokemonSlots = page.locator("[data-drop='1']")
    // A slot is a drop target whether or not anything is in it, and an empty one
    // cannot start a drag — PokemonSlot only calls beginDrag when `mon` is set.
    // PokemonSlot marks the empty ones itself, so ask it rather than inferring
    // occupancy from whatever the Sprite happens to render.
    this.occupiedSlots = page.locator(".pc-slot:not(.pc-slot-empty)")
    this.boxOverviewButton = page.getByRole("button", { name: /box overview/i })
    this.multiSelectButton = page.getByRole("button", { name: /multi-select/i })
    this.dragGhost = page.locator("[data-pc-drag-ghost]")
    this.dragCount = page.locator("[data-pc-drag-count]")
  }

  async goto() {
    await this.page.goto("/smartrotom/pc")
  }

  /** The ghost's viewport position, or null when no drag is in flight. */
  async ghostPosition(): Promise<{ x: number; y: number } | null> {
    const box = await this.dragGhost.boundingBox()
    return box ? { x: box.x, y: box.y } : null
  }

  /**
   * Press on a slot and move far enough to cross DRAG_THRESHOLD_PX (7).
   * Real mouse input, not dispatchEvent: the hook reads clientX/clientY off the
   * event to compute the threshold, and hit-tests with elementFromPoint, so a
   * synthetic event with no coordinates activates nothing.
   */
  async startDragFrom(slot: Locator, dx = 60, dy = 60): Promise<void> {
    const box = await slot.boundingBox()
    if (!box) throw new Error("startDragFrom: the slot has no bounding box — it is not rendered.")
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await this.page.mouse.move(x, y)
    await this.page.mouse.down()
    await this.page.mouse.move(x + dx, y + dy, { steps: 8 })
  }
}
