"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { chapterVars } from "@/app/smartrotom/pasaporte/_utils/chapters"
import type { ChapterAccent, TravelStamp } from "@/app/smartrotom/pasaporte/_types"

/**
 * Pasaporte's showcase module: the paper surface, and the demo document the specimens are
 * printed with. The showcase never fetches — every figure below is invented FOR THE
 * SHOWCASE and none of it comes from, or goes to, the API.
 */

// ── The second surface ──────────────────────────────────────────────────────
/**
 * Pasaporte is the only system with TWO materials inside one scope root: the dark walnut
 * DESK (topbar, nav, inspection chrome, the replay sheet) and the light cream PAPER inside
 * the book. `Sample app="ps"` gives you the desk, because that is what `.ps-app` paints.
 * A page primitive laid straight on it would be invisible — `text-ps-ink` is near-black —
 * so every paper specimen is laid on a `Leaf` first.
 *
 * It is the same `.ps-paper-surface` the real book prints on (guilloché, grain, foxing),
 * and it carries the chapter's ink pair, so `text-ps-chapter-deep` resolves inside it
 * exactly as it does on a real leaf.
 */
export function Leaf({
  accent = "oxblood",
  className,
  children,
}: {
  accent?: ChapterAccent
  className?: string
  children: ReactNode
}) {
  return (
    <div
      style={chapterVars(accent)}
      className={cn(
        "ps-paper-surface relative w-full overflow-hidden rounded-[6px] border border-ps-ink/22",
        "px-[1.625rem] py-[1.375rem] font-ps text-ps-ink shadow-[0_10px_30px_rgba(0,0,0,.45)]",
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── The demo document ───────────────────────────────────────────────────────
/** Shaped like `PasaporteProfileEntity`, but every value here is invented. */
export const PS_DEMO_PROFILE = {
  uuid: "6a1f0c2e-9d44-4b71-8f3a-2c7e51b0d9a8",
  username: "Luisca",
  trainerId: "TRS-7741-K",
  region: "Fukitsu",
  memberSince: "2024-03-14T10:00:00.000Z",
  createdAt: "2024-03-14T10:00:00.000Z",
  rank: 6,
  title: "Entrenador Veterano",
  completionPct: 62,
}

/** The two ICAO lines the `Mrz` strip prints. Produced by `_utils/mrz.ts` from the above. */
export const PS_DEMO_MRZ = [
  "P<TRSFUK<LUISCA<<FUKITSU<<<<<<<<<<<<<<<<<<<<",
  "TRS7741K<FUK2024M<<<RANK06<<<COMP062<<<<<<<<",
]

/**
 * Gym badges, as `Medallas` and the `BadgePage` receive them. The `icon` goes through
 * `badgeArt()` to the API's real artwork; when it 404s the seal falls back to a shield, which
 * is the behaviour worth seeing anyway. The wax is `sealInk(id)` — a hash, not a column.
 */
export const PS_DEMO_SEALS: { id: string; icon: string; name: string; earned: boolean }[] = [
  { id: "gym_roca", icon: "gym_roca", name: "Medalla Roca", earned: true },
  { id: "gym_cascada", icon: "gym_cascada", name: "Medalla Cascada", earned: true },
  { id: "gym_trueno", icon: "gym_trueno", name: "Medalla Trueno", earned: true },
  { id: "gym_alma", icon: "gym_alma", name: "Medalla Alma", earned: false },
]

/** Visados and gym stamps, as `_utils/bitacora.ts` derives them from real dated events. */
export const PS_DEMO_STAMPS: TravelStamp[] = [
  {
    id: "viaje:ciudad-plateada",
    place: "CIUDAD PLATEADA",
    sub: "VISADO · ENTRADA",
    date: "2024-04-02T09:12:00.000Z",
    kind: "viaje",
    shape: "circle",
    rot: -6,
  },
  {
    id: "logro:gym_roca",
    place: "MEDALLA ROCA",
    sub: "GIMNASIO · ROCA",
    date: "2024-05-19T17:40:00.000Z",
    kind: "gimnasio",
    shape: "oval",
    rot: 4,
  },
  {
    id: "logro:liga_fukitsu",
    place: "LIGA DE FUKITSU",
    sub: "LIGA · CAMPEÓN",
    date: "2025-11-08T21:05:00.000Z",
    kind: "liga",
    shape: "rect",
    rot: -3,
    gold: true,
  },
]

/** The season the `Sello de Temporada` is struck for. The standing is derived server-side. */
export const PS_DEMO_SEASON = {
  number: 7,
  name: "Ciclo de Otoño",
  tier: "Oro",
  division: "II",
  lp: 640,
  nextAt: 900,
  wins: 41,
  losses: 17,
  streak: 3,
  peakLp: 688,
  regionRank: 12,
}
