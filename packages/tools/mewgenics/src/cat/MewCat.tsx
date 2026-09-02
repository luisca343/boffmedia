"use client"

import React, { useEffect, useRef, useState } from "react"
import type {
  CatCompositorProps,
  CatEquipment,
  CatParts,
  CatPartsPlacements,
  PlacementEntry,
  RigMatrix,
  SpriteTimeline,
} from "./types"
import { loadCatPartsPlacements, mewCatSvgUrl, mewPaletteUrl } from "./data-loader"

const IDENTITY: RigMatrix = { sx: 1, sy: 1, r0: 0, r1: 0, tx: 0, ty: 0 }

/** Worn overlays — drawn on the cat, but excluded from the auto-fit framing. */
const EQUIPMENT_CLIPS = new Set([
  "HeadItemF", "HeadItemB", "FaceItemF", "FaceItemB", "NeckItemF", "NeckItemB",
])

// m1 ∘ m2 (apply m2 first, then m1) in canvas (a,b,c,d,e,f) semantics
function mul(m1: RigMatrix, m2: RigMatrix): RigMatrix {
  return {
    sx: m1.sx * m2.sx + m1.r1 * m2.r0,
    r0: m1.r0 * m2.sx + m1.sy * m2.r0,
    r1: m1.sx * m2.r1 + m1.r1 * m2.sy,
    sy: m1.r0 * m2.r1 + m1.sy * m2.sy,
    tx: m1.sx * m2.tx + m1.r1 * m2.ty + m1.tx,
    ty: m1.r0 * m2.tx + m1.sy * m2.ty + m1.ty,
  }
}

function applyPt(m: RigMatrix, x: number, y: number): [number, number] {
  return [m.sx * x + m.r1 * y + m.tx, m.r0 * x + m.sy * y + m.ty]
}

function pick(v: number | { [k: string]: number } | undefined, key: string): number | undefined {
  if (v === undefined) return undefined
  return typeof v === "number" ? v : v[key]
}

/** Matrix of a named child on one frame of a rig sprite (e.g. CatBody's 'tex'). */
function namedInstance(
  sprite: SpriteTimeline | undefined,
  frame: number | undefined,
  name: string,
): RigMatrix | undefined {
  const entries = sprite?.frames?.[(frame ?? 1) - 1]
  if (!entries) return undefined
  for (const e of entries) if (e.name === name) return e.matrix ?? IDENTITY
  return undefined
}

interface DrawItem {
  clip: string // PascalCase clip name, keys part_bounds
  frame: number
  matrix: RigMatrix // clip-local → cat space
}

// Asset directories are the lowercase clip names
function clipDir(clip: string): string {
  return clip.toLowerCase()
}

/**
 * Build the z-ordered draw list from the rig:
 * master sprite_11009 (tail → back legs → body → head group → front legs),
 * head internals from CatHeadPlacements per-head-frame anchors (fallback:
 * static sprite_11008 layout). Equipment B layers go behind the head,
 * F layers in front of the face.
 */
