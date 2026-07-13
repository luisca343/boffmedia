// PAPER.

import type { MinecraftStats } from "@/services/api/smartrotom/playerService"
import type { Passport } from "../../_types"
import { deaths, distanceKm, fmt, perMovement, playtime, totalKills } from "../../_utils/stats"
import { mrz } from "../../_utils/mrz"
import { PassportPhoto } from "../PassportPhoto"
import { Card, HoloStamp, Mrz, PageHead, SectionLabel, Skeleton, Stat } from "../ui"

export function Identidad({
  profile,
  stats,
  loading,
  inspect,
}: {
  profile?: Passport | null
  stats?: MinecraftStats | null
  loading: boolean
  inspect: boolean
}) {
  if (loading) {
    return (
      <>
        <PageHead eyebrow="Identidad" title="Datos del Jugador" />
        <div className="flex gap-[18px]">
          <Skeleton className="h-[200px] w-[120px]" />
          <div className="grid flex-1 grid-cols-2 gap-[9px]">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[74px]" />
            ))}
          </div>
        </div>
      </>
    )
  }

  const time = playtime(stats)
  const movement = perMovement(stats)

  return (
    <>
      <PageHead eyebrow="Identidad" title="Datos del Jugador" />

      <div className="flex items-start gap-[18px]">
        <div className="flex-none text-center">
          <div className="rounded-[10px] border border-ps-ink/22 bg-white/40 p-1.5 shadow-[inset_0_0_10px_rgba(80,60,30,.12)]">
            <PassportPhoto uuid={profile?.uuid} />
          </div>
          <p className="mt-[7px] font-ps-ceremony text-[15px]">{profile?.username ?? "—"}</p>
          <p className="font-ps-mono text-[10px] tracking-[.08em] text-ps-ink-faint">{profile?.title ?? ""}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-[9px]">
            <Stat
              icon="clock"
              label="Tiempo de juego"
              value={`${time.hours}h ${time.minutes}m`}
              sub="En el servidor"
            />
            <Stat icon="trophy" label="Victorias" value={fmt(totalKills(stats))} sub="Enemigos derrotados" />
            <Stat icon="skull" label="Caídas" value={fmt(deaths(stats))} sub="Veces derrotado" />
            <Stat
              icon="foot"
              label="Distancia"
              value={`${fmt(distanceKm(stats))} km`}
              sub="A pie, mar y montura"
            />
          </div>

          <hr className="my-2.5 border-0 border-t border-dashed border-ps-ink/22" />

          <SectionLabel className="text-[13px]">Detalles de Movimiento</SectionLabel>
          <dl className="grid grid-cols-3 gap-x-2 text-[11px]">
            {movement.map((row) => (
              <div
                key={row.key}
                className="flex justify-between gap-2 border-b border-dotted border-ps-ink/22 py-1"
              >
                <dt className="text-ps-ink-soft">{row.label}</dt>
                <dd className="ps-num font-ps-mono font-bold">
                  {fmt(row.value)}
                  {row.unit === "km" && " km"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <HoloStamp show={inspect} />
      {profile && <Mrz lines={mrz(profile, profile.completionPct)} inspecting={inspect} />}
    </>
  )
}
