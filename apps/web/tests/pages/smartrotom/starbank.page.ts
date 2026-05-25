import { type Locator, type Page } from "@playwright/test"
import { BasePage } from "../base.page"

export class StarbankPage extends BasePage {
  readonly balanceSection: Locator
  readonly quickActionsSection: Locator
  readonly transferMoneyLink: Locator
  readonly manageAccountsLink: Locator
  readonly payBillsLink: Locator
  readonly noTransactionsMessage: Locator

  constructor(page: Page) {
    super(page)
    this.balanceSection = page.getByText("Balance disponible")
    this.quickActionsSection = page.getByText("Acciones rápidas")
    this.transferMoneyLink = page.getByRole("link", { name: /Enviar dinero/i }).first()
    this.manageAccountsLink = page.getByRole("link", { name: /Mover entre cuentas/i }).first()
    this.payBillsLink = page.getByRole("link", { name: /Programar pago/i })
    this.noTransactionsMessage = page.getByText("No hay transacciones recientes")
  }

  async goto() {
    await this.page.goto("/smartrotom/starbank")
  }
}
