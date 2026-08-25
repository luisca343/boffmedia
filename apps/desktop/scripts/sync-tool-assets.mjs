/**
 * sync-tool-assets.mjs — put the tool packages' static data where the renderer
 * can fetch it.
 *
 * The Seed Finder loads its worldgen from curated bundles served at
 * `/boffmedia/tools/seeds/<id>-<version>.<hash>.bin`, the path
 * `@boffmedia/asset-paths` hands every host. On the web those files sit in
 * `apps/web/public`; here they have to be in this app's own `public/`, because
 * Tauri serves the built renderer from a custom protocol with no access to the
 * web app's tree — and because the launcher works offline, so fetching them
 * from boffmedia.es at runtime is not an option.
 *
 * `apps/*​/public/` is gitignored, so both copies are build artifacts rather
 * than committed bytes. That is why this runs before `vite` rather than being
 * a one-off: the filenames carry a content hash, so rebuilding a bundle
 * changes its name and a stale copy here would be fetched forever under the
 * old URL.
 *
 * The file list comes from `bundles.generated.ts` — the same manifest the
 * renderer imports — so a bundle this app lacks is an error at build time
 * instead of a 404 in a webview with no console open.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, "..", "..", "..")

const MANIFEST = path.join(repo, "packages/tools/minecraft/src/seeds/_lib/bundles.generated.ts")
const SRC = path.join(repo, "apps/web/public/boffmedia/tools/seeds")
const DEST = path.join(here, "..", "public", "boffmedia", "tools", "seeds")

const manifest = fs.readFileSync(MANIFEST, "utf8")
const wanted = [...manifest.matchAll(/^\s*"([^"]+)":\s*"([^"]+)",$/gm)].map((m) => ({ id: m[1], file: m[2] }))

if (!wanted.length) {
  console.error(`[tool-assets] no bundles listed in ${path.relative(repo, MANIFEST)} — has it been generated?`)
  process.exit(1)
}

const missing = wanted.filter((w) => !fs.existsSync(path.join(SRC, w.file)))
if (missing.length) {
  console.error(
    `[tool-assets] ${missing.length} seed bundle(s) missing from ${path.relative(repo, SRC)}:\n` +
      missing.map((m) => `  ${m.id}  ${m.file}`).join("\n") +
      `\n\nBuild them first, e.g.\n` +
      `  cd packages/tools/minecraft && node scripts/build-seed-bundle.mjs <src> ../../../apps/web/public/boffmedia/tools/seeds <id> <version>\n` +
      `They are gitignored build artifacts, so a fresh clone will not have them.`,
  )
  process.exit(1)
}

fs.mkdirSync(DEST, { recursive: true })

let copied = 0
for (const { file } of wanted) {
  const to = path.join(DEST, file)
  // The name carries a content hash, so same name means same bytes.
  if (fs.existsSync(to)) continue
  fs.copyFileSync(path.join(SRC, file), to)
  copied++
}

let pruned = 0
const keep = new Set(wanted.map((w) => w.file))
for (const file of fs.readdirSync(DEST)) {
  if (file.endsWith(".bin") && !keep.has(file)) {
    fs.unlinkSync(path.join(DEST, file))
    pruned++
  }
}

console.log(
  `[tool-assets] seeds: ${wanted.length} bundle(s) ready` +
    (copied ? `, ${copied} copied` : "") +
    (pruned ? `, ${pruned} stale removed` : ""),
)
