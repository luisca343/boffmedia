import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class PokedexPage extends BasePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly quickSearchSection: Locator
  readonly exploreLink: Locator
  readonly locationLink: Locator
  readonly movesLink: Locator
  readonly abilitiesLink: Locator
  readonly typesLink: Locator
  readonly noResultsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.heading = page.getByRole("heading", { name: "Pokédex", exact: true })
    this.searchInput = page.getByPlaceholder("Buscar un Pokémon")
    this.quickSearchSection = page.getByText("Búsqueda Rápida")
    this.exploreLink = page.getByRole("link", { name: /Explorar Pokédex/i })
    this.locationLink = page.getByRole("link", { name: /Localización/i })
    this.movesLink = page.getByRole("link", { name: /Movimientos/i }).first()
    this.abilitiesLink = page.getByRole("link", { name: /Habilidades/i })
    this.typesLink = page.getByRole("link", { name: /Tipos/i }).first()
    this.noResultsMessage = page.getByText("No se encontraron resultados")
  }

  async goto() {
    await this.page.goto("/smartrotom/pokedex")
  }
}
