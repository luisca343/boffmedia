"use client"

import { useEffect, useState } from "react"
import { mewPaletteUrl } from "../cat"

// palette.png read once per session, into one CSS gradient per palette row.
// Module-level because the rail and the drawer both show the swatches and
// re-reading a canvas per mount was the visible hitch when opening the drawer.
let cache: string[] | null = null
let pending: Promise<string[]> | null = null

function readPalettes(): Promise<string[]> {
  if (cache) return Promise.resolve(cache)
  if (pending) return pending
  pending = new Promise<string[]>((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onerror = () => resolve([])
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return resolve([])
      ctx.drawImage(img, 0, 0)

      // One readback for the whole bitmap: the row-by-row scan below used to
      // call `getImageData` per pixel (width × height synchronous canvas
      // reads), which is the hitch this hook exists to avoid in the first
      // place. Index into the single buffer instead — same samples, same
      // output.
      const full = ctx.getImageData(0, 0, img.width, img.height).data

      // Columns 7-12 are fixed highlight/accent slots shared by every palette
      // (column 8 is the same cream in all 49 rows, which is why sampling it
      // made every swatch identical). Columns 2 and 5 carry the palette's own
      // shadow and midtone, so show both as a gradient.
      const at = (x: number, row: number) => {
        const i = (row * img.width + Math.min(img.width - 1, x)) * 4
        return [full[i], full[i + 1], full[i + 2]] as [number, number, number]
      }
      // Every row with more than one distinct colour is a real palette.
      // catgen's num_palettes (49) is only the range wild cats roll from;
      // story cats reference indices up to 202, so stopping at 49 made most
      // presets unreachable.
      const colors: string[] = []
      for (let row = 0; row < img.height; row++) {
        const shades = new Set<string>()
        for (let x = 0; x < img.width; x++) shades.add(at(x, row).join())
        if (shades.size <= 1) break
        const mid = at(5, row)
        const dark = at(2, row)
        colors.push(`linear-gradient(135deg, rgb(${mid.join()}) 0 50%, rgb(${dark.join()}) 50% 100%)`)
      }
      cache = colors
      resolve(colors)
    }
    img.src = mewPaletteUrl()
  })
  return pending
}

export function usePaletteColors(): string[] {
  const [colors, setColors] = useState<string[]>(cache ?? [])
  useEffect(() => {
    if (cache) return
    let alive = true
    readPalettes().then((c) => {
      if (alive) setColors(c)
    })
    return () => {
      alive = false
    }
  }, [])
  return colors
}
