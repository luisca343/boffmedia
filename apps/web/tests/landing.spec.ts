import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
  })

  test("hero section renders with correct content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /Your gaming adventure/i })).toBeVisible()
    await expect(page.getByText("Immerse yourself in immersive gaming experiences")).toBeVisible()
    await expect(page.getByRole("img", { name: "Gaming Illustration" })).toBeVisible()
  })

  test("hero CTA buttons navigate correctly", async ({ page }) => {
    await page.getByRole("link", { name: "Explore Games" }).click()
    await expect(page).toHaveURL("/juegos")

    await page.goto("/")
    await page.getByRole("link", { name: "Join the Community" }).click()
    await expect(page).toHaveURL("/community")
  })

  test("featured section renders with game entries", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Featured Games and Tools" })).toBeVisible()
    await expect(page.getByAltText("Pixelmon Wingull 2").first()).toBeVisible()
  })
})
