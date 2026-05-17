import { test, expect } from "../../fixtures"
import { mockPost, apiOk } from "../../helpers/api"

const APPS_URL = "https://api.ficuslab.es/smartrotom/apps/player"

const mockApps = [
  { id: 1, name: "BoffLauncher", url: "bofflauncher", position: 0 },
]

test.describe("SmartRotom home — authenticated", () => {
  test.beforeEach(async ({ smartRotomHomePage, page }) => {
    await mockPost(page, APPS_URL, apiOk(mockApps))
    await smartRotomHomePage.goto()
  })

  test("page loads at /smartrotom", { tag: "@smoke" }, async ({ page }) => {
    await expect(page).toHaveURL(/\/smartrotom/)
  })

  test("app grid is rendered", async ({ smartRotomHomePage }) => {
    await expect(smartRotomHomePage.appGrid).toBeVisible()
  })
})
