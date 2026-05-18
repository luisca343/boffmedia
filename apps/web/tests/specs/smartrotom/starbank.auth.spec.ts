import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

// Accounts: GET /smartrotom/starbank/accounts/{uuid}
const ACCOUNTS_URL = "https://api.ficuslab.es/smartrotom/starbank/accounts/**"
// Transactions/transfers include the account id and optional query string
const TRANSACTIONS_URL = "https://api.ficuslab.es/smartrotom/starbank/transactions/**"
const TRANSFERS_URL = "https://api.ficuslab.es/smartrotom/starbank/transfers/**"

const mockAccount = {
  id: 1,
  name: "Principal",
  balance: 1500,
  type: "player",
  uuid: "mock-uuid",
  image: null,
}

test.describe("StarBank dashboard", () => {
  test.beforeEach(async ({ starbankPage, page }) => {
    await mockGet(page, ACCOUNTS_URL, apiOk([mockAccount]))
    await mockGet(page, TRANSACTIONS_URL, apiOk([]))
    await mockGet(page, TRANSFERS_URL, apiOk([]))
    await starbankPage.goto()
  })

  test("balance section is visible", { tag: "@smoke" }, async ({ starbankPage }) => {
    await expect(starbankPage.balanceSection).toBeVisible()
  })

  test("quick action links are visible", async ({ starbankPage }) => {
    await expect(starbankPage.transferMoneyLink).toBeVisible()
    await expect(starbankPage.manageAccountsLink).toBeVisible()
    await expect(starbankPage.payBillsLink).toBeVisible()
  })

  test("shows empty transactions message when there are no transactions", async ({ starbankPage }) => {
    await expect(starbankPage.noTransactionsMessage).toBeVisible()
  })
})
