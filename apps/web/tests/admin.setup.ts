import { test as setup, expect } from "@playwright/test"
import fs from "fs"
import path from "path"

export const ADMIN_AUTH_FILE = path.join(__dirname, "../.auth/admin.json")

/**
 * The admin session, minted exactly the way `auth.setup.ts` mints the player one —
 * a real credentials login, not a forged cookie.
 *
 * The role is then VERIFIED against the live session before the state is saved. This is
 * the whole point: /smartrotom/gobierno/admin redirects a non-admin away, so without
 * this check a suite run against an under-privileged account would assert happily on
 * the page it was bounced to. Failing here, loudly, is the only correct outcome.
 */
setup("authenticate as admin", async ({ page }) => {
  const username = process.env.TEST_ADMIN_USERNAME ?? ""
  const password = process.env.TEST_ADMIN_PASSWORD ?? ""

  fs.mkdirSync(path.dirname(ADMIN_AUTH_FILE), { recursive: true })

  if (!username || !password) {
    throw new Error(
      "Admin e2e needs TEST_ADMIN_USERNAME / TEST_ADMIN_PASSWORD in apps/web/.env.development.local, " +
        "pointing at an account that holds the ROTOM_ADMIN role. Without them the admin specs cannot " +
        "run — they must not be skipped into a false pass.",
    )
  }

  let loginError: string | undefined
  page.once("dialog", async (dialog) => {
    loginError = dialog.message()
    await dialog.accept()
  })

  await page.goto("/auth")
  await page.getByPlaceholder("Enter your username").fill(username)
  await page.getByPlaceholder("Enter your password").fill(password)
  await page.getByRole("button", { name: "Sign In", exact: true }).click()

  if (loginError) {
    throw new Error(`Admin auth setup: login rejected — "${loginError}". Check TEST_ADMIN_USERNAME / TEST_ADMIN_PASSWORD.`)
  }

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000, waitUntil: "commit" })

  const session = await page.evaluate(async () => {
    const res = await fetch("/api/auth/session")
    return (await res.json()) as { user?: { roles?: string[]; username?: string } } | null
  })

  // The app's own gate is `isRotomAdmin() || isBoffAdmin()` (useOfficer), so accept
  // either — but nothing weaker.
  const roles = session?.user?.roles ?? []
  const authorised = roles.some((r) => r === "ROTOM_ADMIN" || r === "BOFF_ADMIN")
  expect(
    authorised,
    `The account "${username}" signed in but holds neither ROTOM_ADMIN nor BOFF_ADMIN (roles: ${JSON.stringify(roles)}).\n` +
      "Seed it in the database — grant ROTOM_ADMIN to this user — and re-run.\n" +
      "Do not work around this: every admin page redirects without the role, and the specs would then pass on the wrong page.",
  ).toBe(true)

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})
