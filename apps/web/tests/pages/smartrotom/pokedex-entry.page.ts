import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class PokedexEntryPage extends BasePage {
  readonly entryHeader: Locator
  readonly infoSection: Locator
  readonly infoTab: Locator
  readonly statsTab: Locator
  readonly movesTab: Locator
  readonly notFoundMessage: Locator

  constructor(page: Page) {
    super(page)
    // EntryHeader renders a <header> with the dex number and nav tabs — no semantic h1 for the name
    this.entryHeader = page.locator("header").first()
    // PokedexSection "Información" always present on a valid pokemon entry
    this.infoSection = page.getByRole("button", { name: "Información", exact: true })
    this.infoTab = page.getByRole("link", { name: /^Info$/i })
    this.statsTab = page.getByRole("link", { name: /Estadísticas/i })
    this.movesTab = page.getByRole("link", { name: /Movimientos/i }).first()
    this.notFoundMessage = page.getByText(/Pokemon no encontrado/i)
  }

  async goto(dex: number = 25) {
    await this.page.goto(`/smartrotom/pokedex/entrada/${dex}`)
  }
}
