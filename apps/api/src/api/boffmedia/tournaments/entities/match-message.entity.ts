import { ApiProperty } from '@nestjs/swagger';
import type { MatchMessageKind } from '../tournaments.types';

/** One line of a match's table chat. */
export class MatchMessageView {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ['sys', 'player', 'judge'] })
  kind: MatchMessageKind;

  @ApiProperty({ nullable: true })
  authorUserId: number | null;

  @ApiProperty({ nullable: true })
  authorName: string | null;

  @ApiProperty()
  body: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}