function buildDrawList(
  placements: CatPartsPlacements,
  parts: CatParts,
  pose: NonNullable<CatCompositorProps["pose"]>,
  equipment: CatEquipment | undefined
): DrawItem[] {
  const master = placements.sprites["sprite_11009"]
  const headGroup = placements.sprites["sprite_11008"]
  const chp = placements.sprites["CatHeadPlacements"]
  if (!master?.frames?.length) return []

  const charName = (id: number | undefined): string =>
    id === undefined ? "" : placements._charnames[String(id)] ?? ""

  const eyeClipL = pose.eyes === "closed" ? "CatEyeClosed" : "CatEye"
  const eyeClipR = pose.eyes === "closed" ? "CatEyeClosed_Right" : "CatEye_Right"
  const mouthClip =
    pose.mouth === "open" ? "CatMouthOpen" : pose.mouth === "smile" ? "CatMouthSmile" : "CatMouth"

  const legFrames = [
    pick(parts.legs, "leg1") ?? 1,
    pick(parts.legs, "leg2") ?? pick(parts.legs, "leg1") ?? 1,
    pick(parts.arms, "arm1") ?? pick(parts.legs, "leg1") ?? 1,
    pick(parts.arms, "arm2") ?? pick(parts.arms, "arm1") ?? pick(parts.legs, "leg1") ?? 1,
  ]
  let legIdx = 0

  const items: DrawItem[] = []
  const masterEntries = [...master.frames[0]].sort((a, b) => a.depth - b.depth)

  for (const entry of masterEntries) {
    const name = charName(entry.char)
    const m = entry.matrix ?? IDENTITY
    if (name === "CatTail") {
      if (parts.tail) items.push({ clip: "CatTail", frame: parts.tail, matrix: m })
    } else if (name === "CatLeg") {
      const frame = legFrames[Math.min(legIdx++, 3)]
      if (frame) items.push({ clip: "CatLeg", frame, matrix: m })
    } else if (name === "CatBody") {
      if (parts.body) items.push({ clip: "CatBody", frame: parts.body, matrix: m })
      // Fur pattern over the body, positioned by the body frame's own 'tex'
      // instance. Without this the texture part was picked but never drawn.
      const texLocal = namedInstance(placements.sprites["CatBody"], parts.body, "tex")
      if (parts.texture && texLocal) {
        items.push({ clip: "CatTexture", frame: parts.texture, matrix: mul(m, texLocal) })
      }
    } else if (name === "sprite_11008") {
      items.push(...buildHead(m))
    }
  }
  return items

  function buildHead(headGroupMatrix: RigMatrix): DrawItem[] {
    const out: DrawItem[] = []
    const headFrame = parts.head ?? 1
    const anchorEntries: PlacementEntry[] | undefined = chp?.frames?.[headFrame - 1]
    const anchors = new Map<string, RigMatrix>()
    if (anchorEntries) {
      for (const e of anchorEntries) if (e.name) anchors.set(e.name, e.matrix ?? IDENTITY)
    }

    // CatHeadPlacements entries are PLACEHOLDER MARKERS, not transforms: the
    // eye marker is a 10x10 square, the mouth marker a 2x10 vertical bar, and
    // their scales exist to size those boxes in the authoring file (the mouth
    // anchor reads sx 5.19 / sy 0.31, which flattened the mouth into a band).
    // Only the marker's POSITION is meaningful. So: take the position from the
    // per-head-frame anchor, and the scale/mirror from the static head group,
    // which carries the real ~1.0 matrices with mirrored pairs.
    const at = (name: string): RigMatrix | undefined => anchors.get(name)
    const place = (anchor: string, base: RigMatrix | undefined): RigMatrix | undefined => {
      const a = at(anchor)
      if (!base) return a ? { ...IDENTITY, tx: a.tx, ty: a.ty } : undefined
      if (!a) return base
      // Mirroring lives in the sign of either source; magnitude comes from base.
      const flip = a.sx < 0 !== base.sx < 0 ? -1 : 1
      return { ...base, sx: base.sx * flip, tx: a.tx, ty: a.ty }
    }
    const push = (clip: string, frame: number | undefined, local: RigMatrix | undefined) => {
      if (!frame || !local) return
      out.push({ clip, frame, matrix: mul(headGroupMatrix, local) })
    }

    // Static fallback layout from sprite_11008 (per-symbol matrices, mirrored pairs)
    const staticFor = (clip: string): RigMatrix[] => {
      const res: RigMatrix[] = []
      for (const e of headGroup?.frames?.[0] ?? []) {
        if (charName(e.char) === clip) res.push(e.matrix ?? IDENTITY)
      }
      return res
    }
    const staticEars = staticFor("CatEar")
    const staticEyes = staticFor("CatEye")
    const staticBrows = staticFor("CatEyebrow")
    const staticMouth = staticFor("CatMouth")

    // Equipment anchors have no static counterpart, so they contribute
    // position only, at natural scale.
    const equipAt = (name: string): RigMatrix => {
      const a = at(name)
      return a ? { ...IDENTITY, tx: a.tx, ty: a.ty } : IDENTITY
    }

    // Behind the head: equipment back layers, then ears, then head
    if (equipment?.head) push("HeadItemB", equipment.head, equipAt("ahead"))
    if (equipment?.neck) push("NeckItemB", equipment.neck, equipAt("aneck"))
    push("CatEar", pick(parts.ears, "left"), place("lear", staticEars[0]))
    push("CatEar", pick(parts.ears, "right") ?? pick(parts.ears, "left"), place("rear", staticEars[1]))
    push("CatHead", headFrame, IDENTITY)
    // Fur pattern over the head, at this head frame's own 'tex' anchor.
    if (parts.texture) push("CatTexture", parts.texture, at("tex") ?? IDENTITY)

    // Face
    push(eyeClipL, pick(parts.eyes, "left"), place("leye", staticEyes[0]))
    push(eyeClipR, pick(parts.eyes, "right") ?? pick(parts.eyes, "left"), place("reye", staticEyes[1]))
    push(mouthClip, parts.mouth, place("mouth", staticMouth[0]))
    push("CatEyebrow", pick(parts.eyebrows, "left"), staticBrows[0])
    push(
      "CatEyebrow",
      pick(parts.eyebrows, "right") ?? pick(parts.eyebrows, "left"),
      staticBrows[1]
    )

    // In front: equipment front layers
    if (equipment?.face) push("FaceItemF", equipment.face, equipAt("aface"))
    if (equipment?.neck) push("NeckItemF", equipment.neck, equipAt("aneck"))
    if (equipment?.head) push("HeadItemF", equipment.head, equipAt("ahead"))
    return out
  }
}

