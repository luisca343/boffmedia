import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class FurretTodayPage extends BasePage {
  readonly heading: Locator
  readonly moreNewsSection: Locator
  readonly emptyFeaturedMessage: Locator
  readonly editNewsLink: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByText("¡ÚLTIMAS NOTICIAS!").first()
    this.moreNewsSection = page.getByRole("heading", { name: "Más Noticias", exact: true })
    this.emptyFeaturedMessage = page.getByText(/Furret se ha comido la noticia principal/i)
    this.editNewsLink = page.getByRole("link", { name: /Editar Noticias/i }).first()
  }

  async goto() {
    await this.page.goto("/smartrotom/furrettoday")
  }

  featuredTitle(title: string) {
    return this.page.getByText(title)
  }
}
