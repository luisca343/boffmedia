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
    this.heading = page.locator("h1.dec-title").first()
    this.misionesTab = page.locator(".leather-tab").first()
    this.dialogosTab = page.locator(".leather-tab").nth(3)
    this.searchInput = page.getByPlaceholder(/buscar|search/i)
    this.emptyQuestDetail = page.locator(".dec-title")
  }

  questItem(name: string) {
    return this.page.getByText(name, { exact: true })
  }

  async goto() {
    await this.page.goto("/smartrotom/misiones")
  }
}
