import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

test.use({ storageState: { cookies: [], origins: [] } })

const LEADERBOARD_URL = "https://api.ficuslab.es/events/leaderboards"

const mockPlayers = [
  { userId: 1, nickname: "AshKetchum", totalPoints: 1500, medalPoints: 500, achievementPoints: 1000, medalCount: 5, achievementCount: 12 },
  { userId: 2, nickname: "MistyWater", totalPoints: 1200, medalPoints: 300, achievementPoints: 900, medalCount: 3, achievementCount: 8 },
  { userId: 3, nickname: "BrockRock", totalPoints: 900, medalPoints: 200, achievementPoints: 700, medalCount: 2, achievementCount: 6 },
]

test.describe("Leaderboard page", () => {
  test.beforeEach(async ({ leaderboardPage, page }) => {
    await mockGet(page, LEADERBOARD_URL, apiOk(mockPlayers))
    await leaderboardPage.goto()
  })

  test("heading and tab navigation are visible", { tag: "@smoke" }, async ({ leaderboardPage }) => {
    await expect(leaderboardPage.heading).toBeVisible()
    await expect(leaderboardPage.generalTab).toBeVisible()
    await expect(leaderboardPage.medalsTab).toBeVisible()
    await expect(leaderboardPage.achievementsTab).toBeVisible()
  })

  test("search input is visible", async ({ leaderboardPage }) => {
    await expect(leaderboardPage.searchInput).toBeVisible()
  })

  test("renders player names from API response", async ({ leaderboardPage }) => {
    await expect(leaderboardPage.playerNames.filter({ hasText: "AshKetchum" })).toBeVisible()
  })

  test("switching to Medals tab keeps heading visible", async ({ leaderboardPage }) => {
    await leaderboardPage.medalsTab.click()
    await expect(leaderboardPage.heading).toBeVisible()
  })

  test("switching to Achievements tab keeps heading visible", async ({ leaderboardPage }) => {
    await leaderboardPage.achievementsTab.click()
    await expect(leaderboardPage.heading).toBeVisible()
  })
})
