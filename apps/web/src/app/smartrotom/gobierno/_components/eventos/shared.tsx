"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Badge, Icon, type IconName } from "../ui"
import { TONES, type Tone } from "../../_utils/tones"
import { fmtDateTime, timeLeft } from "../../_utils/format"
import { GOBIERNO_ROOT } from "../../_utils/nav"
import type { Evento, EventoWeights } from "../../_types"

// Two event types, one screen. Everything below is shared between the browse card, the
// detail pages and the creation wizard so the three never drift.

type TFn = (key: string) => string

export function getEventoTypeMeta(t: TFn): Record<Evento["type"], { label: string; icon: IconName; tone: Tone }> {
  return {
    construccion: { label: t("eventos.tipoConstruccion"), icon: "building", tone: "urbanismo" },
    caza: { label: t("eventos.tipoCaza"), icon: "crosshair", tone: "civic" },
  }
}

export function eventoStatusMeta(
  status: Evento["status"],
  t: TFn,
): { label: string; tone: Tone; dot: boolean } {
  switch (status) {
    case "upcoming":
      return { label: t("eventos.proximamente"), tone: "info", dot: false }
    case "building":
      return { label: t("eventos.enConstruccion"), tone: "urbanismo", dot: true }
    case "rating":
      return { label: t("eventos.valoracionAbierta"), tone: "gold", dot: true }
    case "live":
      return { label: t("eventos.enCurso"), tone: "ok", dot: true }
    case "closed":
      return { label: t("eventos.finalizado"), tone: "default", dot: false }
  }
}

/** The one date worth surfacing on a card or a header, given where the event stands. */
export function relevantMoment(ev: Evento, t: TFn): { label: string; iso: string | null } {
  if (ev.type === "construccion") {
    if (ev.status === "rating") return { label: t("eventos.votaHasta"), iso: ev.ratingClosesAt }
    if (ev.status === "closed") return { label: t("eventos.cerrado"), iso: null }
    return { label: t("eventos.construccionHasta"), iso: ev.buildClosedAt }
  }
  if (ev.status === "live") return { label: t("eventos.cierraEn"), iso: ev.closesAt }
  if (ev.status === "closed") return { label: t("eventos.cerrado"), iso: null }
  return { label: t("eventos.empieza"), iso: ev.opensAt }
}

// ─── Scoring vocabulary (caza) ─────────────────────────────────────────────────

export function getScoreFields(
  t: TFn,
): { key: keyof EventoWeights; label: string; icon: IconName; desc: string }[] {
  return [
    {
      key: "especie",
      label: t("eventos.especie"),
      icon: "crosshair",
      desc: t("eventos.scoreEspecieDesc"),
    },
    {
      key: "tamano",
      label: t("eventos.tamano"),
      icon: "arrowUp",
      desc: t("eventos.scoreTamanoDesc"),
    },
    { key: "ivs", label: t("eventos.ivs"), icon: "star", desc: t("eventos.scoreIvsDesc") },
    { key: "nivel", label: t("eventos.nivel"), icon: "trendUp", desc: t("eventos.scoreNivelDesc") },
    { key: "shiny", label: t("eventos.shiny"), icon: "flame", desc: t("eventos.scoreShinyDesc") },
  ]
}

export const weightMax = (w: EventoWeights | null | undefined): number =>
  w ? w.tamano + w.ivs + w.shiny + w.nivel + w.especie : 0

// ─── Rarity vocabulary — a fixed 5-tier scale the organiser assigns per species ────────

export const RARITY_TIERS = ["común", "poco común", "rara", "muy rara", "legendaria zonal"] as const

export const RARITY_TONE: Record<string, Tone> = {
  "común": "default",
  "poco común": "info",
  "rara": "civic",
  "muy rara": "gold",
  "legendaria zonal": "danger",
}

export const RARITY_PTS: Record<string, number> = {
  "común": 4,
  "poco común": 8,
  "rara": 13,
  "muy rara": 19,
  "legendaria zonal": 25,
}

// ─── Small presentational atoms ────────────────────────────────────────────────

/** There is no build/zone render pipeline — every visual slot is this engraved placeholder. */
export function BuildSlot({
  icon,
  label,
  className = "h-32",
}: {
  icon: IconName
  label: string
  className?: string
}) {
  return (
    <div className={`relative grid flex-none place-items-center overflow-hidden bg-gt-paper-2 ${className}`}>
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgb(var(--gt-paper-3)) 0, rgb(var(--gt-paper-3)) 2px, transparent 2px, transparent 14px)",
        }}
        aria-hidden="true"
      />
      <Icon name={icon} size={30} className="relative text-gt-ink-300" />
      <span className="absolute inset-x-0 bottom-2 text-center font-gt-mono text-[9px] uppercase tracking-[.08em] text-gt-ink-400">
        [ {label} ]
      </span>
    </div>
  )
}

