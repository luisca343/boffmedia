import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

// .mts, not .ts — same as apps/desktop and packages/tools/battlesim. Vite
// bundles a `.ts` config to CJS and `require()`s it, and vitest/dist/config.cjs
// pulls in std-env, which is ESM-only: on any Node before 22.12 (no
// `require(esm)`) that is ERR_REQUIRE_ESM and `vitest run` cannot start at all.
// The .mts extension makes Vite emit ESM and load it with import() instead.
// __dirname below still works: Vite shims it when it bundles the config.

// Unit tests for pure logic only (node env, no DOM). Playwright still owns e2e.
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@boffmedia/ui": resolve(__dirname, "../../packages/ui/src"),
    },
  },
  test: {
    environment: "node",
    // @boffmedia/ui is included explicitly: its tests moved out of src/ with
    // the package and would otherwise be silently collected by nothing.
    include: ["src/**/*.test.ts", "../../packages/ui/src/**/*.test.ts"],
    // `config/env` validates NEXT_PUBLIC_* with zod AT IMPORT TIME, so any test
    // that reaches the service layer dies with a ZodError before a single
    // assertion runs — and vitest reports that as a FILE failure while still
    // printing "N tests passed", which reads like success. It has already
    // silently disabled two suites in this backlog (the W14 command palette and
    // W5's session integration tests). Supplying placeholder values here is the
    // fix for the whole class; individual tests that care about a specific value
    // still override it themselves.
    // The three without a zod default are the ones that throw.
    env: {
      NEXT_PUBLIC_API: "http://localhost:34301",
      NEXT_PUBLIC_SOCKET_URL: "http://localhost:34301",
      NEXT_PUBLIC_MC_WORLD: "test",
    },
  },
})
