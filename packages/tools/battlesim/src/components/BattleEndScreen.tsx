"use client"

import { Battle } from "@pkmn/client"
import { Button, DISPLAY_VOICE, cn } from "@boffmedia/ui"
import { useToolT, BATTLESIM_NS } from "../i18n"
import { getParticipantName } from "../engine/replayUtils"
import { toBSXMon } from "../engine/toBSXMon"
import { BxSlot, BxUnknownSlot } from "./bx-kit"
import type { BSXMon } from "../engine/toBSXMon"
import type { EndAction } from "../lib/battle-types"

export type EndResult = "win" | "loss" | "tie"

/**
 * Who won, as a SIDE INDEX. `|win|` carries a player name, so the name is
 * matched against the two sides' names once, here; nothing downstream
 * compares strings. With no win line (a replay cut short) the side with
 * Pokémon standing takes it.
 */
export function endResult(battle: Battle, pov: 0 | 1, winnerName?: string | null): { result: EndResult; winnerSide: 0 | 1 | null } {
  const w = (winnerName ?? battle.winner)?.trim()
  let winnerSide: 0 | 1 | null = null
  if (w) {
    const p1 = getParticipantName(battle.p1.name).trim()
    const p2 = getParticipantName(battle.p2.name).trim()
    if (w === battle.p1.name.trim() || w === p1) winnerSide = 0
    else if (w === battle.p2.name.trim() || w === p2) winnerSide = 1
  }
  if (winnerSide == null) {
    const a = battle.p1.team.some((p) => !p.fainted)
    const b = battle.p2.team.some((p) => !p.fainted)
    if (a && !b) winnerSide = 0
    else if (!a && b) winnerSide = 1
  }
  if (winnerSide == null) return { result: "tie", winnerSide: null }
  return { result: winnerSide === pov ? "win" : "loss", winnerSide }
}

const TONE: Record<EndResult, { text: string; soft: string; line: string }> = {
  win: { text: "text-ok", soft: "bg-ok-soft", line: "border-ok" },
  loss: { text: "text-bad", soft: "bg-bad-soft", line: "border-bad" },
  tie: { text: "text-warn", soft: "bg-warn-soft", line: "border-warn" },
}

/**
 * A side's display name. `getParticipantName` answers "Unknown" for a side the
 * protocol never named, which is an English word in a Spanish UI and tells the
 * reader nothing — the catalog's "TÚ" / "RIVAL" does.
 */
function sideName(raw: string, fallback: string): string {
  const n = getParticipantName(raw || "").trim()
  return !n || n === "Unknown" ? fallback : n
}

/**
 * Every slot of a side, revealed or not.
 *
 * `Side.team` only ever holds what the protocol showed, so in a format without
 * team preview it is "the Pokémon that were sent out" rather than "the team".
 * `Side.totalPokemon` (the `|teamsize|` line) is how many there really are, and
 * the difference is rendered as hidden slots — the same six-dot count the
 * header has been showing all battle.
 */
function membersOf(side: Battle["p1"], known?: BSXMon[]): EndMember[] {
  const fromRequest = (known ?? []).filter((m): m is BSXMon => !!m)
  const list: EndMember[] = (fromRequest.length > 0 ? fromRequest : side.team.map((p) => toBSXMon(p)).filter((m): m is BSXMon => !!m))
    .map((mon, i) => ({ mon, key: `${mon.id}-${i}` }))
  const total = Math.max((side as { totalPokemon?: number }).totalPokemon ?? 0, list.length)
  for (let i = list.length; i < total; i++) list.push({ mon: null, key: `hidden-${i}` })
  return list
}

interface BattleEndScreenProps {
  battle: Battle
  pov: 0 | 1 | any
  username?: string | null
  /** Ranked actions: the first is primary. */
  actions?: EndAction[]
  /** Legacy single action (the replay player). */
  onRestart?: () => void
  /** The transport-reported winner name, for a forfeit whose `|win|` line never reached the client battle. */
  winner?: string | null
  /**
   * Your side as the LAST REQUEST knew it. `battle.p1.team` only holds what the
   * protocol revealed, so in a format without team preview the end screen used
   * to list the one Pokémon that had been sent out. The request carries all six
   * with their real HP, so the caller remembers it and hands it over here.
   */
  youTeam?: BSXMon[]
  /** Display names, already resolved (the raw side name can be empty). */
  youName?: string
  foeName?: string
}

