import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

test.use({ storageState: { cookies: [], origins: [] } })

const GAMES_URL = "https://api.ficuslab.es/events/games"

const mockGame = {
  id: 1,
  title: "Minecraft",
  description: "El juego de construcción más popular",
  active: 1,
  deletedAt: null,
  icon: null,
  createdAt: "2026-01-01T00:00:00.000Z",
}

test.describe("Games page — with games", () => {
  test.beforeEach(async ({ gamesPage, page }) => {
    await mockGet(page, GAMES_URL, apiOk([mockGame]))
    await gamesPage.goto()
  })

  test("heading and search are visible", { tag: "@smoke" }, async ({ gamesPage }) => {
    await expect(gamesPage.heading).toBeVisible()
    await expect(gamesPage.searchInput).toBeVisible()
  })

  test("renders game title from API response", async ({ page }) => {
    await expect(page.getByText("Minecraft").first()).toBeVisible()
  })

  test("renders a Ver Eventos link for each game", async ({ gamesPage }) => {
    await expect(gamesPage.verEventosLinks.first()).toBeVisible()
  })
})

test.describe("Games page — empty state", () => {
  test.beforeEach(async ({ gamesPage, page }) => {
    await mockGet(page, GAMES_URL, apiOk([]))
    await gamesPage.goto()
  })

  test("shows empty state when no games exist", async ({ gamesPage }) => {
    await expect(gamesPage.noGamesMessage).toBeVisible()
  })
})
