import { defineConfig } from "vitest/config"

// The renderer's first test setup, deliberately minimal: no environment, no
// setup files, no aliases. Everything under test here is meant to be pure —
// state rules lifted out of `state/app.tsx` so they can be asserted without
// mounting React or standing up a Tauri bridge — so a DOM would only be
// something to keep working. A suite that needs one should add `environment:
// "happy-dom"` (not jsdom; see packages/tools/battlesim/vitest.config.mts for
// why that one is poisoned in this workspace) rather than making it the default
// for the pure tests.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
})
