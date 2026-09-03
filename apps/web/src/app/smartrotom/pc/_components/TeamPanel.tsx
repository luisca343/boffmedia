"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { useMons } from "../_hooks/queries"
import type { Mon } from "../_types/pc.types"
import { PARTY_SIZE } from "../_utils/constants"
import { Chip, Icon } from "./ui"
import { TeamRow } from "./TeamRow"

/** The live in-game party. Six rows, every one of them a drop target. */
export function TeamPanel() {
  const t = useTranslations("pc")
  const { mons, partyError } = useMons()

  const party = useMemo(() => {
    const slots: (Mon | null)[] = Array.from({ length: PARTY_SIZE }, () => null)
    for (const m of mons) {
      if (m.loc.kind !== "party") continue
      if (m.loc.index < 0 || m.loc.index >= PARTY_SIZE) continue
      slots[m.loc.index] = m
    }
    return slots
  }, [mons])

  const filled = party.filter(Boolean).length

  // The game server 500s on `/team` for a trainer who has never had a party. That is a
  // dead panel, not a dead app — storage still works, so the failure is reported here
  // rather than blanking the board.
  if (partyError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2.5 p-6 text-center">
        <Icon name="wifiOff" size={26} className="text-pc-fg-subtle" />
        <p className="text-[0.78125rem] text-pc-fg-muted">{t("team.loadError")}</p>
        <p className="text-[0.71875rem] text-pc-fg-subtle">
          {t("team.loadErrorBody")}
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-[0.4375rem] overflow-auto p-[0.6875rem]">
      <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
        <span className="text-[0.71875rem] text-pc-fg-subtle">{t("team.inCombat", { count: filled })}</span>
        <Chip className="text-[0.625rem]">
          <Icon name="info" size={11} />
          {t("team.dragHint")}
        </Chip>
      </div>
      {party.map((mon, i) => (
        <TeamRow key={i} mon={mon} index={i} />
      ))}
    </div>
  )
}
