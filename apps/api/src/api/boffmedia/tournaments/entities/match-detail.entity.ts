import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Competitor } from './competitor.entity';
import { MatchView } from './match.entity';
import { TeamsheetMonDto } from '../dto/teamsheet.dto';
import type { ProposalState } from '../tournaments.types';

/** Career line of one side within the match's phase chain (opponent card). */
export class MatchSideRecord {
  @ApiProperty()
  w: number;

  @ApiProperty()
  d: number;

  @ApiProperty()
  l: number;

  @ApiProperty()
  pts: number;
}

/** Active self-report proposal, from the requesting viewer's perspective. */
export class MatchProposalView {
  @ApiProperty({ description: 'Stringified proposer participant id.' })
  byParticipantId: string;

  @ApiProperty({ description: 'True when the viewer wrote this proposal.' })
  mine: boolean;

  @ApiProperty({
    description:
      "Per-game 'W'/'L' from the VIEWER's perspective (top's for spectators).",
  })
  games: string;

  @ApiProperty()
  topScore: number;

  @ApiProperty()
  botScore: number;

  @ApiProperty({ enum: ['pending', 'disputed'] })
  state: ProposalState;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: string;
}

/** Full payload of the match page (`GET /tournaments/:slug/matches/:mid`). */
export class MatchDetail extends MatchView {
  @ApiProperty()
  tournamentId: number;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  tournamentName: string;

  @ApiProperty({ nullable: true })
  phaseName: string | null;

  @ApiProperty({
    enum: ['top', 'bot', 'spectator', 'admin'],
    description: 'What the requesting viewer is to this match.',
  })
  viewerRole: 'top' | 'bot' | 'spectator' | 'admin';

  @ApiProperty({ type: MatchSideRecord, nullable: true })
  topRecord: MatchSideRecord | null;

  @ApiProperty({ type: MatchSideRecord, nullable: true })
  botRecord: MatchSideRecord | null;

  @ApiPropertyOptional({ type: MatchProposalView, nullable: true })
  proposal: MatchProposalView | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  judgeRequestedAt: string | null;

  @ApiProperty({
    type: [TeamsheetMonDto],
    nullable: true,
    description:
      "Opponent's open teamsheet — only for the two participants and admins.",
  })
  opponentTeamsheet: TeamsheetMonDto[] | null;

  @ApiProperty({
    type: [TeamsheetMonDto],
    nullable: true,
    description:
      "The caller's own open teamsheet, for the two participants of this match. Read-only here: teamsheets lock when the field is resolved, before any match exists.",
  })
  viewerTeamsheet: TeamsheetMonDto[] | null;

  @ApiProperty({ type: Competitor, nullable: true })
  champion: Competitor | null;
}
