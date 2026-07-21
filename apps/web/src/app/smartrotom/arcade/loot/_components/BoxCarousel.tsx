"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { boxAccent, type ResolvedBox } from "../../_utils/inventory"
import { Icon, type ArTone } from "../../_components/ui"
import { BoxArt } from "./BoxArt"

export interface BoxCarouselProps {
  boxes: ResolvedBox[]
  index: number
  onIndex: (index: number) => void
  owned: Record<string, number>
}

const GLOW: Record<ArTone, string> = {
  cyan: "drop-shadow-[0_14px_24px_rgb(var(--ar-cyan)/.5)]",
  magenta: "drop-shadow-[0_14px_24px_rgb(var(--ar-magenta)/.55)]",
  violet: "drop-shadow-[0_14px_24px_rgb(var(--ar-violet)/.55)]",
  amber: "drop-shadow-[0_14px_24px_rgb(var(--ar-amber)/.55)]",
  lime: "drop-shadow-[0_14px_24px_rgb(var(--ar-lime)/.5)]",
  ghost: "drop-shadow-[0_14px_24px_rgb(0_0_0/.5)]",
}

const BADGE: Record<ArTone, string> = {
  cyan: "border-ar-cyan/50 bg-ar-cyan/[.14] text-ar-cyan",
  magenta: "border-ar-magenta/50 bg-ar-magenta/[.16] text-ar-magenta-2",
  violet: "border-ar-violet/50 bg-ar-violet/[.18] text-ar-violet-2",
  amber: "border-ar-amber/55 bg-ar-amber/[.16] text-ar-amber",
  lime: "border-ar-lime/50 bg-ar-lime/[.14] text-ar-lime",
  ghost: "border-white/15 bg-white/5 text-ar-ink-muted",
}

/** The three-up box stage: the picked box centred, its neighbours dimmed either side. */
export function BoxCarousel({ boxes, index, onIndex, owned }: BoxCarouselProps) {
  const t = useTranslations("arcade")
  if (boxes.length === 0) return null

  const step = (delta: number) => onIndex((index + delta + boxes.length) % boxes.length)
  const neighbours = boxes.length > 1 ? [-1, 0, 1] : [0]

  return (
    <div className="relative flex min-h-[340px] items-center justify-center rounded-[14px] border border-dashed border-white/[.08] bg-[radial-gradient(60%_60%_at_50%_50%,rgb(var(--ar-violet)/.15),transparent_70%)] px-[60px] pb-6 pt-[30px]">
      {boxes.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("arcade.loot.selectBox")}
            className="ar-lift absolute left-3.5 top-1/2 z-[2] grid h-[38px] w-[38px] -translate-y-1/2 place-items-center rounded-full border border-ar-cyan/40 bg-black/50 text-ar-cyan"
          >
            <Icon.Chevron s={18} dir="left" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("arcade.loot.selectBox")}
            className="ar-lift absolute right-3.5 top-1/2 z-[2] grid h-[38px] w-[38px] -translate-y-1/2 place-items-center rounded-full border border-ar-cyan/40 bg-black/50 text-ar-cyan"
          >
            <Icon.Chevron s={18} />
          </button>
        </>
      )}

      <div className="flex items-center gap-6">
        {neighbours.map((offset) => {
          const i = (index + offset + boxes.length) % boxes.length
          const box = boxes[i]
          const center = offset === 0
          const tone = boxAccent(box.theme)
          const count = owned[box.id] ?? 0

          return (
            <button
              key={`${box.id}-${offset}`}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={box.name}
              aria-current={center ? "true" : undefined}
              className={cn(
                "shrink-0 transition-all duration-[250ms] ease-out",
                center ? "opacity-100" : "hidden scale-[.7] opacity-40 sm:block",
              )}
            >
              <div
                className={cn(
                  "relative mx-auto grid place-items-center",
                  center ? "h-[180px] w-[180px]" : "h-[120px] w-[120px]",
                  GLOW[tone],
                )}
              >
                <BoxArt boxId={box.id} size={center ? 160 : 108} tone={tone} />
                {center && (
                  <span
                    aria-hidden
                    className="absolute right-2 top-1 font-ar-display text-sm text-ar-violet-2 motion-reduce:animate-none animate-ar-float"
                  >
                    ✦
                  </span>
                )}
              </div>

              {center && (
                <div className="mt-3.5 text-center">
                  <div className="ar-chrom font-ar-display text-[15px] leading-relaxed text-ar-ink">
                    {box.name}
                  </div>
                  <p className="mx-auto mt-2 max-w-[320px] font-ar-mono text-[11px] leading-relaxed text-ar-ink-dim">
                    {box.description}
                  </p>
                  <span
                    className={cn(
                      "mt-2.5 inline-flex items-center gap-1.5 rounded-[5px] border px-[9px] py-1 font-ar-mono text-[11px] font-bold uppercase tracking-[0.08em]",
                      count > 0 ? BADGE[tone] : BADGE.ghost,
                    )}
                  >
                    <Icon.Box s={12} /> {count} {t("arcade.loot.inInventory")}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {boxes.length > 1 && (
        <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
          {boxes.map((box, i) => (
            <button
              key={box.id}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={box.name}
              className={cn(
                "h-2 rounded-sm transition-all duration-200",
                i === index
                  ? "w-[22px] bg-ar-cyan shadow-[0_0_10px_rgb(var(--ar-cyan))]"
                  : "w-2 bg-white/20",
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
