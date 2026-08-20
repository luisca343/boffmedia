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
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const profile = process.argv[2] ?? "prod"
const base = JSON.parse(readFileSync(path.join(root, "src-tauri/tauri.conf.json"), "utf8"))
// El perfil dev sobreescribe productName ("Boffmedia App (dev)"), así que el
// nombre del ejecutable depende del perfil, no solo de la config base.
const overrides =
  profile === "dev"
    ? JSON.parse(readFileSync(path.join(root, "src-tauri/tauri.dev.conf.json"), "utf8"))
    : {}
const version = overrides.version ?? base.version
const productName = overrides.productName ?? base.productName

const run = (cmd, args, env) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32", env })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

// `--no-bundle` salta msi/nsis: aquí solo interesa el .exe.
run("node", ["scripts/profile.mjs", profile, "build", "--no-bundle"], {
  ...process.env,
  BOFF_PORTABLE: "1",
})

const ext = process.platform === "win32" ? ".exe" : ""
const releaseDir = path.join(root, "src-tauri/target/release")

// `--no-bundle` salta la fase de bundling, y el rename de la binaria al
// productName ocurre DENTRO de esa fase: aquí el ejecutable conserva el nombre
// del paquete de Cargo. Se aceptan los dos por si algún día se empaqueta.
const src = [`${productName}${ext}`, `boffmedia-app${ext}`]
  .map((name) => path.join(releaseDir, name))
  .find(existsSync)

if (!src) {
  console.error(`no se encontró ni "${productName}${ext}" ni "boffmedia-app${ext}" en ${releaseDir}`)
  process.exit(1)
}

const outDir = path.join(root, "src-tauri/target/portable")
mkdirSync(outDir, { recursive: true })
const zip = path.join(outDir, `BoffmediaApp_${version}_portable_x64.zip`)

// El zip debe llevar el nombre bonito aunque la binaria en disco sea la de
// Cargo: ninguna de las dos herramientas de compresión sabe renombrar entradas.
const stage = path.join(root, "src-tauri/target/portable-stage")
rmSync(stage, { recursive: true, force: true })
mkdirSync(stage, { recursive: true })
const staged = path.join(stage, `${productName}${ext}`)
copyFileSync(src, staged)

if (process.platform === "win32") {
  run("powershell", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Force -Path '${staged}' -DestinationPath '${zip}'`,
  ])
} else {
  run("zip", ["-j", "-9", zip, staged])
}
rmSync(stage, { recursive: true, force: true })

console.log(`\n▸ portable [${profile}] → ${zip}`)
console.log("  Requiere el runtime de WebView2 (incluido en Windows 10 1803+ / 11).")
console.log("  Sin auto-actualización: NO lo subas al feed de releases.")
