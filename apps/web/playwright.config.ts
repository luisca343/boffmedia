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
    baseURL: process.env.BASE_URL ?? "https://ficuslab.es",
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

    // Public-page tests — no session required
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /\.auth\.spec\.ts/],
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
  ],
  webServer: {
    command: "pnpm dev",
    url: process.env.BASE_URL ?? "https://ficuslab.es",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_API: process.env.NEXT_PUBLIC_API ?? "http://127.0.0.1:3333",
    },
  },
})
