// PAPER. Rubber stamps, inked into the sheet.

import { useLocale, useTranslations } from "next-intl"
import type { TravelStamp } from "../../_types"
import { stampDate } from "../../_utils/dates"
import { EmptyState, PageHead, Skeleton } from "../ui"

/**
 * The ink a stamp is pressed in, by what put it there. Raw hex because these are SVG
 * `stroke`/`fill` values — a `stroke` cannot take a Tailwind token, and the palette
 * is the `ps-*` one written out.
 */
const INK: Record<TravelStamp["kind"], string> = {
  viaje: "#2b4a72", // info — an entry visa
  gimnasio: "#9c3b36", // oxblood — a gym
  liga: "#8a6a23", // gild — a title
  evento: "#6e4a86", // plum — everything else
}

const LEGEND_KINDS: TravelStamp["kind"][] = ["viaje", "gimnasio", "liga", "evento"]

/**
 * One inked stamp. The `feTurbulence` + `feDisplacementMap` pair is what makes it read as
 * rubber on paper rather than as a vector: it roughens every stroke by a pixel or two, so
 * the ring breaks up exactly the way a hand-pressed stamp does. `mix-blend-multiply` sinks
 * it into the stock instead of laying it on top.
 */
export function Stamp({ stamp, index }: { stamp: TravelStamp; index: number }) {
  const id = `ps-stamp-${index}`
  const ink = INK[stamp.kind]
  const date = stampDate(stamp.date, useLocale())
  const style = { transform: `rotate(${stamp.rot}deg)`, opacity: stamp.gold ? 0.94 : 0.85 }

  const rough = (
    <filter id={`${id}-f`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={index * 9 + 3} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.7" />
    </filter>
  )

  if (stamp.shape === "rect") {
    return (
      <svg
        viewBox="0 0 130 96"
        role="img"
        aria-label={`${stamp.place} · ${stamp.sub} · ${date.day} ${date.month} ${date.year}`}
        style={style}
        className="h-auto w-[122px] overflow-visible mix-blend-multiply"
      >
        <defs>{rough}</defs>
        <g filter={`url(#${id}-f)`} fill="none" stroke={ink}>
          <rect x="6" y="6" width="118" height="84" rx="5" strokeWidth="2.4" />
          <rect x="11" y="11" width="108" height="74" rx="3" strokeWidth="1" />
          <line x1="11" y1="40" x2="119" y2="40" strokeWidth="1" />
          <line x1="11" y1="62" x2="119" y2="62" strokeWidth="1" />
        </g>
        <text
          x="65"
          y="30"
          textAnchor="middle"
          fill={ink}
          className="font-ps-mono text-[13px] font-bold tracking-[.05em]"
        >
          {stamp.place}
        </text>
        <text
          x="65"
          y="56"
          textAnchor="middle"
          fill={ink}
          className="ps-num font-ps-mono text-[12.5px] font-bold tracking-[.04em]"
        >
          {date.day} {date.month} {date.year}
        </text>
        <text
          x="65"
          y="78"
          textAnchor="middle"
          fill={ink}
          className="font-ps-mono text-[8px] tracking-[.12em]"
        >
          {stamp.sub}
        </text>
      </svg>
    )
  }

  // An oval is the same ring, squashed — the way a stamp lands when it is rocked.
  const squash = stamp.shape === "oval" ? "translate(65 50) scale(1.18 0.84) translate(-65 -50)" : undefined

  return (
    <svg
      viewBox="0 0 130 100"
      role="img"
      aria-label={`${stamp.place} · ${stamp.sub} · ${date.numeric}`}
      style={style}
      className="h-auto w-[116px] overflow-visible mix-blend-multiply"
    >
      <defs>
        {rough}
        <path id={`${id}-top`} d="M22,50 a43,43 0 0,1 86,0" />
        <path id={`${id}-bottom`} d="M25,50 a40,40 0 0,0 80,0" />
      </defs>

      <g transform={squash}>
        <g filter={`url(#${id}-f)`} fill="none" stroke={ink}>
          <circle cx="65" cy="50" r="46" strokeWidth="2.4" />
          <circle cx="65" cy="50" r="35" strokeWidth="1" />
        </g>
        <g filter={`url(#${id}-f)`} fill="none" stroke={ink}>
          <circle cx="65" cy="44" r="8" strokeWidth="2" />
          <line x1="57" y1="44" x2="73" y2="44" strokeWidth="2" />
          <circle cx="65" cy="44" r="2.4" strokeWidth="1.6" />
        </g>
      </g>

      <text fill={ink} className="font-ps-mono text-[9.5px] font-bold tracking-[.04em]">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          {stamp.place}
        </textPath>
      </text>
      <text fill={ink} className="font-ps-mono text-[6.6px] tracking-[.02em]">
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          {stamp.sub} · {date.numeric}
        </textPath>
      </text>
    </svg>
  )
}

export function Bitacora({ stamps, loading }: { stamps: TravelStamp[]; loading: boolean }) {
  const t = useTranslations("pasaporte")

  if (loading) {
    return (
      <>
        <PageHead eyebrow={t("bitacora.eyebrow")} title={t("bitacora.title")} />
        <div className="grid grid-cols-3 justify-items-center gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-[96px] w-[118px] rounded-full" />
          ))}
        </div>
      </>
    )
  }

  if (stamps.length === 0) {
    return (
      <>
        <PageHead eyebrow={t("bitacora.eyebrow")} title={t("bitacora.title")} />
        <EmptyState icon="globe" title={t("bitacora.empty.title")} sub={t("bitacora.empty.sub")} />
      </>
    )
  }

  // A leaf holds nine stamps. When the trainer has more, the page shows the most RECENT
  // nine — a passport is stamped front to back and the last page is the current one — and
  // the counter still reports the true total rather than pretending nine is all there is.
  const shown = stamps.slice(-9)

  return (
    <>
      <PageHead eyebrow={t("bitacora.eyebrow")} title={t("bitacora.title")} />

      <div className="mb-1 flex flex-wrap items-center gap-3.5 text-[10px] text-ps-ink-soft">
        {LEGEND_KINDS.map((kind) => (
          <span key={kind} className="flex items-center gap-1.5">
            <i
              aria-hidden="true"
              style={{ background: INK[kind] }}
              className="inline-block h-2 w-2 rounded-full"
            />
            {t(`bitacora.legend.${kind}`)}
          </span>
        ))}
        <span className="ps-num ml-auto font-ps-mono tracking-[.04em] text-ps-ink-faint">
          {shown.length < stamps.length
            ? t("bitacora.countPartial", { shown: shown.length, count: stamps.length })
            : t("bitacora.countFull", { count: stamps.length })}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-3 content-center justify-items-center gap-x-0.5 py-0.5">
        {shown.map((stamp, i) => (
          <Stamp key={stamp.id} stamp={stamp} index={i} />
        ))}
      </div>
    </>
  )
}
