// PAPER.

import { useLocale, useTranslations } from "next-intl"
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
  const t = useTranslations("pasaporte")
  const locale = useLocale()

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("competiciones.eyebrow")} title={t("competiciones.title")} />
        <div className="grid grid-cols-4 gap-[1.125rem]">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[6rem] rounded-full" />
          ))}
        </div>
      </>
    )
  }

  const events = (achievements ?? []).filter(isCompetition)

  if (events.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("competiciones.eyebrow")} title={t("competiciones.title")} />
        <EmptyState icon="trophy" title={t("competiciones.empty.title")} sub={t("competiciones.empty.sub")} />
      </>
    )
  }

  return (
    <>
      <PageHead eyebrow={t("competiciones.eyebrow")} title={t("competiciones.title")} />

      <p className="mb-3 text-[0.75rem] text-ps-ink-soft">{t("competiciones.intro")}</p>

      <div className="grid grid-cols-4 justify-items-center gap-[1.125rem]">
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
                  "max-w-[5.75rem] text-[0.625rem] leading-[1.1]",
                  earned ? "text-ps-ink-soft" : "text-ps-ink-faint",
                )}
              >
                {event.name}
              </span>
              <span className="ps-num font-ps-mono text-[0.5625rem] text-ps-ink-faint">
                {earned ? docDate(event.completedAt, locale) : t("competiciones.locked")}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
