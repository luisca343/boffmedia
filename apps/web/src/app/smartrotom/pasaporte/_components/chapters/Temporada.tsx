// PAPER.

import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { Season, StandingTier } from "../../_types"
import { docDate } from "../../_utils/dates"
import { roman } from "../../_utils/roman"
import { TIER_BG } from "../../_utils/tiers"
import { Card, EmptyState, Icon, PageHead, Skeleton } from "../ui"

function Box({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="px-2 py-[0.5625rem] text-center">
      <div className="font-ps-mono text-[0.46875rem] uppercase tracking-[.07em] text-ps-ink-faint">{label}</div>
      <div className="ps-num my-1 font-ps-ceremony text-[1.3125rem] leading-none">{value}</div>
      {sub && <div className="text-[0.5625rem] text-ps-ink-soft">{sub}</div>}
    </Card>
  )
}

/**
 * The season standing.
 *
 * Everything on this page is DERIVED from the trainer's real battles: there is no LP table
 * anywhere — `lp` is `max(0, wins * 20 − losses * 12)` walked over the season's replays, and
 * the tier, the division and the regional rank fall out of it. So a trainer who has not
 * fought is not "Bronce IV with 0 LP": they are unranked, and the page says so rather than
 * printing a zeroed ladder as if it were a placing.
 */
