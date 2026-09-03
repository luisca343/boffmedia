"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { TnCompetitor, TnMatch } from "./tournaments-util"

// Circular «world-poster» elimination bracket: competitors on the outer ring,
// crosses converging on the central trophy, scaling 8→256 seats. `.tn-radial`
// Faces use emoji flags (self-contained) rather than fetched PNGs.

export interface RadialRound {
  phase: React.ReactNode
  matches: TnMatch[]
}

interface RSeat {
  x: number
  y: number
  c: TnCompetitor | null
  seed?: number | null
}
interface RNode {
  a: number
  R: number
  x: number
  y: number
  match: TnMatch
}
interface RPath {
  d: string
  tid: string | null
}

function radialLayout(rounds: RadialRound[]) {
  const S = rounds[0].matches.length * 2
  const half = S / 2
  const nR = rounds.length
  const cx = 500
  const cy = 500
  const maxR = 462
  const gap = ((S >= 24 ? 19 : S >= 12 ? 24 : 33) * Math.PI) / 180
  const seatR = maxR * 0.9
  const step = (Math.PI - 2 * gap) / half
  const flagR = Math.max(6.5, Math.min(34, seatR * Math.sin(step / 2) * 0.82))
  const TOP = Math.PI / 2
  const seatAng = new Array<number>(S)
  for (let i = 0; i < half; i++) seatAng[i] = TOP - gap - (i + 0.5) * step
  for (let j = 0; j < half; j++) seatAng[half + j] = TOP + gap + (j + 0.5) * step
  const polar = (a: number, r: number): [number, number] => [cx + r * Math.cos(a), cy - r * Math.sin(a)]
  const nodeRings = nR - 1
  const Rout = maxR * 0.75
  const Rin = maxR * 0.21
  const ringR = (r: number) => (nodeRings <= 1 ? Rin : Rout + (Rin - Rout) * (r / (nodeRings - 1)))
  const meanAng = (r: number, m: number) => {
    const w = Math.pow(2, r + 1)
    let s = 0
    for (let k = m * w; k < m * w + w; k++) s += seatAng[k]
    return s / w
  }

  const nodes: RNode[][] = []
  for (let r = 0; r < nR - 1; r++) {
    nodes[r] = []
    const M = rounds[r].matches.length
    for (let m = 0; m < M; m++) {
      const a = meanAng(r, m)
      const R = ringR(r)
      const [x, y] = polar(a, R)
      nodes[r][m] = { a, R, x, y, match: rounds[r].matches[m] }
    }
  }

  const ringGap = nodeRings > 1 ? (Rout - Rin) / (nodeRings - 1) : (seatR - Rin) * 0.5
  const nodeR: number[] = []
  for (let r = 0; r < nodeRings; r++) {
    const M = rounds[r].matches.length
    const stepN = (Math.PI - 2 * gap) / Math.max(1, M / 2)
    const chord = ringR(r) * Math.sin(Math.min(Math.PI / 2, stepN / 2)) * 0.85
    nodeR[r] = Math.max(3.5, Math.min(flagR * 0.95, ringGap * 0.4, chord))
  }

  const fmt = (n: number) => n.toFixed(1)
  const elbow = (aC: number, rC: number, aP: number, rP: number) => {
    const [x1, y1] = polar(aC, rC)
    const [x2, y2] = polar(aC, rP)
    const [x3, y3] = polar(aP, rP)
    const sweep = aP > aC ? 0 : 1
    return `M${fmt(x1)} ${fmt(y1)} L${fmt(x2)} ${fmt(y2)} A${fmt(rP)} ${fmt(rP)} 0 0 ${sweep} ${fmt(x3)} ${fmt(y3)}`
  }
  const paths: RPath[] = []
  for (let m = 0; m < rounds[0].matches.length; m++) {
    const p = nodes[0][m]
    const mt = rounds[0].matches[m]
    ;([[2 * m, mt.top], [2 * m + 1, mt.bot]] as [number, TnCompetitor | null][]).forEach(([si, c]) =>
      paths.push({ d: elbow(seatAng[si], seatR - flagR - 2, p.a, p.R), tid: c ? c.id : null }),
    )
  }
  for (let r = 1; r < nR - 1; r++)
    for (let m = 0; m < nodes[r].length; m++) {
      const p = nodes[r][m]
      ;[2 * m, 2 * m + 1].forEach((ci) => {
        const c = nodes[r - 1][ci]
        const w = c.match && c.match.winner
        paths.push({ d: elbow(c.a, c.R, p.a, p.R), tid: w ? w.id : null })
      })
    }
  const semi = nodes[nR - 2] || []
  const fGap = maxR * 0.17
  const finalR = Math.max(9, Math.min(flagR * 1.15, maxR * 0.055))
  semi.forEach((n) => {
    const dir = Math.cos(n.a) >= 0 ? 1 : -1
    const [x1, y1] = polar(n.a, n.R)
    const w = n.match && n.match.winner
    paths.push({ d: `M${fmt(x1)} ${fmt(y1)} L${fmt(cx + dir * fGap)} ${fmt(cy)}`, tid: w ? w.id : null })
  })

  const seats: RSeat[] = []
  for (let m = 0; m < rounds[0].matches.length; m++) {
    const mt = rounds[0].matches[m]
    ;([[mt.top, mt.topSeed, 2 * m], [mt.bot, mt.botSeed, 2 * m + 1]] as [TnCompetitor | null, number | null | undefined, number][]).forEach(([c, sd, si]) => {
      const [x, y] = polar(seatAng[si], seatR)
      seats.push({ x, y, c, seed: sd })
    })
  }
  const finals = (rounds[nR - 1] && rounds[nR - 1].matches[0]) || null
  const dirOf = (n: RNode | undefined, fb: number) => (n ? (Math.cos(n.a) >= 0 ? 1 : -1) : fb)
  const finalSeats: RSeat[] = finals
    ? [
        { c: finals.top || null, x: cx + dirOf(semi[0], 1) * fGap, y: cy },
        { c: finals.bot || null, x: cx + dirOf(semi[1], -1) * fGap, y: cy },
      ]
    : []
  return { cx, cy, maxR, seatR, flagR, seats, nodes, nodeR, paths, semi, fGap, finalR, finals, finalSeats, S }
}

