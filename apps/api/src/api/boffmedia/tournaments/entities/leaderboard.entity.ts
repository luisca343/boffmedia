import { ApiProperty } from '@nestjs/swagger';
import { Competitor } from './competitor.entity';
import type { TournamentMetric } from '../tournaments.types';

/** Maps the web `TnLbEntry` VM. */
export class LbEntry {
  @ApiProperty()
  rank: number;

  @ApiProperty({ type: Competitor })
  author: Competitor;

  @ApiProperty()
  score: number;

  @ApiProperty({ nullable: true })
  meta: string | null;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  verified: boolean;
}

/** Maps the web `TnLb` VM (free/score leaderboard). */
export class LeaderboardView {
  @ApiProperty({ enum: ['score', 'time'] })
  metric: TournamentMetric;

  @ApiProperty({ nullable: true })
  unit: string | null;

  @ApiProperty({ type: [LbEntry] })
  entries: LbEntry[];
}
