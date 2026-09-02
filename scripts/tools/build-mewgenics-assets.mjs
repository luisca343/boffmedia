#!/usr/bin/env node
/**
 * build-mewgenics-assets.mjs — turns the raw FFDec extractor tree for
 * Mewgenics into the small, publishable tree the website and the desktop
 * pack manager actually serve.
 *
 * Every SVG that carries an embedded `<image href="data:image/...;base64,…">`
 * payload (icons up to 630px rasters baked into ~115px viewBoxes, a handful
 * of heavy UI backgrounds, a couple of portraits and sprites) is rasterised
 * to `.webp` at `--icon-px` on the longest side via sharp — its SVG input
 * goes through libvips/librsvg, which is what actually renders those data
 * URIs. Everything else that stays vector goes through svgo. `assets/catparts`
 * is a hard exclusion from rasterisation regardless of content: MewCat.tsx
 * regex-parses its viewBox and first transform and relies on
 * `<use xlink:href="#shapeN">`, so it only ever gets the conservative catparts
 * svgo profile (see svgo-profiles.mjs).
 *
 * Renaming a file (.svg -> .webp) breaks the seven art maps that point at it
 * by path, so after the tree is built every map is rewritten in place by
 * rewrite-art-maps.mjs from the set of files actually converted.
 *
 * Usage:
 *   node scripts/tools/build-mewgenics-assets.mjs [options]
 *
 * Options:
 *   --src <dir>       raw extractor tree (default: laboon/tool-sources/mewgenics)
 *   --out <dir>       built tree (default: public/boffmedia/tools/mewgenics)
 *   --icon-px <n>     longest-side px for rasterised icons (default: 256)
 *   --clean           ignore the build stamp and rebuild everything
 *   --keep-anim       also copy assets/sprites_anim/ (dropped by default)
 *   --dry-run         report what would happen; write nothing
 *
 * Idempotent: a second run with unchanged inputs converts nothing (mtime+size
 * stamped per file in <out>/.build-stamp.toon). Exits non-zero if any emitted
 * SVG still contains a data: image, or if a catparts file was rasterised.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import crypto from "node:crypto"
import { Worker } from "node:worker_threads"
import { fileURLToPath } from "node:url"

import { rewriteArtMapJson, ART_MAP_FILES } from "./rewrite-art-maps.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(here, "..", "..")

// ── args ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { src: null, out: null, iconPx: 256, clean: false, keepAnim: false, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--src") args.src = argv[++i]
    else if (a === "--out") args.out = argv[++i]
    else if (a === "--icon-px") args.iconPx = Number(argv[++i])
    else if (a === "--clean") args.clean = true
    else if (a === "--keep-anim") args.keepAnim = true
    else if (a === "--dry-run") args.dryRun = true
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node scripts/tools/build-mewgenics-assets.mjs [--src dir] [--out dir] " +
          "[--icon-px 256] [--clean] [--keep-anim] [--dry-run]",
      )
      process.exit(0)
    } else {
      console.error(`[build-mewgenics-assets] unknown argument: ${a}`)
      process.exit(1)
    }
  }
  return args
}

const cli = parseArgs(process.argv.slice(2))
const SRC = path.resolve(cli.src ? path.resolve(process.cwd(), cli.src) : path.join(REPO, "laboon/tool-sources/mewgenics"))
const OUT = path.resolve(cli.out ? path.resolve(process.cwd(), cli.out) : path.join(REPO, "public/boffmedia/tools/mewgenics"))
const ICON_PX = cli.iconPx
const CLEAN = cli.clean
const KEEP_ANIM = cli.keepAnim
const DRY_RUN = cli.dryRun
const STAMP_PATH = path.join(OUT, ".build-stamp.toon")

if (!Number.isFinite(ICON_PX) || ICON_PX <= 0) {
  console.error(`[build-mewgenics-assets] --icon-px must be a positive number, got ${cli.iconPx}`)
  process.exit(1)
}
if (path.resolve(SRC).toLowerCase() === path.resolve(OUT).toLowerCase()) {
  console.error(`[build-mewgenics-assets] --src and --out resolve to the same directory (${SRC}) — refusing to run`)
  process.exit(1)
}
if (!fs.existsSync(SRC)) {
  console.error(`[build-mewgenics-assets] source tree not found: ${SRC}`)
  process.exit(1)
}

console.log(`[build-mewgenics-assets] src=${path.relative(REPO, SRC)} out=${path.relative(REPO, OUT)} icon-px=${ICON_PX}${CLEAN ? " --clean" : ""}${KEEP_ANIM ? " --keep-anim" : ""}${DRY_RUN ? " --dry-run" : ""}`)

// ── tree walk + classification ───────────────────────────────────────────

const CATPARTS_PREFIX = "assets/catparts/"
const SPRITES_ANIM_PREFIX = "assets/sprites_anim/"
const UI_SFX_PREFIX = "assets/ui/sfx/"

function relPosix(p) {
  return p.split(path.sep).join("/")
}

function topCategory(rel) {
  const m = /^assets\/([^/]+)\//.exec(rel)
  return m ? m[1] : "other"
}

function fileHasDataImage(full) {
  const text = fs.readFileSync(full, "utf8")
  return /data:image\//i.test(text)
}

/** One row per non-dropped input: { relPath, size, mtimeMs, category, action } */
function walkSrcAssets() {
  const decisions = []
  const assetsRoot = path.join(SRC, "assets")
  const stack = [assetsRoot]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      const rel = relPosix(path.relative(SRC, full))
      const st = fs.statSync(full)
      const base = { relPath: rel, size: st.size, mtimeMs: st.mtimeMs, category: topCategory(rel) }

      if (rel.startsWith(UI_SFX_PREFIX)) {
        decisions.push({ ...base, action: "drop", reason: "ui/sfx dropped (C6, sounds removed)" })
        continue
      }
      if (rel.startsWith(SPRITES_ANIM_PREFIX)) {
        decisions.push(
          KEEP_ANIM
            ? { ...base, action: "copy" }
            : { ...base, action: "drop", reason: "sprites_anim dropped by default (--keep-anim to include)" },
        )
        continue
      }
      const ext = path.extname(rel).toLowerCase()
      if (rel.startsWith(CATPARTS_PREFIX)) {
        // Hard exclusion (D-03): never rasterised regardless of content.
        decisions.push({ ...base, action: ext === ".svg" ? "svgo-catparts" : "copy" })
        continue
      }
      if (ext === ".svg") {
        decisions.push({ ...base, action: fileHasDataImage(full) ? "raster" : "svgo-generic" })
        continue
      }
      if (ext === ".png" || ext === ".webp") {
        decisions.push({ ...base, action: "copy" })
        continue
      }
      // Anything unexpected under assets/ is still published, verbatim.
      decisions.push({ ...base, action: "copy" })
    }
  }
  return decisions
}

