import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class PCPage extends BasePage {
  readonly title: Locator
  readonly pokemonSlots: Locator
  readonly boxOverviewButton: Locator
  readonly multiSelectButton: Locator
  readonly dragGhost: Locator

  constructor(page: Page) {
    super(page)
    this.title = page.getByRole("heading", { name: /SmartRotom PC/ })
    this.pokemonSlots = page.locator("[data-drop='1']")
    this.boxOverviewButton = page.getByRole("button", { name: /box overview/i })
    this.multiSelectButton = page.getByRole("button", { name: /multi-select/i })
    this.dragGhost = page.locator("[class*='drag-ghost']").or(page.locator("[class*='drop-shadow']").first())
  }

  async goto() {
    await this.page.goto("/smartrotom/pc")
  }

  /**
   * Get a specific Pokemon slot by location.
   * This is fragile but works for testing without detailed internals.
   * In a real app, you'd query by role/label or data-testid.
   */
  async getSlotByIndex(index: number) {
    return this.pokemonSlots.nth(index)
  }

  /**
   * Perform a drag from one slot to another.
   * This tests the pointer event drag mechanism.
   */
  async dragBetweenSlots(fromSlot: Locator, toSlot: Locator) {
    await fromSlot.dragTo(toSlot)
  }
}
