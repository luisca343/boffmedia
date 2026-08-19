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
  // Located by form-field name, not placeholder text: AuthForm's placeholders and
  // its submit label are translated (t('fields.usernamePh'), t('submit.login')),
  // so any English locator here breaks the moment the default locale is not en.
  // The Google button is type="button", so button[type=submit] is unambiguous.
  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('button[type="submit"]').click()

  // If the login API rejected the credentials, the form shows a native alert.
  // Playwright auto-accepts it; we surface the message here immediately.
  if (loginError) {
    throw new Error(`Auth setup: login rejected — "${loginError}". Check TEST_USERNAME / TEST_PASSWORD in .env.development.local`)
  }

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000, waitUntil: "commit" })

  // Leaving /auth is NOT proof of a session. next-auth answers the credentials
  // callback 200 and redirects even when the browser then refuses to store the
  // cookie — which is what happens on any origin the cookie options cannot be
  // expressed on (see authOptions' `servedOverInsecureOrigin`). The saved state is
  // then empty and every chromium:auth spec runs anonymously while still passing,
  // because a mocked spec never needs a session. Check the session itself.
  const session = await page.request.get("/api/auth/session")
  const user = session.ok() ? ((await session.json()) as { user?: unknown }).user : undefined
  if (!user) {
    throw new Error(
      "Auth setup: signed in but no session was stored. /api/auth/session came back empty, " +
        "so the session cookie was rejected by the browser — check that NEXTAUTH_URL matches " +
        "the origin under test and that the cookie options in authOptions are valid for it.",
    )
  }

  await page.context().storageState({ path: AUTH_FILE })
})
