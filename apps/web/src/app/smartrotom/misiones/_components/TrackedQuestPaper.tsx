"use client"

import { useTranslations } from "next-intl"
import type { NPC, QuestData, Region } from "../_types"
import { spriteName } from "../_utils/items"
import { nextObjective, questProgress } from "../_utils/quests"
import { normalizeStatus, SEAL_TEXT, STATUS_LABEL_KEY } from "../_utils/status"
import { Bar, Button, FlourishCorners, Icon, ItemSprite, Label, Nail, NpcPortrait, Paper, Ribbon, Sparkles, WaxSeal } from "./ui"

/**
 * The centrepiece of the tablón: the quest you are on, nailed at four corners
 * under a ribbon. "Tracked" is a local choice, not a server field — see
 * `_hooks/useBoard`.
 */
export function TrackedQuestPaper({
  quest,
  npc,
  region,
  onOpen,
}: {
  quest: QuestData
  npc?: NPC
  region?: Region
  onOpen: () => void
}) {
  const t = useTranslations("misiones.trackedQuest")
  const tStatus = useTranslations("misiones")
  const status = normalizeStatus(quest)
  const progress = questProgress(quest)
  const next = nextObjective(quest)
  const level = quest.requirements?.requiredLevel
  const rewards = quest.rewards ?? []

  return (
    <Paper tilt={-0.5} className="relative cursor-pointer px-[1.875rem] pb-[1.375rem] pt-[1.625rem]" onClick={onOpen}>
      <Sparkles count={9} />

      <div className="absolute -top-7 left-1/2 z-[8] -translate-x-1/2">
        <Ribbon color="rgb(var(--ms-stamp-red))" width={260} height={48}>
          {t("ribbon")}
        </Ribbon>
      </div>

      <span className="absolute left-2.5 top-2.5">
        <Nail size={14} />
      </span>
      <span className="absolute right-2.5 top-2.5">
        <Nail size={14} />
      </span>
      <span className="absolute bottom-2.5 left-2.5">
        <Nail size={14} />
      </span>
      <span className="absolute bottom-2.5 right-2.5">
        <Nail size={14} />
      </span>

      <FlourishCorners size={32} offset={20} className="text-ms-gold-3/70" />

      <div className="mt-3.5 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="relative shrink-0">
          <NpcPortrait skin={npc?.skin} size={68} ring />
          <span className="absolute -bottom-2 -right-2">
            <WaxSeal status={status} size={34} tilt={-12} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <Label className={SEAL_TEXT[status]}>
            {tStatus(STATUS_LABEL_KEY[status])}
            {level > 0 && t("level", { level })}
            {quest.repeatable && t("repeatable")}
          </Label>
          <h2 className="mb-1.5 mt-1 font-ms-display text-[1.75rem] leading-tight text-ms-ink-1">{quest.name}</h2>

          <div className="mb-3 flex flex-wrap items-center gap-2 text-[0.8125rem] italic text-ms-ink-3">
            <Icon.Quill size={12} />
            <span>{t("commissionedBy")}</span>
            <strong className="font-semibold not-italic text-ms-ink-2">{npc?.name || t("unknown")}</strong>
            {region && (
              <>
                <span className="opacity-50">·</span>
                <Icon.Pin size={12} />
                <span>{region.name}</span>
              </>
            )}
          </div>

          {next && (
            <div className="mb-3 flex items-center gap-3 rounded-sm border border-ms-ink-1/30 bg-[rgba(255,240,200,.5)] px-3.5 py-2.5">
              <Icon.Target size={16} />
              <div className="min-w-0 flex-1">
                <div className="font-ms-uppercase text-[0.6875rem] uppercase tracking-[.12em] text-ms-ink-3">{t("next")}</div>
                <div className="truncate text-sm font-medium text-ms-ink-1">{next.name}</div>
              </div>
              <span className="shrink-0 font-ms-mono text-sm text-ms-ink-2">
                {next.progress}/{next.total}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3.5">
            <Bar gold value={progress.pct} className="min-w-[7.5rem] flex-1" />
            <span className="font-ms-uppercase text-xs uppercase tracking-[.08em] text-ms-gold-3">
              {progress.pct}%
            </span>
            {rewards.length > 0 && (
              <span className="flex items-center gap-1" aria-label={t("rewardsAria")}>
                {rewards.slice(0, 3).map((reward) => (
                  <ItemSprite key={reward.item} name={spriteName(reward.item)} size={20} />
                ))}
              </span>
            )}
            <Button
              variant="primary"
              onClick={(event) => {
                event.stopPropagation()
                onOpen()
              }}
            >
              <Icon.Quill size={12} /> {t("continue")}
            </Button>
          </div>
        </div>
      </div>
    </Paper>
  )
}
