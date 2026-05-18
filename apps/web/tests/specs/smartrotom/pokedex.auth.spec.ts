import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

const POKEMON_URL = "https://api.ficuslab.es/smartrotom/pokemon"
const SEARCH_URL = "https://api.ficuslab.es/smartrotom/pokemon/search/**"

const mockPokemon = {
  dex: 25,
  name: "Pikachu",
  spriteUrl: "/img/pokemon/25.png",
  forms: [],
}

test.describe("Pokédex page", () => {
  test.beforeEach(async ({ pokedexPage, page }) => {
    await mockGet(page, POKEMON_URL, apiOk([mockPokemon]))
    await pokedexPage.goto()
  })

  test("heading and search are visible", { tag: "@smoke" }, async ({ pokedexPage }) => {
    await expect(pokedexPage.heading).toBeVisible()
    await expect(pokedexPage.searchInput).toBeVisible()
  })

  test("Búsqueda Rápida section is visible", async ({ pokedexPage }) => {
    await expect(pokedexPage.quickSearchSection).toBeVisible()
  })

  test("quick access links are visible", async ({ pokedexPage }) => {
    await expect(pokedexPage.exploreLink).toBeVisible()
    await expect(pokedexPage.locationLink).toBeVisible()
    await expect(pokedexPage.movesLink).toBeVisible()
    await expect(pokedexPage.abilitiesLink).toBeVisible()
    await expect(pokedexPage.typesLink).toBeVisible()
  })

  test("search with no match shows no-results message", async ({ pokedexPage, page }) => {
    await mockGet(page, SEARCH_URL, apiOk([]))
    await pokedexPage.searchInput.fill("xyznotfound123")
    await expect(pokedexPage.noResultsMessage).toBeVisible()
  })
})