/** One end-screen chip's worth of data — a known member or a hidden slot. */
type EndMember = { mon: BSXMon; key: string } | { mon: null; key: string }

export function BattleEndScreen({ battle, pov, actions, onRestart, winner, youTeam, youName, foeName }: BattleEndScreenProps) {
  const t = useToolT(BATTLESIM_NS)
  const side: 0 | 1 = pov === 1 ? 1 : 0
  const { result, winnerSide } = endResult(battle, side, winner && winner !== 'tie' ? winner : undefined)
  const you = side === 0 ? battle.p1 : battle.p2
  const foe = side === 0 ? battle.p2 : battle.p1
  const winnerName = winnerSide == null ? "" : sideName((winnerSide === 0 ? battle.p1 : battle.p2).name, winnerSide === side ? t("battle.you") : t("battle.foe"))
  const tone = TONE[result]
  const title = result === "win" ? t("battle.end.victory") : result === "loss" ? t("battle.end.defeat") : t("battle.end.tie")
  const sub = result === "tie" ? t("battle.end.subtitleTie", { turn: battle.turn }) : t("battle.end.subtitleWin", { name: winnerName, turn: battle.turn })
  const list = actions && actions.length > 0 ? actions : onRestart ? [{ id: "again", label: t("battle.end.replayAgain"), variant: "pri" as const, onClick: onRestart, icon: "play" as const }] : []

  const yourName = youName || sideName(you.name, t("battle.you"))
  const theirName = foeName || sideName(foe.name, t("battle.foe"))
  const yourMembers = membersOf(you, youTeam)
  const theirMembers = membersOf(foe, undefined)

  const row = (label: string, members: EndMember[], foeSide: boolean) => (
    <div className="grid min-w-0 gap-2">
      <span className="flex items-center gap-2 font-mono text-[0.625rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
        <i aria-hidden className={cn("h-2 w-2", foeSide ? "bg-bad" : "bg-accent")} />{label}
      </span>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(9.875rem,1fr))] gap-[0.375rem]">
        {members.map((m) =>
          m.mon == null ? (
            <BxUnknownSlot key={m.key} small />
          ) : (
            <BxSlot key={m.key} small mon={m.mon} dim={!!m.mon.fnt}
              aside={m.mon.fnt
                ? <b className="flex-none font-mono text-[0.5625rem] font-bold leading-none text-bad">{t("battle.end.ko")}</b>
                : <b className="flex-none font-mono text-[0.5625rem] font-bold leading-none text-txt-dim">{m.mon.hp}%</b>} />
          ),
        )}
      </div>
    </div>
  )

  return (
    <div role="dialog" aria-label={t("battle.end.aria")} className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-base/90 p-3 backdrop-blur-[3px] sm:p-5">
      <div className="m-auto flex w-full max-w-[47.5rem] min-[2240px]:max-w-[65rem] flex-col gap-4 animate-[bm-modal-in_320ms_ease_both] motion-reduce:animate-none">
        <div className={cn("border border-solid bg-panel p-5 text-center sm:p-7", tone.line)}>
          <span className={cn("cut cut-edge-slant [--cut:3px] inline-block border border-solid px-2 py-1 font-mono text-[0.625rem] font-bold uppercase leading-none tracking-[0.14em]", tone.text, tone.soft, tone.line)}>{t("battle.turn", { turn: battle.turn })}</span>
          <h2 className={cn(DISPLAY_VOICE, "m-0 mt-2 text-[clamp(2.75rem,9vw,5.25rem)]", tone.text)}>{title}</h2>
          <p className="m-0 mt-2 font-mono text-[0.75rem] uppercase tracking-[0.08em] text-txt-muted">{sub}</p>
        </div>

        <div className="grid gap-4 border border-solid border-line bg-panel p-4 md:grid-cols-2">
          {row(`${t("battle.you")} · ${yourName}`, yourMembers, false)}
          {row(`${t("battle.foe")} · ${theirName}`, theirMembers, true)}
        </div>

        {list.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {list.map((a, i) => (
              <Button key={a.id} variant={a.variant} size={i === 0 ? "lg" : "md"} icon={a.icon} onClick={a.onClick}>{a.label}</Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BattleEndScreen
