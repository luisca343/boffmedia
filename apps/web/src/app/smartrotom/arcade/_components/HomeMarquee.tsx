import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Corners, Icon, Tag } from "./ui"

export interface HomeMarqueeProps {
  bannerName?: string
  compact?: boolean
}

/** The cabinet marquee at the top of the hub: the lit sign over the machines. */
export function HomeMarquee({ bannerName, compact }: HomeMarqueeProps) {
  const t = useTranslations("arcade")

  return (
    <div
      className={cn(
        "ar-scanlines ar-vignette relative mb-[22px] overflow-hidden rounded-[14px]",
        "border border-ar-violet/35 bg-[linear-gradient(180deg,#1a0e3d_0%,#0c0628_100%)]",
        "shadow-[inset_0_0_40px_-10px_rgb(var(--ar-violet)/.4)]",
        compact ? "px-[18px] pb-4 pt-[18px]" : "px-7 pb-6 pt-7",
      )}
    >
      <div aria-hidden className="ar-horizon opacity-60" />
      <Corners tone="cyan" inset={10} size={16} />

      <div className="relative z-[3] flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <div className="mb-2.5 inline-flex items-center gap-2 font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-cyan">
            <span aria-hidden className="text-ar-magenta motion-reduce:animate-none animate-ar-blink">
              ●
            </span>
            {t("home.marqueeStatus")}
          </div>
          <h1
            className={cn(
              "ar-marquee-text font-ar-display leading-tight",
              "[text-shadow:0_0_20px_rgb(var(--ar-cyan)/.4)]",
              compact ? "text-[18px]" : "text-[28px]",
            )}
          >
            {t("home.marqueeTitle")}
          </h1>
          <p className="mt-3 max-w-[540px] font-ar text-[13px] text-ar-ink-dim">
            {t("home.marqueeSubtitle")}
          </p>
        </div>

        {bannerName && (
          <Tag tone="lime" size="lg">
            <Icon.Trophy s={14} /> {bannerName}
          </Tag>
        )}
      </div>
    </div>
  )
}
