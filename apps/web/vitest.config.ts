import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

// Unit tests for pure logic only (node env, no DOM). Playwright still owns e2e.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