function walkSrcRoot() {
  const decisions = []
  for (const name of fs.readdirSync(SRC)) {
    const full = path.join(SRC, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) continue
    if (name === "manifest.json") continue // handled separately: gains a build block
    if (name === "FURNITURE_MAPPING_ANALYSIS.txt") {
      decisions.push({ relPath: name, size: st.size, mtimeMs: st.mtimeMs, category: "json", action: "drop", reason: "internal notes, not published" })
      continue
    }
    if (path.extname(name).toLowerCase() === ".json") {
      decisions.push({ relPath: name, size: st.size, mtimeMs: st.mtimeMs, category: "json", action: "copy" })
    }
  }
  const stringsDir = path.join(SRC, "strings")
  if (fs.existsSync(stringsDir)) {
    for (const name of fs.readdirSync(stringsDir)) {
      if (!name.toLowerCase().endsWith(".json")) continue
      const st = fs.statSync(path.join(stringsDir, name))
      decisions.push({ relPath: `strings/${name}`, size: st.size, mtimeMs: st.mtimeMs, category: "json", action: "copy" })
    }
  }
  return decisions
}

// ── build stamp (out/.build-stamp.toon) ──────────────────────────────────

function readStamp() {
  const map = new Map()
  if (CLEAN || !fs.existsSync(STAMP_PATH)) return map
  const text = fs.readFileSync(STAMP_PATH, "utf8")
  let inRows = false
  for (const line of text.split("\n")) {
    if (/^files\[\d+\]\{path,mtimeMs,size\}:$/.test(line.trim())) {
      inRows = true
      continue
    }
    if (!inRows) continue
    const row = line.trim()
    if (!row) continue
    const idx1 = row.indexOf(",")
    const idx2 = row.lastIndexOf(",")
    if (idx1 === -1 || idx2 === idx1) continue
    const p = row.slice(0, idx1)
    const mtimeMs = Number(row.slice(idx1 + 1, idx2))
    const size = Number(row.slice(idx2 + 1))
    map.set(p, { mtimeMs, size })
  }
  return map
}

