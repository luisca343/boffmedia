import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class MisionesPage extends BasePage {
  readonly heading: Locator
  readonly rail: Locator
  readonly bitacoraLink: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { level: 1, name: "Misiones" })
    this.rail = page.getByRole("navigation", { name: "Secciones de Misiones" })
    this.bitacoraLink = this.rail.getByRole("link", { name: /Bitácora/i })
    this.searchInput = page.getByLabel("Buscar en el tablón")
  }

  /** A paper hanging on the cork — the quest's title is its `h3`. */
  questItem(name: string) {
    return this.page.getByRole("heading", { level: 3, name, exact: true })
  }

  async goto() {
    await this.page.goto("/smartrotom/misiones")
  }
}
