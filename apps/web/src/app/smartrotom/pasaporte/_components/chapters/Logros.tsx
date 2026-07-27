"use client"

// PAPER. Two leaves: the resumen (points, tiers, categories, the rarest one) and the
// colección (every trophy card).

import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { Logro, LogroTier } from "../../_types"
import { docDate } from "../../_utils/dates"
import { fmt } from "../../_utils/stats"
import {
  Bar,
  Card,
  EmptyState,
  Medal,
  PageHead,
  PtsChip,
  RarityBadge,
  SectionLabel,
  Skeleton,
  toast,
} from "../ui"

/**
 * The category inks, spelled out.
 *
 * The categories themselves are NOT hardcoded — they are derived from the real `category`
 * column, so one added to the seed shows up here on its own. Only the INK is a literal map,
 * because `bg-${category}` compiles to nothing at all (§4).
 *
 * The first four keys are the categories the API actually ships today (including the seed's
 * own "Combaates" misspelling, kept alongside the correct one so fixing the seed cannot
 * silently grey the bar out); the rest are the handoff's, and are here for the day the seed
 * grows into them. Anything unknown falls back to the gild rather than vanishing.
 */
const CAT_INK: Record<string, string> = {
  Gimnasios: "bg-ps-olive",
  Ligas: "bg-ps-gild-lo",
  "Frente Batalla": "bg-ps-oxblood",
  Combaates: "bg-ps-info",
  Combates: "bg-ps-info",
  Combate: "bg-ps-info",
  Exploración: "bg-ps-teal",
  Colección: "bg-ps-plum",
  Veteranía: "bg-ps-olive",
  Comunidad: "bg-ps-info",
}
const CAT_FALLBACK = "bg-ps-gild-lo"

/** Logros only reach platino; the season ladder is what carries on to maestro. */
const TIERS: LogroTier[] = ["bronce", "plata", "oro", "platino"] as LogroTier[]

const RING_R = 22
const RING_C = 2 * Math.PI * RING_R

function catInk(category: string): string {
  return CAT_INK[category] ?? CAT_FALLBACK
}

function unlocked(logros: Logro[]): Logro[] {
  // `completed` is 0/1 on some rows and a real boolean on others — read it as truthiness.
  return logros.filter((l) => !!l.completed)
}

function categoriesOf(logros: Logro[]): string[] {
  const seen: string[] = []
  for (const logro of logros) {
    if (logro.category && !seen.includes(logro.category)) seen.push(logro.category)
  }
  return seen
}

