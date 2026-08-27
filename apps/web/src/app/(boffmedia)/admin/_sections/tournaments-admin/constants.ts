import type {
  TnFormat,
  TnKind,
  TnPhaseFormat,
  TnAdvanceType,
  TnParticipantStatus,
  TnPhaseInput,
} from "@/services/api/boffmedia/tournamentsService"

export const FORMATS: TnFormat[] = ["single", "double", "groups", "roundrobin", "swiss", "leaderboard"]
export const KINDS: TnKind[] = ["solo", "team", "entry"]
export const PHASE_FORMATS: TnPhaseFormat[] = ["swiss", "single", "double", "roundrobin", "groups", "leaderboard"]
export const ADVANCE_TYPE_OPTIONS: { value: TnAdvanceType; labelKey: string }[] = [
  { value: "record", labelKey: "constants.advanceRecord" },
  { value: "top_n", labelKey: "constants.advanceTopN" },
  { value: "top_or_record", labelKey: "constants.advanceTopOrRecord" },
  { value: "all", labelKey: "constants.advanceAll" },
]
export const PARTICIPANT_STATUS: { value: TnParticipantStatus; labelKey: string }[] = [
  { value: "active", labelKey: "constants.participantActive" },
  { value: "eliminated", labelKey: "constants.participantEliminated" },
  { value: "withdrew", labelKey: "constants.participantWithdrew" },
  { value: "disqualified", labelKey: "constants.participantDisqualified" },
  // Set by entry resolution, not chosen by an admin — but selectable so a
  // wrongly-dropped entrant can be put back by hand as well as via `readmit`.
  { value: "dropped", labelKey: "constants.participantDropped" },
]

export const VGC_PRESET: { nameKey: string; format: TnPhaseFormat; rounds?: number; advanceType?: TnAdvanceType; advanceMaxLosses?: number; tiebreakProfile?: "points" | "resistance"; carryStandings?: boolean; advanceCount?: number; thirdPlace?: boolean }[] = [
  { nameKey: "constants.vgcDay1", format: "swiss", rounds: 9, advanceType: "record", advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { nameKey: "constants.vgcDay2", format: "swiss", rounds: 5, carryStandings: true, advanceType: "top_or_record", advanceCount: 8, advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { nameKey: "constants.vgcTopCut", format: "single", thirdPlace: true, tiebreakProfile: "resistance" },
]

export const PHASE_STATUS_TONE: Record<string, string> = {
  live: "text-accent-bright border-accent-line",
  completed: "text-txt-muted border-line-2",
  pending: "text-txt-dim border-line",
}
