import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vite"

import { isBundledAsset } from "./src/bundled-assets.generated"

const host = process.env.TAURI_DEV_HOST

/**
 * Where `dev:renderer` borrows the shared asset tree from.
 *
 * The launcher proper reads it through the `boffasset://` scheme, which the
 * Rust side serves from an on-disk cache. Browser dev mode has no Rust side, so
 * it used to point straight at the website — which works for an `<img>` and
 * NOT for a `fetch()`: boffmedia.es sends no `Access-Control-Allow-Origin`, so
 * every JSON dataset a tool loads (Mewgenics' is 37 files) failed with a bare
 * "Failed to fetch" and the tool showed its own "check the path exists" error.
 * Proxying makes those requests same-origin, which is the only thing CORS was
 * ever objecting to.
 */
const ASSET_UPSTREAM = process.env.VITE_WEB_BASE_URL || "https://boffmedia.es"

const assetProxy = {
  target: ASSET_UPSTREAM,
  changeOrigin: true,
  // A bundled prefix is served by Vite's own static middleware instead: the
  // bytes are already in public/, and going to the network for them would make
  // dev mode fail in exactly the case the bundling exists to survive. The test
  // is the same generated one the runtime router uses (`bundled-assets`), so
  // dev and the built app cannot disagree about what this app ships.
  bypass: (req: { url?: string }) =>
    isBundledAsset((req.url ?? "").split("?")[0]) ? req.url : null,
}

export default defineConfig({
  plugins: [react()],
  // Tauri serves the build from a custom protocol, so asset URLs must be
  // relative rather than rooted at /.
  base: "./",
  // Rust's own errors are the useful output during `tauri dev`; do not wipe
  // them with Vite's banner.
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_"],
  server: {
    // 5273 rather than Vite's default 5173: the web app and the launcher get
    // run at the same time and must not fight over a port.
    port: 5273,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 5274 } : undefined,
    // src-tauri has its own watcher; letting Vite watch it too causes reload
    // storms on every Rust rebuild.
    watch: { ignored: ["**/src-tauri/**"] },
    // Only in dev: the built app never sees these (it has the scheme).
    proxy: {
      "/boffmedia": assetProxy,
      "/smartrotom": assetProxy,
      "/uploads": assetProxy,
      "/blog": assetProxy,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // @boffmedia/ui ships TypeScript source, so Vite reads it directly.
      // @boffmedia/pack-schema deliberately does NOT get an alias: apps/api
      // consumes it as compiled CJS, and pointing bundlers at the source
      // instead would let types and runtime drift apart.
      "@boffmedia/ui": resolve(__dirname, "../../packages/ui/src"),
      // Tool packages ship TS source too ("Consumed as TS source").
      "@boffmedia/tool-kit": resolve(__dirname, "../../packages/tools/kit/src"),
      "@boffmedia/tools-minecraft": resolve(__dirname, "../../packages/tools/minecraft/src"),
      // Source, not `dist`, because the published package is CJS-only — its
      // `exports` map has `require` and `default` and no `import`, so Rollup
      // reads `dist/cjs/index.js` and fails with `"ASSET" is not exported`.
      // The package cannot simply gain an ESM build: apps/api consumes it as
      // compiled CJS, the same constraint that keeps @boffmedia/pack-schema
      // dual-built. Resolving it per-host here changes nothing for the API.
      "@boffmedia/asset-paths": resolve(__dirname, "../../packages/asset-paths/src"),
    },
  },
  // The schematic tools spawn `new Worker(new URL(...), { type: "module" })`,
  // and those workers dynamically import their parsers/registries. Vite's
  // default worker format is "iife", which cannot represent a code-split
  // bundle — the build fails outright. WebView2 and WKWebView both support
  // module workers, so "es" is free here (this is what the plan's S1 spike was
  // meant to catch).
  worker: { format: "es" },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // WebView2 on Windows and WKWebView on macOS; both are evergreen enough
    // for es2021, and Tauri never ships a legacy browser.
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
