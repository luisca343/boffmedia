import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class EventsPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly eventTitles: Locator
  readonly seeDetailsLinks: Locator
  readonly noEventsMessage: Locator
  readonly noSearchResultsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: "Centro de Eventos" })
    this.searchInput = page.getByPlaceholder("Buscar evento...")
    this.eventTitles = page.getByRole("heading", { level: 3 })
    this.seeDetailsLinks = page.getByRole("link", { name: /Ver detalles/i })
    this.noEventsMessage = page.getByText("No hay eventos disponibles")
    this.noSearchResultsMessage = page.getByText("No se encontraron eventos")
  }

  async goto() {
    await this.page.goto("/eventos")
  }
}
