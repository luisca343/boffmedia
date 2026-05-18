import { test, expect } from "../../fixtures"
import { mockGet, apiOk } from "../../helpers/api"

const NEWS_URL = "https://api.ficuslab.es/smartrotom/documents/news"

const mockArticle = {
  id: 1,
  title: "Gran Torneo de Pixelmon",
  subtitle: "El evento del año ha llegado",
  category: "Events",
  subcategory: "tournaments",
  published: 1,
  featured: 1,
  content: "El gran torneo de Pixelmon ha comenzado. No te lo pierdas.",
  buttonText: "¡Leer la noticia completa!",
  imageUrl: null,
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
}

// "Más Noticias" section only renders when published.length > 3.
// published = news.filter(id !== featured.id && published === 1), so we need 4+ non-featured articles.
const extraArticles = [2, 3, 4, 5].map((id) => ({ ...mockArticle, id, title: `Noticia ${id}`, featured: 0 }))

test.describe("FurretToday — with news", () => {
  test.beforeEach(async ({ furretTodayPage, page }) => {
    await mockGet(page, NEWS_URL, apiOk({ featured: mockArticle, news: [mockArticle, ...extraArticles] }))
    await furretTodayPage.goto()
  })

  test("main heading is visible", { tag: "@smoke" }, async ({ furretTodayPage }) => {
    await expect(furretTodayPage.heading).toBeVisible()
  })

  test("featured article title is visible", async ({ furretTodayPage }) => {
    await expect(furretTodayPage.featuredTitle("Gran Torneo de Pixelmon")).toBeVisible()
  })

  test("Más Noticias section is visible", async ({ furretTodayPage }) => {
    await expect(furretTodayPage.moreNewsSection).toBeVisible()
  })

  test("Edit News link is visible", async ({ furretTodayPage }) => {
    await expect(furretTodayPage.editNewsLink).toBeVisible()
  })
})

test.describe("FurretToday — no featured news", () => {
  test.beforeEach(async ({ furretTodayPage, page }) => {
    await mockGet(page, NEWS_URL, apiOk({ featured: null, news: [] }))
    await furretTodayPage.goto()
  })

  test("shows empty featured state when there is no featured article", async ({ furretTodayPage }) => {
    await expect(furretTodayPage.emptyFeaturedMessage).toBeVisible()
  })
})
