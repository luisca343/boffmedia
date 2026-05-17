import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class LeaderboardPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly generalTab: Locator
  readonly medalsTab: Locator
  readonly achievementsTab: Locator
  readonly playerNames: Locator
  readonly loadingText: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: "Clasificación Global" })
    this.searchInput = page.getByPlaceholder("Buscar jugador...")
    this.generalTab = page.getByRole("tab", { name: "Puntuación General" })
    this.medalsTab = page.getByRole("tab", { name: "Medallas" })
    this.achievementsTab = page.getByRole("tab", { name: "Logros" })
    this.playerNames = page.locator("h3.font-semibold")
    this.loadingText = page.getByText("Cargando clasificación...")
    this.errorMessage = page.getByText("Error al cargar la clasificación")
  }

  async goto() {
    await this.page.goto("/clasificacion")
  }
}
