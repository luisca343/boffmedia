import { test, expect } from "../fixtures"

// Auth page tests run without a session — we are testing the form itself
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Login form", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto()
  })

  test("renders heading, username field, password field, and submit button", async ({ authPage }) => {
    await expect(authPage.heading).toHaveText("Iniciar Sesión")
    await expect(authPage.usernameInput).toBeVisible()
    await expect(authPage.passwordInput).toBeVisible()
    await expect(authPage.signInButton).toBeVisible()
  })

  test("shows username required error on empty submit", async ({ authPage }) => {
    await authPage.signInButton.click()
    await expect(authPage.page.getByText("Username is required")).toBeVisible()
  })

  test("shows password length error when password is too short", async ({ authPage }) => {
    await authPage.usernameInput.fill("AshKetchum")
    await authPage.passwordInput.fill("short")
    await authPage.signInButton.click()
    await expect(authPage.page.getByText(/at least 8 characters/i)).toBeVisible()
  })

  test("button switches to Processing while submitting valid credentials", async ({ authPage }) => {
    await authPage.usernameInput.fill("AshKetchum")
    await authPage.passwordInput.fill("validpassword")
    await authPage.signInButton.click()
    await expect(authPage.processingButton).toBeVisible()
  })
})

test.describe("Register form", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoRegister()
  })

  test("renders heading and all register fields", async ({ authPage }) => {
    await expect(authPage.heading).toHaveText("Registrarse")
    await expect(authPage.usernameInput).toBeVisible()
    await expect(authPage.emailInput).toBeVisible()
    await expect(authPage.passwordInput).toBeVisible()
    await expect(authPage.confirmPasswordInput).toBeVisible()
    await expect(authPage.registerButton).toBeVisible()
  })

  test("shows password mismatch error when passwords differ", async ({ authPage }) => {
    await authPage.submitRegister("AshKetchum", "ash@pokemon.com", "validpassword1", "different123")
    await expect(authPage.page.getByText(/Passwords don't match/i)).toBeVisible()
  })
})
