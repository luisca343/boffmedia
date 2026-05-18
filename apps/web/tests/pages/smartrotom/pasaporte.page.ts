import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class PasaportePage extends BasePage {
  // The outer <section> wrapping the Book — always visible
  readonly bookSection: Locator

  constructor(page: Page) {
    super(page)
    this.bookSection = page.locator("section").first()
  }

  async goto() {
    await this.page.goto("/smartrotom/pasaporte")
  }
}
