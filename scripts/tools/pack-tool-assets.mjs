#!/usr/bin/env node
/**
 * pack-tool-assets.mjs — streams a built tool asset tree
 * (public/boffmedia/tools/<tool>/) into a single content-versioned zip under
 * public/boffmedia/tools/packs/, and rewrites packs/index.json to point at
 * it.
 *
 * The zip is written with yazl (streaming, no native build): the tree is
 * never buffered as a whole, only one file at a time is read for hashing and
 * one file at a time is streamed into the archive. Entries are rooted at
 * `boffmedia/tools/<tool>/…` — the SAME root-relative shape the desktop
 * protocol serves — so the Rust side resolves a path with a plain join, no
 * prefix arithmetic (D-06).
 *
 * Determinism: entries are added in sorted path order and every entry (plus
 * the embedded pack.toon) is written with a FIXED mtime and mode, so packing
 * the same tree content twice yields a byte-identical zip and therefore an
 * identical sha256 — even though the files on disk carry whatever mtimes the
 * build step happened to leave them with.
 *
 * pack.toon travels inside the zip for provenance and for sync-public.sh.
 * Rust does not parse it (D-07): tool_packs.rs verifies the whole-archive
 * sha256 carried in index.json, which is cheaper than vendoring a TOON
 * parser to check per-file hashes that must already agree with the archive
 * hash.
 *
 * index.json is rewritten LAST, after the zip is fully written and hashed —
 * a reader must never see an index naming a zip that is not there yet.
 *
 * Usage:
 *   node scripts/tools/pack-tool-assets.mjs <tool> [--out dir]
 *
 * Options:
 *   --out <dir>   packs directory (default: public/boffmedia/tools/packs)
 */
import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import { fileURLToPath } from "node:url"
import { ZipFile } from "yazl"

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(here, "..", "..")

// Fixed timestamp for every zip entry (D: determinism). Any constant works;
// this one is comfortably inside the DOS-date-representable range (1980-2107)
// so yazl never has to clamp it.
const FIXED_MTIME = new Date("2020-01-01T00:00:00Z")
const FIXED_MODE = 0o100644

// ── args ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { tool: null, out: null }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--out") args.out = argv[++i]
    else if (a === "--help" || a === "-h") {
      console.log("Usage: node scripts/tools/pack-tool-assets.mjs <tool> [--out dir]")
      process.exit(0)
    } else if (a.startsWith("--")) {
      console.error(`[pack-tool-assets] unknown argument: ${a}`)
      process.exit(1)
    } else if (!args.tool) {
      args.tool = a
    } else {
      console.error(`[pack-tool-assets] unexpected argument: ${a}`)
      process.exit(1)
    }
  }
  return args
}

const cli = parseArgs(process.argv.slice(2))
if (!cli.tool) {
  console.error("[pack-tool-assets] usage: node scripts/tools/pack-tool-assets.mjs <tool> [--out dir]")
  process.exit(1)
}
const TOOL = cli.tool
const TOOL_DIR = path.join(REPO, "public/boffmedia/tools", TOOL)
const OUT_DIR = path.resolve(cli.out ? path.resolve(process.cwd(), cli.out) : path.join(REPO, "public/boffmedia/tools/packs"))
const INDEX_PATH = path.join(OUT_DIR, "index.json")
const ENTRY_ROOT = `boffmedia/tools/${TOOL}`

if (!fs.existsSync(TOOL_DIR) || !fs.statSync(TOOL_DIR).isDirectory()) {
  console.error(`[pack-tool-assets] built tree not found: ${TOOL_DIR} — run the build step first`)
  process.exit(1)
}

function relPosix(p) {
  return p.split(path.sep).join("/")
}

// ── walk the built tree ──────────────────────────────────────────────────
// Excludes the gitignored build stamp: it is build-local bookkeeping, never
// published content.
//
// Also excludes anything the tree's own manifest.json lists under `excluded`.
// That field is how a build script says "this file is on disk but is not part
// of the tool" — battlesim's 158 MB unreferenced background GIF is the reason
// it exists. `public/` is gitignored and hand-synced, so the file cannot simply
// be deleted from the repo; without this the packer happily shipped a 191 MB
// archive of a 42 MB tool.

function walkTree(dir, excluded = new Set()) {
  const rels = []
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (entry.name === ".build-stamp.toon") continue
      const rel = relPosix(path.relative(dir, full))
      if (excluded.has(rel)) continue
      rels.push(rel)
    }
  }
  return rels
}

function sha256File(fullPath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256")
    const stream = fs.createReadStream(fullPath)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("error", reject)
    stream.on("end", () => resolve(hash.digest("hex")))
  })
}

function sha256Async(fullPath) {
  // sha256File already streams; this wrapper name kept for symmetry below.
  return sha256File(fullPath)
}

function createLimiter(concurrency) {
  let active = 0
  const queue = []
  function next() {
    if (active >= concurrency || queue.length === 0) return
    active++
    const { fn, resolve, reject } = queue.shift()
    fn().then(
      (v) => {
        active--
        resolve(v)
        next()
      },
      (e) => {
        active--
        reject(e)
        next()
      },
    )
  }
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject })
      next()
    })
}

// ── TOON writer for pack.toon ─────────────────────────────────────────────
// No timestamp inside pack.toon on purpose: everything in it must be a pure
// function of tree CONTENT so a rebuild of identical content is byte-for-
// byte identical (see FIXED_MTIME above).