type BracketT = (key: string, values?: Record<string, string | number>) => string

const radialRoundName = (t: BracketT, players: number) =>
  players <= 2
    ? t("roundFinal")
    : players === 4
      ? t("roundSemis")
      : players === 8
        ? t("roundQuarters")
        : players === 16
          ? t("round16")
          : t("roundOf", { players })

function RadialFace({ c, r }: { c: TnCompetitor; r: number }) {
  if (c.kind === "team")
    return (
      <>
        <circle r={r - 2} fill={`hsl(${c.hue || 210} 42% 34%)`} />
        <text y={1} textAnchor="middle" dominantBaseline="central" fill="#fff" style={{ fontSize: r * 0.9, fontFamily: "var(--font-display)", fontWeight: 800 }}>
          {(c.name || "?").replace(/^Equipo\s+/, "")[0]}
        </text>
      </>
    )
  return (
    <text y={1} textAnchor="middle" dominantBaseline="central" style={{ fontSize: r * 1.4, pointerEvents: "none" }}>
      {c.flag || "🏳️"}
    </text>
  )
}

// per-element ring style resolved from state (CSS cascade → JS)
function ring(opts: { base: number; live: boolean; path: boolean; win: boolean; champ?: boolean; pin?: boolean }) {
  const { base, live, path, win, champ, pin } = opts
  if (win) return { fill: "var(--panel)", stroke: "var(--warn)", strokeWidth: 2.6, dash: undefined as string | undefined }
  if (path) return { fill: "var(--panel)", stroke: "var(--accent-bright)", strokeWidth: 3, dash: undefined }
  if (pin) return { fill: "var(--panel)", stroke: "var(--accent-bright)", strokeWidth: 3, dash: undefined }
  if (champ) return { fill: "var(--panel)", stroke: "var(--warn)", strokeWidth: 3.5, dash: undefined }
  if (!live) return { fill: "var(--bg)", stroke: "var(--line-2)", strokeWidth: base, dash: "3 4" }
  return { fill: "var(--panel)", stroke: "var(--line-2)", strokeWidth: base, dash: undefined }
}

