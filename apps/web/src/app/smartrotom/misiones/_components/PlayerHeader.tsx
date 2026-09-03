"use client"

import { useTranslations } from "next-intl"
import { useBoffSession } from "@/services/useBoffSession"
import { useRotomUsername } from "@/components/smartrotom/behavior/useRotomUuid"
import type { QuestData, Region } from "../_types"
import { questCounts } from "../_utils/quests"
import { Bar, FlourishCorners, Label, Nail, Paper, Shield } from "./ui"

/**
 * "Bitácora del aventurero" — who is reading the board.
 *
 * A level, an XP bar, badges and hours played do not exist in the quest API, so
 * none of them are invented here ([deferred] — see
 * docs/smartrotom/deferred/README.md). Every figure below is counted from the
 * player's own quests, and the name is the real Minecraft account on the
 * session.
 */
export function PlayerHeader({ quests, regions }: { quests: QuestData[]; regions: Region[] }) {
  const t = useTranslations("misiones.playerHeader")
  const { session } = useBoffSession()
  const user = session?.user
  const name = useRotomUsername() || user?.username || t("defaultName")
  const avatar = user?.profilePicture || user?.image

  const counts = questCounts(quests)
  const completed = counts.COMPLETED ?? 0
  const total = quests.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const tablets = [
    { label: t("active"), value: counts.ACTIVE ?? 0, className: "text-ms-seal-active" },
    { label: t("available"), value: counts.AVAILABLE ?? 0, className: "text-ms-seal-available" },
    { label: t("sealed"), value: counts.LOCKED ?? 0, className: "text-ms-seal-locked" },
    { label: t("kingdoms"), value: regions.length, className: "text-ms-gold-3" },
  ]

  return (
    <Paper tilt={-0.4} className="relative mb-7 px-[1.375rem] py-[1.125rem]">
      <span className="absolute left-3.5 top-2">
        <Nail size={14} />
      </span>
      <span className="absolute right-3.5 top-2">
        <Nail size={14} />
      </span>
      <FlourishCorners size={28} offset={4} className="text-ms-gold-3/55" />

      <div className="flex flex-wrap items-center gap-5">
        <div className="relative shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              width={72}
              height={72}
              className="h-[4.5rem] w-[4.5rem] object-cover shadow-[1px_2px_2px_rgba(0,0,0,.45)] ring-[1.5px] ring-inset ring-ms-gold-2"
            />
          ) : (
            <div className="grid h-[4.5rem] w-[4.5rem] place-items-center bg-ms-ink-2/20 font-ms-display text-3xl text-ms-ink-2 ring-[1.5px] ring-inset ring-ms-gold-2">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* The shield carries the only rank the game actually grants: how many
              encargos this adventurer has closed. */}
          <span className="absolute -bottom-2 -right-2">
            <Shield size={32}>{completed}</Shield>
          </span>
        </div>

        <div className="min-w-0 flex-[1_1_240px]">
          <Label className="text-ms-gold-3">{t("adventurerLog")}</Label>
          <h1 className="my-0.5 font-ms-display text-[1.75rem] leading-tight text-ms-ink-1">{name}</h1>
          <div className="text-[0.8125rem] italic text-ms-ink-3">
            {regions.length > 0
              ? t("questsInKingdoms", { count: regions.length })
              : t("noQuests")}
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex justify-between font-ms-uppercase text-[0.625rem] uppercase tracking-[.14em] text-ms-ink-3">
              <span>{t("completedQuests")}</span>
              <span className="text-ms-gold-3">
                {completed} / {total}
              </span>
            </div>
            <Bar gold value={pct} />
          </div>
        </div>

        <div className="grid flex-[1_1_320px] grid-cols-4 gap-2.5">
          {tablets.map((tablet) => (
            <div
              key={tablet.label}
              className="rounded-sm border border-ms-ink-1/20 bg-ms-ink-1/[.08] px-1.5 py-2.5 text-center"
            >
              <div className={`font-ms-display text-[1.375rem] leading-none ${tablet.className}`}>{tablet.value}</div>
              <Label className="mt-1">{tablet.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-ms-ink-1/[.28] pt-3 font-ms-uppercase text-[0.6875rem] uppercase tracking-[.12em] text-ms-ink-3">
        <span>{t("inn")}</span>
        <span>{t("questsOnBoard", { count: total })}</span>
      </div>
    </Paper>
  )
}
