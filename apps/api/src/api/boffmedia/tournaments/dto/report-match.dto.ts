import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Explicit winner (overrides score-derived).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  winnerParticipantId?: number;

  @ApiPropertyOptional({
    description:
      "Walkover: the named winner advances by the opponent's absence " +
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

  @ApiPropertyOptional({
    description:
      'The version of the match when loaded (optimistic concurrency for amends). ' +
      'Required when amend:true. If the match was amended by another admin, ' +
      'the call fails with 409 Conflict; reload the match and try again.',
  })
  // Mandatory precisely when it protects something. Left optional, an amend
  // that simply omits it would fall through to an unconditional
  // `WHERE id = ?` — which is the concurrent-overwrite bug this field exists
  // to close, so "optional" would have quietly preserved it.
  @ValidateIf((o: ReportMatchDto) => o.amend === true)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  amendVersion?: number;
}