export function LogrosResumen({ logros, loading }: { logros?: Logro[] | null; loading: boolean }) {
  const t = useTranslations("pasaporte")

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("logros.eyebrow")} title={t("logros.title")} />
        <Skeleton className="mb-3 h-[92px]" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="mb-2 h-9" />
        ))}
      </>
    )
  }

  const all = logros ?? []
  if (all.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("logros.eyebrow")} title={t("logros.title")} />
        <EmptyState icon="star" title={t("logros.empty.title")} sub={t("logros.empty.sub")} />
      </>
    )
  }

  const own = unlocked(all)
  const points = own.reduce((total, l) => total + l.points, 0)
  const totalPoints = all.reduce((total, l) => total + l.points, 0)
  const pct = Math.round((own.length / all.length) * 100)
  const offset = RING_C * (1 - own.length / all.length)

  // `rarity` is a REAL percentage — the share of players who own it — so the rarest unlocked
  // logro is simply the smallest one.
  const rarest = own.slice().sort((a, b) => a.rarity - b.rarity)[0]

  return (
    <>
      <PageHead eyebrow={t("logros.eyebrow")} title={t("logros.title")} />

      <Card className="mb-3 flex items-center justify-between gap-3.5 px-4 py-3.5">
        <div className="min-w-0">
          <div className="font-ps-mono text-[10px] uppercase tracking-[.22em] text-ps-ink-faint">
            {t("logros.points")}
          </div>
          <div className="ps-foil ps-num mt-0.5 font-ps-ceremony text-[clamp(34px,5.4vh,46px)] leading-[.95]">
            {points}
          </div>
          <div className="ps-num mt-1 text-[11px] text-ps-ink-soft">
            {t("logros.pointsSub", { total: totalPoints, own: own.length, all: all.length })}
          </div>
        </div>
        <div className="relative grid flex-none place-items-center">
          <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true" className="-rotate-90">
            <circle cx="31" cy="31" r={RING_R} fill="none" stroke="rgb(var(--ps-ink) / .14)" strokeWidth="6" />
            <circle
              cx="31"
              cy="31"
              r={RING_R}
              fill="none"
              stroke="rgb(var(--ps-gild))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={RING_C.toFixed(1)}
              strokeDashoffset={offset.toFixed(1)}
            />
          </svg>
          <span className="ps-num absolute font-ps-display text-[14px] font-extrabold text-ps-gild-lo">
            {pct}%
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        {TIERS.map((tier) => {
          const owned = own.filter((l) => l.tier === tier).length
          const count = all.filter((l) => l.tier === tier).length
          return (
            <div
              key={tier}
              className="flex items-center gap-[7px] rounded-[9px] border border-ps-ink/22 bg-white/[.32] px-2 py-[7px]"
            >
              <Medal tier={tier} size={22} />
              <div className="min-w-0">
                <div className="truncate text-[9.5px] uppercase tracking-[.06em] text-ps-ink-soft">
                  {t(`tiers.${tier}`)}
                </div>
                <div className="ps-num font-ps-mono text-[14px] font-bold leading-none text-ps-ink">
                  {owned}
                  <span className="text-[10px] font-normal text-ps-ink-faint">/{count}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <SectionLabel className="mt-3 text-[13px]">{t("logros.categoryProgress")}</SectionLabel>
      <div className="flex flex-col gap-[7px]">
        {categoriesOf(all).map((category) => {
          const list = all.filter((l) => l.category === category)
          const done = list.filter((l) => !!l.completed).length
          return (
            <div key={category}>
              <div className="mb-[3px] flex items-center gap-[7px] text-[11.5px]">
                <span aria-hidden="true" className={cn("h-2 w-2 flex-none rounded-full", catInk(category))} />
                <span className="flex-1 text-ps-ink-soft">{category}</span>
                <span className="ps-num font-ps-mono text-[10.5px] text-ps-ink-faint">
                  {done}/{list.length}
                </span>
              </div>
              <Bar
                value={done}
                max={list.length}
                thin
                fill={catInk(category)}
                label={t("logros.categoryBar", { category, done, total: list.length })}
              />
            </div>
          )
        })}
      </div>

      {rarest && (
        <>
          <SectionLabel className="mt-2.5 text-[13px]">{t("logros.rarest")}</SectionLabel>
          <Card className="flex items-center gap-3">
            <Medal tier={rarest.tier} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-ps-ceremony text-[16px]">{rarest.name}</span>
                <RarityBadge rarity={rarest.rarity} showPct />
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-ps-ink-soft">{rarest.description}</p>
            </div>
            <PtsChip points={rarest.points} />
          </Card>
        </>
      )}
    </>
  )
}

export function LogrosColeccion({ logros, loading }: { logros?: Logro[] | null; loading: boolean }) {
  const t = useTranslations("pasaporte")
  const locale = useLocale()

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("logros.eyebrowCollection")} title={t("logros.title")} />
        <div className="grid grid-cols-2 gap-[9px]">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[54px]" />
          ))}
        </div>
      </>
    )
  }

  const all = logros ?? []
  if (all.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("logros.eyebrowCollection")} title={t("logros.title")} />
        <EmptyState icon="star" title={t("logros.empty.title")} sub={t("logros.empty.sub")} />
      </>
    )
  }

  const order = categoriesOf(all)
  const cards = all
    .slice()
    .sort(
      (a, b) =>
        order.indexOf(a.category) - order.indexOf(b.category) ||
        Number(!!b.completed) - Number(!!a.completed) ||
        a.order - b.order,
    )

  return (
    <>
      <PageHead eyebrow={t("logros.eyebrowCollection")} title={t("logros.title")} />

      <div className="ps-scroll grid min-h-0 flex-1 grid-cols-2 content-start gap-[9px] overflow-y-auto pb-7 pr-1">
        {cards.map((logro) => {
          const done = !!logro.completed
          const pct = logro.target > 0 ? Math.min(100, Math.round((logro.progress / logro.target) * 100)) : 0

          return (
            <button
              key={logro.id}
              type="button"
              onClick={() =>
                toast(
                  done
                    ? t("logros.unlockedToast", { name: logro.name, date: docDate(logro.completedAt, locale) })
                    : t("logros.progressToast", {
                        name: logro.name,
                        progress: fmt(logro.progress, locale),
                        target: fmt(logro.target, locale),
                      }),
                )
              }
              className={cn(
                "relative flex items-center gap-[9px] overflow-hidden rounded-[10px] border border-ps-ink/22 py-2 pl-3 pr-2.5 text-left",
                "bg-gradient-to-b from-white/50 to-white/[.18] transition-transform duration-200",
                "hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(80,60,30,.14)] motion-reduce:transition-none motion-reduce:hover:transform-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-chapter",
                !done && "opacity-[.82]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-0 left-0 top-0 w-1",
                  catInk(logro.category),
                )}
              />
              <Medal tier={logro.tier} locked={!done} size={34} />

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-1.5">
                  <span
                    className={cn(
                      "truncate font-ps-ceremony text-[13px]",
                      done ? "text-ps-ink" : "text-ps-ink-soft",
                    )}
                  >
                    {logro.name}
                  </span>
                  <PtsChip points={logro.points} sm />
                </span>

                {done ? (
                  <span className="mt-1 flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="grid h-[15px] w-[15px] flex-none place-items-center rounded-full bg-ps-ok text-[10px] text-white"
                    >
                      ✓
                    </span>
                    <RarityBadge rarity={logro.rarity} showPct className="border-0 px-0" />
                  </span>
                ) : (
                  <>
                    <Bar
                      value={pct}
                      thin
                      className="mt-1.5"
                      fill={catInk(logro.category)}
                      label={t("logros.collectionBar", {
                        name: logro.name,
                        progress: logro.progress,
                        target: logro.target,
                      })}
                    />
                    <span className="ps-num mt-[3px] block font-ps-mono text-[9px] text-ps-ink-faint">
                      {fmt(logro.progress, locale)} / {fmt(logro.target, locale)}
                    </span>
                  </>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
