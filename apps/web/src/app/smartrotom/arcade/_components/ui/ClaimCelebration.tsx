"use client"

import { useEffect, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useCountUp, prefersReducedMotion } from "../../_hooks/useCountUp"
import { useFormat } from "@boffmedia/ui/useFormat"
import { raritySkin, type ArRarity } from "../../_utils/rarity"
import { Corners } from "./Corners"

export interface ArCelebrationReward {
  name: string
  rarity: ArRarity
  /** Shown when the reward is a quantity (coins, stars). Omit for a named item. */
  amount?: number | null
  /** Glyph or artwork for the trophy plinth. */
  art?: ReactNode
}

export interface ClaimCelebrationProps {
  reward: ArCelebrationReward | null
  onClose: () => void
}

const PARTICLE_COUNT = 16

/**
 * The reward "moment" — the payoff every claim funnels into. Renders in place
 * (not a portal) so it keeps the `.ar-app` scope and its tokens resolve; the
 * fixed overlay covers the viewport regardless (SMARTROTOM_V3.md §2).
 */
export function ClaimCelebration({ reward, onClose }: ClaimCelebrationProps) {
  const t = useTranslations("arcade")
  const reduce = prefersReducedMotion()
  const display = useCountUp(reward?.amount ?? 0, 900)
  const { number } = useFormat()

  useEffect(() => {
    if (!reward) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [reward, onClose])

  if (!reward) return null

  const skin = raritySkin(reward.rarity)
  const particles = reduce ? [] : Array.from({ length: PARTICLE_COUNT }, (_, i) => i)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("celebration.ariaLabel", { name: reward.name })}
      onClick={onClose}
      className="fixed inset-0 z-[9999] grid cursor-pointer place-items-center bg-[rgb(4_2_14/.78)] backdrop-blur-lg"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="ar-scanlines relative w-[340px] max-w-[88vw] cursor-default overflow-hidden rounded-[18px] px-7 pb-[26px] pt-[34px] text-center motion-reduce:animate-none animate-ar-pop"
        style={{
          background: `linear-gradient(180deg, ${skin.bg}, rgba(8,4,28,0.96))`,
          border: `1.5px solid ${skin.fg}`,
          boxShadow: `0 0 60px ${skin.bd}, 0 30px 80px -20px rgba(0,0,0,0.7)`,
        }}
      >
        <Corners tone="cyan" inset={10} size={14} />

        {!reduce && (
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-16 -ml-[60px] h-[120px] w-[120px] rounded-full animate-ar-celeb-ring"
            style={{ border: `2px solid ${skin.fg}` }}
          />
        )}
        {particles.map((i) => {
          const angle = (i / PARTICLE_COUNT) * Math.PI * 2
          const distance = 92 + ((i * 53) % 44)
          return (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[42%] h-[7px] w-[7px] rounded-sm animate-ar-particle"
              style={
                {
                  background: i % 3 === 0 ? "#ffb845" : i % 3 === 1 ? skin.fg : "#00e5ff",
                  "--ar-dx": `${Math.cos(angle) * distance}px`,
                  "--ar-dy": `${Math.sin(angle) * distance}px`,
                  animationDelay: `${(i % 5) * 0.04}s`,
                } as React.CSSProperties
              }
            />
          )
        })}

        <div
          className="relative mb-[18px] font-ar-mono text-[11px] font-bold uppercase tracking-[0.2em]"
          style={{ color: skin.fg }}
        >
          {t("celebration.rewardObtained")}
        </div>

        <div
          className="mx-auto mb-4 grid h-[104px] w-[104px] place-items-center overflow-hidden rounded-[18px] font-ar-display text-[44px] motion-reduce:animate-none animate-ar-float"
          style={{
            background: `radial-gradient(60% 60% at 50% 40%, ${skin.fg}44, transparent 70%)`,
            border: `1.5px solid ${skin.fg}`,
            boxShadow: `inset 0 0 30px ${skin.bd}`,
            color: skin.fg,
          }}
        >
          {reward.art ?? "★"}
        </div>

        {reward.amount != null && (
          <div className="mb-1.5 font-ar-display text-[30px] text-ar-ink">
            {number(display)}
          </div>
        )}
        <div className="font-ar text-base font-bold text-ar-ink">{reward.name}</div>
        <div className="mt-1.5 font-ar-mono text-xs uppercase" style={{ color: skin.fg }}>
          {t(skin.nameKey)}
        </div>

        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="ar-lift mt-[22px] w-full rounded-[10px] border border-white/[.18] p-3 font-ar text-xs font-extrabold uppercase tracking-[0.08em] text-[#0a0420]"
          style={{ background: `linear-gradient(180deg, ${skin.fg}, ${skin.bd})` }}
        >
          {t("celebration.great")}
        </button>
      </div>
    </div>
  )
}
