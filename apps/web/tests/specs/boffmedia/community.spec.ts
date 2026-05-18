import { test, expect } from "../../fixtures"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Community page", () => {
  test.beforeEach(async ({ communityPage }) => {
    await communityPage.goto()
  })

  test("shows under construction heading", { tag: "@smoke" }, async ({ communityPage }) => {
    await expect(communityPage.heading).toBeVisible()
  })

  test("back to home link is visible", async ({ communityPage }) => {
    await expect(communityPage.backToHomeButton).toBeVisible()
  })

  test("reload button is visible", async ({ communityPage }) => {
    await expect(communityPage.reloadButton).toBeVisible()
  })
})