export function TnRadialBracket({ rounds, championId, onOpen, pinned }: { rounds: RadialRound[]; championId?: string | null; onOpen?: (id: string) => void; pinned?: string | null }) {
  const t = useTranslations("torneos.bracket") as unknown as BracketT
  const L = React.useMemo(() => (rounds && rounds.length ? radialLayout(rounds) : null), [rounds])
  const [hovered, setHovered] = React.useState<string | null>(null)
  if (!L) return null
  const hl = hovered || pinned || null
  const fr = L.flagR
  const champ = championId ? L.seats.find((s) => s.c && s.c.id === championId) : null
  const played = rounds.filter((rd) => rd.matches.every((m) => m.winner)).length
  const liveRound = rounds[Math.min(played, rounds.length - 1)]
  const dim = (isPath: boolean) => (hl && !isPath ? 0.4 : 1)
  const seatHandlers = (c: TnCompetitor | null) =>
    c
      ? {
          onClick: () => onOpen?.(c.id),
          onMouseEnter: () => setHovered(c.id),
          onMouseLeave: () => setHovered(null),
          role: onOpen ? ("button" as const) : undefined,
          tabIndex: onOpen ? 0 : undefined,
          style: { cursor: onOpen ? "pointer" : "default" },
        }
      : {}

  return (
    <div className={cn("relative grid justify-items-center border border-solid border-line bg-base-2 p-[clamp(1rem,3.4%,2.125rem)]")}>
      <svg viewBox="0 0 1000 1000" role="img" aria-label={t("radialAriaLabel")} className="block h-auto w-full max-w-[min(51.25rem,82vh)]">
        {/* connectors */}
        <g fill="none">
          {L.paths.map((p, i) => {
            const isWin = !!championId && p.tid === championId
            const isPath = !!hl && p.tid === hl
            const stroke = isWin ? "var(--warn)" : isPath ? "var(--accent-bright)" : "var(--dim)"
            const w = isWin ? 2.8 : isPath ? 3 : 1.6
            return <path key={i} d={p.d} stroke={stroke} strokeWidth={w} style={{ opacity: hl && !isPath && !isWin ? 0.3 : 1 }} />
          })}
        </g>
        {/* central trophy */}
        <text x={L.cx} y={L.cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: L.maxR * 0.125, pointerEvents: "none" }}>🏆</text>
        {/* round-winner rings */}
        {L.nodes.map((ringNodes, r) => {
          const nr = L.nodeR[r]
          const players = rounds[r].matches.length * 2
          return (
            <g key={r}>
              {ringNodes.map((n, m) => {
                const w = n.match && n.match.winner
                const isPath = !!(hl && w && w.id === hl)
                const isWin = !!(championId && w && w.id === championId)
                const st = ring({ base: 1.6, live: !!w, path: isPath, win: isWin, champ: !!(championId && w && w.id === championId) })
                const tip = n.match && n.match.top && n.match.bot ? `${radialRoundName(t, players)} · ${n.match.top.name}${n.match.g1 != null ? ` ${n.match.g1}–${n.match.g2} ` : " vs "}${n.match.bot.name}` : `${radialRoundName(t, players)} · ${t("tbdShort")}`
                return (
                  <g key={m} transform={`translate(${n.x} ${n.y})`} style={{ opacity: dim(isPath) }} {...(w ? seatHandlers(w) : {})}>
                    <title>{tip}</title>
                    <circle r={nr} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} strokeDasharray={st.dash} />
                    {w ? <RadialFace c={w} r={nr} /> : <circle r={Math.max(1.4, nr * 0.24)} fill="var(--muted)" />}
                  </g>
                )
              })}
            </g>
          )
        })}
        {/* finalists beside the trophy */}
        <g>
          {L.finalSeats.map((f, i) => {
            const c = f.c
            const isChamp = !!(c && championId && c.id === championId)
            const isPath = !!(hl && c && c.id === hl)
            const st = ring({ base: 2.4, live: !!c, path: isPath, win: isChamp, champ: isChamp })
            return (
              <g key={i} transform={`translate(${f.x} ${f.y})`} style={{ opacity: dim(isPath) }} {...seatHandlers(c)}>
                <title>{c ? (isChamp ? t("champion") + " · " : t("finalist") + " · ") + c.name : t("finalTbd")}</title>
                <circle r={L.finalR} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} strokeDasharray={st.dash} />
                {c ? <RadialFace c={c} r={L.finalR} /> : <circle r={L.finalR * 0.24} fill="var(--muted)" />}
              </g>
            )
          })}
        </g>
        {/* seats / competitors */}
        <g>
          {L.seats.map((s, i) => {
            const c = s.c
            const isChamp = !!(champ && c && c.id === championId)
            const isPin = !!(c && pinned === c.id)
            const isPath = !!(hl && c && c.id === hl)
            const st = ring({ base: 2, live: !!c, path: isPath, win: false, champ: isChamp, pin: isPin })
            return (
              <g key={i} transform={`translate(${s.x} ${s.y})`} style={{ opacity: dim(isPath) }} {...seatHandlers(c)}>
                {c && <title>{c.name + (s.seed != null ? " · " + t("seed", { seed: s.seed }) : "")}</title>}
                <circle r={fr} fill={st.fill} stroke={st.stroke} strokeWidth={st.strokeWidth} strokeDasharray={st.dash} />
                {c ? (
                  <RadialFace c={c} r={fr} />
                ) : (
                  <text y={1} textAnchor="middle" dominantBaseline="central" fill="var(--dim)" style={{ fontSize: fr * 0.7, fontFamily: "var(--font-mono)" }}>?</text>
                )}
                {s.seed != null && c && fr >= 13 && (
                  <text x={0} y={fr + 11} textAnchor="middle" fill={isChamp ? "var(--warn)" : "var(--dim)"} style={{ fontSize: Math.max(9, fr * 0.42), fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                    {s.seed}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>
      {champ && champ.c ? (
        <div className="mt-4 inline-flex items-center gap-2.5 border border-solid border-warn bg-panel px-[0.875rem] py-2 shadow-[var(--shadow)]">
          <span className="inline-flex text-[1.375rem] leading-none">{champ.c.kind === "team" ? "🏆" : champ.c.flag}</span>
          <span className="grid gap-px">
            <i className="font-mono text-[0.53125rem]/none font-bold uppercase not-italic tracking-[0.16em] text-warn">{t("champion")}</i>
            <b className="font-display text-[0.9375rem]/none font-bold uppercase tracking-[0.02em]">{champ.c.name}</b>
          </span>
        </div>
      ) : (
        <div className="mt-4 inline-flex items-baseline gap-3 border border-solid border-line-2 bg-panel px-[0.875rem] py-2 shadow-[var(--shadow)]">
          <span className="grid gap-px">
            <i className="font-mono text-[0.53125rem]/none font-bold uppercase not-italic tracking-[0.16em] text-accent-bright">{t("live")}</i>
            <b className="font-display text-[0.9375rem]/none font-bold uppercase tracking-[0.02em]">{radialRoundName(t, liveRound.matches.length * 2)}</b>
          </span>
          <em className="font-mono text-[0.6875rem]/none not-italic text-txt-dim">{t("roundsPlayed", { played, total: rounds.length })}</em>
        </div>
      )}
    </div>
  )
}
