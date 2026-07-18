// PAPER.

import { useTranslations } from "next-intl"
import type { UserAchievement } from "@boffmedia/shared"
import { cn } from "@/lib/utils"
import { badgeArt, circuitsOf, isEarned, isGym, sealInk } from "../../_utils/medals"
import { Bar, Card, EmptyState, PageHead, SectionLabel, Skeleton, WaxSeal, toast } from "../ui"

/** "Circuito de Kanto" reads as "Kanto" once it is under a heading that already says circuit. */
function shortCircuit(name: string): string {
  return name.replace(/^Circuito de\s+/i, "")
}

function shortBadge(name: string): string {
  return name.replace(/^Gimnasio\s+/i, "")
}

export function Medallas({
  achievements,
  loading,
  onOpenBadge,
}: {
  achievements?: UserAchievement[] | null
  loading: boolean
  /** Flips to that badge's own leaf. */
  onOpenBadge: (id: string) => void
}) {
  const t = useTranslations("pasaporte")

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("medallas.eyebrow")} title={t("medallas.title")} />
        <Skeleton className="mb-3 h-[62px]" />
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="mb-3 h-[110px]" />
        ))}
      </>
    )
  }

  const gyms = (achievements ?? []).filter(isGym)
  const circuits = circuitsOf(achievements ?? [], t)
  const done = gyms.filter(isEarned).length

  if (gyms.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("medallas.eyebrow")} title={t("medallas.title")} />
        <EmptyState icon="medal" title={t("medallas.empty.title")} sub={t("medallas.empty.sub")} />
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow={t("medallas.eyebrow")} title={t("medallas.title")} />

      <Card className="mb-3 px-3.5 py-[11px]">
        <div className="mb-[7px] flex items-center justify-between gap-2">
          <span className="font-ps-ceremony text-[15px]">{t("medallas.badgesEarned")}</span>
          <span className="ps-num font-ps-mono text-[13px] text-ps-ink-soft">
            <b className="text-[18px] text-ps-ink">{done}</b>/{gyms.length}
          </span>
        </div>
        <Bar value={done} max={gyms.length} label={t("medallas.badgesCount", { done, total: gyms.length })} />
      </Card>

      {/* Three circuits of nine badges do not fit one leaf, and a passport that hides two
          thirds of a trainer's gyms is worse than one that scrolls. */}
      <div className="ps-scroll min-h-0 flex-1 overflow-y-auto pb-7 pr-1">
      {circuits.map((circuit) => (
        <section key={circuit.name} className="mb-3.5">
          <SectionLabel className="text-[13px]" count={`${circuit.done}/${circuit.badges.length} · ${circuit.pct}%`}>
            {shortCircuit(circuit.name)}
          </SectionLabel>
          <Bar
            value={circuit.done}
            max={circuit.badges.length}
            thin
            className="mb-3"
            label={t("medallas.circuitBar", { name: shortCircuit(circuit.name), pct: circuit.pct })}
          />

          <div className="grid grid-cols-5 justify-items-center gap-x-1.5 gap-y-3">
            {circuit.badges.map((badge) => {
              const earned = isEarned(badge)
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => (earned ? onOpenBadge(badge.id) : toast(t("medallas.unsealedToast")))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg p-0.5",
                    "transition-transform duration-200 hover:-translate-y-[3px] hover:scale-105 motion-reduce:transition-none motion-reduce:hover:transform-none",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter",
                  )}
                >
                  <WaxSeal
                    src={badgeArt(badge.icon)}
                    alt={badge.name}
                    earned={earned}
                    size={44}
                    tint={sealInk(badge.id)}
                  />
                  <span
                    className={cn(
                      "max-w-[76px] text-center text-[9.5px] leading-[1.05]",
                      earned ? "text-ps-ink-soft" : "text-ps-ink-faint",
                    )}
                  >
                    {shortBadge(badge.name)}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
      </div>
    </>
  )
}
