"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar } from "@boffmedia/ui"
import { evHue, evNum, type PlayerLike } from "./events-util"

// Ranking pieces reused across the global leaderboard, the game page and the
// event detail: Podium (top 3), LeaderTable (with a «you» highlight), PlayerLine
// (compact list) and ParticipantStack (stacked avatars). Mirror eventos.css.
// [deferred] — fed by demo rows until the ranking API exists.

const CUT_RANK = "cut-seal [--cut:6px]"
const CUT_PLACE = "cut-seal [--cut:7px]"
const CUT_POD = "cut-corner [--cut-lg:14px]"
const CUT_MORE = "cut-seal [--cut:8px]"

// ── ParticipantStack — grupo de avatares apilados ────────────────────────────
export function ParticipantStack({ players, max = 8, size = 38 }: { players: PlayerLike[]; max?: number; size?: number }) {
  const shown = players.slice(0, max)
  const extra = players.length - shown.length
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span
          key={p.userId ?? i}
          className="relative -ml-2.5 grid flex-none place-items-center first:ml-0"
          style={{ width: size, height: size, zIndex: shown.length - i }}
        >
          <Avatar className="!h-full !w-full border-line-2 shadow-[0_0_0_2px_var(--panel)]">{p.avatar}</Avatar>
        </span>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "-ml-2.5 grid flex-none place-items-center border border-solid border-accent-line bg-panel-2 font-mono text-[12px]/none font-bold text-accent shadow-[0_0_0_2px_var(--panel)]",
            CUT_MORE,
          )}
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  )
}

