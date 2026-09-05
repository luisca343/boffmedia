import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

/**
 * Vite for the e2e host. ONE alias, and it is the same one apps/desktop needs.
 *
 * The first cut of this file carried a block of hand-written regex aliases for
 * `@boffmedia/ui`, `@boffmedia/ui/*` and friends. Those were working around a
 * resolution failure whose real cause was a nested package.json that pnpm never
 * installed (see main.tsx), and they are gone: ordinary node resolution finds
 * everything, because the @boffmedia workspace links live in
 * `packages/tools/battlesim/node_modules` and react/@pkmn are hoisted to the
 * repo root. An alias that only restates a package's own `exports` map is how a
 * host ends up bundling something the real app does not.
 *
 * `@boffmedia/asset-paths` is the exception, for the reason
 * `apps/desktop/vite.config.ts` documents at the identical line: that package is
 * CJS-only — its `exports` map has `require` and `default` and no `import` — so
 * a browser loading `dist/cjs/index.js` as an ES module dies on
 * `does not provide an export named 'ASSET'`. It cannot simply gain an ESM
 * build, because apps/api consumes it as compiled CJS. Resolving it to source
 * per-host is the established answer here, and `optimizeDeps.include` is NOT a
 * substitute: the import arrives through a linked package Vite is told to
 * exclude, so it is served over `/@fs/` and never pre-bundled at all.
 */
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5178,
    host: "127.0.0.1",
    strictPort: true,
    // The suite asserts on what the app renders, not on Vite's error overlay.
    hmr: false,
  },
  optimizeDeps: {
    // These publish TypeScript SOURCE as their entry (`"main": "./src/index.ts"`),
    // so there is nothing to pre-bundle — let Vite compile them like
    // first-party code.
    exclude: [
      "@boffmedia/tools-battlesim",
      "@boffmedia/ui",
      "@boffmedia/tool-kit",
      "@boffmedia/tools-pokemon",
      "@boffmedia/pkmn-names",
    ],
  },
  resolve: {
    alias: {
      // See the header. The three CJS-only workspace packages, resolved to
      // source — the same treatment apps/desktop/vite.config.ts gives
      // asset-paths, for the same reason and with the same constraint: none of
      // them can simply gain an ESM build, because apps/api consumes them as
      // compiled CJS.
      //
      // The failure mode is worth naming because it costs an hour every time:
      // the page goes BLANK with no React error, only
      // `does not provide an export named 'X'`, because it happens at module
      // evaluation before anything renders. It surfaces one package at a time,
      // so fixing asset-paths just reveals pokemon-identity.
      "@boffmedia/asset-paths": path.resolve(__dirname, "../../../../asset-paths/src"),
      "@boffmedia/pokemon-identity": path.resolve(__dirname, "../../../../pokemon-identity/src"),
      "@boffmedia/battle-core": path.resolve(__dirname, "../../../../battle-core/src"),
    },
    // One React instance. The host resolves react from the repo root and the
    // package's own tree could resolve a second copy, which is the classic
    // "invalid hook call" that looks like a component bug.
    dedupe: ["react", "react-dom"],
  },
  define: {
    // Some @pkmn entry points read process.env at module scope.
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  cacheDir: path.join(__dirname, ".vite"),
})
