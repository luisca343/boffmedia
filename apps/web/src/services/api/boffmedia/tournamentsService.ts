import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedAutoPATCH,
  apiAuthedAutoPUT,
  apiAuthedAutoDELETE,
} from '@/services/boffAPI'

// Hand-written (no generate:shared needed). Mirrors the NestJS tournaments module.

export type TnFormat = 'single' | 'double' | 'groups' | 'roundrobin' | 'swiss' | 'leaderboard'
export type TnKind = 'solo' | 'team' | 'entry'
export type TnStatus = 'draft' | 'registration' | 'live' | 'completed' | 'cancelled'
export type TnMetric = 'score' | 'time'
export type TnParticipantStatus = 'active' | 'eliminated' | 'withdrew' | 'disqualified'

export interface TnRosterMember { id: number; userId: number | null; name: string; role: string | null }

export interface TnCompetitorApi {
  id: string
  kind: TnKind
  name: string
  tag: string | null
  country: string | null
  flag: string | null
  seed: number | null
  status: TnParticipantStatus
  checkedIn: boolean
  hue: number | null
  avatar: string | null
  score: number | null
  verified: boolean
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
  bestOf: number
  scheduledAt: string | null
  proposalState: 'pending' | 'disputed' | null
}

export interface TnMatchProposalApi {
  byParticipantId: string
  mine: boolean
  games: string
  topScore: number
  botScore: number
  state: 'pending' | 'disputed'
  expiresAt: string
}

export interface TnMonApi {
  slot?: number
  dex?: number
  name: string
  item?: string
  ability?: string
  tera?: string
  moves: string[]
}

export interface TnMatchSideRecordApi { w: number; d: number; l: number; pts: number }

export interface TnMatchDetailApi extends TnMatchApi {
  tournamentId: number
  slug: string
  tournamentName: string
  phaseName: string | null
  viewerRole: 'top' | 'bot' | 'spectator' | 'admin'
  topRecord: TnMatchSideRecordApi | null
  botRecord: TnMatchSideRecordApi | null
  proposal: TnMatchProposalApi | null
  judgeRequestedAt: string | null
  opponentTeamsheet: TnMonApi[] | null
  champion: TnCompetitorApi | null
}

export interface TnMatchMessageApi {
  id: number
  kind: 'sys' | 'player' | 'judge'
  authorUserId: number | null
  authorName: string | null
  body: string
  createdAt: string
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
  thirdPlace?: TnMatchApi | null
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

export type TnPhaseFormat = 'single' | 'double' | 'roundrobin' | 'swiss' | 'leaderboard' | 'groups'
export type TnPhaseStatus = 'pending' | 'live' | 'completed'
export type TnAdvanceType = 'all' | 'top_n' | 'record' | 'top_or_record'
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
  finalsBestOf: number | null
  groupCount: number | null
  thirdPlace: boolean
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
  finalsBestOf?: number
  rounds?: number
  groupCount?: number
  thirdPlace?: boolean
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
  prizes: string | null
  checkInOpen: boolean
  banner: string | null
  icon: string | null
  hue: number | null
  bestOf: number
  autoVerifyMinutes: number | null
  maxParticipants: number | null
  registrationOpen: boolean
  startDate: string | null
  endDate: string | null
  champion: TnCompetitorApi | null
  participants: TnCompetitorApi[]
  viewerParticipantId: string | null
  myMatchId: number | null
  podium: TnCompetitorApi[]
  activePhaseId: number | null
  phases: TnPhaseApi[]
  view: TnViewApi
}

export interface MyTournamentApi extends TournamentSummaryApi {
  myStatus: TnParticipantStatus
  isChampion: boolean
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

  static getMatchDetail(slug: string, matchId: number) {
    return apiAuthedAutoGET<TnMatchDetailApi>(`/tournaments/${slug}/matches/${matchId}`)
  }

  static mine() {
    return apiAuthedAutoGET<MyTournamentApi[]>('/tournaments/mine')
  }

  // Player self-report + match page
  static propose(id: number, matchId: number, games: string) {
    return apiAuthedAutoPOST<{ success: boolean }>(`/tournaments/${id}/matches/${matchId}/propose`, { games })
  }
  static confirm(id: number, matchId: number, accept: boolean) {
    return apiAuthedAutoPOST<{ success: boolean }>(`/tournaments/${id}/matches/${matchId}/confirm`, { accept })
  }
  static getMessages(id: number, matchId: number, after = 0) {
    return apiAuthedAutoGET<TnMatchMessageApi[]>(`/tournaments/${id}/matches/${matchId}/messages${after ? `?after=${after}` : ''}`)
  }
  static postMessage(id: number, matchId: number, body: string) {
    return apiAuthedAutoPOST<TnMatchMessageApi>(`/tournaments/${id}/matches/${matchId}/messages`, { body })
  }
  static requestJudge(id: number, matchId: number) {
    return apiAuthedAutoPOST<{ success: boolean }>(`/tournaments/${id}/matches/${matchId}/judge`, {})
  }
  static setTeamsheet(id: number, mons: TnMonApi[]) {
    return apiAuthedAutoPUT<{ success: boolean }>(`/tournaments/${id}/teamsheet`, { mons })
  }

  // Check-in + leaderboard submissions
  static checkIn(id: number) {
    return apiAuthedAutoPOST<{ success: boolean; checkedInAt: string | null }>(`/tournaments/${id}/checkin`, {})
  }
  static checkOut(id: number) {
    return apiAuthedAutoDELETE<{ success: boolean; checkedInAt: string | null }>(`/tournaments/${id}/checkin`)
  }
  static submitScore(id: number, body: { score: number; meta?: string }) {
    return apiAuthedAutoPOST<TnCompetitorApi>(`/tournaments/${id}/submit-score`, body)
  }

  // Admin scheduling
  static schedule(id: number, matchIds: number[], scheduledAt: string | null) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/matches/schedule`, { matchIds, scheduledAt })
  }

  // Self-registration
  static register(
    id: number,
    body: {
      name?: string
      tag?: string
      country?: string
      roster?: { name: string; userId?: number; role?: string }[]
    },
  ) {
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
  static report(
    id: number,
    matchId: number,
    body: {
      topScore: number
      botScore: number
      winnerParticipantId?: number
      amend?: boolean
      forfeit?: boolean
    },
  ) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/matches/${matchId}/report`, body)
  }
  static setStatus(id: number, status: TnStatus) {
    return apiAuthedAutoPOST<TournamentDetailApi>(`/tournaments/${id}/status`, { status })
  }
}
