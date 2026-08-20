#!/usr/bin/env node
// Runs the Tauri CLI against one environment. The profile picks BOTH halves of
// the API host at once, which is the whole point: the updater endpoint lives in
// tauri.conf.json while the packs/auth host is baked into Rust by api.rs's
// option_env!("BOFF_API_URL"), and a build with those two disagreeing would
// check for updates against one server and download packs from another.
//
//   node scripts/profile.mjs <dev|prod> <dev|build> [...extra tauri args]
//
// Env vars are set here rather than inline in package.json because the release
// build happens on Windows, where `FOO=bar cmd` is not a thing.
// It also loads apps/desktop/.env into the child's environment. Nothing else
// loads that file — cargo and the Tauri CLI read only the shell environment,
// and Vite exposes it only to the renderer under the VITE_/TAURI_ENV_ prefixes.
// Without this, TAURI_SIGNING_PRIVATE_KEY has to be re-exported into every new
// shell, and a build that forgets dies at the very end, after the full compile.
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PROFILES = {
  dev: {
    apiUrl: "https://api.ficuslab.es",
    config: ["--config", "src-tauri/tauri.dev.conf.json"],
  },
  // No overrides: tauri.conf.json and api.rs already carry production.
  prod: { apiUrl: null, config: [] },
}

const [profileName, command, ...rest] = process.argv.slice(2)
const profile = PROFILES[profileName]

if (!profile || !command) {
  console.error("usage: node scripts/profile.mjs <dev|prod> <dev|build> [args]")
  process.exit(1)
}

// The shell always wins over .env: loadEnvFile does not overwrite variables
// that are already set, so `TAURI_SIGNING_PRIVATE_KEY=... pnpm build` still
// overrides the file.
const envFile = resolve(dirname(fileURLToPath(import.meta.url)), "..", ".env")
// Read before loading: only a BOFF_API_URL from the real shell may override the
// profile. A stale one in .env silently pointing a `prod` build at dev is
// exactly the split the profile exists to prevent.
const shellApiUrl = process.env.BOFF_API_URL
if (existsSync(envFile)) process.loadEnvFile(envFile)

const env = { ...process.env }

// Signing failures surface only after the whole Rust compile, so check up front.
if (command === "build" && !env.TAURI_SIGNING_PRIVATE_KEY) {
  console.error(
    "✗ TAURI_SIGNING_PRIVATE_KEY is not set.\n" +
      `  Put it in ${envFile} (see .env.example) — the key file is\n` +
      "  ~/.boff-launcher/boff-launcher-updater.key. See docs/RELEASING.md.",
  )
  process.exit(1)
}
// Tauri prompts for a passphrase when this is unset, hanging a CI/background
// build forever. The key was generated without one, so an empty string is right.
if (env.TAURI_SIGNING_PRIVATE_KEY && env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD === undefined) {
  env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
}
// An explicit BOFF_API_URL in the shell still wins — that is how you point a
// build at a third environment without adding a profile for it.
if (shellApiUrl) env.BOFF_API_URL = shellApiUrl
else if (profile.apiUrl) env.BOFF_API_URL = profile.apiUrl
else delete env.BOFF_API_URL // prod: fall through to api.rs's compiled default

console.log(`▸ ${command} [${profileName}] → ${env.BOFF_API_URL ?? "https://api.boffmedia.es (compiled default)"}`)

const child = spawn(
  "pnpm",
  ["exec", "tauri", command, ...profile.config, ...rest],
  { stdio: "inherit", env, shell: process.platform === "win32" },
)
child.on("exit", (code) => process.exit(code ?? 1))