function writeStamp(decisions) {
  const included = decisions.filter((d) => d.action !== "drop")
  const rows = included.map((d) => `  ${d.relPath},${d.mtimeMs},${d.size}`).join("\n")
  const content =
    `stamp: mewgenics\n` +
    `builtAt: ${new Date().toISOString()}\n` +
    `iconPx: ${ICON_PX}\n` +
    `files[${included.length}]{path,mtimeMs,size}:\n` +
    (rows ? rows + "\n" : "")
  fs.mkdirSync(path.dirname(STAMP_PATH), { recursive: true })
  fs.writeFileSync(STAMP_PATH, content, "utf8")
}

function stampMatches(stamp, d) {
  const prev = stamp.get(d.relPath)
  return !!prev && prev.size === d.size && prev.mtimeMs === d.mtimeMs
}

// ── worker pool (sharp + svgo run off the main thread) ───────────────────

function createPool(size) {
  const workerUrl = new URL("./build-worker.mjs", import.meta.url)
  const idle = []
  const queue = []
  const all = []

  function pump() {
    while (idle.length && queue.length) {
      const w = idle.pop()
      const { job, resolve, reject } = queue.shift()
      w.__cb = { resolve, reject }
      w.postMessage(job)
    }
  }

  function makeWorker(slot) {
    const w = new Worker(workerUrl)
    w.on("message", (msg) => {
      const cb = w.__cb
      w.__cb = null
      idle.push(w)
      pump()
      cb?.resolve(msg)
    })
    w.on("error", (err) => {
      const cb = w.__cb
      w.__cb = null
      all[slot] = makeWorker(slot)
      idle.push(all[slot])
      pump()
      cb?.reject(err)
    })
    return w
  }

  for (let i = 0; i < size; i++) {
    all.push(makeWorker(i))
    idle.push(all[i])
  }

  return {
    run(job) {
      return new Promise((resolve, reject) => {
        queue.push({ job, resolve, reject })
        pump()
      })
    },
    async close() {
      await Promise.all(all.map((w) => w.terminate()))
    },
  }
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

async function copyFile(inPath, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.copyFileSync(inPath, outPath)
}

// ── size report helpers ───────────────────────────────────────────────────

function dirStats(dir) {
  let files = 0
  let bytes = 0
  if (!fs.existsSync(dir)) return { files, bytes }
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) stack.push(full)
      else {
        files++
        bytes += fs.statSync(full).size
      }
    }
  }
  return { files, bytes }
}

function jsonRootStats(outRoot) {
  let files = 0
  let bytes = 0
  if (!fs.existsSync(outRoot)) return { files, bytes }
  for (const name of fs.readdirSync(outRoot)) {
    if (!name.toLowerCase().endsWith(".json")) continue
    files++
    bytes += fs.statSync(path.join(outRoot, name)).size
  }
  const stringsDir = path.join(outRoot, "strings")
  if (fs.existsSync(stringsDir)) {
    for (const name of fs.readdirSync(stringsDir)) {
      if (!name.toLowerCase().endsWith(".json")) continue
      files++
      bytes += fs.statSync(path.join(stringsDir, name)).size
    }
  }
  return { files, bytes }
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2)

// ── art-path helpers (shared by pruning and the X7 self-check) ────────────
// Extensions an emitted json can plausibly reference as an on-disk asset.
// Started as image-only; K19 adds .opus/.m4a after media_map.json's sfx
// entries turned out to be a real (if currently inert) blind spot — one list
// feeds both the prune pass and the self-check so they can't drift apart
// again the way the check's original .svg/.webp/.png-only scope did.
const ART_PATH_RE = /\.(svg|webp|png|opus|m4a)$/i
const ART_CATEGORY_RE = /(icons|sprites|sprites_anim|portraits|ui|maps|catparts|furniture)\//

