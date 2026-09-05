import { defineConfig, devices } from "@playwright/test"
import path from "path"

export default defineConfig({
  testDir: path.resolve(__dirname, "tests"),
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  // Both output paths are pinned INSIDE e2e/, where the .gitignore is.
  // Playwright resolves them against the process CWD, which is the package
  // root here, so the defaults dropped playwright-report/ and test-results/
  // beside package.json as untracked noise.
  reporter: [["html", { outputFolder: path.resolve(__dirname, "playwright-report"), open: "never" }]],
  outputDir: path.resolve(__dirname, "test-results"),
  use: {
    baseURL: "http://127.0.0.1:5178",
    trace: "on-first-retry",
    // A real desktop window, not Playwright's 1280x720 default. The battle
    // stage is `aspect-[16/9]` with a fixed-width rail beside it, so at 720px
    // tall the field and the move dock genuinely overlap and the dock stops
    // being clickable -- an artefact of the viewport, not of the app.
    viewport: { width: 1600, height: 1000 },
  },
  webServer: {
    // Start vite for the e2e host. The host's vite.config.ts is at
    // packages/tools/battlesim/e2e/host/vite.config.ts. Its index.html and
    // main.tsx mount BsimRoot with no network, testing bundling, workers, and
    // the canvas — the three things audits B7 and B11 needed to see.
    //
    // Port 5178 is REQUIRED (see e2e/host/vite.config.ts). Use pnpm to ensure
    // node_modules is available in workspace. The command runs from battlesim
    // so relative paths in vite.config.ts resolve correctly.
    command: "pnpm exec vite --config e2e/host/vite.config.ts",
    port: 5178,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // `..`, not `../..`. This file lives in packages/tools/battlesim/e2e, so
    // one level up is the package; two was packages/tools, and Vite then looked
    // for the config at <repo>/e2e/host/vite.config.ts and died.
    //
    // Nobody noticed for several runs because `reuseExistingServer` is true
    // outside CI and a dev server started by hand was already on 5178: every
    // run quietly attached to it and passed. In CI, where that flag is false,
    // this would have failed on the first attempt — a suite that had never once
    // started its own server. Found by killing the stray server before a
    // negative test.
    cwd: path.resolve(__dirname, ".."),
  },
})
