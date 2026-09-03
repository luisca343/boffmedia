"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { DailyRewardItem } from "@boffmedia/shared"
import {
  useArcadeInventory,
  useArcadeStreak,
  useClaimDailyReward,
  useLootboxConfig,
  useRewardsBanner,
} from "../_hooks/queries"
import { useCountdown } from "../_hooks/useCountdown"
import { ownedBoxes, resolveBoxes, totalBoxesOwned } from "../_utils/inventory"
import { rewardView } from "../_utils/rewards"
import { DayTile, dayState } from "../_components/StreakRail"
import {
  Button,
  ClaimCelebration,
  Corners,
  Icon,
  Panel,
  SectionTitle,
  Skeleton,
  StatCard,
  Tag,
  type ArCelebrationReward,
} from "../_components/ui"

export default function RachaPage() {
  const t = useTranslations("arcade")
  const streak = useArcadeStreak()
  const banner = useRewardsBanner()
  const inventory = useArcadeInventory()
  const lootConfig = useLootboxConfig()
  const claim = useClaimDailyReward()
  const resetIn = useCountdown(streak.data?.nextResetTime)
  const [celebration, setCelebration] = useState<ArCelebrationReward | null>(null)

  const rewards = banner.data?.rewards ?? []
  const currentDay = streak.data?.currentDay ?? 0
  const totalDays = streak.data?.totalDays ?? 7
  const claimedToday = streak.data?.claimedToday ?? false
  const today = rewards.find((r) => r.day === currentDay)
  const boxes = totalBoxesOwned(ownedBoxes(inventory.data, resolveBoxes(lootConfig.data)))

  const onClaim = async () => {
    if (claim.isPending) return
    const result = await claim.mutateAsync()
    const reward = result?.reward as DailyRewardItem | undefined
    if (!reward) return
    const view = rewardView(reward, t, 64)
    setCelebration({
      name: view.label,
      rarity: "rare",
      amount: ["coins", "money"].includes(String(reward.type).toLowerCase()) ? reward.amount : null,
      art: view.art,
    })
  }

  if (streak.isLoading || banner.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-[13.75rem] rounded-2xl" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[8.75rem] rounded-[14px]" />
          ))}
        </div>
      </div>
    )
  }

  const todayView = today ? rewardView(today, t, 56) : null

  return (
    <>
      <Panel tone="cyan" className="relative mb-5">
        <div aria-hidden className="ar-horizon opacity-45" />
        <Corners tone="cyan" inset={10} size={14} />

        <div className="relative z-[2] grid items-center gap-6 lg:grid-cols-[1fr_22.5rem]">
          <div>
            <div className="mb-2.5 font-ar-display text-[0.625rem] uppercase tracking-[0.18em] text-ar-cyan">
              {t("streak.kicker", {
                banner: streak.data?.currentBanner ?? banner.data?.name ?? "",
              })}
            </div>
            <h1 className="ar-chrom font-ar-display text-[1.625rem] leading-tight text-ar-ink">
              {t.rich("streak.dayHeading", {
                current: currentDay,
                total: totalDays,
                muted: (chunks) => <span className="text-ar-ink-muted">{chunks}</span>,
              })}
            </h1>
            <p className="mt-3 max-w-[32.5rem] font-ar text-[0.8125rem] leading-relaxed text-ar-ink-dim">
              {t("streak.claimDescription")}
            </p>

            <div className="mt-[1.125rem] flex flex-wrap items-center gap-2.5">
              {claimedToday ? (
                <Tag tone="lime" size="lg">
                  <Icon.Shield s={14} /> {t("streak.dayClaimed", { day: currentDay })}
                </Tag>
              ) : (
                <Button
                  variant="cyan"
                  size="md"
                  icon={<Icon.Sparkle s={14} />}
                  onClick={onClaim}
                  disabled={claim.isPending}
                >
                  {claim.isPending
                    ? t("streak.claiming")
                    : t("streak.claimDay", { day: currentDay })}
                </Button>
              )}
              {resetIn && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-ar-amber/35 bg-black/50 px-3 py-2 font-ar-mono text-xs text-ar-amber">
                  <span
                    aria-hidden
                    className="text-ar-magenta-2 motion-reduce:animate-none animate-ar-blink"
                  >
                    ●
                  </span>
                  {t.rich("streak.resetsInStrong", {
                    time: resetIn,
                    b: (chunks) => <b>{chunks}</b>,
                  })}
                </div>
              )}
            </div>

            {claim.isError && (
              <p role="alert" className="mt-3 font-ar-mono text-[0.6875rem] text-ar-danger">
                {t("streak.claimError")}
              </p>
            )}
          </div>

          {todayView && (
            <div className="relative rounded-[14px] border border-ar-cyan/30 bg-black/40 p-[1.125rem]">
              <div className="mb-2.5 text-center font-ar-display text-[0.5625rem] uppercase tracking-[0.18em] text-ar-cyan">
                {t("streak.rewardReady")}
              </div>
              <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-[18px] border border-ar-cyan/40 bg-[radial-gradient(60%_60%_at_50%_40%,rgb(var(--ar-cyan)/.2),transparent_70%)] shadow-[inset_0_0_30px_rgb(var(--ar-cyan)/.3)] motion-reduce:animate-none animate-ar-float">
                {todayView.art}
              </div>
              <div className="ar-chrom mt-3 text-center font-ar-display text-[0.8125rem] leading-relaxed text-ar-ink">
                {todayView.label}
              </div>
            </div>
          )}
        </div>
      </Panel>

      <SectionTitle
        kicker={t("streak.progression", { days: totalDays })}
        title={t("streak.currentWeek")}
        accent="cyan"
      />
      <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {rewards.map((reward) => (
          <DayTile
            key={reward.day}
            reward={reward}
            state={dayState(reward.day, currentDay, claimedToday)}
            size="lg"
          />
        ))}
      </div>

      {/* Every figure here is a real column. The handoff also showed "racha más
          larga" and "reclamado esta semana" — the API stores neither. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          kicker={t("streak.totalStreak")}
          value={streak.data?.streak ?? 0}
          sub={t("streak.totalStreakSub")}
          tone="cyan"
          icon={<Icon.Trophy s={18} />}
        />
        <StatCard
          kicker={t("streak.totalClaims")}
          value={streak.data?.totalClaims ?? 0}
          sub={t("streak.totalClaimsSub")}
          tone="amber"
          icon={<Icon.Calendar s={18} />}
        />
        <StatCard
          kicker={t("streak.unopenedBoxes")}
          value={boxes}
          sub={t("streak.unopenedBoxesSub")}
          tone="violet"
          icon={<Icon.Box s={18} />}
        />
        <StatCard
          kicker={t("streak.nextReset")}
          value={resetIn ?? "—"}
          sub={t("streak.nextResetSub")}
          tone="magenta"
          icon={<Icon.Sparkle s={18} />}
        />
      </div>

      <ClaimCelebration reward={celebration} onClose={() => setCelebration(null)} />
    </>
  )
}
