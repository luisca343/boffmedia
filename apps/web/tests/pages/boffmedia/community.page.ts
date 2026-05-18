import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class CommunityPage extends BasePage {
  readonly heading: Locator
  readonly backToHomeButton: Locator
  readonly reloadButton: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: /construcción/i })
    this.backToHomeButton = page.getByRole("link", { name: /Volver al Inicio/i })
    this.reloadButton = page.getByRole("button", { name: /Recargar/i })
  }

  async goto() {
    await this.page.goto("/community")
  }
}
