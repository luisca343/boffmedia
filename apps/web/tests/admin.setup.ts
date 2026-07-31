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
setup("authenticate as admin", async ({ page, baseURL }) => {
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

  // LOCALHOST PATH. authOptions hardcodes the session cookie's domain to
  // `.ficuslab.es` outside production (authOptions.ts, `cookies.sessionToken`),
  // so a browser on http://localhost cannot store it: the form login succeeds
  // server-side and /api/auth/session then returns {} — which reads exactly
  // like "this account has no roles" and sends you hunting in the database.
  //
  // This is still a REAL credentials login: the same csrf + callback exchange
  // the form performs, with the genuine token re-homed onto a domain the
  // browser will accept. Nothing is minted from NEXTAUTH_SECRET.
  const target = new URL(baseURL ?? "http://localhost:3000")
  if (target.hostname === "localhost" || target.hostname === "127.0.0.1") {
    const api = page.request
    const csrfRes = await api.get("/api/auth/csrf")
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string }

    const callback = await api.post("/api/auth/callback/boffmedia", {
      form: { csrfToken, username, password, json: "true" },
    })
    if (!callback.ok()) {
      throw new Error(`Admin auth setup: credentials callback returned ${callback.status()}.`)
    }

    // Read the raw Set-Cookie, not the cookie jar: the jar rejects this cookie
    // for the very reason we are here — its Domain is .ficuslab.es and the
    // request went to localhost.
    const setCookies = callback
      .headersArray()
      .filter((h) => h.name.toLowerCase() === "set-cookie")
      .map((h) => h.value)
    const token = setCookies
      .find((c) => c.startsWith("__Secure-next-auth.session-token="))
      ?.split(";")[0]
      ?.split("=")
      .slice(1)
      .join("=")
    if (!token) {
      throw new Error(
        "Admin auth setup: the credentials callback set no session cookie. " +
          "Check TEST_ADMIN_USERNAME / TEST_ADMIN_PASSWORD.",
      )
    }

    // sameSite must be spelled out or CDP rejects the __Secure- prefixed name.
    // Chrome treats http://localhost as a secure origin, so `secure` is fine.
    await page.context().addCookies([
      {
        name: "__Secure-next-auth.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
      },
    ])
  } else {
    await formLogin()
  }

  async function formLogin() {
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

  if (loginError) {
    throw new Error(`Admin auth setup: login rejected — "${loginError}". Check TEST_ADMIN_USERNAME / TEST_ADMIN_PASSWORD.`)
  }

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 20_000, waitUntil: "commit" })
  }

  // The role check below runs against whichever path was taken, so a cookie
  // that does not actually carry the role still fails loudly.
  await page.goto("/")

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
