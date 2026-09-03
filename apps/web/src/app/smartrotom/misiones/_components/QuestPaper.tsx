"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { NPC, QuestData, Region } from "../_types"
import { spriteName } from "../_utils/items"
import { questProgress, tiltFor } from "../_utils/quests"
import { normalizeStatus, SEAL_TEXT, STATUS_LABEL_KEY, STATUS_PAPER_FILTER } from "../_utils/status"
import { Icon, ItemSprite, Label, Nail, NpcPortrait, Paper, Bar, Sparkles, Stamp, TACK_GOLD, TACK_RED, Thumbtack, WaxSeal } from "./ui"

/**
 * One quest, as a paper pinned to the cork. There is no XP, and no usable quest
 * "type" (`type` is an unmapped Pixelmon enum id), so the slots carry what is
 * real: the status seal, the required level, and the actual reward sprites.
 */
export function QuestPaper({
  quest,
  npc,
  region,
  selected,
  onOpen,
}: {
  quest: QuestData
  npc?: NPC
  region?: Region
  selected?: boolean
  onOpen: () => void
}) {
  const t = useTranslations("misiones.questPaper")
  const tStatus = useTranslations("misiones")
  const status = normalizeStatus(quest)
  const progress = questProgress(quest)
  const level = quest.requirements?.requiredLevel
  const rewards = quest.rewards ?? []

  const isActive = status === "ACTIVE"
  const isAvailable = status === "AVAILABLE"
  const showProgress = progress.total > 0 && status !== "LOCKED" && status !== "COMPLETED"

  return (
    <Paper
      tilt={tiltFor(quest.id)}
      className={cn(
        "ms-pinned flex min-h-[13.75rem] flex-col px-[1.375rem] pb-4 pt-5 text-left",
        STATUS_PAPER_FILTER[status],
        selected && "shadow-[inset_0_0_40px_rgba(80,50,20,.18),0_0_0_2px_rgb(var(--ms-gold-2)),0_4px_8px_rgba(0,0,0,.4),0_16px_32px_var(--ms-paper-shadow)]",
      )}
      role="button"
      tabIndex={0}
      aria-label={`${quest.name} — ${tStatus(STATUS_LABEL_KEY[status])}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
    >
      <span className="absolute -top-3 left-1/2 z-[6] -translate-x-1/2">
        {isActive ? (
          <Thumbtack size={20} color={TACK_GOLD} />
        ) : isAvailable ? (
          <Thumbtack size={20} color={TACK_RED} />
        ) : (
          <Nail size={18} />
        )}
      </span>

      {isActive && <Sparkles count={5} />}
      {status === "COMPLETED" && <Stamp kind="completed">{t("completed")}</Stamp>}
      {status === "FAILED" && <Stamp kind="failed">{t("failed")}</Stamp>}

      {status === "LOCKED" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, transparent 48%, rgba(60,30,10,.35) 50%, transparent 52%)," +
              "linear-gradient(45deg, transparent 48%, rgba(60,30,10,.35) 50%, transparent 52%)",
          }}
        />
      )}

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className={SEAL_TEXT[status]}>{tStatus(STATUS_LABEL_KEY[status])}</Label>
        <span className="flex items-center gap-2">
          {quest.repeatable && <Label>{t("repeatable")}</Label>}
          {level > 0 && <Label>{t("level", { level })}</Label>}
        </span>
      </div>

      <h3 className="mb-2 mt-0.5 font-ms-display text-[1.1875rem] leading-[1.15] text-ms-ink-1">{quest.name}</h3>

      <div className="mb-2.5 flex items-center gap-2 text-xs italic text-ms-ink-3">
        <NpcPortrait skin={npc?.skin} size={22} />
        <span className="truncate">
          {t("from", { npc: npc?.name || t("unknown") })}
        </span>
        {region && (
          <>
            <span className="opacity-50">·</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Icon.Map size={11} />
              <span className="truncate">{region.name}</span>
            </span>
          </>
        )}
      </div>

      <p className="mb-3 line-clamp-2 text-[0.8125rem] italic leading-[1.55] text-ms-ink-2">&ldquo;{quest.logText}&rdquo;</p>

      {showProgress && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between font-ms-uppercase text-[0.625rem] uppercase tracking-[.12em] text-ms-ink-3">
            <span>
              {t("objectives", { done: progress.done, total: progress.total })}
            </span>
            <span>{progress.pct}%</span>
          </div>
          <Bar value={progress.pct} />
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-dashed border-ms-ink-1/30 pt-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <Label>{t("reward")}</Label>
          {rewards.length > 0 ? (
            <span className="flex items-center gap-1">
              {rewards.slice(0, 3).map((reward) => (
                <ItemSprite key={reward.item} name={spriteName(reward.item)} size={22} />
              ))}
              {rewards.length > 3 && (
                <span className="font-ms-mono text-xs text-ms-ink-3">+{rewards.length - 3}</span>
              )}
            </span>
          ) : (
            <span className="font-ms-mono text-xs text-ms-ink-3">—</span>
          )}
        </div>
        <WaxSeal status={status} size={42} tilt={-12} />
      </div>
    </Paper>
  )
}
