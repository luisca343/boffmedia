"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { getItemName } from "@/lib/intlUtils"
import { ItemImage } from "@/lib/ItemImage"
import { cn } from "@/lib/utils"
import { prefersReducedMotion } from "../../_hooks/useCountUp"
import { useArcadePrefs } from "../../_hooks/useArcadePrefs"
import { raritySkin } from "../../_utils/rarity"
import { REEL_TILE, useReelSpin } from "../_hooks/useReelSpin"
import type { ReelTile } from "../_utils/reel"

export interface ReelSpinnerProps {
  tiles: ReelTile[]
  winningPosition: number
  /** Fired once the winner has landed and the reveal beat has passed. */
  onRevealed: () => void
}

export function ReelSpinner({ tiles, winningPosition, onRevealed }: ReelSpinnerProps) {
  const t = useTranslations("arcade")
  const { sound } = useArcadePrefs()

  const spin = useReelSpin({
    winningPosition,
    tileCount: tiles.length,
    sound,
    reduceMotion: prefersReducedMotion(),
  })

  const fired = useRef(false)
  useEffect(() => {
    if (spin.revealed && !fired.current) {
      fired.current = true
      onRevealed()
    }
  }, [spin.revealed, onRevealed])

  return (
    <div
      className="ar-scanlines relative h-[180px] overflow-hidden rounded-xl border-2 border-ar-cyan/45 bg-[#06031a] shadow-[inset_0_0_60px_rgb(var(--ar-cyan)/.12)]"
      role="img"
      aria-label={spin.settled ? t("loot.reelAriaSettled") : t("loot.reelAriaSpinning")}
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 z-[5] w-0.5 -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgb(var(--ar-cyan)),transparent)] shadow-[0_0_14px_rgb(var(--ar-cyan))]"
      />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 z-[6] h-0 w-0 -translate-x-1/2 border-x-[10px] border-t-[10px] border-x-transparent border-t-ar-cyan"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 z-[6] h-0 w-0 -translate-x-1/2 border-x-[10px] border-b-[10px] border-x-transparent border-b-ar-cyan"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[4] w-[90px] bg-[linear-gradient(90deg,#06031a,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-[4] w-[90px] bg-[linear-gradient(270deg,#06031a,transparent)]"
      />

      <div
        ref={spin.trackRef}
        className="absolute left-1/2 top-0 flex h-full items-center will-change-transform"
        style={{
          transform: `translateX(-${spin.offset}px)`,
          transition: spin.durationMs
            ? `transform ${spin.durationMs}ms ${spin.ease}`
            : undefined,
        }}
      >
        {tiles.map((tile, i) => {
          const skin = raritySkin(tile.rarity)
          const isWinner = spin.settled && i === winningPosition
          return (
            <div
              key={tile.key}
              className={cn(
                "mx-1 flex shrink-0 flex-col items-center justify-center rounded-[10px] border transition-[transform,box-shadow] duration-300",
                isWinner && "scale-105",
              )}
              style={{
                width: REEL_TILE,
                height: 140,
                background: `linear-gradient(180deg, ${skin.bg}, rgba(0,0,0,0.5))`,
                borderColor: skin.bd,
                boxShadow: isWinner
                  ? `0 0 40px ${skin.fg}, inset 0 0 20px ${skin.bd}`
                  : `inset 0 0 12px ${skin.bd}`,
              }}
            >
              <div
                className="grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-lg border"
                style={{
                  background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}33, transparent 70%)`,
                  borderColor: skin.bd,
                }}
              >
                <ItemImage type={tile.type} itemId={tile.data || tile.id} size={44} />
              </div>
              <div className="mt-2 line-clamp-2 px-1.5 text-center font-ar-mono text-[10px] leading-tight text-ar-ink-dim">
                {getItemName(t, tile.id, tile.type)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
