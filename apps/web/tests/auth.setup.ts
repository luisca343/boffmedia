import { test as setup } from "@playwright/test"
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

  // Capture the native alert that AuthForm shows on failed login
  let loginError: string | undefined
  page.once("dialog", async (dialog) => {
    loginError = dialog.message()
    await dialog.accept()
  })

  await page.goto("/auth")
  await page.getByPlaceholder("Enter your username").fill(username)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByRole("button", { name: "Sign In", exact: true }).click()

  // If the login API rejected the credentials, the form shows a native alert.
  // Playwright auto-accepts it; we surface the message here immediately.
  if (loginError) {
    throw new Error(`Auth setup: login rejected — "${loginError}". Check TEST_USERNAME / TEST_PASSWORD in .env.development.local`)
  }

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000, waitUntil: "commit" })

  await page.context().storageState({ path: AUTH_FILE })
})