// ── LeaderTable — tabla de clasificación reutilizable ────────────────────────
export function LeaderTable({
  players,
  showGame = true,
  highlight,
  offset = 0,
}: {
  players: PlayerLike[]
  showGame?: boolean
  /** userId of the viewer's row, rendered with the «me» highlight. */
  highlight?: number | null
  offset?: number
}) {
  const th = "border-b-2 border-solid border-line-2 bg-panel-2 px-4 py-[13px] text-left font-mono text-[10px]/none font-semibold uppercase tracking-[0.13em] text-txt-muted whitespace-nowrap"
  const td = "border-b border-solid border-line px-4 py-[11px] last:[&]:border-b-0"
  return (
    <div className="overflow-x-auto border border-solid border-line">
      <table className="w-full min-w-[520px] border-collapse bg-panel">
        <thead>
          <tr>
            <th className={cn(th, "w-[56px]")}>#</th>
            <th className={th}>Jugador</th>
            {showGame && <th className={th}>Juego</th>}
            <th className={cn(th, "text-center")}>Logros</th>
            <th className={cn(th, "text-center")}>Medallas</th>
            <th className={cn(th, "text-right")}>Puntos</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => {
            const rank = offset + i + 1
            const me = highlight === p.userId
            const rankCls =
              rank === 1
                ? cn("bg-accent text-accent-ink", CUT_RANK)
                : rank === 2
                  ? cn("border border-solid border-line-2 bg-panel-2 text-txt", CUT_RANK)
                  : rank === 3
                    ? cn("border border-solid border-accent-line text-accent", CUT_RANK)
                    : ""
            return (
              <tr
                key={p.userId}
                className={cn(
                  "transition-colors duration-[140ms] hover:bg-panel-2",
                  rank <= 3 && "bg-[linear-gradient(90deg,var(--accent-soft),transparent_45%)]",
                  me && "bg-[color-mix(in_srgb,var(--accent)_14%,var(--panel))] shadow-[inset_3px_0_0_var(--accent)]",
                )}
              >
                <td className={cn(td, "text-center")}>
                  <span className={cn("inline-grid h-[30px] w-[30px] place-items-center font-display text-[17px]/none font-extrabold italic text-txt-muted", rankCls)}>{rank}</span>
                </td>
                <td className={td}>
                  <span className="inline-flex items-center gap-3">
                    <Avatar accent={rank <= 3} className="!h-8 !w-8 !text-[12px]">{p.avatar}</Avatar>
                    <b className="font-display text-[16px]/none font-bold uppercase tracking-[0.01em]">{p.nickname}</b>
                  </span>
                </td>
                {showGame && (
                  <td className={td}>
                    <span
                      style={{ ["--ghue" as string]: evHue(p.hue) }}
                      className="inline-block border border-solid border-[color:color-mix(in_srgb,var(--ghue)_45%,var(--line))] px-2 py-[5px] font-mono text-[10px]/none font-semibold uppercase tracking-[0.08em] text-[color:var(--ghue)]"
                    >
                      {p.gameShort || "—"}
                    </span>
                  </td>
                )}
                <td className={cn(td, "text-center font-mono text-[14px]/none font-medium")}>{p.achievementCount}</td>
                <td className={cn(td, "text-center font-mono text-[14px]/none font-medium")}>{p.medalCount}</td>
                <td className={cn(td, "text-right font-mono text-[15px]/none font-semibold")}>{evNum(p.totalPoints)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── PlayerLine — fila compacta de jugador ────────────────────────────────────
export function PlayerLine({ player, rank }: { player: PlayerLike; rank: number }) {
  const top = rank <= 3
  return (
    <div
      className={cn(
        "flex items-center gap-[14px] border border-solid bg-panel px-4 py-[11px]",
        top ? "border-accent-line bg-[linear-gradient(90deg,var(--accent-soft),transparent_60%)]" : "border-line",
      )}
    >
      <span className={cn("w-[30px] flex-none font-display text-[22px]/none font-extrabold italic", top ? "text-accent" : "text-txt-muted")}>{String(rank).padStart(2, "0")}</span>
      <Avatar accent={top}>{player.avatar}</Avatar>
      <div className="min-w-0 flex-1">
        <span className="block font-display text-[17px]/[1.1] font-bold uppercase">{player.nickname}</span>
        <span className="mt-[3px] block font-mono text-[10px]/none font-medium uppercase tracking-[0.06em] text-txt-muted">
          {player.medalCount} medallas · {player.achievementCount} logros
        </span>
      </div>
      <span className="ml-auto flex-none font-mono text-[15px]/none font-semibold">
        {evNum(player.totalPoints)}
        <small className="ml-1 text-[10px] text-txt-muted">pts</small>
      </span>
    </div>
  )
}

// ── Podium — top 3 en podio (2 · 1 · 3) ──────────────────────────────────────
export function Podium({ players }: { players: PlayerLike[] }) {
  const top = players.slice(0, 3)
  const order = [top[1], top[0], top[2]].filter(Boolean) as PlayerLike[]
  return (
    <div className="mx-auto grid max-w-[760px] grid-cols-3 items-end gap-4 max-[720px]:max-w-[380px] max-[720px]:grid-cols-1">
      {order.map((p) => {
        const place = top.indexOf(p) + 1
        const first = place === 1
        return (
          <div
            key={p.userId}
            style={{ ["--ghue" as string]: evHue(p.hue) }}
            className={cn(
              "relative flex flex-col items-center px-4 pb-[18px] pt-[46px] text-center",
              "border border-solid bg-panel",
              first
                ? "border-accent-line bg-[linear-gradient(to_bottom,var(--accent-soft),var(--panel)_60%)] pt-[54px]"
                : "border-line",
              CUT_POD,
              "max-[720px]:flex-row max-[720px]:items-center max-[720px]:gap-[14px] max-[720px]:p-4 max-[720px]:text-left",
            )}
          >
            <span
              className={cn(
                "absolute left-1/2 top-3 grid h-[34px] w-[34px] -translate-x-1/2 place-items-center font-display text-[18px]/none font-extrabold italic",
                first ? "bg-accent text-accent-ink" : "border border-solid border-line-2 bg-panel-2 text-txt",
                CUT_PLACE,
                "max-[720px]:static max-[720px]:translate-x-0",
              )}
            >
              {place}
            </span>
            <Avatar
              accent
              className={cn(
                "mb-3 max-[720px]:!m-0 max-[720px]:!h-12 max-[720px]:!w-12 max-[720px]:!text-[18px]",
                first ? "!h-[74px] !w-[74px] !text-[28px]" : "!h-[60px] !w-[60px] !text-[22px]",
              )}
            >
              {p.avatar}
            </Avatar>
            <span className="font-display text-[19px]/[1.05] font-bold uppercase">{p.nickname}</span>
            {p.gameShort && (
              <span className="mt-1.5 border border-solid border-[color:color-mix(in_srgb,var(--ghue)_45%,var(--line))] px-[7px] py-1 font-mono text-[9.5px]/none font-semibold uppercase tracking-[0.1em] text-[color:var(--ghue)]">
                {p.gameShort}
              </span>
            )}
            <span className={cn("mt-3 font-display font-extrabold italic text-accent max-[720px]:ml-auto max-[720px]:mt-0", first ? "text-[32px]/none" : "text-[26px]/none")}>
              {evNum(p.totalPoints)}
              <small className="mt-[5px] block font-mono text-[9px]/none font-medium uppercase not-italic tracking-[0.12em] text-txt-muted [-webkit-text-stroke:0]">pts</small>
            </span>
            <span
              className={cn(
                "mt-4 block h-1 w-full max-[720px]:hidden",
                first ? "bg-accent opacity-100 max-[720px]:h-1.5" : "bg-[color:var(--ghue)] opacity-50",
                first && "h-1.5",
              )}
              aria-hidden="true"
            />
          </div>
        )
      })}
    </div>
  )
}
