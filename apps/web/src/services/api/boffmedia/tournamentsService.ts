import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoDELETE,
} from '@/services/boffAPI'

// Hand-written (no generate:shared needed). Mirrors the NestJS tournaments module.

export type TnFormat = 'single' | 'double' | 'groups' | 'roundrobin' | 'swiss' | 'leaderboard'
export type TnKind = 'solo' | 'team' | 'entry'
export type TnStatus = 'draft' | 'registration' | 'live' | 'completed' | 'cancelled'
export type TnMetric = 'score' | 'time'

export interface TnRosterMember { id: number; userId: number | null; name: string; role: string | null }

export interface TnCompetitorApi {
  id: string
  kind: TnKind
  name: string
  tag: string | null
  country: string | null
  flag: string | null
  seed: number | null
  hue: number | null
  avatar: string | null
  roster?: TnRosterMember[]
}

export interface TnMatchApi {
  id: number
  bracket: string
  roundNumber: number
  position: number
  top: TnCompetitorApi | null
  bot: TnCompetitorApi | null
  g1: number | null
  g2: number | null
  status: string
  winner: TnCompetitorApi | null
}

export interface TnStandingApi {
  rank: number
  c: TnCompetitorApi
  played: number
  w: number
  d: number
  l: number
  gf: number
  ga: number
  pts: number
}

export interface TnCrosstableApi {
  entrants: TnCompetitorApi[]
  grid: ({ r: string; s: string } | null)[][]
}

export interface TnGroupApi {
  id: number
  name: string
  done: number
  total: number
  advance: number
  standings: TnStandingApi[]
}

export interface TnLbEntryApi {
  rank: number
  author: TnCompetitorApi
  score: number
  meta: string | null
  unit: string
  verified: boolean
}

export interface TnViewApi {
  rounds?: TnMatchApi[][]
  winners?: TnMatchApi[][]
  losers?: TnMatchApi[][]
  grandFinal?: TnMatchApi | null
  table?: TnStandingApi[]
  crosstable?: TnCrosstableApi
  standings?: TnStandingApi[]
  groups?: TnGroupApi[]
  knockout?: { rounds: TnMatchApi[][] } | null
  done?: number
  total?: number
  metric?: TnMetric
  unit?: string | null
  entries?: TnLbEntryApi[]
}

export interface TournamentSummaryApi {
  id: number
  slug: string
  name: string
  format: TnFormat
  competitorKind: TnKind
  status: TnStatus
  gameId: number | null
  gameTitle: string | null
  banner: string | null
  icon: string | null
  hue: number | null
  maxParticipants: number | null
  registrationOpen: boolean
  participantCount: number
  championName: string | null
  startDate: string | null
  endDate: string | null
}

export type TnPhaseFormat = 'single' | 'double' | 'roundrobin' | 'swiss' | 'leaderboard'
export type TnPhaseStatus = 'pending' | 'live' | 'completed'
export type TnAdvanceType = 'all' | 'top_n' | 'record'
export type TnTiebreakProfile = 'points' | 'resistance'

export interface TnAdvanceRuleApi {
  type: TnAdvanceType
  maxLosses: number | null
  count: number | null
}

export interface TnPhaseApi {
  id: number
  order: number
  name: string
  format: TnPhaseFormat
  status: TnPhaseStatus
  rounds: number | null
  bestOf: number
  carryStandings: boolean
  advance: TnAdvanceRuleApi | null
  entrantCount: number
  qualifiedCount: number | null
  view: TnViewApi
}

// Phase authoring payload (admin create/edit). Mirrors CreatePhaseDto.
export interface TnPhaseInput {
  name: string
  format: TnPhaseFormat
  bestOf?: number
  rounds?: number
  carryStandings?: boolean
  advanceType?: TnAdvanceType
  advanceCount?: number
  advanceMaxLosses?: number
  tiebreakProfile?: TnTiebreakProfile
}

export interface TournamentDetailApi {
  id: number
  slug: string
  name: string
  format: TnFormat
  competitorKind: TnKind
  status: TnStatus
  metric: TnMetric | null
  unit: string | null
  gameId: number | null
  gameTitle: string | null
  eventId: number | null
  description: string | null
  rules: string | null
  banner: string | null
  icon: string | null
  hue: number | null
  bestOf: number
  maxParticipants: number | null
  registrationOpen: boolean
  startDate: string | null
  endDate: string | null
  champion: TnCompetitorApi | null
  participants: TnCompetitorApi[]
  activePhaseId: number | null
  phases: TnPhaseApi[]
  view: TnViewApi
}

export interface TournamentFilters {
  status?: TnStatus
  format?: TnFormat
  gameId?: number
  q?: string
  limit?: number
  offset?: number
}

export class TournamentsService {
  static list(filters?: TournamentFilters) {
    const params = new URLSearchParams(
      Object.entries(filters ?? {})
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return apiAuthedAutoGET<TournamentSummaryApi[]>(
      params ? `/tournaments?${params}` : '/tournaments',
    )
  }

  static get(slug: string) {
    return apiAuthedAutoGET<TournamentDetailApi>(`/tournaments/${slug}`)
  }

  static getMatches(slug: string) {
    return apiAuthedAutoGET<TnMatchApi[]>(`/tournaments/${slug}/matches`)
  }

  // Self-registration
  static register(id: number, body: { name?: string; tag?: string; country?: string }) {
    return apiAuthedAutoPOST<TnCompetitorApi>(`/tournaments/${id}/register`, body)
  }
  static withdraw(id: number) {
    return apiAuthedAutoDELETE<{ success: boolean }>(`/tournaments/${id}/register`)
  }

  // Admin
  static create(body: Record<string, unknown>) {
    return apiAuthedAutoPOST<TournamentDetailApi>('/tournaments', body)
  }
  static update(id: number, body: Record<string, unknown>) {
    return apiAuthedAutoPATCH<TournamentDetailApi>(`/tournaments/${id}`, body)
  }
  static remove(id: number) {
    return apiAuthedAutoDELETE<{ success: boolean }>(`/tournaments/${id}`)
  }
  static addParticipant(id: number, body: Record<string, unknown>) {
    return apiAuthedAutoPOST<TnCompetitorApi>(`/tournaments/${id}/participants`, body)
  }
  static updateParticipant(id: number, pid: number, body: Record<string, unknown>) {
    return apiAuthedAutoPATCH<TnCompetitorApi>(`/tournaments/${id}/participants/${pid}`, body)
  }
  static removeParticipant(id: number, pid: number) {
    return apiAuthedAutoDELETE<{ success: boolean }>(`/tournaments/${id}/participants/${pid}`)
  }
  static generate(id: number, body: Record<string, unknown> = {}) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/generate`, body)
  }
  static advance(id: number) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/advance`, {})
  }
  static addPhase(id: number, body: TnPhaseInput) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/phases`, body as unknown as Record<string, unknown>)
  }
  static updatePhase(id: number, pid: number, body: Partial<TnPhaseInput>) {
    return apiAuthedAutoPATCH<TournamentDetailApi>(`/tournaments/${id}/phases/${pid}`, body as unknown as Record<string, unknown>)
  }
  static removePhase(id: number, pid: number) {
    return apiAuthedAutoDELETE<TournamentDetailApi>(`/tournaments/${id}/phases/${pid}`)
  }
  static report(id: number, matchId: number, body: { topScore: number; botScore: number; winnerParticipantId?: number }) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/matches/${matchId}/report`, body)
  }
  static setStatus(id: number, status: TnStatus) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/status`, { status })
  }
}
