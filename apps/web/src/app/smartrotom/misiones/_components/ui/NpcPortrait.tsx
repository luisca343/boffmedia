"use client"

import { Suspense } from "react"
import NpcSkin from "@/components/smartrotom/MinecraftSkin"
import { cn } from "@/lib/utils"

/**
 * The NPC's real Minecraft skin, framed like a portrait nailed to the board.
 * The server already renders the actual skin of every custom NPC, so that is
 * what hangs here rather than hand-drawn art — this component only frames it.
 *
 * The render is a full-body 1:2 image, so a square frame showing its top half
 * lands on head-and-shoulders; `full` keeps the whole figure for the expediente.
 */
export function NpcPortrait({
  skin,
  size = 56,
  ring = false,
  full = false,
  className,
}: {
  skin: string | undefined
  size?: number
  ring?: boolean
  full?: boolean
  className?: string
}) {
  const width = size
  const height = full ? size * 2 : size

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-[#1a1208]/60 shadow-[1px_2px_2px_rgba(0,0,0,.45)]",
        ring && "ring-[1.5px] ring-inset ring-ms-gold-2",
        className,
      )}
      style={{ width, height }}
    >
      <Suspense fallback={<div className="h-full w-full animate-pulse bg-ms-ink-2/40" />}>
        <NpcSkin
          npcName={skin || "steve"}
          width={width}
          height={size * 2}
          style={{ imageRendering: "pixelated", display: "block" }}
        />
      </Suspense>
    </div>
  )
}
