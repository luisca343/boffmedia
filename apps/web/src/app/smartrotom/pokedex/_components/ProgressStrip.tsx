"use client"

import { useTranslations } from "next-intl"
import { usePokedexData } from "@/hooks/usePokedexData"
import { useRotomUuid } from "@/components/smartrotom/behavior/useRotomUuid"
import { useGetRegistries } from "@/hooks/pokemon/useGetRegistries"

export function ProgressStrip() {
  const t = useTranslations("pokedex")
  const uuid = useRotomUuid()
  const { pokedexData } = usePokedexData()
  const { registries } = useGetRegistries(uuid!)

  const caught = pokedexData?.caughtCount ?? 0
  const seen = pokedexData?.seenCount ?? 0
  const shiny = pokedexData?.shinyCount ?? 0
  const total = pokedexData?.totalPokemon ?? 1
  const pending = total - caught - seen
  const pct = Math.round((caught / total) * 100)

  const lastCaptureTime = registries?.[0]?.caughtAt || registries?.[0]?.seenAt
  const lastCaptureAgo = lastCaptureTime ? getRelativeTime(lastCaptureTime) : "—"
  const streak = computeStreak(registries)

  const segments = [
    { id: "caught", color: "#34d399", n: caught, label: t("progress_captured") },
    { id: "seen", color: "#fbbf24", n: seen, label: t("progress_seen") },
    { id: "shiny", color: "#f0abfc", n: shiny, label: t("progress_shiny") },
  ]

  return (
    <div className="bg-[radial-gradient(700px_200px_at_80%_-50%,rgba(249,115,22,0.12),transparent_60%)] bg-gradient-to-b from-white/[0.03] to-white/[0.015] border border-white/[0.08] rounded-[14px] p-5">
      <div className="flex items-end justify-between gap-6 mb-4">
        <div>
          <p className="font-pk-mono text-[11px] tracking-[0.12em] uppercase text-pk-surface-500 mb-1.5">
            {t("progress_title")}
          </p>
          <div className="font-pk-display font-bold text-[44px] leading-none tracking-tight flex items-baseline gap-2.5 tabular-nums">
            <span className="text-pk-surface-50">{caught}</span>
            <span className="text-pk-surface-600 font-normal">/</span>
            <span className="text-pk-surface-400 text-[28px]">{total}</span>
            <span className="text-xs font-pk font-medium text-pk-primary-300 bg-pk-primary-400/[0.12] px-2.5 py-1 rounded-full ml-1.5">
              {pct}%
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-right text-xs text-pk-surface-400">
          <span>
            {t("progress_last_capture")} · <b className="text-pk-surface-100 font-semibold">{lastCaptureAgo}</b>
          </span>
          <span>
            {t("progress_streak")} · <b className="text-pk-surface-100 font-semibold">{streak} {streak === 1 ? t("progress_streak_day") : t("progress_streak_days")}</b>
          </span>
        </div>
      </div>

      <div
        className="flex h-3 rounded-full overflow-hidden bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]"
        role="img"
        aria-label={`${pct}% capturados, ${seen} vistos, ${shiny} shiny`}
      >
        {segments.map((s) => (
          <div
            key={s.id}
            className="h-full relative cursor-pointer transition-[filter] hover:brightness-110"
            style={{ width: `${(s.n / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${s.n}`}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.18] to-transparent" />
          </div>
        ))}
      </div>

      <div className="flex gap-[18px] mt-3 flex-wrap">
        {segments.map((s) => (
          <button
            key={s.id}
            className="inline-flex items-center gap-2 text-xs text-pk-surface-300 hover:text-pk-surface-50 transition-colors bg-transparent border-none p-1"
          >
            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: s.color, color: s.color }} />
            {s.label}
            <b className="font-pk-mono text-xs tabular-nums text-pk-surface-100 ml-0.5">{s.n}</b>
          </button>
        ))}
        <button className="inline-flex items-center gap-2 text-xs text-pk-surface-300 hover:text-pk-surface-50 transition-colors bg-transparent border-none p-1">
          <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ background: "#97a6bb", color: "#97a6bb" }} />
          {t("progress_pending")}
          <b className="font-pk-mono text-xs tabular-nums text-pk-surface-100 ml-0.5">{Math.max(0, pending)}</b>
        </button>
      </div>
    </div>
  )
}

function getRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `${diffD}d`
}

// Consecutive-day capture streak derived from real registries (ending today or
// yesterday). Replaces the design's placeholder value — no streak API needed.
function computeStreak(registries?: { caughtAt?: string; seenAt?: string }[]): number {
  if (!registries?.length) return 0
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const days = new Set(
    registries
      .map((r) => r.caughtAt || r.seenAt)
      .filter(Boolean)
      .map((s) => iso(new Date(s as string)))
  )
  const cursor = new Date()
  if (!days.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(iso(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