/** Ticks every second; renders nothing once there is no target moment. */
export function Countdown({ iso, label }: { iso: string | null; label?: string }) {
  const t = useTranslations("gobierno")
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  if (!iso) return null

  const ms = new Date(iso).getTime() - Date.now()
  const closed = Number.isNaN(ms) || ms <= 0
  const urgent = !closed && ms < 3_600_000

  return (
    <div className="text-right">
      <div className="font-gt-mono text-[8.5px] uppercase tracking-[.14em] text-gt-ink-400">
        {closed ? t("actividad.estado") : (label ?? t("eventos.cierraEn"))}
      </div>
      <div
        className={`font-gt-mono text-lg font-bold leading-tight tabular-nums ${
          closed ? "text-gt-ink-400" : urgent ? "text-gt-danger" : "text-gt-ink-900"
        }`}
      >
        {closed ? t("eventos.cerrado") : timeLeft(iso, t("common.finalizado"))}
      </div>
    </div>
  )
}

export function StarsStatic({ value, size = 14 }: { value: number; size?: number }) {
  const filled = Math.round(value)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={size}
          fill={filled >= n ? "rgb(var(--gt-gold-600))" : "none"}
          className={filled >= n ? "text-gt-gold-600" : "text-gt-ink-300"}
        />
      ))}
    </div>
  )
}

/** The design system has a gold tone but no silver/bronze — only first place gets a distinct mark. */
export function RankMark({ rank }: { rank: number }) {
  if (rank === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-gt-gold-600">
        <Icon name="award" size={15} fill="rgb(var(--gt-gold-600))" />
        <span className="font-gt-mono text-[9px] font-bold uppercase tracking-[.08em]">1º</span>
      </span>
    )
  }
  return (
    <span className="inline-block w-6 text-center font-gt-mono text-xs tabular-nums text-gt-ink-400">
      {rank + 1}
    </span>
  )
}

/** score10 (0–10, already averaged server-side from the vote categories) presented as the
 * primary system — stars — plus the raw figure. Everything else the handoff offers (nota /10,
 * nota /100, medallas) is the same number restyled; this is the one we ship. */
export function ScoreDisplay({ score10 }: { score10: number }) {
  return (
    <div className="flex items-center gap-2">
      <StarsStatic value={score10 / 2} size={16} />
      <span className="font-gt-display text-base font-bold tabular-nums text-gt-ink-900">
        {(score10 / 2).toFixed(1)}
      </span>
    </div>
  )
}

export function BackToEventos() {
  const t = useTranslations("gobierno")
  return (
    <Link
      href={`${GOBIERNO_ROOT}/eventos`}
      className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gt-ink-500 transition-colors hover:text-gt-ink-900"
    >
      <Icon name="arrowLeft" size={15} /> {t("nav.eventos")}
    </Link>
  )
}

// ─── The card ───────────────────────────────────────────────────────────────────

export function EventoCard({ ev, linkable = true }: { ev: Evento; linkable?: boolean }) {
  const t = useTranslations("gobierno")
  const typeMeta = getEventoTypeMeta(t)
  const type = typeMeta[ev.type]
  const status = eventoStatusMeta(ev.status, t)
  const isCons = ev.type === "construccion"
  const moment = relevantMoment(ev, t)

  const body = (
    <>
      <BuildSlot icon={type.icon} label={isCons ? t("eventos.maquetaReto") : t("eventos.mapaZona")} />
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={type.tone} icon={type.icon}>
            {type.label}
          </Badge>
          <Badge tone={status.tone} dot={status.dot}>
            {status.label}
          </Badge>
        </div>
        <h3 className="mb-1.5 font-gt-display text-lg leading-tight text-gt-ink-900">{ev.title}</h3>
        <p className="line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-gt-ink-500">
          {isCons ? ev.brief : ev.rules}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gt-line-soft pt-2.5">
          {isCons ? (
            moment.iso ? (
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">
                {moment.label} {fmtDateTime(moment.iso)}
              </span>
            ) : (
              <span className="font-gt-mono text-[10.5px] text-gt-ink-400">{moment.label}</span>
            )
          ) : (
            <span className="flex items-center gap-1 font-gt-mono text-[10.5px] text-gt-ink-400">
              <Icon name="mapPin" size={11} /> {ev.zone ?? "—"}
            </span>
          )}
          {linkable && (
            <span className={`flex flex-none items-center gap-1 text-[11.5px] font-bold ${TONES[type.tone].text}`}>
              {t("eventos.abrir")} <Icon name="arrowRight" size={13} />
            </span>
          )}
        </div>
      </div>
    </>
  )

  const className =
    "gt-spine group flex flex-col overflow-hidden rounded-gt border border-gt-line bg-gt-paper-0 text-left shadow-gt transition-transform motion-reduce:transition-none hover:-translate-y-0.5"
  const style = { ["--gt-dep" as string]: TONES[type.tone].css }

  if (!linkable) {
    return (
      <div className={className} style={style}>
        {body}
      </div>
    )
  }
  return (
    <Link href={`${GOBIERNO_ROOT}/eventos/${ev.id}`} className={className} style={style}>
      {body}
    </Link>
  )
}
