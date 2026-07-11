import { ApiProperty } from '@nestjs/swagger';
import { Competitor } from './competitor.entity';
import type {
  MatchBracket,
  MatchStatus,
  ProposalState,
} from '../tournaments.types';

/** Maps the web `TnMatch` VM (a bracket seat pairing). */
export class MatchView {
  @ApiProperty()
  id: number;

  @ApiProperty({
    enum: ['winners', 'losers', 'grand', 'group', 'league', 'swiss', 'third'],
  })
  bracket: MatchBracket;

  @ApiProperty()
  roundNumber: number;

  @ApiProperty()
  position: number;

  @ApiProperty({ type: Competitor, nullable: true })
  top: Competitor | null;

  @ApiProperty({ type: Competitor, nullable: true })
  bot: Competitor | null;

  @ApiProperty({ nullable: true, description: 'Games won by top (TnMatch g1).' })
  g1: number | null;

  @ApiProperty({ nullable: true, description: 'Games won by bot (TnMatch g2).' })
  g2: number | null;

  @ApiProperty({ enum: ['pending', 'ready', 'live', 'completed', 'bye'] })
  status: MatchStatus;

  @ApiProperty({ type: Competitor, nullable: true })
  winner: Competitor | null;

  @ApiProperty({
    description: 'Effective games-per-match (phase finals may escalate).',
  })
  bestOf: number;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  scheduledAt: string | null;

  @ApiProperty({
    nullable: true,
    enum: ['pending', 'disputed'],
    description: 'Active self-report proposal state, if any.',
  })
  proposalState: ProposalState | null;
}