export function Temporada({
  season,
  region,
  loading,
}: {
  season?: Season | null
  /** The trainer's own region — the standing knows the rank, not where it was earned. */
  region?: string
  loading: boolean
}) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("temporada.eyebrow")} title={t("temporada.title")} />
        <Skeleton className="mx-auto mb-4 h-[9.375rem] w-[9.375rem] rounded-full" />
        <Skeleton className="mb-2.5 h-10" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="mb-2 h-12" />
        ))}
      </>
    )
  }

  if (!season?.season) {
    return (
      <>
        <PageHead eyebrow={t("temporada.eyebrow")} title={t("temporada.title")} />
        <EmptyState icon="crown" title={t("temporada.empty.title")} sub={t("temporada.empty.sub")} />
      </>
    )
  }

  const info = season.season
  const s = season.standing

  if (!s || s.battles === 0) {
    return (
      <>
        <PageHead eyebrow={t("temporada.eyebrow")} title={t("temporada.title")} />
        <EmptyState
          icon="swords"
          title={t("temporada.notFought.title")}
          sub={t("temporada.notFought.sub", { name: info.name, date: docDate(info.endsAt, locale) })}
        />
      </>
    )
  }

  const ladder = season.ladder ?? []
  const current = ladder.findIndex((rung) => rung.key === s.tierKey)
  const total = s.wins + s.losses
  const winRate = total > 0 ? Math.round((s.wins / total) * 100) : 0
  const nextPct = s.nextAt && s.nextAt > 0 ? Math.min(100, Math.round((s.lp / s.nextAt) * 100)) : 100
  const nextRung = current >= 0 ? ladder[current + 1] : undefined

  return (
    <>
      <PageHead eyebrow={t("temporada.eyebrow")} title={t("temporada.title")} />

      <div className="relative mx-auto mb-3.5 grid h-[9.875rem] w-[9.875rem] place-items-center">
        <span
          aria-hidden="true"
          className="ps-holo-gold ps-loop absolute inset-0 rounded-full shadow-[0_7px_20px_rgba(120,90,30,.32),inset_0_0_0_2px_rgba(255,255,255,.45)] animate-ps-spin-slow motion-reduce:animate-none"
        />
        <div
          style={{
            background: "radial-gradient(circle at 50% 30%, #fdf3cf, #e6c873 54%, #b8902f)",
          }}
          className="relative z-[2] grid h-[7.25rem] w-[7.25rem] place-items-center content-center rounded-full border-[3px] border-[#fff6d8] text-center shadow-[inset_0_0_0_3px_rgba(255,255,255,.5),inset_0_-6px_14px_rgba(120,80,20,.35),0_3px_9px_rgba(0,0,0,.3)]"
        >
          <span className="ps-foil font-ps-display text-[0.8125rem] font-extrabold tracking-[.12em]">
            {roman(info.number)}
          </span>
          <Icon name="crown" className="h-10 w-10 text-ps-gild-lo drop-shadow-[0_1px_1px_rgba(255,255,255,.5)]" />
          <span className="font-ps-ceremony text-[0.9375rem] leading-none text-[#5a3f12]">
            {s.tier} {s.division}
          </span>
        </div>
        <span className="absolute -bottom-[0.4375rem] left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-ps-ribbon to-ps-ribbon-hi px-[0.9375rem] py-1 font-ps-display text-[0.6875rem] font-extrabold tracking-[.08em] text-white shadow-[0_2px_6px_rgba(0,0,0,.32)]">
          {info.name}
        </span>
      </div>

      <p className="ps-num mb-3 text-center font-ps-mono text-[0.65625rem] tracking-[.06em] text-ps-ink-faint">
        {t("temporada.seasonLine", { number: info.number, date: docDate(info.endsAt, locale) })}
      </p>

      <ol className="mb-3 grid grid-cols-6 gap-1">
        {ladder.map((rung, i) => {
          const done = current >= 0 && i < current
          const isCurrent = i === current
          return (
            <li
              key={rung.key}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[9px] px-0.5 py-2",
                isCurrent && "bg-white/50 shadow-[0_2px_9px_rgba(80,60,30,.18)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "rounded-full border-2 transition-all duration-200 motion-reduce:transition-none",
                  isCurrent
                    ? "h-[1.625rem] w-[1.625rem] border-white shadow-[0_2px_6px_rgba(0,0,0,.25)]"
                    : "h-[1.125rem] w-[1.125rem] border-ps-ink/20",
                  done || isCurrent
                    ? TIER_BG[rung.key as StandingTier] ?? "bg-ps-ink/20"
                    : "bg-ps-ink/[.12]",
                  done && "opacity-60",
                )}
              />
              <span
                className={cn(
                  "font-ps-mono text-[0.5rem] uppercase tracking-[.03em]",
                  isCurrent ? "font-bold text-ps-ink" : done ? "text-ps-ink-soft" : "text-ps-ink-faint",
                )}
              >
                {rung.name}
              </span>
            </li>
          )
        })}
      </ol>

      <Card className="mb-3 px-3.5 py-[0.6875rem]">
        <div className="mb-[0.4375rem] flex items-baseline justify-between gap-2 text-[0.75rem] text-ps-ink-soft">
          <span>{nextRung ? t("temporada.progressTo", { name: nextRung.name }) : t("temporada.maxRank")}</span>
          <b className="ps-num font-ps-mono text-ps-ink">
            {s.lp} {s.nextAt ? `/ ${s.nextAt}` : ""} LP
          </b>
        </div>
        <div className="h-2 overflow-hidden rounded-md bg-ps-ink/[.14]">
          <span
            role="progressbar"
            aria-valuenow={nextPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("temporada.nextRankAria")}
            style={{
              width: `${nextPct}%`,
              background:
                "linear-gradient(90deg, rgb(var(--ps-tier-diamante)), rgb(var(--ps-tier-maestro)))",
            }}
            className="block h-full rounded-md"
          />
        </div>
        <p className="mt-1.5 text-[0.65625rem] text-ps-ink-faint">
          {s.nextAt
            ? t.rich("temporada.remaining", {
                n: Math.max(0, s.nextAt - s.lp),
                b: (chunks) => <b className="text-ps-ink-soft">{chunks}</b>,
              })
            : t("temporada.atTop")}{" "}
          · {t("temporada.streak", { n: s.streak })}
        </p>
      </Card>

      <div className="grid grid-cols-4 gap-[0.5625rem]">
        <Box label={t("temporada.box.lp")} value={String(s.lp)} sub={t("temporada.box.peak", { n: s.peakLp })} />
        <Box
          label={t("temporada.box.wins")}
          value={String(s.wins)}
          sub={t("temporada.box.losses", { n: s.losses })}
        />
        <Box
          label={t("temporada.box.winRate")}
          value={`${winRate}%`}
          sub={t("temporada.box.matches", { n: total })}
        />
        <Box
          label={t("temporada.box.regionalRank")}
          value={s.regionRank > 0 ? `#${s.regionRank}` : "—"}
          sub={region ?? t("temporada.box.battles", { n: s.battles })}
        />
      </div>
    </>
  )
}
