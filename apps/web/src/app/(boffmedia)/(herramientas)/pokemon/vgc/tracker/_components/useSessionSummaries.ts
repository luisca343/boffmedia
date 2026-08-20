"use client"

import { useEffect, useState } from "react"
import { vgcDb } from "@/lib/db/vgc-db"
import { useTrackerSync } from "@/features/vgc-tracker/context/TrackerSyncContext"
import type { Match, Series, Session } from "@/features/vgc-tracker/types"

export interface LadderSummary {
  type: "ladder"
  played: number
  wins: number
  losses: number
  draws: number
  eloCurrent: number | null
  eloBest: number | null
}

export interface TournamentSummary {
  type: "tournament"
  seriesWins: number
  seriesLosses: number
  gameWins: number
  gameLosses: number
}

export type SessionSummary = LadderSummary | TournamentSummary

export interface Career {
  sessions: number
  wins: number
  losses: number
  winRate: number
  bestElo: number
}

function summarizeLadder(matches: Match[]): LadderSummary {
  const completed = matches.filter((m) => m.result !== undefined && m.eloAfter !== undefined)
  const chron = [...completed].sort((a, b) => (a.completedAt ?? a.createdAt) - (b.completedAt ?? b.createdAt))
  const elos = chron.map((m) => m.eloAfter as number)
  return {
    type: "ladder",
    played: completed.length,
    wins: completed.filter((m) => m.result === "win").length,
    losses: completed.filter((m) => m.result === "loss").length,
    draws: completed.filter((m) => m.result === "draw").length,
    eloCurrent: elos.length ? elos[elos.length - 1] : null,
    eloBest: elos.length ? Math.max(...elos) : null,
  }
}

function summarizeTournament(series: Series[]): TournamentSummary {
  const games = series.flatMap((s) => s.games)
  return {
    type: "tournament",
    seriesWins: series.filter((s) => s.seriesResult === "win").length,
    seriesLosses: series.filter((s) => s.seriesResult === "loss").length,
    gameWins: games.filter((g) => g.result === "win").length,
    gameLosses: games.filter((g) => g.result === "loss").length,
  }
}

/**
 * Loads every match + series once and reduces them to a per-session record
 * summary, keyed by session id. Recomputes when the session set or sync changes.
 */
export function useSessionSummaries(sessions: Session[]): Record<string, SessionSummary> {
  const { lastSyncAt } = useTrackerSync()
  const [byId, setById] = useState<Record<string, SessionSummary>>({})
  const sig = sessions.map((s) => `${s.id}:${s.type}`).join(",")

  useEffect(() => {
    let alive = true
    Promise.all([vgcDb.matches.toArray(), vgcDb.series.toArray()]).then(([matches, series]) => {
      if (!alive) return
      const map: Record<string, SessionSummary> = {}
      for (const s of sessions) {
        map[s.id] =
          s.type === "tournament"
            ? summarizeTournament(series.filter((x) => x.sessionId === s.id))
            : summarizeLadder(matches.filter((x) => x.sessionId === s.id))
      }
      setById(map)
    })
    return () => {
      alive = false
    }
  }, [sig, lastSyncAt])

  return byId
}

export function careerFromSummaries(sessions: Session[], byId: Record<string, SessionSummary>): Career {
  let wins = 0
  let losses = 0
  let bestElo = 0
  for (const s of sessions) {
    const sum = byId[s.id]
    if (!sum) continue
    if (sum.type === "ladder") {
      wins += sum.wins
      losses += sum.losses
      bestElo = Math.max(bestElo, sum.eloBest ?? 0)
    } else {
      wins += sum.seriesWins
      losses += sum.seriesLosses
    }
  }
  const total = wins + losses
  return { sessions: sessions.length, wins, losses, winRate: total ? Math.round((wins / total) * 100) : 0, bestElo }
}
