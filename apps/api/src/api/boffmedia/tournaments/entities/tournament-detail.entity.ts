import { ApiProperty } from '@nestjs/swagger';
import { Competitor } from './competitor.entity';
import { PhaseView } from './phase.entity';
import type {
  TournamentFormat,
  CompetitorKind,
  TournamentStatus,
  TournamentMetric,
} from '../tournaments.types';

/**
 * Full tournament payload for `GET /tournaments/:slug`. `view` is the
 * format-specific render model — one of BracketView / DoubleBracketView /
 * { groups } / LeagueView / LeaderboardView — matched to the web `Tn*` VM types.
 * Typed loosely here (discriminated on `format`); the web adapters narrow it.
 */
export class TournamentDetail {
  @ApiProperty()
  id: number;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['single', 'double', 'groups', 'roundrobin', 'swiss', 'leaderboard'],
  })
  format: TournamentFormat;

  @ApiProperty({ enum: ['solo', 'team', 'entry'] })
  competitorKind: CompetitorKind;

  @ApiProperty({
    enum: ['draft', 'registration', 'live', 'completed', 'cancelled'],
  })
  status: TournamentStatus;

  @ApiProperty({ enum: ['score', 'time'], nullable: true })
  metric: TournamentMetric | null;

  @ApiProperty({ nullable: true })
  unit: string | null;

  @ApiProperty({ nullable: true })
  gameId: number | null;

  @ApiProperty({ nullable: true })
  gameTitle: string | null;

  @ApiProperty({ nullable: true })
  eventId: number | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  rules: string | null;

  @ApiProperty({ nullable: true, description: 'Prize breakdown (free text).' })
  prizes: string | null;

  @ApiProperty({ description: 'Player check-in window open.' })
  checkInOpen: boolean;

  @ApiProperty({ nullable: true })
  banner: string | null;

  @ApiProperty({ nullable: true })
  icon: string | null;

  @ApiProperty({ nullable: true })
  hue: number | null;

  @ApiProperty()
  bestOf: number;

  @ApiProperty({
    nullable: true,
    description: 'Self-report auto-verify window (minutes); null → default 10.',
  })
  autoVerifyMinutes: number | null;

  @ApiProperty({ nullable: true })
  maxParticipants: number | null;

  @ApiProperty()
  registrationOpen: boolean;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  startDate: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  endDate: string | null;

  @ApiProperty({ type: Competitor, nullable: true })
  champion: Competitor | null;

  @ApiProperty({ type: [Competitor] })
  participants: Competitor[];

  @ApiProperty({
    nullable: true,
    description:
      "The signed-in caller's own participant id (stringified), or null when " +
      'anonymous / not registered. Drives the register/withdraw control.',
  })
  viewerParticipantId: string | null;

  @ApiProperty({
    nullable: true,
    description:
      "The caller's currently playable (ready/live) match id — the 'Tu partida' banner.",
  })
  myMatchId: number | null;

  @ApiProperty({
    type: [Competitor],
    description: 'Top-3 podium, only populated once the tournament completes.',
  })
  podium: Competitor[];

  @ApiProperty({
    nullable: true,
    description:
      'Id of the phase the UI should default to (live / last played).',
  })
  activePhaseId: number | null;

  @ApiProperty({
    type: [PhaseView],
    description:
      'Ordered phases. Single-phase tournaments carry exactly one entry.',
  })
  phases: PhaseView[];

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      "Legacy: the active phase's render model (bracket / double / groups / league / leaderboard). Prefer `phases[].view`.",
  })
  view: object;
}
