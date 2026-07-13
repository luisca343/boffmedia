"use client"

import { useBoffSession } from "@/services/useBoffSession"
import type { QuestData, Region } from "../_types"
import { questCounts } from "../_utils/quests"
import { Bar, FlourishCorners, Label, Nail, Paper, Shield } from "./ui"

/**
 * "Bitácora del aventurero" — who is reading the board.
 *
 * The handoff's adventurer carries a level, an XP bar, badges and hours played.
 * None of that exists in the quest API, so none of it is invented here
 * ([deferred] — see docs/smartrotom/deferred/README.md). Every figure below is
 * counted from the player's own quests, and the name is the real Minecraft
 * account on the session.
 */
export function PlayerHeader({ quests, regions }: { quests: QuestData[]; regions: Region[] }) {
  const { session } = useBoffSession()
  const user = session?.user
  const name = user?.smartRotomUser?.username || user?.username || "Aventurero"
  const avatar = user?.profilePicture || user?.image

  const counts = questCounts(quests)
  const completed = counts.COMPLETED ?? 0
  const total = quests.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const tablets = [
    { label: "Vigentes", value: counts.ACTIVE ?? 0, className: "text-ms-seal-active" },
    { label: "Disponibles", value: counts.AVAILABLE ?? 0, className: "text-ms-seal-available" },
    { label: "Selladas", value: counts.LOCKED ?? 0, className: "text-ms-seal-locked" },
    { label: "Reinos", value: regions.length, className: "text-ms-gold-3" },
  ]

  return (
    <Paper tilt={-0.4} className="relative mb-7 px-[22px] py-[18px]">
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
              className="h-[72px] w-[72px] object-cover shadow-[1px_2px_2px_rgba(0,0,0,.45)] ring-[1.5px] ring-inset ring-ms-gold-2"
            />
          ) : (
            <div className="grid h-[72px] w-[72px] place-items-center bg-ms-ink-2/20 font-ms-display text-3xl text-ms-ink-2 ring-[1.5px] ring-inset ring-ms-gold-2">
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
          <Label className="text-ms-gold-3">Bitácora del aventurero</Label>
          <h1 className="my-0.5 font-ms-display text-[28px] leading-tight text-ms-ink-1">{name}</h1>
          <div className="text-[13px] italic text-ms-ink-3">
            {regions.length > 0
              ? `Encargos en ${regions.length} ${regions.length === 1 ? "reino" : "reinos"}`
              : "Sin encargos en el tablón"}
          </div>

          <div className="mt-2.5">
            <div className="mb-1 flex justify-between font-ms-uppercase text-[10px] uppercase tracking-[.14em] text-ms-ink-3">
              <span>Encargos cumplidos</span>
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
              <div className={`font-ms-display text-[22px] leading-none ${tablet.className}`}>{tablet.value}</div>
              <Label className="mt-1">{tablet.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2.5 border-t border-dashed border-ms-ink-1/[.28] pt-3 font-ms-uppercase text-[11px] uppercase tracking-[.12em] text-ms-ink-3">
        <span>❦ Posada del Rotom</span>
        <span>⚔ {total} encargos en el tablón</span>
      </div>
    </Paper>
  )
}
