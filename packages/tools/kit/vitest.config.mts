import { defineConfig } from "vitest/config"

// `node`, not happy-dom: what is tested here is the retry policy, which is a
// clock and a queue and nothing else. The one React binding in this package
// (`hooks.ts`) is a thin wrapper over that policy and is covered where it is
// used, so pulling a DOM in to reach it would cost a dependency for nothing.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
})
