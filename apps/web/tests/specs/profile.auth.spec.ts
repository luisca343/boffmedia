import { test, expect } from "../fixtures"

test.describe("Profile page — unauthenticated", () => {
  // Override the session so this describe block runs without a user
  test.use({ storageState: { cookies: [], origins: [] } })

  test("shows access required message when not logged in", async ({ profilePage }) => {
    await profilePage.goto()
    await expect(profilePage.accessRequiredHeading).toBeVisible()
    await expect(profilePage.page.getByText("Inicia sesión para ver tu perfil.")).toBeVisible()
  })
})

test.describe("Profile page — authenticated", () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.goto()
  })

  test("renders user name and email", async ({ profilePage }) => {
    await expect(profilePage.userNameHeading).toBeVisible()
    await expect(profilePage.nameInput).toBeVisible()
    await expect(profilePage.emailInput).toBeVisible()
  })

  test("profile fields are disabled by default", async ({ profilePage }) => {
    await expect(profilePage.nameInput).toBeDisabled()
    await expect(profilePage.emailInput).toBeDisabled()
  })

  test("Edit profile button is visible and Edit button is not in editing mode initially", async ({ profilePage }) => {
    await expect(profilePage.editProfileButton).toBeVisible()
    await expect(profilePage.saveChangesButton).not.toBeVisible()
  })

  test("clicking Edit profile enables inputs and shows Save / Cancel", async ({ profilePage }) => {
    await profilePage.editProfileButton.click()
    await expect(profilePage.nameInput).toBeEnabled()
    await expect(profilePage.emailInput).toBeEnabled()
    await expect(profilePage.saveChangesButton).toBeVisible()
    await expect(profilePage.cancelButton).toBeVisible()
  })

  test("Cancel returns to view mode without saving", async ({ profilePage }) => {
    await profilePage.editProfileButton.click()
    await profilePage.nameInput.fill("Changed Name")
    await profilePage.cancelButton.click()
    await expect(profilePage.editProfileButton).toBeVisible()
    await expect(profilePage.nameInput).toBeDisabled()
  })

  test("connections section shows Discord and Minecraft cards", async ({ profilePage }) => {
    await expect(profilePage.discordCard).toBeVisible()
    await expect(profilePage.minecraftCard).toBeVisible()
  })
})