function buildPackToon(tool, version, totalBytes, files) {
  const rows = files.map((f) => `  ${f.path},${f.size},${f.sha256}`).join("\n")
  return (
    `pack: ${tool}\n` +
    `version: ${version}\n` +
    `bytes: ${totalBytes}\n` +
    `files[${files.length}]{path,size,sha256}:\n` +
    (rows ? rows + "\n" : "")
  )
}

async function main() {
  const manifestPath = path.join(TOOL_DIR, "manifest.json")
  if (!fs.existsSync(manifestPath)) {
    console.error(`[pack-tool-assets] ${manifestPath} not found — the built tree has no manifest.json`)
    process.exit(1)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  // manifest.json's `version` is itself content-addressed as of K19 (see
  // build-mewgenics-assets.mjs) — it already moves whenever the emitted tree
  // changes, so the pack version IS the manifest version, verbatim. No
  // second content-hash suffix here: two suffixes for the same fact (this
  // tree's content changed) is the double-versioning bug K19 fixed, and a
  // hand-computed one is a constant someone has to remember to keep in sync.
  const version = manifest.version
  if (!version || typeof version !== "string") {
    console.error(`[pack-tool-assets] manifest.json has no string "version" field`)
    process.exit(1)
  }

  const excluded = new Set(
    Array.isArray(manifest.excluded) ? manifest.excluded.filter((p) => typeof p === "string") : [],
  )
  const relPaths = walkTree(TOOL_DIR, excluded)
  if (relPaths.length === 0) {
    console.error(`[pack-tool-assets] ${TOOL_DIR} is empty — refusing to pack nothing`)
    process.exit(1)
  }
  relPaths.sort() // deterministic entry order

  const excludedNote = excluded.size ? ` excluded=${excluded.size}` : ""
  console.log(`[pack-tool-assets] tool=${TOOL} dataset=${version} files=${relPaths.length}${excludedNote} out=${path.relative(REPO, OUT_DIR)}`)

  // Hash every file (streamed, bounded concurrency — the tree is never
  // buffered as a whole).
  const limiter = createLimiter(16)
  const files = await Promise.all(
    relPaths.map((rel) =>
      limiter(async () => {
        const full = path.join(TOOL_DIR, rel)
        const size = fs.statSync(full).size
        const sha256 = await sha256Async(full)
        return { rel, full, path: `${ENTRY_ROOT}/${rel}`, size, sha256 }
      }),
    ),
  )
  // Re-sort by rel to guarantee entry order is unaffected by hashing
  // concurrency finishing out of order.
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))

  console.log(`[pack-tool-assets] pack version=${version}`)

  const totalBytes = files.reduce((s, f) => s + f.size, 0)
  const packToon = buildPackToon(TOOL, version, totalBytes, files)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const finalZipPath = path.join(OUT_DIR, `${TOOL}-${version}.zip`)
  const tmpZipPath = `${finalZipPath}.tmp`

  const zipfile = new ZipFile()
  for (const f of files) {
    zipfile.addFile(f.full, f.path, { mtime: FIXED_MTIME, mode: FIXED_MODE, compress: true })
  }
  zipfile.addBuffer(Buffer.from(packToon, "utf8"), "pack.toon", { mtime: FIXED_MTIME, mode: FIXED_MODE, compress: true })
  zipfile.end()

  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(tmpZipPath)
    zipfile.outputStream.pipe(out)
    out.on("finish", resolve)
    out.on("error", reject)
    zipfile.outputStream.on("error", reject)
  })
  fs.renameSync(tmpZipPath, finalZipPath)

  const zipBytes = fs.statSync(finalZipPath).size
  const zipSha256 = await sha256Async(finalZipPath)

  console.log(
    `[pack-tool-assets] wrote ${path.relative(REPO, finalZipPath)} — ${(zipBytes / 1024 / 1024).toFixed(2)} MB, ` +
      `${files.length} entries, sha256=${zipSha256}`,
  )

  // index.json — rewritten LAST, replacing only this tool's entry.
  let index = { packs: [] }
  if (fs.existsSync(INDEX_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"))
      if (parsed && Array.isArray(parsed.packs)) index = parsed
    } catch (err) {
      console.error(`[pack-tool-assets] existing index.json is not valid JSON, rebuilding it: ${err.message}`)
    }
  }
  index.packs = index.packs.filter((p) => p.tool !== TOOL)
  index.packs.push({
    tool: TOOL,
    version,
    url: `/boffmedia/tools/packs/${TOOL}-${version}.zip`,
    bytes: zipBytes,
    sha256: zipSha256,
    builtAt: new Date().toISOString(),
  })
  index.packs.sort((a, b) => (a.tool < b.tool ? -1 : a.tool > b.tool ? 1 : 0))
  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(index, null, 1)}\n`, "utf8")

  console.log(`[pack-tool-assets] index.json updated: ${index.packs.length} pack(s) — ${path.relative(REPO, INDEX_PATH)}`)

  // Drop this tool's superseded zips, AFTER index.json no longer names them.
  // The version is content-addressed, so every rebuild that changes a byte
  // writes a new 54 MB file next to the old one; without this the packs
  // directory grows by a whole pack per build, and sync-public.sh would
  // faithfully copy the whole pile to the server.
  const keep = path.basename(finalZipPath)
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (!name.startsWith(`${TOOL}-`) || !name.endsWith(".zip") || name === keep) continue
    fs.unlinkSync(path.join(OUT_DIR, name))
    console.log(`[pack-tool-assets] removed superseded pack ${name}`)
  }
  console.log(`\nbytes=${zipBytes} sha256=${zipSha256}`)
}

main().catch((err) => {
  console.error(`[pack-tool-assets] fatal: ${err instanceof Error ? err.stack : err}`)
  process.exit(1)
})
