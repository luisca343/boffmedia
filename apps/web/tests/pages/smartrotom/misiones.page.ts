import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class MisionesPage extends BasePage {
  readonly heading: Locator
  readonly misionesTab: Locator
  readonly dialogosTab: Locator
  readonly searchInput: Locator
  readonly emptyQuestDetail: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { level: 1 })
    this.misionesTab = page.getByRole("tab", { name: /Misiones/i })
    this.dialogosTab = page.getByRole("tab", { name: /Diálogos/i })
    this.searchInput = page.getByPlaceholder("Buscar misiones...")
    this.emptyQuestDetail = page.getByText(/Selecciona una misión para ver sus detalles/i)
  }

  questItem(name: string) {
    return this.page.getByText(name, { exact: true })
  }

  async goto() {
    await this.page.goto("/smartrotom/misiones")
  }
}
