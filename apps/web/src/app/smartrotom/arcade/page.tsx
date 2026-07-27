"use client"

import { useTranslations } from "next-intl"

import { GameLibrary } from "./_components/GameLibrary"
import { HomeMarquee } from "./_components/HomeMarquee"
import { InventoryBanner } from "./_components/InventoryBanner"
import { StreakRail } from "./_components/StreakRail"
import { useArcadeStreak } from "./_hooks/queries"

export default function ArcadePage() {
  const t = useTranslations("arcade")
  const streak = useArcadeStreak()

  return (
    <>
      <HomeMarquee bannerName={streak.data?.currentBanner} />
      <StreakRail />
      <InventoryBanner />
      <GameLibrary />

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/[.06] bg-black/35 px-[18px] py-3.5">
        <span className="font-ar-mono text-[11px] text-ar-ink-muted">
          {t("home.footer")}
        </span>
        <span aria-hidden className="inline-flex gap-1.5">
          <span className="h-2.5 w-2.5 bg-ar-cyan shadow-[0_0_8px_rgb(var(--ar-cyan))]" />
          <span className="h-2.5 w-2.5 bg-ar-magenta shadow-[0_0_8px_rgb(var(--ar-magenta))]" />
          <span className="h-2.5 w-2.5 bg-ar-amber shadow-[0_0_8px_rgb(var(--ar-amber))]" />
          <span className="h-2.5 w-2.5 bg-ar-violet shadow-[0_0_8px_rgb(var(--ar-violet))]" />
          <span className="h-2.5 w-2.5 bg-ar-lime shadow-[0_0_8px_rgb(var(--ar-lime))]" />
        </span>
      </footer>
    </>
  )
}
