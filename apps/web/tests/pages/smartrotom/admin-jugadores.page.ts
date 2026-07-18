import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"
import { expectOnAdminSurface } from "../../helpers/pageMarker"

/** Administración · Jugadores — the player roster and its government appointments. */
export class AdminJugadoresPage extends BasePage {
  readonly searchInput: Locator
  readonly rows: Locator
  readonly dossier: Locator
  readonly closeDossier: Locator
  readonly onlineFilter: Locator
  readonly offlineFilter: Locator
  readonly allFilter: Locator

  constructor(page: Page) {
    super(page)
    this.searchInput = page.getByPlaceholder("Buscar jugador o UUID…")
    this.rows = page.locator("tbody tr")
    this.dossier = page.getByText("Ficha", { exact: true })
    this.closeDossier = page.getByRole("button", { name: "Cerrar ficha" })
    this.allFilter = page.getByRole("button", { name: "Todos", exact: true })
    this.onlineFilter = page.getByRole("button", { name: "En línea", exact: true })
    this.offlineFilter = page.getByRole("button", { name: "Desconect.", exact: true })
  }

  /** Navigating asserts we actually landed, so no spec can be satisfied by a redirect. */
  async goto(): Promise<void> {
    await this.page.goto("/smartrotom/gobierno/admin/jugadores")
    await expectOnAdminSurface(this.page, "jugadores")
  }

  rowFor(username: string): Locator {
    return this.rows.filter({ hasText: username })
  }
}
