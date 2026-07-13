import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  PhaseFormat,
  PhaseStatus,
  AdvanceType,
} from '../tournaments.types';

/** The advancement rule out of a phase (null on the final phase). */
export class PhaseAdvanceRule {
  @ApiProperty({ enum: ['all', 'top_n', 'record', 'top_or_record'] })
  type: AdvanceType;

  @ApiProperty({
    nullable: true,
    description: 'record: "X-N or better" loss cap.',
  })
  maxLosses: number | null;

  @ApiProperty({
    nullable: true,
    description: 'top_n: N · record: optional cap by standings order.',
  })
  count: number | null;
}

/**
 * One phase of a tournament for `GET /tournaments/:slug`. `view` is the same
 * per-format render model the detail already exposes (bracket / league / swiss /
 * leaderboard), scoped to this phase's matches + entrants.
 */
export class PhaseView {
  @ApiProperty()
  id: number;

  @ApiProperty({ description: '1-based phase order.' })
  order: number;

  @ApiProperty()
  name: string;

  @ApiProperty({
    enum: ['single', 'double', 'roundrobin', 'swiss', 'leaderboard', 'groups'],
  })
  format: PhaseFormat;

  @ApiProperty({ enum: ['pending', 'live', 'completed'] })
  status: PhaseStatus;

  @ApiProperty({ nullable: true, description: 'Swiss: fixed round count.' })
  rounds: number | null;

  @ApiProperty()
  bestOf: number;

  @ApiProperty({
    nullable: true,
    description: 'Best-of override for the decisive match (final/grand final).',
  })
  finalsBestOf: number | null;

  @ApiProperty({ nullable: true, description: 'Groups: number of groups.' })
  groupCount: number | null;

  @ApiProperty({ description: 'Single: third-place match is played.' })
  thirdPlace: boolean;

  @ApiProperty()
  carryStandings: boolean;

  @ApiPropertyOptional({ type: PhaseAdvanceRule, nullable: true })
  advance: PhaseAdvanceRule | null;

  @ApiProperty({ description: 'Competitors that entered this phase.' })
  entrantCount: number;

  @ApiProperty({
    nullable: true,
    description:
      'Competitors that advanced to the next phase (null on the final).',
  })
  qualifiedCount: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description: 'Per-format render model for this phase.',
  })
  view: object;
}
