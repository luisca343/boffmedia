import { ApiProperty } from '@nestjs/swagger';
import type {
  TournamentFormat,
  CompetitorKind,
  TournamentStatus,
} from '../tournaments.types';

/** List-row summary for `GET /tournaments`. */
export class TournamentSummary {
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

  @ApiProperty({ nullable: true })
  gameId: number | null;

  @ApiProperty({ nullable: true })
  gameTitle: string | null;

  @ApiProperty({ nullable: true })
  banner: string | null;

  @ApiProperty({ nullable: true })
  icon: string | null;

  @ApiProperty({ nullable: true })
  hue: number | null;

  @ApiProperty({ nullable: true })
  maxParticipants: number | null;

  @ApiProperty()
  registrationOpen: boolean;

  @ApiProperty()
  participantCount: number;

  @ApiProperty({ nullable: true })
  championName: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  startDate: string | null;

  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  endDate: string | null;
}
