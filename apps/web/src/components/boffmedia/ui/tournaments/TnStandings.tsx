"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { DkFlag, DkPin } from "@/components/boffmedia/ui/tools/datakit"
import { TnAvatar } from "./TnEntrant"
import type { TnCompetitor } from "./tournaments-util"

export interface TnStanding {
  rank: number
  c: TnCompetitor
  played: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  pts: number
}
export interface TnCrosstableData {
  entrants: TnCompetitor[]
  grid: ({ r: string; s: string } | null)[][]
}
export interface TnGroup {
  name: React.ReactNode
  label?: string
  done: number
  total: number
  standings: TnStanding[]
}
export interface TnLeague {
  table: TnStanding[]
  crosstable: TnCrosstableData
  done?: number
  total?: number
}

const diff = (s: TnStanding) => (s.gf - s.ga > 0 ? "+" : "") + (s.gf - s.ga)

// Round-robin mini group card. `.tn-group`
export function TnGroupCard({ group, advance = 2, onOpen, pinned, onPin }: { group: TnGroup; advance?: number; onOpen?: (id: string) => void; pinned?: string | null; onPin?: (id: string) => void }) {
  const th = "border-b border-solid border-line px-[10px] py-[7px] text-left font-mono text-[8.5px]/none font-bold uppercase tracking-[0.08em] text-txt-dim"
  const td = "border-b border-solid border-line px-[10px] py-[7px] text-[12.5px] [tr:last-child_&]:border-b-0"
  return (
    <div className="border border-solid border-line bg-panel">
      <div className="flex items-center justify-between border-b border-solid border-line bg-base-2 px-[13px] py-[9px]">
        <b className="font-display text-[14px]/none font-bold uppercase tracking-[0.03em]">{group.name}</b>
        <span className="font-mono text-[9.5px]/none font-medium text-txt-dim">{group.done}/{group.total} jugados</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th} style={{ width: 30 }}>#</th>
              <th className={th}>Competidor</th>
              <th className={cn(th, "text-center")} style={{ width: 34 }}>PJ</th>
              <th className={cn(th, "text-center")} style={{ width: 66 }}>V-E-D</th>
              <th className={cn(th, "text-right")} style={{ width: 42 }}>Dif</th>
              <th className={cn(th, "text-right")} style={{ width: 40 }}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((s) => {
              const adv = s.rank <= advance
              return (
                <tr
                  key={s.c.id}
                  onClick={() => onOpen?.(s.c.id)}
                  className={cn(
                    onOpen && "cursor-pointer",
                    adv && "bg-[color-mix(in_srgb,var(--ok)_5%,transparent)]",
                    pinned === s.c.id && "!bg-[color-mix(in_srgb,var(--warn)_7%,transparent)]",
                  )}
                >
                  <td className={td}><span className={cn("font-mono text-[12px]/none font-bold", adv ? "text-ok" : "text-txt-muted")}>{s.rank}</span></td>
                  <td className={td}>
                    <span className="flex min-w-0 items-center gap-[9px]">
                      {s.c.kind === "team" ? <TnAvatar c={s.c} size={20} /> : <DkFlag flag={s.c.flag} code={s.c.country} name={s.c.countryName} size={14} />}
                      <b className="truncate font-body text-[13px]/[1.2] font-semibold">{s.c.name}</b>
                      {onPin && <DkPin on={pinned === s.c.id} onClick={() => onPin(s.c.id)} size={12} />}
                    </span>
                  </td>
                  <td className={cn(td, "text-center font-mono text-[12px] text-txt-dim")}>{s.played}</td>
                  <td className={cn(td, "text-center")}><WdlCell s={s} /></td>
                  <td className={cn(td, "text-right font-mono text-[12px] text-txt-muted")}>{diff(s)}</td>
                  <td className={cn(td, "text-right font-mono text-[12px] font-bold")}>{s.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WdlCell({ s }: { s: TnStanding }) {
  return (
    <span className="font-mono text-[12px]">
      <b className="text-ok">{s.w}</b>-<i className="not-italic text-txt-muted">{s.d}</i>-<u className="no-underline text-bad">{s.l}</u>
    </span>
  )
}

// Recent form pips from the crosstable. `.tn-form`
export function TnForm({ c, league }: { c: TnCompetitor; league: TnLeague }) {
  const { entrants, grid } = league.crosstable
  const i = entrants.findIndex((e) => e.id === c.id)
  const res: string[] = []
  if (i >= 0) for (let j = 0; j < entrants.length; j++) { const g = grid[i][j]; if (g) res.push(g.r) }
  const last = res.slice(-5)
  return (
    <span className="inline-flex gap-[3px]">
      {last.length === 0 ? (
        <i className="not-italic text-txt-dim">—</i>
      ) : (
        last.map((r, k) => (
          <span
            key={k}
            title={r === "w" ? "Victoria" : r === "l" ? "Derrota" : "Empate"}
            className={cn("inline-grid h-[18px] w-[18px] place-items-center font-mono text-[9px]/none font-extrabold text-white", r === "w" ? "bg-ok" : r === "l" ? "bg-bad" : "bg-[color:var(--dim)]")}
          >
            {r === "w" ? "V" : r === "l" ? "D" : "E"}
          </span>
        ))
      )}
    </span>
  )
}

// League (round robin) table. `.tn-ltable` on `.dk-table`
export function TnLeagueTable({ league, onOpen, pinned, onPin, promo = 4 }: { league: TnLeague; onOpen?: (id: string) => void; pinned?: string | null; onPin?: (id: string) => void; promo?: number }) {
  const th = "sticky top-0 z-[2] border-b border-solid border-line-2 bg-base-2 px-3 py-2.5 text-left font-mono text-[9px]/none font-semibold uppercase tracking-[0.14em] text-txt-dim whitespace-nowrap"
  const td = "border-b border-solid border-[color:color-mix(in_srgb,var(--line)_60%,transparent)] px-3 py-[9px] font-body text-[13px]/[1.35] align-middle [tr:last-child_&]:border-b-0"
  const mono = "font-mono text-[12px]"
  return (
    <div className="overflow-x-auto border border-solid border-line bg-panel">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className={th} style={{ width: 44 }}>#</th>
            <th className={th}>Competidor</th>
            <th className={cn(th, "text-center")} style={{ width: 40 }}>PJ</th>
            <th className={cn(th, "text-center")} style={{ width: 40 }}>V</th>
            <th className={cn(th, "text-center")} style={{ width: 40 }}>E</th>
            <th className={cn(th, "text-center")} style={{ width: 40 }}>D</th>
            <th className={cn(th, "text-right")} style={{ width: 64 }}>Dif</th>
            <th className={th} style={{ width: 130 }}>Forma</th>
            <th className={cn(th, "text-right")} style={{ width: 48 }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {league.table.map((s) => (
            <tr
              key={s.c.id}
              onClick={() => onOpen?.(s.c.id)}
              className={cn(
                onOpen && "cursor-pointer transition-colors hover:bg-panel-2",
                s.rank <= promo && "bg-[color-mix(in_srgb,var(--ok)_5%,transparent)]",
                pinned === s.c.id && "!bg-[color-mix(in_srgb,var(--warn)_7%,transparent)]",
              )}
            >
              <td className={td}><span className={cn("font-mono text-[12px]/none font-bold", s.rank <= 3 ? "text-warn" : "text-txt-muted")}>{s.rank}</span></td>
              <td className={td}>
                <span className="flex min-w-0 items-center gap-[9px]">
                  {s.c.kind === "team" ? <TnAvatar c={s.c} size={22} /> : <DkFlag flag={s.c.flag} code={s.c.country} name={s.c.countryName} size={15} />}
                  <span className="grid min-w-0">
                    <b className="truncate font-body text-[13px]/[1.2] font-semibold">{s.c.name}</b>
                    {s.c.tag && <i className="truncate font-mono text-[9.5px]/[1.2] not-italic text-txt-dim">{s.c.kind === "team" ? s.c.tag : "@" + s.c.tag}</i>}
                  </span>
                  {onPin && <DkPin on={pinned === s.c.id} onClick={() => onPin(s.c.id)} size={13} />}
                </span>
              </td>
              <td className={cn(td, mono, "text-center text-txt-dim")}>{s.played}</td>
              <td className={cn(td, mono, "text-center text-ok")}>{s.w}</td>
              <td className={cn(td, mono, "text-center text-txt-muted")}>{s.d}</td>
              <td className={cn(td, mono, "text-center text-bad")}>{s.l}</td>
              <td className={cn(td, mono, "text-right text-txt-muted")}>{diff(s)}</td>
              <td className={td}><TnForm c={s.c} league={league} /></td>
              <td className={cn(td, "text-right font-mono text-[14px] font-extrabold")}>{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// All-vs-all results matrix. `.tn-cross`
export function TnCrosstable({ crosstable, onOpen }: { crosstable: TnCrosstableData; onOpen?: (id: string) => void }) {
  const { entrants, grid } = crosstable
  const bordered = "border border-solid border-line text-center"
  return (
    <div className="overflow-auto border border-solid border-line bg-panel">
      <table className="border-collapse font-mono">
        <thead>
          <tr>
            <th className={cn(bordered, "bg-base-2")} />
            {entrants.map((e) => (
              <th key={e.id} className={cn(bordered, "bg-base-2 px-1 py-2")} title={e.name}>
                <span className="font-mono text-[9px]/none font-bold text-txt-muted [writing-mode:vertical-rl] [transform:rotate(180deg)]">{e.kind === "team" ? e.tag : "#" + e.seed}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entrants.map((e, i) => (
            <tr key={e.id}>
              <th className={cn(bordered, "sticky left-0 z-[1] bg-base-2")}>
                <button type="button" onClick={() => onOpen?.(e.id)} className="flex min-w-[150px] max-w-[200px] cursor-pointer items-center gap-[7px] border-0 bg-transparent px-[10px] py-[6px]">
                  {e.kind === "team" ? <TnAvatar c={e} size={18} /> : <DkFlag flag={e.flag} code={e.country} name={e.countryName} size={13} />}
                  <span className="truncate font-body text-[11.5px]/[1.2] font-semibold text-txt">{e.name}</span>
                </button>
              </th>
              {entrants.map((f, j) => {
                if (i === j) return <td key={f.id} className={cn(bordered, "bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,var(--line)_4px,var(--line)_5px)] text-txt-dim")}>—</td>
                const g = grid[i][j]
                return (
                  <td
                    key={f.id}
                    title={g ? `${e.name} ${g.s} ${f.name}` : "Pendiente"}
                    className={cn(
                      bordered,
                      "h-[34px] w-[42px] font-mono text-[10px]/none font-semibold text-txt-muted",
                      g?.r === "w" && "bg-ok-soft text-ok",
                      g?.r === "l" && "bg-bad-soft text-bad",
                      g?.r === "d" && "bg-warn-soft text-warn",
                    )}
                  >
                    {g ? g.s : ""}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
