// PAPER. A pixel portrait mounted in an embossed ring, like a photo tipped into a page.

"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSpriteManifestStore } from "@/stores/spriteManifestStore"
import { getSpriteUrl } from "@/utils/spriteUtils"
import { Icon } from "./Icon"

/**
 * Resolved through the shared sprite manifest — the same `id:form:palette` lookup, with its
 * form and palette fallbacks, that the PC and the Pokédex use. Deliberately not
 * `next/image`: the manifest already resolves the URL and the optimiser would resample
 * pixel art.
 *
 * It subscribes to the manifest store rather than reading `getState()` once, so a whole
 * team fills in when the manifest lands instead of staying blank until something else
 * forces a re-render.
 */
export function Sprite({
  dex,
  form,
  palette,
  name,
  size = 64,
  className,
}: {
  dex: number
  form?: string
  palette?: string
  name: string
  /** The ring's diameter. The sprite sits 8px inside it. */
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const manifest = useSpriteManifestStore((s) => s.manifest)

  const src = manifest ? getSpriteUrl({ id: dex, form: form || "base", palette: palette || "none" }) : null

  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "grid flex-none place-items-center rounded-full border-2 border-ps-ink/22",
        "bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,.7),rgba(255,255,255,.1))]",
        "shadow-[inset_0_0_8px_rgba(80,60,30,.15)]",
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          draggable={false}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={{ width: size - 8, height: size - 8, imageRendering: "pixelated" }}
          className="object-contain drop-shadow-[0_2px_1px_rgba(0,0,0,.25)]"
        />
      ) : (
        <Icon name="egg" className="h-[45%] w-[45%] text-ps-ink-faint/60" />
      )}
    </span>
  )
}
