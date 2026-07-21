"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { GameAccent } from "../_data/games"
import { Button, Icon } from "./ui"

export interface GameTopBarProps {
  title: string
  accent?: GameAccent
  onHelp?: () => void
  onReset?: () => void
  /** Game-specific controls, rendered to the left of Ayuda / Reiniciar. */
  actions?: ReactNode
}

// The accent lights the whole cabinet head: the marquee underline, its bloom and
// the back button's frame. Full literal classes — `border-b-ar-${accent}` would
// silently never compile (SMARTROTOM_V3.md §4).
const ACCENT: Record<GameAccent, { bar: string; back: string }> = {
  cyan: {
    bar: "border-b-ar-cyan/[.35] shadow-[0_0_18px_rgb(var(--ar-cyan)/.2)]",
    back: "border-ar-cyan/40 text-ar-cyan hover:border-ar-cyan/70",
  },
  magenta: {
    bar: "border-b-ar-magenta/[.35] shadow-[0_0_18px_rgb(var(--ar-magenta)/.2)]",
    back: "border-ar-magenta/40 text-ar-magenta-2 hover:border-ar-magenta/70",
  },
  violet: {
    bar: "border-b-ar-violet/[.35] shadow-[0_0_18px_rgb(var(--ar-violet)/.2)]",
    back: "border-ar-violet/40 text-ar-violet-2 hover:border-ar-violet/70",
  },
  amber: {
    bar: "border-b-ar-amber/[.35] shadow-[0_0_18px_rgb(var(--ar-amber)/.2)]",
    back: "border-ar-amber/40 text-ar-amber hover:border-ar-amber/70",
  },
  lime: {
    bar: "border-b-ar-lime/[.35] shadow-[0_0_18px_rgb(var(--ar-lime)/.2)]",
    back: "border-ar-lime/40 text-ar-lime hover:border-ar-lime/70",
  },
}

/**
 * The head of every game cabinet: the way back to the arcade, the marquee, and
 * the machine's controls. Pair it with `GameStage`, which draws the cabinet body
 * underneath and continues its frame.
 *
 * The handoff also hangs a coin balance here — the arcade has no currency
 * endpoint, so it is not rendered (docs/smartrotom/deferred/arcade.md).
 */
export function GameTopBar({ title, accent = "cyan", onHelp, onReset, actions }: GameTopBarProps) {
  const t = useTranslations("arcade")
  const skin = ACCENT[accent]

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-white/[.06] border-b px-3.5 py-2.5",
        "bg-[linear-gradient(180deg,#14072e,#0a0420)]",
        skin.bar,
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <Link
          href="/smartrotom/arcade"
          className={cn(
            "ar-lift inline-flex items-center gap-1.5 rounded-lg border bg-black/40 px-2.5 py-1.5",
            "font-ar text-[11px] font-semibold uppercase tracking-[0.08em]",
            skin.back,
          )}
        >
          <Icon.Chevron s={12} dir="left" />
          {t("arcade.sidebar.arcade")}
        </Link>
        <span aria-hidden className="h-[18px] w-px bg-white/10" />
        <span className="flex min-w-0 items-center gap-2">
          <Icon.Joystick s={16} className="shrink-0 text-ar-ink-dim" />
          <span className="ar-marquee-text truncate font-ar-display text-[13px] leading-relaxed">
            {title}
          </span>
        </span>
      </div>

      {(actions || onHelp || onReset) && (
        <div className="flex items-center gap-2">
          {actions}
          {onHelp && (
            <Button variant="outline" size="sm" icon={<Icon.Info s={12} />} onClick={onHelp}>
              {t("arcade.gameTopBar.help")}
            </Button>
          )}
          {onReset && (
            <Button variant="ghost" size="sm" icon={<Icon.Reset s={12} />} onClick={onReset}>
              {t("arcade.gameTopBar.reset")}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
