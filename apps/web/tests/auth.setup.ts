import { test as setup, expect } from "@playwright/test"
import fs from "fs"
import path from "path"

export const AUTH_FILE = path.join(__dirname, "../.auth/user.json")

setup("authenticate", async ({ page }) => {
  const username = process.env.TEST_USERNAME ?? ""
  const password = process.env.TEST_PASSWORD ?? ""

  // Always ensure the directory exists so chromium:auth can load the file
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  if (!username || !password) {
    // Write an empty state — authenticated tests will see no session and fail
    // with a meaningful error rather than a missing-file crash
    await page.context().storageState({ path: AUTH_FILE })
    return
  }

  await page.goto("/auth")
  await page.getByPlaceholder("Enter your username").fill(username)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByRole("button", { name: "Sign In", exact: true }).click()

  await expect(page).not.toHaveURL(/\/auth/, { timeout: 10_000 })

  await page.context().storageState({ path: AUTH_FILE })
})
