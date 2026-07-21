"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { GAME_CATEGORY_KEYS, GAMES } from "../_data/games"
import { CabinetCard } from "./CabinetCard"
import { SectionTitle } from "./ui"

/** The cabinet grid, filterable by category. */
export function GameLibrary() {
  const t = useTranslations("")
  const [category, setCategory] = useState(GAME_CATEGORY_KEYS[0])
  const shown = category === GAME_CATEGORY_KEYS[0] ? GAMES : GAMES.filter((g) => g.categoryKey === category)

  return (
    <section>
      <SectionTitle
        kicker={t("arcade.home.library", { count: GAMES.length })}
        title={t("arcade.home.arcadeGames")}
        accent="cyan"
        right={
          <div className="flex flex-wrap gap-1.5">
            {GAME_CATEGORY_KEYS.map((c) => {
              const active = c === category
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={active}
                  className={cn(
                    "ar-lift rounded-md border px-2.5 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em]",
                    active
                      ? "border-ar-cyan/50 bg-ar-cyan/[.18] text-ar-cyan"
                      : "border-white/[.08] bg-white/[.04] text-ar-ink-dim hover:text-ar-ink",
                  )}
                >
                  {t(c)}
                </button>
              )
            })}
          </div>
        }
      />
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((game) => (
          <CabinetCard key={game.id} game={game} />
        ))}
      </div>
    </section>
  )
}
