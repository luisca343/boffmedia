// PAPER.

import { useLocale, useTranslations } from "next-intl"
import type { MinecraftStats } from "@/services/api/smartrotom/playerService"
import { usePassportStore } from "../../_stores/usePassportStore"
import type { Passport } from "../../_types"
import { deaths, distanceKm, fmt, perMovement, playtime, totalKills } from "../../_utils/stats"
import { mrz } from "../../_utils/mrz"
import { PassportPhoto } from "../PassportPhoto"
import { Card, HoloStamp, Mrz, PageHead, SectionLabel, Skeleton, Stat } from "../ui"

export function Identidad({
  profile,
  stats,
  loading,
}: {
  profile?: Passport | null
  stats?: MinecraftStats | null
  loading: boolean
}) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()
  // The lamp is read HERE, not passed down: a prop would put it in the leaf array the book
  // hands to StPageFlip, and that array must not change when the reader toggles anything.
  const inspect = usePassportStore((s) => s.inspect)

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("identidad.eyebrow")} title={t("identidad.title")} />
        <div className="flex gap-[1.125rem]">
          <Skeleton className="h-[12.5rem] w-[7.5rem]" />
          <div className="grid flex-1 grid-cols-2 gap-[0.5625rem]">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[4.625rem]" />
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
      <PageHead eyebrow={t("identidad.eyebrow")} title={t("identidad.title")} />

      <div className="flex items-start gap-[1.125rem]">
        <div className="flex-none text-center">
          <div className="rounded-[10px] border border-ps-ink/22 bg-white/40 p-1.5 shadow-[inset_0_0_10px_rgba(80,60,30,.12)]">
            <PassportPhoto uuid={profile?.uuid} />
          </div>
          <p className="mt-[0.4375rem] font-ps-ceremony text-[0.9375rem]">{profile?.username ?? "—"}</p>
          <p className="font-ps-mono text-[0.625rem] tracking-[.08em] text-ps-ink-faint">{profile?.title ?? ""}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-[0.5625rem]">
            <Stat
              icon="clock"
              label={t("identidad.stat.playtime")}
              value={`${time.hours}h ${time.minutes}m`}
              sub={t("identidad.stat.playtimeSub")}
            />
            <Stat
              icon="trophy"
              label={t("identidad.stat.wins")}
              value={fmt(totalKills(stats), locale)}
              sub={t("identidad.stat.winsSub")}
            />
            <Stat
              icon="skull"
              label={t("identidad.stat.deaths")}
              value={fmt(deaths(stats), locale)}
              sub={t("identidad.stat.deathsSub")}
            />
            <Stat
              icon="foot"
              label={t("identidad.stat.distance")}
              value={`${fmt(distanceKm(stats), locale)} km`}
              sub={t("identidad.stat.distanceSub")}
            />
          </div>

          <hr className="my-2.5 border-0 border-t border-dashed border-ps-ink/22" />

          <SectionLabel className="text-[0.8125rem]">{t("identidad.sectionMovement")}</SectionLabel>
          <dl className="grid grid-cols-3 gap-x-2 text-[0.6875rem]">
            {movement.map((row) => (
              <div
                key={row.key}
                className="flex justify-between gap-2 border-b border-dotted border-ps-ink/22 py-1"
              >
                <dt className="text-ps-ink-soft">{t(`identidad.movement.${row.key}`)}</dt>
                <dd className="ps-num font-ps-mono font-bold">
                  {fmt(row.value, locale)}
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