// ---- SVG loading -----------------------------------------------------------

interface LoadedPart {
  img: HTMLImageElement
  /** Local-space box [x0,y0,x1,y1] read from the SVG itself, or null. */
  box: [number, number, number, number] | null
}

/** Bounded so a long codex/builder session (thousands of clip×frame combos)
 *  cannot grow this without limit — only the decoded `Image` is kept, never
 *  the blob url it was loaded from (see the revoke below). */
const SVG_CACHE_LIMIT = 256
const svgCache = new Map<string, Promise<LoadedPart | null>>()

/** Map preserves insertion order, so re-inserting on access is a cheap LRU. */
function svgCacheGet(url: string): Promise<LoadedPart | null> | undefined {
  const p = svgCache.get(url)
  if (p) {
    svgCache.delete(url)
    svgCache.set(url, p)
  }
  return p
}

function svgCacheSet(url: string, p: Promise<LoadedPart | null>): void {
  svgCache.set(url, p)
  if (svgCache.size > SVG_CACHE_LIMIT) {
    const oldest = svgCache.keys().next().value
    if (oldest !== undefined) svgCache.delete(oldest)
  }
}

function loadPartImage(clip: string, frame: number): Promise<LoadedPart | null> {
  const url = mewCatSvgUrl(clipDir(clip), frame)
  let p = svgCacheGet(url)
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) return null
        let svg = await res.text()
        // The SVG carries its own placement: the baked viewBox is measured on
        // FFDec's canvas and the root <g translate(tx ty)> is that canvas's
        // origin, so viewBox - translate is the frame's local box. Reading it
        // here keeps rendering correct even when catparts_placements.json is
        // stale or missing the clip — which is how equipment silently vanished.
        let box: [number, number, number, number] | null = null
        const vb = /viewBox="([^"]+)"/.exec(svg)
        // The canvas origin is the FIRST transform in the body — FFDec puts it
        // on a wrapping <g> for some clips and straight on the first <use> for
        // others, as translate(x y) or matrix(a,b,c,d,tx,ty). All four shapes
        // occur, so read the translation out of whichever comes first.
        const tr = /transform="(?:translate\(\s*(-?[\d.eE+-]+)[\s,]+(-?[\d.eE+-]+)\s*\)|matrix\(\s*(?:[-\d.eE+]+[\s,]+){4}(-?[\d.eE+-]+)[\s,]+(-?[\d.eE+-]+)\s*\))/.exec(svg)
        if (vb) {
          const [x, y, w, h] = vb[1].trim().split(/[\s,]+/).map(Number)
          if (tr && [x, y, w, h].every(Number.isFinite) && w > 0 && h > 0) {
            const tx = Number(tr[1] ?? tr[3])
            const ty = Number(tr[2] ?? tr[4])
            if (Number.isFinite(tx) && Number.isFinite(ty)) {
              box = [x - tx, y - ty, x - tx + w, y - ty + h]
            }
          }
          // Give the raster a generous intrinsic size for crispness: rewrite
          // the root width/height from the viewBox (replace any existing
          // attributes — injecting duplicates makes the XML invalid).
          if (w && h) {
            svg = svg.replace(/<svg([^>]*)>/, (_, attrs: string) => {
              const cleaned = attrs.replace(/\s(?:width|height)="[^"]*"/g, "")
              return `<svg width="${Math.ceil(w * 3)}" height="${Math.ceil(h * 3)}"${cleaned}>`
            })
          }
        }
        const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
        const img = new Image()
        const loaded = new Promise<HTMLImageElement | null>((resolve) => {
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
        })
        img.src = blobUrl
        const el = await loaded
        // The blob is only needed to get the image decoded — once it has
        // (loaded or failed) the raster stays valid off the revoked url, and
        // holding the url alive for the cache's lifetime leaked one blob per
        // clip×frame ever drawn.
        URL.revokeObjectURL(blobUrl)
        return el ? { img: el, box } : null
      } catch {
        return null
      }
    })()
    svgCacheSet(url, p)
  }
  return p
}

