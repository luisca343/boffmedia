import * as React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { GameLogo } from "./GameLogo"
import { hueStyle } from "./tools-data"

export interface GameCoverData {
  name: string
  tagline: string
  slug: string
  hueColor: string
  logoLabel: string
  toolCount: number
  href?: string
}

/**
 * Game cover card — the entry to each game on the hub. The background is a
 * key-art image-slot (deferred locally → tinted panel), scrimmed, with the game
 * logo + tool count on top and title/tagline/CTA at the foot. `mini` is the
 * wide slim variant used in the mixed layout. Mirrors `.tx-cover` from tools.css.
 */
export function GameCover({ game, mini = false }: { game: GameCoverData; mini?: boolean }) {
  const t = useTranslations("boffmedia.hub")
  return (
    <Link
      href={game.href ?? `/herramientas/${game.slug}`}
      aria-label={t("toolsOf", { game: game.name })}
      style={hueStyle(game.hueColor)}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden border border-solid border-line bg-panel text-left no-underline",
        "cut-corner [--cut-lg:18px] transition-[transform,border-color] duration-[140ms]",
        "hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--ghue)_55%,var(--line))]",
        mini ? "aspect-[21/9]" : "aspect-[15/11]",
      )}
    >
      {/* [deferred] key-art image-slot → tinted placeholder */}
      <span aria-hidden className="absolute inset-0 z-0 [background:radial-gradient(120%_90%_at_75%_10%,color-mix(in_srgb,var(--ghue)_26%,transparent),transparent_60%),repeating-linear-gradient(135deg,var(--bg-2)_0_9px,var(--panel-2)_9px_18px)]" />
      <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] [background:linear-gradient(to_top,var(--bg)_4%,color-mix(in_srgb,var(--bg)_55%,transparent)_42%,transparent_78%)]" />

      <div className="absolute inset-x-0 top-0 z-[2] flex items-center gap-3 px-[18px] py-4">
        <GameLogo label={game.logoLabel} hueColor={game.hueColor} size="sm" />
        <span className="ml-auto border border-solid border-line bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] px-[9px] py-1.5 font-mono text-[10px]/none font-semibold uppercase tracking-[0.12em] text-txt backdrop-blur-[4px]">
          {game.toolCount} {t("toolCount", { count: game.toolCount })}
        </span>
      </div>

      <div className="relative z-[2] px-5 pb-5">
        <h3 className={cn("leading-[0.95]", mini ? "text-[28px]" : "text-[clamp(28px,2.6vw,38px)]")}>{game.name}</h3>
        {!mini && <p className="mt-[7px] max-w-[34ch] text-pretty text-[13.5px] text-txt-muted">{game.tagline}</p>}
        <span className={cn("flex items-center gap-2 font-mono text-[11px]/none font-semibold uppercase tracking-[0.1em] text-txt-muted", mini ? "mt-2.5" : "mt-3.5")}>
          {t("enter")}
          <span className="ml-auto text-txt-dim transition-[color,transform] duration-[140ms] group-hover:translate-x-1 group-hover:text-accent-bright">
            <Icon name="arrow" size={17} />
          </span>
        </span>
      </div>
    </Link>
  )
}
