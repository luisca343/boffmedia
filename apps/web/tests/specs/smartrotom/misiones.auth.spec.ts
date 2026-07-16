import { test, expect } from "../../fixtures"
import { type Page } from "@playwright/test"

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

/** The giver rides here now, not inlined on the quest. */
const mockDialog = {
  id: 0,
  questId: 1,
  text: "¿Listo para empezar?",
  npcLocations: [
    { name: "Maestro Pokémon", dialogId: 0, skin: "steve", x: 0, y: 64, z: 0, world: "minecraft:overworld", uuid: "" },
  ],
}

/**
 * `isMinecraft()` only checks that `window.mcefQuery` exists, so defining it is
 * the whole stub — but it also flips AppWrapper into re-authenticating through
 * `GET_USER_DATA`, which must therefore answer as the linked account or the
 * shell replaces the app with its account-linking gate.
 */
async function mockMcef(page: Page, responses: Record<string, unknown>) {
  await page.addInitScript((map) => {
    window.mcefQuery = ({
      request,
      onSuccess,
      onFailure,
    }: {
      request: string
      onSuccess: (response: string) => void
      onFailure: (error: string) => void
    }) => {
      const { query } = JSON.parse(request) as { query: string }
      const match = (map as Record<string, unknown>)[query]
      if (match !== undefined) onSuccess(JSON.stringify(match))
      else onFailure(`unmocked query: ${query}`)
    }
  }, responses)
}

test.describe("Misiones — el tablón", () => {
  test.beforeEach(async ({ misionesPage, page }) => {
    const session = await page.request.get("/api/auth/session").then((res) => res.json())
    const mc = session?.user?.smartRotomUser
    expect(mc?.uuid, "the test account must be linked to a Minecraft user").toBeTruthy()

    await mockMcef(page, {
      GET_USER_DATA: { username: mc.username, uuid: mc.uuid, world: "minecraft:overworld", x: 0, y: 64, z: 0 },
      getMisiones: { quests: [mockQuest], categories: { General: [1] }, dialogs: [mockDialog], npcs: [] },
    })
    await misionesPage.goto()
  })

  test("main heading is visible", { tag: "@smoke" }, async ({ misionesPage }) => {
    await expect(misionesPage.heading).toBeVisible()
  })

  test("the rail links to the Bitácora", async ({ misionesPage }) => {
    await expect(misionesPage.bitacoraLink).toBeVisible()
  })

  test("search input is visible", async ({ misionesPage }) => {
    await expect(misionesPage.searchInput).toBeVisible()
  })

  test("quest name appears on the board after data loads", async ({ misionesPage }) => {
    await expect(misionesPage.questItem("La Aventura Comienza")).toBeVisible()
  })
})

test.describe("Misiones — outside the game", () => {
  test("says the board is only readable in-game when mcef is absent", async ({ misionesPage, page }) => {
    await misionesPage.goto()
    await expect(page.getByText(/sólo puede leerse desde el juego/i)).toBeVisible()
  })
})
