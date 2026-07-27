"use client"

import { useTranslations } from "next-intl"
import { Panel } from "../../_components/ui"

interface ScoreboardProps {
  roundScore: number
  totalCoins: number
  level: number
}

/**
 * The cabinet's score readout. The big figure is the round multiplier — the one
 * a Voltorb takes away — with the level and the banked total underneath.
 */
export default function Scoreboard({ roundScore, totalCoins, level }: ScoreboardProps) {
  const t = useTranslations("arcade")
  return (
    <Panel tone="cyan" tight>
      <div className="mb-2 font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-cyan">
        {t("voltorb.score")}
      </div>
      <div
        key={roundScore}
        className="ar-glow-cyan animate-ar-pop py-2.5 text-center font-ar-display text-[26px] tabular-nums text-ar-ink motion-reduce:animate-none sm:text-[32px]"
      >
        <span className="text-ar-cyan">×</span>
        {roundScore}
      </div>
      <div className="mt-2 flex items-center justify-between font-ar-mono text-[11px] text-ar-ink-dim">
        <span>
          {t("voltorb.level")} <b className="text-ar-ink">{level}</b>
        </span>
        <span>
          {t("voltorb.total")} <b className="tabular-nums text-ar-amber">{totalCoins}</b>
        </span>
      </div>
    </Panel>
  )
}
