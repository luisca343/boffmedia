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
    this.balanceSection = page.getByText("Balance de cuenta")
    this.quickActionsSection = page.getByText("Acciones Rápidas")
    this.transferMoneyLink = page.getByRole("link", { name: /Transferir Dinero/i })
    this.manageAccountsLink = page.getByRole("link", { name: /Administrar Cuentas/i })
    this.payBillsLink = page.getByRole("link", { name: /Pagar Facturas/i })
    this.noTransactionsMessage = page.getByText("No hay transacciones")
  }

  async goto() {
    await this.page.goto("/smartrotom/starbank")
  }
}
