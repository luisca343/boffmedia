"use client"

import Link from "next/link"
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { DailyRewardItem } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import { useArcadeStreak, useClaimDailyReward, useRewardsBanner } from "../_hooks/queries"
import { useCountdown } from "../_hooks/useCountdown"
import { rewardTone, rewardView } from "../_utils/rewards"
import {
  Button,
  ClaimCelebration,
  Icon,
  Panel,
  Skeleton,
  type ArCelebrationReward,
  type ArTone,
} from "./ui"

type DayState = "claimed" | "today" | "locked"

// Full literal classes per tone — a `border-${tone}` would silently never compile.
const TILE_TONE: Record<ArTone, string> = {
  cyan: "border-ar-cyan bg-[linear-gradient(180deg,rgb(var(--ar-cyan)/.12),rgb(0_0_0/.4))] shadow-[0_0_20px_rgb(var(--ar-cyan)/.35)]",
  magenta:
    "border-ar-magenta-2 bg-[linear-gradient(180deg,rgb(var(--ar-magenta)/.14),rgb(0_0_0/.4))] shadow-[0_0_20px_rgb(var(--ar-magenta)/.35)]",
  violet:
    "border-ar-violet-2 bg-[linear-gradient(180deg,rgb(var(--ar-violet)/.16),rgb(0_0_0/.4))] shadow-[0_0_20px_rgb(var(--ar-violet)/.35)]",
  amber:
    "border-ar-amber bg-[linear-gradient(180deg,rgb(var(--ar-amber)/.16),rgb(0_0_0/.4))] shadow-[0_0_20px_rgb(var(--ar-amber)/.35)]",
  lime: "border-ar-lime bg-[linear-gradient(180deg,rgb(var(--ar-lime)/.14),rgb(0_0_0/.4))] shadow-[0_0_20px_rgb(var(--ar-lime)/.35)]",
  ghost: "border-white/20 bg-white/[.03]",
}

const RING_TONE: Record<ArTone, string> = {
  cyan: "border-ar-cyan",
  magenta: "border-ar-magenta-2",
  violet: "border-ar-violet-2",
  amber: "border-ar-amber",
  lime: "border-ar-lime",
  ghost: "border-white/20",
}

const TEXT_TONE: Record<ArTone, string> = {
  cyan: "text-ar-cyan",
  magenta: "text-ar-magenta-2",
  violet: "text-ar-violet-2",
  amber: "text-ar-amber",
  lime: "text-ar-lime",
  ghost: "text-ar-ink-muted",
}

export function DayTile({
  reward,
  state,
  size = "sm",
}: {
  reward: DailyRewardItem
  state: DayState
  size?: "sm" | "lg"
}) {
  const t = useTranslations("arcade")
  const view = rewardView(reward, t, size === "lg" ? 44 : 32)
  const tone = rewardTone(reward)
  const isToday = state === "today"

  return (
    <div
      className={cn(
        "relative rounded-[10px] border p-2.5 text-center",
        size === "lg" && "flex min-h-[140px] flex-col justify-between rounded-[14px] p-3.5",
        isToday
          ? TILE_TONE[tone]
          : state === "claimed"
            ? "border-ar-lime/30 bg-black/45 opacity-70"
            : "border-dashed border-white/10 bg-white/[.02]",
      )}
    >
      {isToday && (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -inset-0.5 rounded-[11px] border-2 motion-reduce:animate-none animate-ar-ring",
            RING_TONE[tone],
          )}
        />
      )}

      <div
        className={cn(
          "mb-2 font-ar-display text-[8px]",
          isToday ? TEXT_TONE[tone] : "text-ar-ink-muted",
        )}
      >
        {t("common.day", { day: reward.day })}
      </div>

      <div
        className={cn(
          "mx-auto mb-2 grid place-items-center overflow-hidden rounded-lg border",
          size === "lg" ? "h-[60px] w-[60px]" : "h-9 w-9",
          isToday ? RING_TONE[tone] : "border-white/10",
          TEXT_TONE[tone],
        )}
      >
        {view.art}
      </div>

      <div
        className={cn(
          "truncate font-ar-mono text-[10px]",
          isToday ? "text-ar-ink" : "text-ar-ink-dim",
        )}
        title={view.label}
      >
        {view.label}
      </div>

      {state === "claimed" && (
        <div aria-label={t("common.claimed")} className="absolute right-1.5 top-1.5 text-[10px] text-ar-lime">
          ✓
        </div>
      )}
    </div>
  )
}