// ---- palette ---------------------------------------------------------------

let paletteImagePromise: Promise<HTMLImageElement | null> | null = null

function loadPaletteImage(): Promise<HTMLImageElement | null> {
  if (!paletteImagePromise) {
    paletteImagePromise = new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = mewPaletteUrl()
    })
  }
  return paletteImagePromise
}

/** Below this luminance a pixel is treated as line art, not fill. */
const LINE_ART_LUMA = 70

/**
 * Paint the fur pattern into the cat's fill without touching its outlines.
 *
 * The game layers fur under the line art; we only have each part flattened
 * (fill + outline in one image), so replace the shade where the cat is light
 * enough to be fill and leave the dark strokes alone. Multiplying instead
 * turned the whole cat near-black, and painting over it erased every outline.
 */
function applyTexture(
  ctx: CanvasRenderingContext2D,
  tex: HTMLCanvasElement,
  w: number,
  h: number,
) {
  const tctx = tex.getContext("2d", { willReadFrequently: true })
  if (!tctx) return
  const dst = ctx.getImageData(0, 0, w, h)
  const src = tctx.getImageData(0, 0, w, h)
  const d = dst.data
  const s = src.data
  for (let i = 0; i < d.length; i += 4) {
    if (s[i + 3] === 0 || d[i + 3] === 0) continue
    if ((d[i] + d[i + 1] + d[i + 2]) / 3 <= LINE_ART_LUMA) continue
    d[i] = s[i]
    d[i + 1] = s[i + 1]
    d[i + 2] = s[i + 2]
  }
  ctx.putImageData(dst, 0, 0)
}

/**
 * Game shader port: pixels that are (near-)gray are replaced by
 * palette.png[gray*15, paletteIndex]; colored pixels pass through.
 * A small tolerance absorbs canvas antialiasing on grayscale art.
 */