function isArtPathRef(value) {
  if (typeof value !== "string") return false
  if (!ART_PATH_RE.test(value)) return false
  if (!ART_CATEGORY_RE.test(value)) return false
  if (value.startsWith("http")) return false
  return true
}

function artRefOnDiskRel(value) {
  const rel = value.replace(/^\/+/, "")
  return rel.startsWith("assets/") ? rel : path.posix.join("assets", rel)
}

const PRUNED = Symbol("pruned-dropped-art-ref")

/**
 * Walks a parsed json value and removes any string leaf that references an
 * asset the build DROPPED (e.g. assets/ui/sfx/*, sounds are hard-disabled —
 * see useMewSounds.ts MEW_SOUND_ENABLED). A container (object/array) that
 * loses every entry to pruning is itself pruned from its parent, so
 * `media_map.json`'s whole `sfx` key disappears rather than surviving as
 * `{}`. Returns { value, pruned } — `pruned` is the sentinel when the WHOLE
 * input was pruned away.
 */
function pruneDroppedRefs(value, droppedSet, stats) {
  if (isArtPathRef(value)) {
    if (droppedSet.has(artRefOnDiskRel(value))) {
      stats.pruned++
      return PRUNED
    }
    return value
  }
  if (Array.isArray(value)) {
    const next = value.map((v) => pruneDroppedRefs(v, droppedSet, stats)).filter((v) => v !== PRUNED)
    return next.length === 0 && value.length > 0 ? PRUNED : next
  }
  if (value && typeof value === "object") {
    const out = {}
    let removedAny = false
    for (const [k, v] of Object.entries(value)) {
      const next = pruneDroppedRefs(v, droppedSet, stats)
      if (next === PRUNED) {
        removedAny = true
        continue
      }
      out[k] = next
    }
    if (removedAny && Object.keys(out).length === 0 && Object.keys(value).length > 0) return PRUNED
    return out
  }
  return value
}

// ── self-checks (X7) ──────────────────────────────────────────────────────

function findSvgsWithDataImage(outRoot) {
  const offenders = []
  const stack = [outRoot]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        stack.push(full)
        continue
      }
      if (!e.name.toLowerCase().endsWith(".svg")) continue
      if (/data:image\//i.test(fs.readFileSync(full, "utf8"))) offenders.push(path.relative(outRoot, full))
    }
  }
  return offenders
}

function findRasterisedCatparts(outRoot) {
  const dir = path.join(outRoot, "assets", "catparts")
  const offenders = []
  if (!fs.existsSync(dir)) return offenders
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) stack.push(full)
      else if (e.name.toLowerCase().endsWith(".webp")) offenders.push(path.relative(outRoot, full))
    }
  }
  return offenders
}

// ── main ──────────────────────────────────────────────────────────────────

