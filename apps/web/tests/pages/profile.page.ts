import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "./base.page"

export class ProfilePage extends BasePage {
  // Unauthenticated state
  readonly accessRequiredHeading: Locator

  // Authenticated state — identity
  readonly userNameHeading: Locator

  // Profile fields
  readonly nameInput: Locator
  readonly emailInput: Locator

  // Actions
  readonly editProfileButton: Locator
  readonly saveChangesButton: Locator
  readonly cancelButton: Locator

  // Connections
  readonly discordCard: Locator
  readonly minecraftCard: Locator

  constructor(page: Page) {
    super(page)
    this.accessRequiredHeading = page.getByRole("heading", { name: "Acceso Requerido" })
    this.userNameHeading = page.getByRole("heading", { level: 2 })
    this.nameInput = page.getByLabel("Nombre", { exact: false })
    this.emailInput = page.getByLabel("Email", { exact: false })
    this.editProfileButton = page.getByRole("button", { name: "Editar perfil" })
    this.saveChangesButton = page.getByRole("button", { name: "Guardar cambios" })
    this.cancelButton = page.getByRole("button", { name: "Cancelar" })
    this.discordCard = page.getByText("Discord Account")
    this.minecraftCard = page.getByText("Minecraft Account")
  }

  async goto() {
    await this.page.goto("/perfil")
  }
}
