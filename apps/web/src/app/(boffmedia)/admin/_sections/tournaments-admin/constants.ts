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
export const ADVANCE_TYPE_OPTIONS: { value: TnAdvanceType; label: string }[] = [
  { value: "record", label: "Récord (≤ derrotas)" },
  { value: "top_n", label: "Top N" },
  { value: "top_or_record", label: "Top N + récord (unión)" },
  { value: "all", label: "Todos avanzan" },
]
export const PARTICIPANT_STATUS: { value: TnParticipantStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "eliminated", label: "Eliminado" },
  { value: "withdrew", label: "Retirado" },
  { value: "disqualified", label: "Descalificado" },
]

// Official Pokémon VGC regional shape: Day 1 swiss (X-2 or better make Day 2) →
// Day 2 swiss (carry) → Top Cut = top 8 PLUS everyone still at X-2 (asymmetric).
export const VGC_PRESET: TnPhaseInput[] = [
  { name: "Día 1 — Suizo", format: "swiss", rounds: 9, advanceType: "record", advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Día 2 — Suizo", format: "swiss", rounds: 5, carryStandings: true, advanceType: "top_or_record", advanceCount: 8, advanceMaxLosses: 2, tiebreakProfile: "resistance" },
  { name: "Top Cut", format: "single", thirdPlace: true, tiebreakProfile: "resistance" },
]

export const PHASE_STATUS_TONE: Record<string, string> = {
  live: "text-accent-bright border-accent-line",
  completed: "text-txt-muted border-line-2",
  pending: "text-txt-dim border-line",
}
