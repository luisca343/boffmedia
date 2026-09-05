import { defineConfig, devices } from "@playwright/test"
import fs from "fs"
import path from "path"

// Load .env.development.local when present (CI injects vars directly, so we
// only set keys that aren't already in the environment).
const envFile = path.join(__dirname, ".env.development.local")
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf-8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (key && !(key in process.env)) process.env[key] = val
  }
}

/**
 * WHERE THE SUITE POINTS, and why the default is local.
 *
 * This used to read `process.env.BASE_URL ?? "https://ficuslab.es"` in two
 * places, and the two combined into a trap. `webServer` starts `pnpm dev` and
 * then waits for `url` to answer -- and with BASE_URL unset, `url` was
 * PRODUCTION, which answers immediately. So the readiness probe passed whether
 * or not the local server had started, and the whole suite ran against
 * production. Not only reads: `chromium:auth` signs in as TEST_USERNAME first,
 * and the PC specs drag real Pokemon between real boxes.
 *
 * Two rules follow, and they are the fix:
 *
 *   1. The default is LOCAL. Pointing a suite that mutates data at a deployed
 *      environment must be a deliberate act -- `BASE_URL=... npx playwright
 *      test` -- never what you get by forgetting to set a variable.
 *   2. A webServer starts ONLY when the target is local. Against a deployed
 *      environment there is nothing to start, and a readiness probe aimed at
 *      the remote host cannot tell you anything about a local process.
 *
 * The banner prints the target on every run, because "which environment did
 * that green tick describe" is not a question a report should leave open.
 */
const LOCAL_TARGET = "http://localhost:3000"
const TARGET = process.env.BASE_URL ?? LOCAL_TARGET
// Anchored, and the host must END at a port, a path or the string's end --
// `https://localhost.evil.com` contains "localhost" and is not local.
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(TARGET)

console.log(
  `[playwright] target ${TARGET} ` +
    (IS_LOCAL
      ? "(local -- starting `pnpm dev`)"
      : "(REMOTE -- no server is started, and the authenticated specs will sign in and WRITE there)"),
)

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: TARGET,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    // Runs once to log in and save session to .auth/user.json.
    // Skips gracefully when TEST_USERNAME / TEST_PASSWORD are not set.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Runs once to log in as a ROTOM_ADMIN account and save session to .auth/admin.json.
    // Unlike `setup` it FAILS when the credentials are missing or the account lacks the
    // role — an admin suite that silently degrades to a non-admin session is the bug
    // this project exists to close.
    {
      name: "admin-setup",
      testMatch: /admin\.setup\.ts/,
    },

    // Public-page tests — no session required
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /admin\.setup\.ts/, /\.auth\.spec\.ts/, /\.admin\.spec\.ts/],
    },

    // Authenticated tests — depends on setup, session loaded from .auth/user.json
    {
      name: "chromium:auth",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: /.*\.auth\.spec\.ts/,
    },

    // Administración tests — require a session that actually carries ROTOM_ADMIN.
    {
      name: "chromium:admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/admin.json",
      },
      dependencies: ["admin-setup"],
      testMatch: /.*\.admin\.spec\.ts/,
    },
  ],
  // Undefined against a remote target: there is no local process to wait for,
  // and probing the remote host reports "ready" instantly while proving nothing.
  webServer: IS_LOCAL
    ? {
        command: "pnpm dev",
        url: TARGET,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: {
          ...process.env,
          NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API ?? "http://127.0.0.1:3333",
        },
      }
    : undefined,
})
