/**
 * build-worker.mjs — one worker_threads job runner for build-mewgenics-assets.mjs.
 *
 * svgo's `optimize()` is synchronous JS, so calling it ~11k times on the main
 * thread would serialise all of that CPU work behind the event loop. sharp's
 * calls are async (libvips does the work off-thread already), but routing
 * both kinds of job through the same worker pool keeps the main thread free
 * to walk the tree, dispatch jobs and stream progress instead of blocking on
 * either.
 */
import { parentPort } from "node:worker_threads"
import fs from "node:fs"
import path from "node:path"
import sharp from "sharp"
import { optimize } from "svgo"
import { genericConfig, catpartsConfig } from "./svgo-profiles.mjs"

if (!parentPort) throw new Error("build-worker.mjs must be run as a worker_threads Worker")

parentPort.on("message", async (job) => {
  try {
    if (job.type === "raster") {
      parentPort.postMessage(await rasterize(job))
    } else if (job.type === "svgo") {
      parentPort.postMessage(svgoOptimize(job))
    } else {
      throw new Error(`unknown job type: ${job.type}`)
    }
  } catch (err) {
    parentPort.postMessage({
      ok: false,
      relPath: job.relPath,
      error: err instanceof Error ? err.message : String(err),
    })
  }
})

/** Rasterise one data-URI-carrying SVG to .webp, longest side == job.px. */
async function rasterize(job) {
  const svg = fs.readFileSync(job.inPath)
  const probe = sharp(svg)
  const meta = await probe.metadata()
  const iw = meta.width || job.px
  const ih = meta.height || job.px
  const longest = Math.max(iw, ih)
  const scale = job.px / longest
  const outW = Math.max(1, Math.round(iw * scale))
  const outH = Math.max(1, Math.round(ih * scale))
  // Render at a density that gives the target pixel size directly (default
  // density is 72, which maps 1 SVG unit to 1 px) — the embedded rasters
  // inside these icons are up to 630px in a ~115px viewBox, so rendering at
  // a higher density before the final resize keeps that detail instead of
  // sampling it down twice.
  const density = Math.max(72, Math.round(72 * (job.px / longest)))
  fs.mkdirSync(path.dirname(job.outPath), { recursive: true })
  await sharp(svg, { density })
    .resize(outW, outH, { fit: "inside", withoutEnlargement: false })
    .webp({ quality: 85 })
    .toFile(job.outPath)
  return {
    ok: true,
    kind: "raster",
    relPath: job.relPath,
    bytesIn: svg.length,
    bytesOut: fs.statSync(job.outPath).size,
  }
}

/** Run one of the two svgo profiles and write the result. */
function svgoOptimize(job) {
  const src = fs.readFileSync(job.inPath, "utf8")
  const config = job.profile === "catparts" ? catpartsConfig() : genericConfig()
  const result = optimize(src, { ...config, path: job.inPath })
  fs.mkdirSync(path.dirname(job.outPath), { recursive: true })
  fs.writeFileSync(job.outPath, result.data, "utf8")
  return {
    ok: true,
    kind: "svgo",
    relPath: job.relPath,
    bytesIn: Buffer.byteLength(src),
    bytesOut: Buffer.byteLength(result.data),
  }
}
