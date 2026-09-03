"use client"

import { VgcLink } from "../../routing";
import { useVgcT } from "../../i18n";
import { cn } from "@boffmedia/ui/cn"
import { Icon } from "@boffmedia/ui"
import { TrResult, TrBrought, trFmtTime } from "../_components/ui/tr-ui"
import { seriesScore } from "../../tracker-core/types"
import type { Match, Series } from "../../tracker-core/types"

const ROW =
  "flex w-full min-w-0 items-start gap-3 border border-solid border-line bg-panel px-[0.8125rem] py-[0.625rem] text-left transition-[border-color,background] hover:border-line-2 hover:bg-panel-2"
const CHIP = "whitespace-nowrap border border-solid border-line-2 px-[0.375rem] py-[3px] font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.08em] text-txt-muted"
const CHIP_GHOST = "whitespace-nowrap border border-dashed border-line-2 px-[0.375rem] py-[3px] font-mono text-[0.5625rem] font-semibold uppercase leading-none tracking-[0.08em] text-txt-dim"
const NOTES = "inline-flex items-center gap-1 font-mono text-[0.625rem] text-txt-dim"

export function TrMatchRow({ match, number, sessionId, eloDelta }: { match: Match; number: number; sessionId: string; eloDelta?: number }) {
  const t = useVgcT("tracker")
  const deltaTone = eloDelta == null ? "text-txt-dim" : match.result === "win" ? "text-ok" : match.result === "loss" ? "text-bad" : "text-txt-dim"
  return (
    <VgcLink href={`/pokemon/vgc/tracker/${sessionId}/${match.id}`} className={ROW}>
      <TrResult result={match.result} size={30} />
      <span className="grid min-w-0 flex-1 gap-[0.375rem]">
        <span className="flex min-w-0 flex-wrap items-center gap-[0.5625rem]">
          <b className="font-display text-[0.84375rem] font-bold uppercase leading-[1.1] tracking-[0.03em]">{t("matchRow.match", { number })}</b>
          {match.opponentName && <span className="font-body text-[0.75rem] text-txt-muted">{t("matchRow.vs")} {match.opponentName}</span>}
          {match.opponentArchetype && <span className={CHIP_GHOST}>{match.opponentArchetype}</span>}
          <span className="ml-auto inline-flex items-center gap-[0.5625rem]">
            {eloDelta != null && (
              <span className={cn("font-mono text-[0.71875rem] font-bold leading-none", deltaTone)}>
                {eloDelta >= 0 ? "+" : ""}
                {Number.isInteger(eloDelta) ? eloDelta : eloDelta.toFixed(1)}
              </span>
            )}
            {match.eloAfter != null && <span className="font-mono text-[0.6875rem] text-txt-muted">{match.eloAfter}</span>}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-[0.5625rem]">
          <TrBrought slots={match.myTeam.slots} size={22} />
          <i className="font-mono text-[0.5625rem] not-italic uppercase leading-none tracking-[0.1em] text-txt-dim">{t("matchRow.vs")}</i>
          <TrBrought slots={match.opponentTeam.slots} size={22} />
          <span className="ml-auto font-mono text-[0.625rem] text-txt-dim">{trFmtTime(match.createdAt)}</span>
          {match.notes.length > 0 && (
            <span className={NOTES}>
              <Icon name="message" size={11} />
              {match.notes.length}
            </span>
          )}
        </span>
      </span>
    </VgcLink>
  )
}

const DOT = "inline-block h-2 w-2 cut [--cut:2px]"

export function TrSeriesRow({ series, number, sessionId }: { series: Series; number: number; sessionId: string }) {
  const t = useVgcT("tracker")
  const { wins, losses } = seriesScore(series.games)
  const score = series.seriesResult === "win" ? `2–${losses}` : series.seriesResult === "loss" ? `${wins}–2` : `${wins}–${losses}`
  const scoreTone = series.seriesResult === "win" ? "text-ok" : series.seriesResult === "loss" ? "text-bad" : "text-txt-dim"
  return (
    <VgcLink href={`/pokemon/vgc/tracker/${sessionId}/series/${series.id}`} className={ROW}>
      <TrResult result={series.seriesResult} size={30} />
      <span className="grid min-w-0 flex-1 gap-[0.375rem]">
        <span className="flex min-w-0 flex-wrap items-center gap-[0.5625rem]">
          {series.roundNumber != null && <span className={CHIP}>R{series.roundNumber}</span>}
          <b className="font-display text-[0.84375rem] font-bold uppercase leading-[1.1] tracking-[0.03em]">
            {series.opponentName || t("tournament.seriesNumber", { n: number })}
          </b>
          {series.opponentArchetype && <span className={CHIP_GHOST}>{series.opponentArchetype}</span>}
          <span className="ml-auto inline-flex items-center gap-[0.5625rem]">
            <span className="inline-flex gap-1">
              {series.games.map((g, i) => (
                <i key={i} className={cn(DOT, g.result === "win" ? "bg-ok" : g.result === "loss" ? "bg-bad" : "bg-warn")} />
              ))}
            </span>
            <span className={cn("font-mono text-[0.8125rem] font-bold", scoreTone)}>{score}</span>
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-[0.5625rem]">
          <TrBrought slots={series.opponentTeam.slots} size={22} mode="preview" />
          <span className="ml-auto font-mono text-[0.625rem] text-txt-dim">{trFmtTime(series.createdAt)}</span>
          {series.notes.length > 0 && (
            <span className={NOTES}>
              <Icon name="message" size={11} />
              {series.notes.length}
            </span>
          )}
        </span>
      </span>
    </VgcLink>
  )
}
