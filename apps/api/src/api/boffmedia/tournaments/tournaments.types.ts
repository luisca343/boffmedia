import {
  TOURNAMENT_FORMAT,
  COMPETITOR_KIND,
  TOURNAMENT_STATUS,
  TOURNAMENT_METRIC,
  TOURNAMENT_PARTICIPANT_STATUS,
  MATCH_BRACKET,
  MATCH_STATUS,
  MATCH_SLOT,
  PHASE_FORMAT,
  PHASE_STATUS,
  ADVANCE_TYPE,
  TIEBREAK_PROFILE,
  PROPOSAL_STATE,
  MATCH_MESSAGE_KIND,
  TEAMSHEET_VISIBILITY,
} from '@/_db/schema/BoffMediaTournaments';

export type TournamentFormat =
  (typeof TOURNAMENT_FORMAT)[keyof typeof TOURNAMENT_FORMAT];
export type CompetitorKind =
  (typeof COMPETITOR_KIND)[keyof typeof COMPETITOR_KIND];
export type TournamentStatus =
  (typeof TOURNAMENT_STATUS)[keyof typeof TOURNAMENT_STATUS];
export type TournamentMetric =
  (typeof TOURNAMENT_METRIC)[keyof typeof TOURNAMENT_METRIC];
export type TeamsheetVisibility =
  (typeof TEAMSHEET_VISIBILITY)[keyof typeof TEAMSHEET_VISIBILITY];
export type ParticipantStatus =
  (typeof TOURNAMENT_PARTICIPANT_STATUS)[keyof typeof TOURNAMENT_PARTICIPANT_STATUS];
export type MatchBracket = (typeof MATCH_BRACKET)[keyof typeof MATCH_BRACKET];
export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];
export type MatchSlot = (typeof MATCH_SLOT)[keyof typeof MATCH_SLOT];
export type PhaseFormat = (typeof PHASE_FORMAT)[keyof typeof PHASE_FORMAT];
export type PhaseStatus = (typeof PHASE_STATUS)[keyof typeof PHASE_STATUS];
export type AdvanceType = (typeof ADVANCE_TYPE)[keyof typeof ADVANCE_TYPE];
export type TiebreakProfile =
  (typeof TIEBREAK_PROFILE)[keyof typeof TIEBREAK_PROFILE];
export type ProposalState =
  (typeof PROPOSAL_STATE)[keyof typeof PROPOSAL_STATE];
export type MatchMessageKind =
  (typeof MATCH_MESSAGE_KIND)[keyof typeof MATCH_MESSAGE_KIND];
