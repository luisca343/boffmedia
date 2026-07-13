"use client"

import { cn } from "@/lib/utils"
import { Icon, Sprite } from "./ui"

/**
 * One slot in the Vitrina.
 *
 * A shiny gets a cyan edge and a sparkle; an uncaught species is drawn as its own
 * silhouette rather than a question mark, because the shape is the tease. That is the
 * whole grammar of the grid — everything else is the sprite.
 */
export interface DexTileProps {
  dex: number
  form?: string
  palette?: string
  caught?: boolean
  shiny?: boolean
  name?: string
  size?: number
}

export function DexTile({
  dex,
  form = "base",
  palette = "none",
  caught = true,
  shiny = false,
  name,
  size = 64,
}: DexTileProps) {
  return (
    <div
      title={caught ? name : "???"}
      className={cn(
        "relative grid aspect-square place-items-center overflow-hidden rounded-rk-md border p-1",
        shiny ? "border-rk-shiny/45" : "border-rk-line",
        caught ? "bg-rk-card" : "bg-rk-card/50",
      )}
    >
      {shiny && (
        <span className="absolute right-1 top-1 z-[2] text-rk-shiny">
          <Icon name="sparkle" size={12} fill />
        </span>
      )}
      <Sprite
        dex={dex}
        form={form}
        palette={palette}
        size={Math.round(size * 0.8)}
        alt={caught ? (name ?? String(dex)) : "No capturado"}
        // An uncaught species is knocked all the way down to a flat silhouette. The
        // filter is inline because it is a composite no Tailwind utility expresses.
        className={caught ? undefined : "opacity-30"}
      />
    </div>
  )
}
