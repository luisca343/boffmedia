// PAPER. A seal is struck INTO the sheet — it is the most physical thing in the book.

"use client"

import { useTranslations } from "next-intl"
import { useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { Icon } from "./Icon"

/**
 * Earned, it is wax: the scalloped clip (`.ps-wax`), lit from the upper left, with the
 * badge's own artwork pressed into it. Unearned, it is a blind emboss (`.ps-wax-blank`) —
 * a depression in the paper with a lock in it, lit from BELOW, which is what makes an
 * empty slot read as "nothing was struck here" rather than as a greyed-out button.
 *
 * The state is never colour alone: struck and unstruck differ in shape, in lighting and
 * in glyph.
 */
export function WaxSeal({
  src,
  alt,
  earned,
  size = 64,
  tint,
  slam = false,
  className,
}: {
  /** The real badge artwork. Falls back to a shield if it 404s — never a broken image. */
  src?: string
  alt: string
  earned: boolean
  size?: number
  /** The seal's ink as an `r g b` triplet — data-driven, so it rides on `style` (§4). */
  tint: string
  /** Strike it on mount: the stamp comes down. */
  slam?: boolean
  className?: string
}) {
  const t = useTranslations("pasaporte")
  const [failed, setFailed] = useState(false)

  return (
    <div
      role="img"
      aria-label={earned ? alt : t("waxSeal.unsealed", { alt })}
      style={{ width: size, height: size, "--ps-seal": tint } as CSSProperties}
      className={cn(
        "relative grid flex-none place-items-center",
        earned && slam && "animate-ps-stamp motion-reduce:animate-none",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("absolute inset-0", earned ? "ps-wax" : "ps-wax-blank")} />

      {earned ? (
        src && !failed ? (
          <img
            src={src}
            alt=""
            draggable={false}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="relative z-[2] h-[56%] w-[56%] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,.45)]"
          />
        ) : (
          <Icon name="shield" className="relative z-[2] h-[56%] w-[56%] text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]" />
        )
      ) : (
        <Icon name="lock" className="relative z-[3] h-[34%] w-[34%] text-ps-ink/60" />
      )}
    </div>
  )
}
