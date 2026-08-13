import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vite"

const host = process.env.TAURI_DEV_HOST

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
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // @boffmedia/ui ships TypeScript source, so Vite reads it directly.
      // @boffmedia/pack-schema deliberately does NOT get an alias: apps/api
      // consumes it as compiled CJS, and pointing bundlers at the source
      // instead would let types and runtime drift apart.
      "@boffmedia/ui": resolve(__dirname, "../../packages/ui/src"),
      // Tool packages ship TS source too (plan §3: "Consumed as TS source").
      "@boffmedia/tool-kit": resolve(__dirname, "../../packages/tools/kit/src"),
      "@boffmedia/tools-minecraft": resolve(__dirname, "../../packages/tools/minecraft/src"),
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