async function applyPalette(ctx: CanvasRenderingContext2D, w: number, h: number, index: number) {
  const img = await loadPaletteImage()
  if (!img) return
  const pal = document.createElement("canvas")
  pal.width = img.width
  pal.height = img.height
  const pctx = pal.getContext("2d", { willReadFrequently: true })
  if (!pctx) return
  pctx.drawImage(img, 0, 0)
  const row = Math.max(0, Math.min(img.height - 1, index))
  const rowData = pctx.getImageData(0, row, img.width, 1).data
  const lut: [number, number, number][] = []
  for (let i = 0; i < 16; i++) {
    const x = Math.min(img.width - 1, i)
    lut.push([rowData[x * 4], rowData[x * 4 + 1], rowData[x * 4 + 2]])
  }

  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3]
    if (a === 0) continue
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]
    const mx = Math.max(r, g, b)
    const mn = Math.min(r, g, b)
    if (mx - mn <= 8) {
      const gray = (r + g + b) / 3
      const [nr, ng, nb] = lut[Math.max(0, Math.min(15, Math.round((gray / 255) * 15)))]
      d[i] = nr
      d[i + 1] = ng
      d[i + 2] = nb
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

// ---- component -------------------------------------------------------------

export const MewCat = React.forwardRef<HTMLCanvasElement, CatCompositorProps>(
  ({ parts, palette, pose = {}, equipment, size = 400, background, tightFit }, ref) => {
    const localRef = useRef<HTMLCanvasElement>(null)
    const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || localRef
    const [error, setError] = useState<string | null>(null)
    const renderSeq = useRef(0)

    useEffect(() => {
      const seq = ++renderSeq.current
      const run = async () => {
        try {
          const placements = await loadCatPartsPlacements()
          const canvas = canvasRef.current
          if (!canvas || renderSeq.current !== seq) return
          const dpr = 2
          canvas.width = size * dpr
          canvas.height = size * dpr
          const ctx = canvas.getContext("2d", { willReadFrequently: true })
          if (!ctx) return

          const items = buildDrawList(placements, parts, pose, equipment)

          // Load first: each SVG declares its own local box, which is the
          // authoritative placement. part_bounds is only a fallback now, so a
          // stale or incomplete placements file cannot blank a part.
          const loaded = await Promise.all(items.map((it) => loadPartImage(it.clip, it.frame)))
          if (renderSeq.current !== seq) return

          // Measure the framing from the CAT ONLY. Equipment still draws, but
          // never sizes the view: a few overlay frames are exported on a huge
          // mostly-empty FFDec canvas (HeadItemF 21 spans 535px upward), and
          // letting one of those into the union shrank the whole cat to a
          // speck the moment you equipped it.
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
          let texCanvas: HTMLCanvasElement | null = null
          const drawable: Array<DrawItem & {
            bb: [number, number, number, number]
            img: HTMLImageElement
          }> = []
          items.forEach((it, i) => {
            const part = loaded[i]
            if (!part) return
            // The JSON is authoritative: it is measured from the RAW export,
            // before svgo folds the wrapping <g> transform into the children
            // and destroys the canvas origin the SVG box is relative to. The
            // SVG-derived box stays as a fallback so a stale or incomplete
            // placements file degrades to a slightly-off part, never a
            // missing one.
            const bb = placements.part_bounds[it.clip]?.[String(it.frame)] ?? part.box
            if (!bb) return
            drawable.push({ ...it, bb, img: part.img })
            if (EQUIPMENT_CLIPS.has(it.clip)) return
            for (const cx of [bb[0], bb[2]]) {
              for (const cy of [bb[1], bb[3]]) {
                const [px, py] = applyPt(it.matrix, cx, cy)
                x0 = Math.min(x0, px); y0 = Math.min(y0, py)
                x1 = Math.max(x1, px); y1 = Math.max(y1, py)
              }
            }
          })
          if (!drawable.length || !Number.isFinite(x0) || x1 <= x0 || y1 <= y0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            setError(null)
            return
          }

          // `part_bounds` is one rect per CLIP, not per frame: FFDec exports every
          // frame of a clip on that clip's shared canvas, so all 384 ear frames
          // report the same 216-unit box while the ear drawn inside it is a
          // fraction of that. Framing from the union of those canvases leaves the
          // cat at ~50% of its box with the slack piled on whichever side has the
          // widest empty canvas.
          //
          // There is no per-frame ink box anywhere in the data, so `tightFit`
          // measures one: draw the cat parts into a 256px probe and read the
          // pixels that actually got painted. ~14 drawImage calls and a 65k-pixel
          // alpha scan — the palette pass already walks more than that.
          if (tightFit) {
            const P = 256
            const probe = document.createElement("canvas")
            probe.width = P
            probe.height = P
            const pctx = probe.getContext("2d", { willReadFrequently: true })
            if (pctx) {
              const pk = Math.min(P / (x1 - x0), P / (y1 - y0))
              const pfit: RigMatrix = {
                sx: pk, sy: pk, r0: 0, r1: 0,
                tx: (P - pk * (x1 + x0)) / 2,
                ty: (P - pk * (y1 + y0)) / 2,
              }
              for (const d of drawable) {
                // Same exclusions as the union: equipment must not size the view,
                // and the fur swatch is masked to the cat when it is really drawn,
                // so its raw rectangle would defeat the whole measurement.
                if (EQUIPMENT_CLIPS.has(d.clip) || d.clip === "CatTexture") continue
                const m = mul(pfit, d.matrix)
                pctx.setTransform(m.sx, m.r0, m.r1, m.sy, m.tx, m.ty)
                pctx.drawImage(d.img, d.bb[0], d.bb[1], d.bb[2] - d.bb[0], d.bb[3] - d.bb[1])
              }
              pctx.setTransform(1, 0, 0, 1, 0, 0)
              const px = pctx.getImageData(0, 0, P, P).data
              let ix0 = P, iy0 = P, ix1 = -1, iy1 = -1
              for (let y = 0; y < P; y++) {
                for (let x = 0; x < P; x++) {
                  if (px[(y * P + x) * 4 + 3] > 8) {
                    if (x < ix0) ix0 = x
                    if (x > ix1) ix1 = x
                    if (y < iy0) iy0 = y
                    if (y > iy1) iy1 = y
                  }
                }
              }
              // One probe pixel of margin on each side, and only trust a
              // measurement that found real ink.
              if (ix1 > ix0 && iy1 > iy0) {
                x0 = (ix0 - 1 - pfit.tx) / pk
                y0 = (iy0 - 1 - pfit.ty) / pk
                x1 = (ix1 + 1 - pfit.tx) / pk
                y1 = (iy1 + 1 - pfit.ty) / pk
              }
            }
          }

          const pad = size * 0.06
          const k = Math.min(
            ((size - 2 * pad) * dpr) / (x1 - x0),
            ((size - 2 * pad) * dpr) / (y1 - y0)
          )
          const fit: RigMatrix = {
            sx: k, sy: k, r0: 0, r1: 0,
            tx: (size * dpr - k * (x1 + x0)) / 2,
            ty: (size * dpr - k * (y1 + y0)) / 2,
          }

          // The cat is composed on its own layer because the palette swap must
          // NOT touch equipment: items ship in their own colours, and running
          // the fur LUT over the whole canvas repainted every hat and collar
          // in the cat's coat colour.
          const catLayer = document.createElement("canvas")
          catLayer.width = canvas.width
          catLayer.height = canvas.height
          const catCtx = catLayer.getContext("2d", { willReadFrequently: true })
          if (!catCtx) return
          catCtx.imageSmoothingEnabled = true
          catCtx.imageSmoothingQuality = "high"

          const drawPart = (
            target: CanvasRenderingContext2D,
            d: (typeof drawable)[number],
          ) => {
            const m = mul(fit, d.matrix)
            target.setTransform(m.sx, m.r0, m.r1, m.sy, m.tx, m.ty)
            target.drawImage(d.img, d.bb[0], d.bb[1], d.bb[2] - d.bb[0], d.bb[3] - d.bb[1])
            target.setTransform(1, 0, 0, 1, 0, 0)
          }

          // Equipment keeps its own colours, so it is held back and composited
          // after the palette runs — back layers under the cat, front over it.
          const backEquip: typeof drawable = []
          const frontEquip: typeof drawable = []
          for (const d of drawable) {
            if (EQUIPMENT_CLIPS.has(d.clip)) {
              ;(d.clip.endsWith("B") ? backEquip : frontEquip).push(d)
              continue
            }
            if (d.clip === "CatTexture") {
              // Fur is a rectangular swatch the game paints INSIDE the cat and
              // UNDER the line art. Collect it offscreen, masked to whatever is
              // already drawn (destination-in = the silhouette so far); the
              // blend onto the cat happens after the loop.
              if (!texCanvas) {
                texCanvas = document.createElement("canvas")
                texCanvas.width = canvas.width
                texCanvas.height = canvas.height
              }
              const octx = texCanvas.getContext("2d")
              if (!octx) continue
              const layer = document.createElement("canvas")
              layer.width = canvas.width
              layer.height = canvas.height
              const lctx = layer.getContext("2d")
              if (!lctx) continue
              const m = mul(fit, d.matrix)
              lctx.setTransform(m.sx, m.r0, m.r1, m.sy, m.tx, m.ty)
              lctx.drawImage(d.img, d.bb[0], d.bb[1], d.bb[2] - d.bb[0], d.bb[3] - d.bb[1])
              lctx.setTransform(1, 0, 0, 1, 0, 0)
              lctx.globalCompositeOperation = "destination-in"
              lctx.drawImage(catLayer, 0, 0)
              octx.drawImage(layer, 0, 0)
              continue
            }
            drawPart(catCtx, d)
          }
          if (texCanvas) applyTexture(catCtx, texCanvas, canvas.width, canvas.height)
          await applyPalette(catCtx, canvas.width, canvas.height, palette)
          if (renderSeq.current !== seq) return

          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          for (const d of backEquip) drawPart(ctx, d)
          ctx.drawImage(catLayer, 0, 0)
          for (const d of frontEquip) drawPart(ctx, d)
          if (renderSeq.current === seq) setError(null)
        } catch (err) {
          if (renderSeq.current === seq) {
            setError(err instanceof Error ? err.message : "render failed")
          }
        }
      }
      run()
    }, [parts, palette, pose, equipment, size, canvasRef])

    // Weapons and trinkets have no anchor anywhere in the rig — the game
    // places them from combat code, not from the art — so they are shown
    // beside the cat as held gear rather than guessed onto the body.
    const held: Array<{ clip: string; frame: number }> = []
    if (equipment?.weapon) held.push({ clip: "weapon", frame: equipment.weapon })
    if (equipment?.trinket) held.push({ clip: "trinket", frame: equipment.trinket })

    return (
      <>
        <canvas
          ref={canvasRef}
          className={`border-2 border-solid border-[color:var(--mwp-ink)] [border-radius:var(--wob-sm)]${background ? "" : " bg-[color:var(--mwp-paper)]"}`}
          style={{ width: size, height: size, maxWidth: "100%", background }}
        />
        {held.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            {held.map((h) => (
              <img
                key={h.clip}
                src={mewCatSvgUrl(h.clip, h.frame)}
                alt=""
                className="h-16 w-16 border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] object-contain p-1 [border-radius:var(--wob-sm)]"
              />
            ))}
          </div>
        )}
        {error && <div className="text-xs text-[color:var(--mwp-bad)]">{error}</div>}
      </>
    )
  }
)

MewCat.displayName = "MewCat"
