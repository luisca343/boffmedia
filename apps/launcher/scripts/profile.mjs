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
import { spawn } from "node:child_process"

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

const env = { ...process.env }
// An explicit BOFF_API_URL in the shell still wins — that is how you point a
// build at a third environment without adding a profile for it.
if (profile.apiUrl && !env.BOFF_API_URL) env.BOFF_API_URL = profile.apiUrl

console.log(`▸ ${command} [${profileName}] → ${env.BOFF_API_URL ?? "https://api.boffmedia.es (compiled default)"}`)

const child = spawn(
  "pnpm",
  ["exec", "tauri", command, ...profile.config, ...rest],
  { stdio: "inherit", env, shell: process.platform === "win32" },
)
child.on("exit", (code) => process.exit(code ?? 1))
