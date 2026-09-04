import { defineConfig } from "vitest/config"
import { resolve } from "node:path"

// happy-dom, not jsdom: the hoisted jsdom in this workspace pulls
// html-encoding-sniffer@6 → the ESM-only @exodus/bytes, which throws
// ERR_REQUIRE_ESM the moment a JSDOM is constructed. The engine only needs
// document/element/style, which happy-dom provides.
export default defineConfig({
  resolve: {
    alias: {
      "@boffmedia/asset-paths": resolve(__dirname, "../../asset-paths/src/index.ts"),
      "@boffmedia/tool-kit": resolve(__dirname, "../kit/src/index.ts"),
      // More specific first: Vite matches string aliases as prefixes, so a
      // bare "@boffmedia/ui" entry would rewrite "@boffmedia/ui/i18n" too.
      "@boffmedia/ui/i18n": resolve(__dirname, "../../ui/src/i18n.tsx"),
      "@boffmedia/ui/datakit": resolve(__dirname, "../../ui/src/datakit/index.ts"),
      "@boffmedia/ui/cn": resolve(__dirname, "../../ui/src/cn.ts"),
      // Catch-all for the rest of the subpaths, so importing a NEW one from
      // `@boffmedia/ui/...` does not fail here with "does the file exist?" —
      // which is what the bare entry below turns a missing rule into.
      "@boffmedia/ui/": resolve(__dirname, "../../ui/src") + "/",
      "@boffmedia/ui": resolve(__dirname, "../../ui/src/index.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/__tests__/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
  },
})
