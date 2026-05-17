import { test, expect } from "../../fixtures"

test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Login form", () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.goto()
  })

  test("renders heading, fields, and submit button", { tag: "@smoke" }, async ({ authPage }) => {
    await expect(authPage.heading).toHaveText("Iniciar Sesión")
    await expect(authPage.usernameInput).toBeVisible()
    await expect(authPage.passwordInput).toBeVisible()
    await expect(authPage.signInButton).toBeVisible()
  })

  test("shows username required error on empty submit", async ({ authPage }) => {
    await authPage.signInButton.click()
    await expect(authPage.usernameRequiredError).toBeVisible()
  })

  test("shows password length error when password is too short", async ({ authPage }) => {
    await authPage.usernameInput.fill("AshKetchum")
    await authPage.passwordInput.fill("short")
    await authPage.signInButton.click()
    await expect(authPage.passwordLengthError).toBeVisible()
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

  test("renders heading and all register fields", { tag: "@smoke" }, async ({ authPage }) => {
    await expect(authPage.heading).toHaveText("Registrarse")
    await expect(authPage.usernameInput).toBeVisible()
    await expect(authPage.emailInput).toBeVisible()
    await expect(authPage.passwordInput).toBeVisible()
    await expect(authPage.confirmPasswordInput).toBeVisible()
    await expect(authPage.registerButton).toBeVisible()
  })

  test("shows password mismatch error when passwords differ", async ({ authPage }) => {
    await authPage.submitRegister("AshKetchum", "ash@pokemon.com", "validpassword1", "different123")
    await expect(authPage.passwordMismatchError).toBeVisible()
  })
})
