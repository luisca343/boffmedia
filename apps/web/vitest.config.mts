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
  },
})
