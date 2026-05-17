import { test, expect } from "../../fixtures"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Landing page", () => {
  test.beforeEach(async ({ landingPage }) => {
    await landingPage.goto()
  })

  test("hero title and description are visible", { tag: "@smoke" }, async ({ landingPage }) => {
    await expect(landingPage.heroTitle).toBeVisible()
    await expect(landingPage.heroDescription).toBeVisible()
  })

  test("hero image is visible on desktop viewport", async ({ landingPage }) => {
    await expect(landingPage.heroImage).toBeVisible()
  })

  test("Explore Games CTA navigates to /juegos", async ({ landingPage, page }) => {
    await landingPage.exploreGamesLink.click()
    await expect(page).toHaveURL("/juegos")
  })

  test("Join the Community CTA navigates to /community", async ({ landingPage, page }) => {
    await landingPage.joinCommunityLink.click()
    await expect(page).toHaveURL("/community")
  })

  test("featured games section heading is visible", async ({ landingPage }) => {
    await expect(landingPage.featuredSectionHeading).toBeVisible()
  })
})
