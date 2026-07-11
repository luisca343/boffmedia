import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

/**
 * Report a match result. `topScore`/`botScore` are games won by each side.
 * The winner is derived from the scores unless `winnerParticipantId` is given
 * (needed for draws / manual overrides).
 */
export class ReportMatchDto {
  @ApiProperty({ description: 'Games won by the top competitor.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  topScore: number;

  @ApiProperty({ description: 'Games won by the bottom competitor.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  botScore: number;

  @ApiPropertyOptional({ description: 'Explicit winner (overrides score-derived).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  winnerParticipantId?: number;

  @ApiPropertyOptional({
    description:
      'Walkover: the named winner advances by the opponent\'s absence ' +
      '(no-show / disqualification). Requires winnerParticipantId; scores and ' +
      'best-of bounds are ignored.',
  })
  @IsOptional()
  @IsBoolean()
  forfeit?: boolean;

  @ApiPropertyOptional({
    description:
      'Correct an already-resolved match. Allowed only while its successors ' +
      '(next/loser-next targets, later swiss rounds) are still unplayed.',
  })
  @IsOptional()
  @IsBoolean()
  amend?: boolean;
}
