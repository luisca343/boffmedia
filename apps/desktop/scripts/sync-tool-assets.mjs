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
 * PMD Sky's species portraits ride along for the same reason, and are the whole
 * reason that tool needs no `api` capability: 533 files of ~1.5 KB, one per
 * species, out of a 75 MB tree that carries sixteen emotions each. That ratio is
 * what makes this set worth bundling and Mewgenics' 389 MB not — the general
 * answer for the heavy trees is a caching asset protocol, not this script.
 *
 * Both file lists come from the packages' own generated modules — the same ones
 * the renderer imports — so an asset this app lacks is an error at build time
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

// ── PMD Sky portraits ────────────────────────────────────────────────────────

const PORTRAITS = path.join(repo, "packages/tools/pokemon/src/pmdsky/portraits.ts")
const PORTRAIT_SRC = path.join(repo, "apps/web/public/smartrotom/img/pmd/portrait")
const PORTRAIT_DEST = path.join(here, "..", "public", "smartrotom", "img", "pmd", "portrait")
/** Where a fresh clone gets them: `apps/*​/public` is gitignored, so the web
 *  app's tree may simply not exist on this machine. */
const PORTRAIT_URL = "https://boffmedia.es/smartrotom/img/pmd/portrait"

const portraitSrc = fs.readFileSync(PORTRAITS, "utf8")
// Only the table's own body: the prose around it talks about dex numbers too.
const portraitMap = portraitSrc.slice(portraitSrc.indexOf("PMD_INDEX_TO_DEX"), portraitSrc.indexOf("\n};"))
const dexes = [
  ...new Set([...portraitMap.matchAll(/\d+:\s*(\d+)/g)].map((m) => m[1].padStart(4, "0"))),
]

if (!dexes.length) {
  console.error(`[tool-assets] no dex ids found in ${path.relative(repo, PORTRAITS)} — has it been generated?`)
  process.exit(1)
}

let pCopied = 0
let pFetched = 0
const pFailed = []
for (const dex of dexes) {
  const to = path.join(PORTRAIT_DEST, dex, "Normal.png")
  // Frozen game art under a stable name: present means correct.
  if (fs.existsSync(to)) continue
  fs.mkdirSync(path.dirname(to), { recursive: true })
  const from = path.join(PORTRAIT_SRC, dex, "Normal.png")
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to)
    pCopied++
    continue
  }
  try {
    const res = await fetch(`${PORTRAIT_URL}/${dex}/Normal.png`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    fs.writeFileSync(to, Buffer.from(await res.arrayBuffer()))
    pFetched++
  } catch (err) {
    pFailed.push(`  ${dex}  ${err instanceof Error ? err.message : String(err)}`)
  }
}

if (pFailed.length) {
  console.error(
    `[tool-assets] ${pFailed.length} PMD portrait(s) could not be obtained, from neither\n` +
      `  ${path.relative(repo, PORTRAIT_SRC)}\n` +
      `nor ${PORTRAIT_URL}:\n` +
      pFailed.join("\n") +
      `\n\nThe app would ship with blank portrait frames, so this is a build error.`,
  )
  process.exit(1)
}

console.log(
  `[tool-assets] pmdsky: ${dexes.length} portrait(s) ready` +
    (pCopied ? `, ${pCopied} copied` : "") +
    (pFetched ? `, ${pFetched} downloaded` : ""),
)

// ── What the app ships, for the runtime router ───────────────────────────────

/**
 * Written rather than hand-maintained because getting it wrong is silent: a
 * prefix listed here but not actually bundled makes every request for it
 * resolve against `tauri://localhost`, where nothing serves it, INSTEAD of
 * falling through to the caching protocol that would have worked.
 */
const GENERATED = path.join(here, "..", "src", "bundled-assets.generated.ts")
const prefixes = ["/boffmedia/tools/seeds/", "/smartrotom/img/pmd/portrait/"]
// Mewgenics no longer bundles a data-file subset here: its whole tree (data
// and art alike) is now resolved through the tool-pack manager (tool_packs.rs)
// ahead of `boffasset://`, so this router carries no exceptions any more.
const exceptions = []

const generated =
  `// GENERATED by scripts/sync-tool-assets.mjs — do not edit by hand.\n` +
  `//\n` +
  `// The asset prefixes this build actually ships, and the sub-trees inside them\n` +
  `// that it does NOT. Anything else is fetched through \`boffasset://\`.\n\n` +
  `export const BUNDLED_ASSET_PREFIXES: readonly string[] = ${JSON.stringify(prefixes, null, 2)}\n\n` +
  `export const BUNDLED_ASSET_EXCEPTIONS: readonly string[] = ${JSON.stringify(exceptions, null, 2)}\n\n` +
  `/** True when \`path\` is served out of this app's own bundle. */\n` +
  `export function isBundledAsset(path: string): boolean {\n` +
  `  if (BUNDLED_ASSET_EXCEPTIONS.some((prefix) => path.startsWith(prefix))) return false\n` +
  `  return BUNDLED_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix))\n` +
  `}\n`

const previous = fs.existsSync(GENERATED) ? fs.readFileSync(GENERATED, "utf8") : ""
if (previous !== generated) {
  fs.writeFileSync(GENERATED, generated)
  console.log(`[tool-assets] wrote ${path.relative(repo, GENERATED)}`)
}