export const dayState = (day: number, currentDay: number, claimedToday: boolean): DayState => {
  if (day < currentDay) return "claimed"
  if (day === currentDay) return claimedToday ? "claimed" : "today"
  return "locked"
}

/** The compact 7-day rail on the hub. The full view lives at /arcade/racha. */
export function StreakRail() {
  const t = useTranslations("arcade")
  const streak = useArcadeStreak()
  const banner = useRewardsBanner()
  const claim = useClaimDailyReward()
  const resetIn = useCountdown(streak.data?.nextResetTime)
  const [celebration, setCelebration] = useState<ArCelebrationReward | null>(null)

  const rewards = banner.data?.rewards ?? []
  const currentDay = streak.data?.currentDay ?? 0
  const claimedToday = streak.data?.claimedToday ?? false

  const onClaim = async () => {
    const result = await claim.mutateAsync()
    const reward = result?.reward as DailyRewardItem | undefined
    if (!reward) return
    const view = rewardView(reward, t, 64)
    setCelebration({
      name: view.label,
      // The API does not rank daily rewards, so the celebration frames every one
      // at the same tier rather than inventing a rarity for it.
      rarity: "rare",
      amount: ["coins", "money"].includes(String(reward.type).toLowerCase()) ? reward.amount : null,
      art: view.art,
    })
  }

  if (streak.isLoading || banner.isLoading) {
    return (
      <Panel tone="deep" className="mb-[22px]">
        <Skeleton className="mb-3.5 h-10 w-full" />
        <div className="grid grid-cols-7 gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[104px]" />
          ))}
        </div>
      </Panel>
    )
  }

  if (!rewards.length) return null

  return (
    <Panel tone="deep" className="mb-[22px]">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="mb-1.5 font-ar-display text-[9px] uppercase tracking-[0.18em] text-ar-cyan">
            {t("streak.weeklyStreak", { current: currentDay, total: streak.data?.totalDays ?? 7 })}
          </div>
          <h3 className="font-ar-display text-sm leading-relaxed text-ar-ink">
            {streak.data?.currentBanner ?? banner.data?.name}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {resetIn && (
            <span className="font-ar-mono text-[11px] text-ar-ink-dim">
              <span className="text-ar-ink-muted">{t("streak.resetsIn", { time: resetIn })}</span>{" "}
              <b className="text-ar-amber">{resetIn}</b>
            </span>
          )}
          {claimedToday ? (
            <Link
              href="/smartrotom/arcade/racha"
              className="ar-lift inline-flex items-center gap-1.5 rounded-lg border border-ar-lime/40 bg-ar-lime/[.12] px-3 py-1.5 font-ar text-[11px] font-semibold uppercase tracking-[0.08em] text-ar-lime"
            >
              <Icon.Shield s={12} /> {t("streak.dayClaimed", { day: currentDay })}
            </Link>
          ) : (
            <Button
              variant="cyan"
              size="sm"
              icon={<Icon.Sparkle s={12} />}
              onClick={onClaim}
              disabled={claim.isPending}
            >
              {claim.isPending ? t("streak.claiming") : t("streak.claimDay", { day: currentDay })}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {rewards.map((reward) => (
          <DayTile
            key={reward.day}
            reward={reward}
            state={dayState(reward.day, currentDay, claimedToday)}
          />
        ))}
      </div>

      {claim.isError && (
        <p role="alert" className="mt-3 font-ar-mono text-[11px] text-ar-danger">
          {t("streak.claimError")}
        </p>
      )}

      <ClaimCelebration reward={celebration} onClose={() => setCelebration(null)} />
    </Panel>
  )
}
