import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

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
