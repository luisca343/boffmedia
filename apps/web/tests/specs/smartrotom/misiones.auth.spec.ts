import { test, expect } from "../../fixtures"
import { mockPost, apiOk } from "../../helpers/api"

// POST /smartrotom/misiones/user — returns quest data for the authenticated user
const QUESTS_URL = "https://api.ficuslab.es/smartrotom/misiones/user"

const mockQuest = {
  id: 1,
  name: "La Aventura Comienza",
  logText: "Habla con el Maestro Pokémon",
  completeText: "¡Bien hecho, entrenador!",
  repeatable: false,
  type: 0,
  nextQuest: 0,
  category: "General",
  status: "AVAILABLE",
  objectives: [],
  requirements: {
    available: true,
    requiredQuests: [],
    requiredDialogs: [],
    requiredLevel: 0,
    requiredTime: 0,
    factionRequirements: [],
    scoreboardRequirements: [],
  },
  dialogId: 0,
  rewards: [],
}

test.describe("Misiones — quest log", () => {
  test.beforeEach(async ({ misionesPage, page }) => {
    await mockPost(page, QUESTS_URL, apiOk({ quests: [mockQuest], categories: { General: [1] }, dialogs: [], npcs: [] }))
    await misionesPage.goto()
  })

  test("main heading is visible", { tag: "@smoke" }, async ({ misionesPage }) => {
    await expect(misionesPage.heading).toBeVisible()
    await expect(misionesPage.heading).toContainText("Registro de Misiones")
  })

  test("Misiones and Diálogos tabs are visible", async ({ misionesPage }) => {
    await expect(misionesPage.misionesTab).toBeVisible()
    await expect(misionesPage.dialogosTab).toBeVisible()
  })

  test("search input is visible", async ({ misionesPage }) => {
    await expect(misionesPage.searchInput).toBeVisible()
  })

  test("quest name appears in the list after data loads", async ({ misionesPage }) => {
    await expect(misionesPage.questItem("La Aventura Comienza")).toBeVisible()
  })
})
