"use client"

// PAPER. The photograph tipped into the identity page and into the carné.

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * The holder's REAL Minecraft skin, rendered full-body from their uuid.
 *
 * `mc-heads.net` is what the rest of SmartRotom already renders players with — ChatApp's
 * avatars, the call overlay, Gobierno's skin admin — so the passport uses it rather than
 * introducing a second service. It renders on demand from the uuid: there is no stored asset
 * and nothing to fake.
 *
 * When the render is unavailable the frame stays EMPTY. It used to fall back to a hand-drawn
 * pixel figure, which is a lie on an identity document — a passport carrying a stranger's face
 * is worse than one carrying none. An unphotographed holder gets "SIN FOTOGRAFÍA", which is
 * what a registry would actually print.
 *
 * Not `next/image`: the render already comes back at the requested size, and the optimiser
 * would resample pixel art (§10).
 */
export function PassportPhoto({
  uuid,
  size = 104,
  className,
}: {
  uuid?: string | null
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!uuid || failed) {
    return (
      <div
        style={{ width: size, height: Math.round(size * 1.45) }}
        className={cn(
          "mx-auto grid place-items-center rounded-[3px] border border-dashed border-ps-ink/22 bg-ps-paper-2",
          className,
        )}
      >
        <span className="px-1 text-center font-ps-mono text-[8px] uppercase leading-[1.3] tracking-[.14em] text-ps-ink-faint">
          Sin
          <br />
          fotografía
        </span>
      </div>
    )
  }

  return (
    <img
      // 2× so the skin stays crisp on a retina counter.
      src={`https://mc-heads.net/body/${encodeURIComponent(uuid)}/${size * 2}`}
      alt="Fotografía del titular"
      draggable={false}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      style={{ imageRendering: "pixelated", maxWidth: size }}
      className={cn("mx-auto block h-auto w-full object-contain", className)}
    />
  )
}
