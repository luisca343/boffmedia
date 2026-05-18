import { test, expect } from "../../fixtures"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Tools page", () => {
  test.beforeEach(async ({ toolsPage }) => {
    await toolsPage.goto()
  })

  test("heading and search are visible", { tag: "@smoke" }, async ({ toolsPage }) => {
    await expect(toolsPage.heading).toBeVisible()
    await expect(toolsPage.searchInput).toBeVisible()
  })

  test("Pokémon category is visible", async ({ toolsPage }) => {
    await expect(toolsPage.pokemonCategory).toBeVisible()
  })

  test("Monster Hunter Wilds category is visible", async ({ toolsPage }) => {
    await expect(toolsPage.mhwildsCategory).toBeVisible()
  })

  test("Otros category is visible", async ({ toolsPage }) => {
    await expect(toolsPage.otrosCategory).toBeVisible()
  })

  test("search with no match shows empty state", async ({ toolsPage }) => {
    await toolsPage.searchInput.fill("xyznotfound123")
    await expect(toolsPage.noResultsMessage).toBeVisible()
  })
})
