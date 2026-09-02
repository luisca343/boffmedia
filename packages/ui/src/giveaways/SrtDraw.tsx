import * as React from "react"
import { Avatar, Button, Icon } from "../index"
import { useGiveawaysT } from "./i18n"
import { SRT_REEL_COLORS, srtTotalTickets, type Sorteo, type SrtParticipant } from "./giveaways-util"

interface ReelCell {
  p: SrtParticipant
  w: number
  ci: number
  key: string
  target: boolean
}

// Weighted draw reel — each participant occupies space proportional to their
// tickets, and the needle lands on the winner. Mirrors .srt-reel from
// sorteos.css.
export function SrtDrawReel({ sorteo, spinning, revealed, onLand }: { sorteo: Sorteo; spinning?: boolean; revealed?: boolean; onLand?: () => void }) {
  const t = useGiveawaysT()
  const trackRef = React.useRef<HTMLDivElement>(null)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const winner = sorteo.winner || sorteo.participants[0]

  const { cells, winnerCenter } = React.useMemo(() => {
    const base = sorteo.participants
    const unit = (p: SrtParticipant) => 40 + p.tickets * 14
    const reps = 6
    const out: ReelCell[] = []
    let x = 0
    let wc = 0
    const wIdx = Math.max(0, base.findIndex((p) => p.name === winner.name))
    for (let r = 0; r < reps; r++) {
      base.forEach((p, i) => {
        const w = unit(p)
        const isWinnerTarget = r === reps - 1 && i === wIdx
        if (isWinnerTarget) wc = x + w / 2
        out.push({ p, w, ci: i, key: r + "-" + i, target: isWinnerTarget })
        x += w
      })
    }
    return { cells: out, winnerCenter: wc }
  }, [sorteo.id, sorteo.participants, winner.name])

  React.useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (spinning) {
      const vw = viewportRef.current ? viewportRef.current.clientWidth : 600
      const target = winnerCenter - vw / 2
      track.style.transition = "none"
      track.style.transform = "translateX(0px)"
      void track.offsetWidth
      const dur = 3600
      track.style.transition = `transform ${dur}ms cubic-bezier(0.12, 0.72, 0.12, 1)`
      track.style.transform = `translateX(${-target}px)`
      const to = setTimeout(() => onLand && onLand(), dur + 60)
      return () => clearTimeout(to)
    } else if (revealed) {
      const vw = viewportRef.current ? viewportRef.current.clientWidth : 600
      track.style.transition = "none"
      track.style.transform = `translateX(${-(winnerCenter - vw / 2)}px)`
    } else {
      track.style.transition = "none"
      track.style.transform = "translateX(0px)"
    }
  }, [spinning, revealed, winnerCenter, onLand])

  return (
    <div className="relative">
      <div ref={viewportRef} className="relative h-[84px] overflow-hidden border border-solid border-line-2 bg-base-2">
        <span aria-hidden className="absolute -bottom-1 -top-1 left-1/2 z-[3] w-[3px] -translate-x-1/2 bg-txt [box-shadow:0_0_0_1px_var(--bg)]">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 border-[7px] border-solid border-transparent border-t-accent" />
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-[7px] border-solid border-transparent border-b-accent" />
        </span>
        <span aria-hidden className="pointer-events-none absolute inset-0 z-[2] [background:linear-gradient(90deg,var(--bg-2),transparent_12%_88%,var(--bg-2))]" />
        <div ref={trackRef} className="absolute bottom-0 left-0 top-0 flex will-change-transform">
          {cells.map((c) => {
            const color = SRT_REEL_COLORS[c.ci % SRT_REEL_COLORS.length]
            const isWin = revealed && c.target
            return (
              <div
                key={c.key}
                className="relative flex flex-none flex-col items-center justify-center gap-1 overflow-hidden border-r border-solid border-[rgba(0,0,0,0.35)]"
                style={{ width: c.w, background: color, boxShadow: isWin ? "inset 0 0 0 3px var(--text)" : undefined }}
              >
                <Avatar className="h-[30px] w-[30px] text-[12px]">{c.p.avatar}</Avatar>
                <span className="whitespace-nowrap font-mono text-[9px]/none font-semibold uppercase tracking-[0.04em] text-accent-ink opacity-[0.85]">{c.p.name}</span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px]/none font-medium tracking-[0.05em] text-txt-muted">
        <Icon name="info" size={13} />
        {t("reelExplainer")}
      </div>
    </div>
  )
}

export function SrtWinnerCard({ sorteo, onReplay }: { sorteo: Sorteo; onReplay?: () => void }) {
  const t = useGiveawaysT()
  const w = sorteo.winner
  if (!w) return null
  const total = srtTotalTickets(sorteo)
  const odds = total ? (w.tickets / total) * 100 : 0
  return (
    <div className="relative border border-solid border-accent-line border-t-[3px] border-t-accent bg-panel px-[26px] pb-[30px] pt-[34px] text-center cut-corner cut-corner-edge [--cut-line:var(--accent-line)] [--cut-lg:16px]">
      <span aria-hidden className="pointer-events-none absolute inset-0 z-0 [background:radial-gradient(80%_70%_at_50%_0,var(--accent-soft),transparent_60%)]" />
      <span className="relative z-[1] inline-flex items-center gap-[7px] border border-solid border-accent-line px-[11px] py-1.5 font-mono text-[10px]/none font-bold uppercase tracking-[0.14em] text-accent">
        <Icon name="sparkles" size={12} />
        {t("status.announced.label")}
      </span>
      <div className="relative z-[1] mx-auto mb-[14px] mt-[18px] grid h-[76px] w-[76px] place-items-center border border-solid border-accent-line bg-accent-soft text-accent cut-seal cut-seal-edge [--cut-line:var(--accent-line)] [--cut:14px]">
        <Icon name="trophy" size={40} />
      </div>
      <div className="relative z-[1] inline-flex items-center gap-3">
        <Avatar accent className="h-11 w-11 text-[17px]">{w.avatar}</Avatar>
        <b className="font-display text-[34px]/none font-extrabold italic text-txt">{w.name}</b>
      </div>
      <p className="relative z-[1] mt-3 text-[14px] text-txt-muted">
        {/* Plain `t`, not a rich translation. The web original passed a `b`
            chunk handler, but neither locale's `wonWith` contains a tag for it
            to wrap — the handler never fired. Keeping it would have forced a
            `rich` method onto the shared `Translate` type, which the launcher's
            translator does not implement and every tool package's namespace
            shim would then fail to satisfy. */}
        {t("wonWith", { tickets: w.tickets, odds: odds.toFixed(1) })}
      </p>
      {onReplay && (
        <div className="relative z-[1] mt-5 flex flex-wrap justify-center gap-2.5">
          <Button variant="pri" icon="play" onClick={onReplay}>
            {t("watchDraw")}
          </Button>
          <Button icon="link">{t("share")}</Button>
        </div>
      )}
    </div>
  )
}
