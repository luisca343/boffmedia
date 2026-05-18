import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class ToolsPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly pokemonCategory: Locator
  readonly mhwildsCategory: Locator
  readonly otrosCategory: Locator
  readonly noResultsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: /VIDEOJUEGOS/i })
    this.searchInput = page.getByPlaceholder("BUSCAR HERRAMIENTAS...")
    this.pokemonCategory = page.getByText("Pokémon").first()
    this.mhwildsCategory = page.getByText("Monster Hunter Wilds")
    this.otrosCategory = page.getByText("Otros")
    this.noResultsMessage = page.getByText("// Sin resultados")
  }

  async goto() {
    await this.page.goto("/herramientas")
  }
}
