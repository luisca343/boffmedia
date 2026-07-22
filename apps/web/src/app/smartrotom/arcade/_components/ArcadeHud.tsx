"use client"

import type { ArcadeStreak } from "@boffmedia/shared"
import { useTranslations } from "next-intl"
import { useBoffSession } from "@/services/useBoffSession"
import { useRotomUsername } from "@/components/smartrotom/behavior/useRotomUuid"
import { useCountdown } from "../_hooks/useCountdown"
import { Icon, ProgressBar, Ring, Skeleton, Tag } from "./ui"

export interface ArcadeHudProps {
  streak: ArcadeStreak | undefined
  boxesOwned: number
  loading: boolean
  /** True while any arcade query is in flight — drives the sync pill. */
  syncing: boolean
}

/**
 * The persistent player HUD.
 *
 * The handoff's HUD reads level, XP, a coin balance and a daily multiplier. None
 * of those exist: the arcade stores a streak and an item inventory and nothing
 * else, so this shows the week's real progress instead of a fabricated level.
 * The dropped fields are catalogued in docs/smartrotom/deferred/arcade.md (§9 —
 * derive, defer, or ask; never invent).
 */
export function ArcadeHud({ streak, boxesOwned, loading, syncing }: ArcadeHudProps) {
  const t = useTranslations("arcade")
  const { session } = useBoffSession()
  const resetIn = useCountdown(streak?.nextResetTime)

  const name = useRotomUsername() ?? session?.user?.username ?? t("hud.trainerFallback")
  const currentDay = streak?.currentDay ?? 0
  const totalDays = streak?.totalDays ?? 7

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ar-violet/[.18] bg-[linear-gradient(180deg,rgb(20_10_52/.85),rgb(8_4_24/.85))] px-[18px] py-3">
      <div className="flex items-center gap-3.5">
        {loading ? (
          <Skeleton className="h-[46px] w-[46px] rounded-full" />
        ) : (
          <Ring
            label={currentDay}
            value={currentDay}
            max={totalDays}
            tone="cyan"
            title={t("hud.streakDay")}
          />
        )}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-ar text-[15px] font-bold text-ar-ink">{name}</span>
            {streak?.currentBanner && (
              <span className="font-ar-mono text-[11px] text-ar-ink-muted">{streak.currentBanner}</span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="w-[140px]">
              <ProgressBar
                value={currentDay}
                max={totalDays}
                tone="cyan"
                height={6}
                label={t("hud.weeklyStreakProgress")}
              />
            </div>
            <span className="font-ar-mono text-[10px] tabular-nums text-ar-ink-muted">
              DÍA {currentDay}/{totalDays}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {streak && !streak.claimedToday && (
          <Tag tone="amber" size="md">
            <Icon.Sparkle s={13} /> {t("hud.rewardReady")}
          </Tag>
        )}
        {boxesOwned > 0 && (
          <Tag tone="violet" size="md">
            <Icon.Box s={13} /> {boxesOwned} {t("hud.box", { count: boxesOwned })}
          </Tag>
        )}
        {resetIn && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-ar-amber/35 bg-black/45 px-2.5 py-1.5 font-ar-mono text-[11px] font-bold tabular-nums text-ar-amber">
            {t("hud.resetsIn", { resetIn })}
          </span>
        )}
        <span className="inline-flex items-center gap-[7px] rounded-lg border border-ar-lime/30 bg-black/35 px-2.5 py-1.5 font-ar-mono text-[11px] text-ar-lime">
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-ar-lime shadow-[0_0_8px_rgb(var(--ar-lime))] motion-reduce:animate-none animate-ar-pulse"
          />
          {syncing ? t("hud.syncing") : t("hud.synced")}
        </span>
      </div>
    </div>
  )
}
