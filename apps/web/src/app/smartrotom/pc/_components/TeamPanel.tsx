"use client"

import { useMemo } from "react"
import { useMons } from "../_hooks/queries"
import type { Mon } from "../_types/pc.types"
import { PARTY_SIZE } from "../_utils/constants"
import { Chip, Icon } from "./ui"
import { TeamRow } from "./TeamRow"

/** The live in-game party. Six rows, every one of them a drop target. */
export function TeamPanel() {
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
        <p className="text-[12.5px] text-pc-fg-muted">No se pudo leer tu equipo</p>
        <p className="text-[11.5px] text-pc-fg-subtle">
          El servidor de juego no respondió. Tus cajas siguen disponibles.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-[7px] overflow-auto p-[11px]">
      <div className="flex items-center justify-between px-1 pb-1 pt-0.5">
        <span className="text-[11.5px] text-pc-fg-subtle">{filled}/6 en combate</span>
        <Chip className="text-[10px]">
          <Icon name="info" size={11} />
          arrastra para ordenar
        </Chip>
      </div>
      {party.map((mon, i) => (
        <TeamRow key={i} mon={mon} index={i} />
      ))}
    </div>
  )
}
