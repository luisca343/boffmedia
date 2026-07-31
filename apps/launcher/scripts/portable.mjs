#!/usr/bin/env node
// Empaqueta la versión PORTABLE: el .exe crudo que `tauri build` deja en
// target/release, sin instalador, dentro de un .zip.
//
//   node scripts/portable.mjs <dev|prod>
//
// Dos cosas que no son obvias:
//
//  1. Tauri no tiene un target de bundle "portable". El ejecutable de
//     target/release YA es autocontenido (el frontend va incrustado en el
//     binario); lo único que no lleva dentro es el runtime de WebView2, que
//     Windows 10 1803+ y Windows 11 ya traen de serie. Por eso esto no compila
//     nada distinto: reutiliza el binario del build normal.
//  2. Se compila con BOFF_PORTABLE=1 para que updates.rs no ofrezca la
//     actualización automática — instalaría una copia PARALELA en Archivos de
//     programa y reiniciaría en ella, dejando la portable huérfana.
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const profile = process.argv[2] ?? "prod"
const { version } = JSON.parse(readFileSync(path.join(root, "src-tauri/tauri.conf.json"), "utf8"))

const run = (cmd, args, env) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32", env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// `--no-bundle` salta msi/nsis: aquí solo interesa el .exe.
run("node", ["scripts/profile.mjs", profile, "build", "--no-bundle"], {
  ...process.env,
  BOFF_PORTABLE: "1",
})

const exe = process.platform === "win32" ? "Boff Launcher.exe" : "boff-launcher"
const src = path.join(root, "src-tauri/target/release", exe)
if (!existsSync(src)) {
  console.error(`no se encontró ${src} — ¿cambió productName en tauri.conf.json?`)
  process.exit(1)
}

const outDir = path.join(root, "src-tauri/target/portable")
mkdirSync(outDir, { recursive: true })
const zip = path.join(outDir, `BoffLauncher_${version}_portable_x64.zip`)

if (process.platform === "win32") {
  run("powershell", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Force -Path '${src}' -DestinationPath '${zip}'`,
  ])
} else {
  run("zip", ["-j", "-9", zip, src])
}

console.log(`\n▸ portable [${profile}] → ${zip}`)
console.log("  Requiere el runtime de WebView2 (incluido en Windows 10 1803+ / 11).")
console.log("  Sin auto-actualización: NO lo subas al feed de releases.")
