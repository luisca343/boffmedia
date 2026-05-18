import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

const DEX = 25

const mockPokemonDetail = {
  name: "Pikachu",
  dex: DEX,
  generation: 1,
  spriteUrl: `/img/pokemon/${DEX}.png`,
  defaultForms: ["pikachu"],
  forms: [
    {
      name: "pikachu",
      index: 0,
      types: ["electric"],
      genderProperties: [
        {
          palettes: [{ name: "default", sprite: `/img/sprites/pikachu.png` }],
        },
      ],
    },
  ],
}

const mockNextPrev = {
  next: { dex: 26, name: "Raichu", spriteUrl: "/img/pokemon/26.png" },
  prev: { dex: 24, name: "Arbok", spriteUrl: "/img/pokemon/24.png" },
}

test.describe("Pokédex entry page", () => {
  test.beforeEach(async ({ pokedexEntryPage, page }) => {
    await mockGet(page, `https://api.ficuslab.es/smartrotom/pokemon/dex/${DEX}`, apiOk(mockPokemonDetail))
    await mockGet(page, `https://api.ficuslab.es/smartrotom/pokemon/nextprev/${DEX}`, apiOk(mockNextPrev))
    await mockGet(page, `https://api.ficuslab.es/smartrotom/pokemon/moves/${DEX}/**`, apiOk([]))
    await mockGet(page, `https://api.ficuslab.es/smartrotom/pokemon/spawns/${DEX}`, apiOk([]))
    await mockGet(page, `https://api.ficuslab.es/smartrotom/pokemon/evotree/${DEX}`, apiOk([]))
    await pokedexEntryPage.goto(DEX)
  })

  test("info section is visible", { tag: "@smoke" }, async ({ pokedexEntryPage }) => {
    await expect(pokedexEntryPage.infoSection).toBeVisible()
  })

  test("header contains dex number", async ({ pokedexEntryPage }) => {
    await expect(pokedexEntryPage.entryHeader).toContainText(`#${DEX}`)
  })

  test("navigation tabs are visible", async ({ pokedexEntryPage }) => {
    await expect(pokedexEntryPage.infoTab).toBeVisible()
    await expect(pokedexEntryPage.statsTab).toBeVisible()
    await expect(pokedexEntryPage.movesTab).toBeVisible()
  })
})
