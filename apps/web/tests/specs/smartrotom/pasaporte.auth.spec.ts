import { test, expect } from "../../fixtures"
import { mockPost, apiOk } from "../../helpers/api"

// POST endpoints used by the Pasaporte page
const PLAYER_STATS_URL = "https://api.ficuslab.es/smartrotom/player/stats"
const WINGULL_TEAM_URL = "https://api.ficuslab.es/wingull/team"
const ACHIEVEMENTS_URL = "https://api.ficuslab.es/smartrotom/achievement/get-achievements"

const mockStats = {
  stats: {
    "minecraft:custom": {
      "minecraft:play_one_minute": 72000,
      "minecraft:deaths": 5,
      "minecraft:walk_one_cm": 500000,
      "minecraft:sprint_one_cm": 200000,
      "minecraft:horse_one_cm": 0,
      "minecraft:boat_one_cm": 0,
      "minecraft:swim_one_cm": 10000,
    },
    "minecraft:killed": {},
  },
}

test.describe("Pasaporte page", () => {
  test.beforeEach(async ({ pasaportePage, page }) => {
    await mockPost(page, PLAYER_STATS_URL, apiOk(mockStats))
    await mockPost(page, WINGULL_TEAM_URL, apiOk([]))
    await mockPost(page, ACHIEVEMENTS_URL, apiOk([]))
    await pasaportePage.goto()
  })

  // react-pageflip (showCover=true) only mounts the cover page in the DOM initially.
  // Deeper page content is not accessible until the user flips — test the visible container only.
  test("book section renders", { tag: "@smoke" }, async ({ pasaportePage }) => {
    await expect(pasaportePage.bookSection).toBeVisible()
  })
})
