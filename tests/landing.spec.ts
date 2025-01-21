import { test, expect } from "@playwright/test"

test.describe("Gaming Landing Page", () => {
  test("should display main elements and navigate correctly", async ({ page }) => {
    // Navigate to the home page
    await page.goto("http://localhost:3000/")

    // Check if the logo is present
    await expect(page.getByAltText("Logo de BoffMedia")).toBeVisible()

    // Check if the main title is present
    await expect(page.getByRole("heading", { name: "Bienvenido a BoffMedia" })).toBeVisible()

    // Check if the main description is present
    await expect(
      page.getByText("Sumérgete en experiencias de juego inmersivas y herramientas poderosas para gamers"),
    ).toBeVisible()

    // Check if the "Explora Pixelmon Wingull 2" button is present and clickable
    const exploreButton = page.getByRole("link", { name: "Explora Pixelmon Wingull 2" })
    await expect(exploreButton).toBeVisible()
    await exploreButton.click()
    await expect(page).toHaveURL("/wingull")

    // Navigate back to the home page
    await page.goto("http://localhost:3000/")

    // Check if the "Únete a la Comunidad" button is present and clickable
    const communityButton = page.getByRole("link", { name: "Únete a la Comunidad" })
    await expect(communityButton).toBeVisible()
    await communityButton.click()
    await expect(page).toHaveURL("/comunidad")

    // Navigate back to the home page
    await page.goto("http://localhost:3000/")

    // Check if the "Juegos y Herramientas Destacados" section is present
    await expect(page.getByRole("heading", { name: "Juegos y Herramientas Destacados" })).toBeVisible()

    // Check if all three featured items are present
    const featuredItems = ["Pixelmon Wingull 2", "SmartRotom", "Herramientas de Juego"]
    for (const item of featuredItems) {
      await expect(page.getByRole("heading", { name: item })).toBeVisible()
    }

    // Check if the "Eventos Destacados" section is present
    await expect(page.getByRole("heading", { name: "Eventos Destacados" })).toBeVisible()

    // Check if the "Calendario de Eventos" section is present
    await expect(page.getByRole("heading", { name: "Calendario de Eventos" })).toBeVisible()

    // Check if the "Tabla de Clasificación" section is present
    await expect(page.getByRole("heading", { name: "Tabla de Clasificación" })).toBeVisible()
  })
})

