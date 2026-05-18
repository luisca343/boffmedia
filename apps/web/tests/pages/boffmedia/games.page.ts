import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class GamesPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly verEventosLinks: Locator
  readonly noGamesMessage: Locator
  readonly noSearchResultsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: "Centro de Juegos" })
    this.searchInput = page.getByPlaceholder("Buscar juego...")
    this.verEventosLinks = page.getByRole("link", { name: /Ver Eventos/i })
    this.noGamesMessage = page.getByText("No hay juegos disponibles")
    this.noSearchResultsMessage = page.getByText("No se encontraron juegos")
  }

  async goto() {
    await this.page.goto("/juegos")
  }
}
