// PAPER.

import type { UserAchievement } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import { docDate } from "../../_utils/dates"
import { badgeArt, isCompetition, isEarned, sealInk } from "../../_utils/medals"
import { EmptyState, PageHead, Skeleton, WaxSeal } from "../ui"

export function Competiciones({
  achievements,
  loading,
}: {
  achievements?: UserAchievement[] | null
  loading: boolean
}) {
  if (loading) {
    return (
      <>
        <PageHead eyebrow="Ligas & Frente Batalla" title="Competiciones" />
        <div className="grid grid-cols-4 gap-[18px]">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[96px] rounded-full" />
          ))}
        </div>
      </>
    )
  }

  const events = (achievements ?? []).filter(isCompetition)

  if (events.length === 0) {
    return (
      <>
        <PageHead eyebrow="Ligas & Frente Batalla" title="Competiciones" />
        <EmptyState
          icon="trophy"
          title="Sin competiciones"
          sub="El circuito competitivo de Teras aún no ha abierto sus puertas."
        />
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow="Ligas & Frente Batalla" title="Competiciones" />

      <p className="mb-3 text-[12px] text-ps-ink-soft">
        Los grandes desafíos del circuito competitivo de Teras. Cada victoria deja su sello.
      </p>

      <div className="grid grid-cols-4 justify-items-center gap-[18px]">
        {events.map((event) => {
          const earned = isEarned(event)
          return (
            <div key={event.id} className="flex flex-col items-center gap-1.5 text-center">
              <WaxSeal
                src={badgeArt(event.icon)}
                alt={event.name}
                earned={earned}
                size={60}
                tint={sealInk(event.id)}
              />
              <span
                className={cn(
                  "max-w-[92px] text-[10px] leading-[1.1]",
                  earned ? "text-ps-ink-soft" : "text-ps-ink-faint",
                )}
              >
                {event.name}
              </span>
              <span className="ps-num font-ps-mono text-[9px] text-ps-ink-faint">
                {earned ? docDate(event.completedAt) : "Bloqueado"}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
