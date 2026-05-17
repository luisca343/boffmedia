import { test, expect } from "../../fixtures"

test.describe("Profile page — unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("shows access required gate when not logged in", { tag: "@smoke" }, async ({ profilePage }) => {
    await profilePage.goto()
    await expect(profilePage.accessRequiredHeading).toBeVisible()
    await expect(profilePage.accessRequiredText).toBeVisible()
  })
})

test.describe("Profile page — authenticated", () => {
  test.beforeEach(async ({ profilePage }) => {
    await profilePage.goto()
  })

  test("renders user name and profile fields", { tag: "@smoke" }, async ({ profilePage }) => {
    await expect(profilePage.userNameHeading).toBeVisible()
    await expect(profilePage.nameInput).toBeVisible()
    await expect(profilePage.emailInput).toBeVisible()
  })

  test("profile fields are disabled by default", async ({ profilePage }) => {
    await expect(profilePage.nameInput).toBeDisabled()
    await expect(profilePage.emailInput).toBeDisabled()
  })

  test("Edit profile button is visible in view mode", async ({ profilePage }) => {
    await expect(profilePage.editProfileButton).toBeVisible()
  })

  test("Save and Cancel buttons are hidden in view mode", async ({ profilePage }) => {
    await expect(profilePage.saveChangesButton).not.toBeVisible()
    await expect(profilePage.cancelButton).not.toBeVisible()
  })

  test("clicking Edit profile enables inputs and shows Save and Cancel", async ({ profilePage }) => {
    await profilePage.editProfileButton.click()
    await expect(profilePage.nameInput).toBeEnabled()
    await expect(profilePage.emailInput).toBeEnabled()
    await expect(profilePage.saveChangesButton).toBeVisible()
    await expect(profilePage.cancelButton).toBeVisible()
  })

  test("Cancel returns to view mode", async ({ profilePage }) => {
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
