import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class SmartRotomHomePage extends BasePage {
  readonly appGrid: Locator
  readonly appNames: Locator

  constructor(page: Page) {
    super(page)
    this.appGrid = page.locator(".grid-cols-8")
    this.appNames = page.locator("p.text-base")
  }

  async goto() {
    await this.page.goto("/smartrotom")
  }
}
