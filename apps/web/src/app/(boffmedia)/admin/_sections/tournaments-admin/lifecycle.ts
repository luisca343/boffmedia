import type {
  TournamentDetailApi,
  TnMatchApi,
  TnStatus,
} from "@/services/api/boffmedia/tournamentsService"

/**
 * The tournament's lifecycle, read from the payload — no React, no i18n, so
 * every screen of the admin derives "where are we" and "what next" from the
 * same place, and the answers can be unit-tested.
 */

/** The four stages the stepper draws. `cancelled` is a badge, not a step. */
export const STAGES = ["draft", "registration", "live", "completed"] as const
export type Stage = (typeof STAGES)[number]

export function stageIndex(status: TnStatus): number {
  const i = STAGES.indexOf(status as Stage)
  return i === -1 ? 0 : i
}

/**
 * Registration is open only when BOTH gates the API checks are open. Reading
 * the flag alone is what once made a fresh tournament (status `draft`, flag
 * `true` straight from the create form) claim to be taking sign-ups.
 */
export function registrationIsOpen(tn: TournamentDetailApi): boolean {
  return tn.status === "registration" && tn.registrationOpen
}

export function isPreStart(tn: TournamentDetailApi): boolean {
  return tn.status === "draft" || tn.status === "registration"
}

export function livePhase(tn: TournamentDetailApi) {
  return (tn.phases ?? []).find((p) => p.status === "live") ?? null
}

/** Counts every screen shows; computed once, the same way, everywhere. */
export interface FieldStats {
  registered: number
  active: number
  entered: number
  checkedIn: number
  missingTeamsheet: number
  missingCheckIn: number
  dropped: number
}

export function fieldStats(tn: TournamentDetailApi): FieldStats {
  const s: FieldStats = {
    registered: tn.participants.length,
    active: 0,
    entered: 0,
    checkedIn: 0,
    missingTeamsheet: 0,
    missingCheckIn: 0,
    dropped: 0,
  }
  for (const p of tn.participants) {
    if (p.status === "dropped") s.dropped++
    if (p.status !== "active") continue
    s.active++
    if (p.checkedIn) s.checkedIn++
    // `entryGaps` is admin-only; on the admin page it is always populated.
    const gaps = p.entryGaps ?? []
    if (gaps.length === 0) s.entered++
    if (gaps.includes("teamsheet")) s.missingTeamsheet++
    if (gaps.includes("check-in")) s.missingCheckIn++
  }
  return s
}

export interface MatchStats {
  total: number
  done: number
  ready: number
  disputed: number
  judgeCalls: number
}

export function matchStats(matches: TnMatchApi[]): MatchStats {
  const s: MatchStats = { total: matches.length, done: 0, ready: 0, disputed: 0, judgeCalls: 0 }
  for (const m of matches) {
    if (m.status === "completed" || m.status === "bye") s.done++
    if (m.status === "ready" && m.top && m.bot) s.ready++
    if (m.proposalState === "disputed") s.disputed++
    else if (m.judgeRequestedAt) s.judgeCalls++
  }
  return s
}

/**
 * The one thing the organiser most likely does next. The header shows it as
 * the primary button; nothing else is hidden because of it.
 */
export type NextAction =
  | { kind: "openReg" }
  | { kind: "generate"; round?: { next: number; total: number | string } }
  | { kind: "publish" }
  | { kind: "report"; count: number }
  | { kind: "advance" }
  | { kind: "finalize" }
  | { kind: "reopen" }
  | null

export function nextAction(tn: TournamentDetailApi, matches: TnMatchApi[]): NextAction {
  if (tn.status === "completed") return null
  if (tn.status === "cancelled") return { kind: "reopen" }
  if (tn.status === "draft") return { kind: "openReg" }

  const phases = tn.phases ?? []
  const lp = livePhase(tn)

  if (tn.status === "registration") {
    // Generated as a draft but never published: the bracket exists, players
    // cannot see it yet.
    return lp ? { kind: "publish" } : { kind: "generate" }
  }

  // live
  const ms = matchStats(matches)
  if (lp?.format === "swiss") {
    const played = lp.view.rounds?.length ?? 0
    const total = lp.rounds ?? "?"
    const roundOpen = ms.ready > 0
    if (roundOpen) return { kind: "report", count: ms.ready }
    if (typeof total === "number" && played < total) {
      return { kind: "generate", round: { next: played + 1, total } }
    }
  }
  if (ms.ready > 0) return { kind: "report", count: ms.ready }
  if (phases.length > 1 && lp) return { kind: "advance" }
  return { kind: "finalize" }
}

/**
 * Things that need a human. Each item is an id plus the numbers its label
 * needs; the screen decides wording and where the click goes.
 */
export type AttentionTone = "error" | "warning" | "info"
export interface AttentionItem {
  id:
    | "regInconsistent"
    | "missingSteps"
    | "droppedReadmittable"
    | "deadlinePassedUnresolved"
    | "deadlineSoon"
    | "startSoonCheckInClosed"
    | "disputed"
    | "judgeCalls"
    | "draftBracketUnpublished"
  tone: AttentionTone
  count?: number
  hours?: number
}

const HOUR = 3_600_000

export function attentionItems(
  tn: TournamentDetailApi,
  matches: TnMatchApi[],
  now: number = Date.now(),
): AttentionItem[] {
  const items: AttentionItem[] = []
  const fs = fieldStats(tn)
  const ms = matchStats(matches)
  const pre = isPreStart(tn)

  // The flag says open, the status says draft: players see nothing and the
  // admin used to see a button claiming otherwise.
  if (tn.status === "draft" && tn.registrationOpen) {
    items.push({ id: "regInconsistent", tone: "warning" })
  }
  if (pre && livePhase(tn)) items.push({ id: "draftBracketUnpublished", tone: "info" })

  if (ms.disputed > 0) items.push({ id: "disputed", tone: "error", count: ms.disputed })
  if (ms.judgeCalls > 0) items.push({ id: "judgeCalls", tone: "warning", count: ms.judgeCalls })

  if (pre) {
    const missing = fs.missingTeamsheet + fs.missingCheckIn > 0 ? fs.active - fs.entered : 0
    if (missing > 0) items.push({ id: "missingSteps", tone: "warning", count: missing })
    if (fs.dropped > 0 && matches.length === 0) {
      items.push({ id: "droppedReadmittable", tone: "info", count: fs.dropped })
    }
    if (tn.entryDeadline && tn.teamsheetLockedAt == null) {
      const dl = new Date(tn.entryDeadline).getTime()
      if (dl <= now) items.push({ id: "deadlinePassedUnresolved", tone: "warning" })
      else if (dl - now <= 24 * HOUR) {
        items.push({ id: "deadlineSoon", tone: "info", hours: Math.max(1, Math.round((dl - now) / HOUR)) })
      }
    }
    if (tn.startDate && !tn.checkInOpen) {
      const st = new Date(tn.startDate).getTime()
      if (st > now && st - now <= 24 * HOUR) {
        items.push({ id: "startSoonCheckInClosed", tone: "warning", hours: Math.max(1, Math.round((st - now) / HOUR)) })
      }
    }
  }
  return items
}