async function main() {
  const decisions = [...walkSrcRoot(), ...walkSrcAssets()]
  const stamp = readStamp()

  if (CLEAN && !DRY_RUN) {
    fs.rmSync(OUT, { recursive: true, force: true })
  }
  if (!DRY_RUN) fs.mkdirSync(OUT, { recursive: true })

  const workerCount = Math.max(2, Math.min(os.cpus().length, 16))
  const pool = DRY_RUN ? null : createPool(workerCount)
  const copyLimiter = createLimiter(32)

  let processed = 0
  let skipped = 0
  const errors = []
  const jobs = []

  for (const d of decisions) {
    if (d.action === "drop") continue
    const outRel = d.action === "raster" ? d.relPath.replace(/\.svg$/i, ".webp") : d.relPath
    const outPath = path.join(OUT, outRel)
    const inPath = path.join(SRC, d.relPath)

    if (!CLEAN && stampMatches(stamp, d) && fs.existsSync(outPath)) {
      skipped++
      continue
    }
    processed++
    if (DRY_RUN) continue

    if (d.action === "copy") {
      jobs.push(copyLimiter(() => copyFile(inPath, outPath)))
    } else {
      const type = d.action === "raster" ? "raster" : "svgo"
      const profile = d.action === "svgo-catparts" ? "catparts" : "generic"
      jobs.push(
        pool.run({ type, profile, inPath, outPath, relPath: d.relPath, px: ICON_PX }).then((res) => {
          if (!res.ok) errors.push(`${d.relPath}: ${res.error}`)
        }),
      )
    }
  }

  await Promise.all(jobs)
  if (pool) await pool.close()

  if (errors.length) {
    console.error(`[build-mewgenics-assets] ${errors.length} file(s) failed:`)
    for (const e of errors.slice(0, 20)) console.error(`  ${e}`)
    if (errors.length > 20) console.error(`  … and ${errors.length - 20} more`)
    process.exit(1)
  }

  console.log(`[build-mewgenics-assets] processed ${processed} file(s), skipped ${skipped} unchanged`)

  if (!DRY_RUN) writeStamp(decisions)

  // Art maps: rewrite every path that was actually converted to .webp. Built
  // from ALL raster decisions (not just this run's), so the maps stay correct
  // even when the raster work itself was skipped as unchanged.
  const renameMap = new Map(
    decisions.filter((d) => d.action === "raster").map((d) => [d.relPath, d.relPath.replace(/\.svg$/i, ".webp")]),
  )
  // EVERY root .json is rewritten, not only the seven art maps. Records carry
  // their own art path (`rec.icon`, `rec.sprite`) and mew-art.ts prefers that
  // field OVER the map lookup, so rewriting maps alone left 829 of 1134 items
  // pointing at an .svg the build had just replaced with .webp — the codex
  // rendered its glyph fallback for most of the Items tab while every map
  // resolved perfectly. A dataset file with no art paths simply reports 0.
  const REWRITE_FILES = fs
    .readdirSync(SRC)
    .filter((n) => n.toLowerCase().endsWith(".json") && n !== "manifest.json")
    .sort()
  // Assets the build actually dropped this classification pass (ui/sfx
  // always; sprites_anim unless --keep-anim). Any json still pointing at one
  // of these is a dangling reference to a file that was never emitted —
  // media_map.json's sfx entries are the known case (N3), prune generically
  // so the next dropped category doesn't need its own bespoke fix.
  const droppedSet = new Set(decisions.filter((d) => d.action === "drop").map((d) => d.relPath))
  let totalMapChanges = 0
  let totalPruned = 0
  for (const name of REWRITE_FILES) {
    const srcPath = path.join(SRC, name)
    if (!fs.existsSync(srcPath)) continue
    const raw = fs.readFileSync(srcPath, "utf8")
    const pruneStats = { pruned: 0 }
    const parsed = JSON.parse(raw)
    const prunedValue = pruneDroppedRefs(parsed, droppedSet, pruneStats)
    const prunedJson = `${JSON.stringify(prunedValue === PRUNED ? {} : prunedValue, null, 1)}\n`
    const first = rewriteArtMapJson(prunedJson, renameMap)
    // X8 self-check: rewriting an already-rewritten map must be a no-op.
    const second = rewriteArtMapJson(first.json, renameMap)
    if (second.changes !== 0) {
      console.error(
        `[build-mewgenics-assets] X8 self-check failed: re-rewriting ${name} changed ${second.changes} more value(s) — rewrite-art-maps.mjs is not idempotent`,
      )
      process.exit(1)
    }
    // Only rewrite files that actually changed: re-serialising costs ~2 MB of
    // whitespace across the 36 dataset files (the sources are minified), and
    // that whitespace would ride into the pack and over the wire for nothing.
    if (!DRY_RUN && (first.changes > 0 || pruneStats.pruned > 0)) fs.writeFileSync(path.join(OUT, name), first.json, "utf8")
    totalMapChanges += first.changes
    totalPruned += pruneStats.pruned
    if (first.changes > 0 || pruneStats.pruned > 0 || ART_MAP_FILES.includes(name)) {
      console.log(
        `[build-mewgenics-assets] ${name}: ${first.changes} path(s) rewritten to .webp, ${pruneStats.pruned} dropped-asset reference(s) pruned`,
      )
    }
  }
  console.log(
    `[build-mewgenics-assets] art paths: ${renameMap.size} file(s) renamed, ${totalMapChanges} reference(s) updated, ${totalPruned} dropped-asset reference(s) pruned across ${REWRITE_FILES.length} dataset json file(s) (${ART_MAP_FILES.length} of them art maps)`,
  )

  // manifest.json: always regenerated (builtAt changes every run). `version`
  // is now CONTENT-ADDRESSED (K19) rather than copied verbatim from the
  // source manifest: dataset-cache.ts (both hosts) keys its persisted
  // snapshot on this exact string, and mew-store-state.ts's `?v=` cache-bust
  // rides on it too, so anything that changes what actually got emitted —
  // not just the source dataset — must move this string, or a returning
  // client keeps hydrating stale art paths forever (the K17/K19 regression:
  // rasterising 1292 icons to .webp changed every affected record's art path
  // while the source `version` stayed put). The original source manifest's
  // `version` is kept verbatim as `build.sourceVersion` so nothing is lost.
  //
  // Computed HERE, after the art-map rewrite/prune pass above (not right
  // after the raster/svgo/copy loop): those dataset json files are rewritten
  // on disk by that pass on every run (deterministically, but unconditionally
  // — see the comment there), so hashing their *out* sizes before that pass
  // ran would fingerprint last run's leftovers instead of what this run is
  // actually publishing, and the version would only settle one run late.
  const srcManifestPath = path.join(SRC, "manifest.json")
  const manifestData = JSON.parse(fs.readFileSync(srcManifestPath, "utf8"))
  const sourceVersion = manifestData.version
  const included = decisions.filter((d) => d.action !== "drop").slice().sort((a, b) => a.relPath.localeCompare(b.relPath))
  const hash = crypto.createHash("sha256")
  for (const d of included) hash.update(`${d.relPath}:${d.size}:${d.mtimeMs}\n`)

  // Emitted-content fingerprint: sorted (post-rename) output relPath + actual
  // output byte size, plus every build parameter that can change output
  // bytes without changing which source files were touched (--icon-px;
  // --keep-anim already shows up in the emitted path list itself). Built
  // from ALL decisions (not just this run's), so it is identical whether the
  // work was just done or was skipped as unchanged — same input, same hash,
  // same version, every time (idempotent by construction, no hand-bumped
  // constant to forget).
  const emittedRels = decisions
    .filter((d) => d.action !== "drop")
    .map((d) => (d.action === "raster" ? d.relPath.replace(/\.svg$/i, ".webp") : d.relPath))
    .sort()
  const versionHash = crypto.createHash("sha256")
  versionHash.update(`iconPx:${ICON_PX}\n`)
  for (const rel of emittedRels) {
    const outPath = path.join(OUT, rel)
    const size = fs.existsSync(outPath) ? fs.statSync(outPath).size : -1 // -1 only in --dry-run, where nothing was written
    versionHash.update(`${rel}:${size}\n`)
  }
  const version = `${sourceVersion}-${versionHash.digest("hex").slice(0, 8)}`
  manifestData.version = version
  manifestData.build = {
    tool: "mewgenics",
    builtAt: new Date().toISOString(),
    srcHash: hash.digest("hex").slice(0, 16),
    sourceVersion,
  }
  if (!DRY_RUN) {
    fs.writeFileSync(path.join(OUT, "manifest.json"), `${JSON.stringify(manifestData, null, 1)}\n`, "utf8")
  }
  console.log(
    `[build-mewgenics-assets] manifest.json: version=${manifestData.version} (sourceVersion=${sourceVersion}) build.srcHash=${manifestData.build.srcHash}`,
  )

  // X7 self-checks
  if (!DRY_RUN) {
    const dataImageOffenders = findSvgsWithDataImage(OUT)
    if (dataImageOffenders.length) {
      console.error(`[build-mewgenics-assets] X7 self-check failed: ${dataImageOffenders.length} emitted SVG(s) still contain a data: image:`)
      for (const f of dataImageOffenders.slice(0, 20)) console.error(`  ${f}`)
      process.exit(1)
    }
    // Dangling-art self-check: every art path referenced by any emitted json
    // must exist on disk. This is the check that would have caught the maps
    // being rewritten while items.json was not; keep it, it is cheap.
    const dangling = []
    const seenRef = new Set()
    const checkRefs = (value) => {
      if (typeof value === "string") {
        if (!isArtPathRef(value) || seenRef.has(value)) return
        seenRef.add(value)
        if (!fs.existsSync(path.join(OUT, artRefOnDiskRel(value)))) dangling.push(value)
      } else if (Array.isArray(value)) value.forEach(checkRefs)
      else if (value && typeof value === "object") Object.values(value).forEach(checkRefs)
    }
    for (const name of fs.readdirSync(OUT)) {
      if (!name.toLowerCase().endsWith(".json")) continue
      try {
        checkRefs(JSON.parse(fs.readFileSync(path.join(OUT, name), "utf8")))
      } catch {
        /* a non-object json is not an art carrier */
      }
    }
    if (dangling.length) {
      console.error(`[build-mewgenics-assets] self-check failed: ${dangling.length} art path(s) referenced by the dataset do not exist in the built tree:`)
      for (const f of dangling.slice(0, 20)) console.error(`  ${f}`)
      process.exit(1)
    }
    const rasterisedCatparts = findRasterisedCatparts(OUT)
    if (rasterisedCatparts.length) {
      console.error(`[build-mewgenics-assets] X7 self-check failed: ${rasterisedCatparts.length} catparts file(s) were rasterised:`)
      for (const f of rasterisedCatparts.slice(0, 20)) console.error(`  ${f}`)
      process.exit(1)
    }
    console.log(`[build-mewgenics-assets] self-checks passed: 0 data:image left in any SVG, 0 catparts rasterised`)
  }

  // ── size report ──────────────────────────────────────────────────────
  const CATEGORY_DIRS = {
    icons: "assets/icons",
    catparts: "assets/catparts",
    sprites: "assets/sprites",
    portraits: "assets/portraits",
    ui: "assets/ui",
    maps: "assets/maps",
    furniture: "assets/furniture",
  }
  if (KEEP_ANIM) CATEGORY_DIRS.sprites_anim = "assets/sprites_anim"

  const rawByCategory = new Map()
  const counts = { raster: 0, "svgo-generic": 0, "svgo-catparts": 0, copy: 0, drop: 0 }
  for (const d of decisions) {
    counts[d.action] = (counts[d.action] ?? 0) + 1
    if (d.action === "drop") continue
    const acc = rawByCategory.get(d.category) ?? { files: 0, bytes: 0 }
    acc.files++
    acc.bytes += d.size
    rawByCategory.set(d.category, acc)
  }

  console.log("\nSize report (category: files, raw MB -> out MB):")
  let totalFiles = 0
  let totalRaw = 0
  let totalOut = 0
  for (const cat of [...Object.keys(CATEGORY_DIRS), "json"]) {
    const raw = rawByCategory.get(cat) ?? { files: 0, bytes: 0 }
    const outStats = DRY_RUN ? null : cat === "json" ? jsonRootStats(OUT) : dirStats(path.join(OUT, CATEGORY_DIRS[cat] ?? ""))
    totalFiles += raw.files
    totalRaw += raw.bytes
    totalOut += outStats?.bytes ?? 0
    console.log(
      `  ${cat.padEnd(12)} files=${String(raw.files).padStart(6)}  raw=${mb(raw.bytes).padStart(8)} MB  out=${outStats ? `${mb(outStats.bytes).padStart(8)} MB` : "n/a (dry-run)"}`,
    )
  }
  console.log(
    `  ${"total".padEnd(12)} files=${String(totalFiles).padStart(6)}  raw=${mb(totalRaw).padStart(8)} MB  out=${DRY_RUN ? "n/a (dry-run)" : `${mb(totalOut).padStart(8)} MB`}`,
  )

  const dropped = decisions.filter((d) => d.action === "drop")
  const droppedBytes = dropped.reduce((s, d) => s + d.size, 0)
  console.log(`\nrasterised=${counts.raster} svgo=${(counts["svgo-generic"] ?? 0) + (counts["svgo-catparts"] ?? 0)} copied=${counts.copy} dropped=${dropped.length} (${mb(droppedBytes)} MB)`)
  if (DRY_RUN) console.log("(dry run — nothing was written)")
}

main().catch((err) => {
  console.error(`[build-mewgenics-assets] fatal: ${err instanceof Error ? err.stack : err}`)
  process.exit(1)
})
