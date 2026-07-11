import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

/**
 * A player self-reports their match: per-game results from THEIR OWN
 * perspective ("WLW" = won game 1, lost game 2, won game 3). The server
 * normalizes to the top participant's perspective for storage.
 */
export class ProposeReportDto {
  @ApiProperty({ example: 'WLW', description: "Per-game 'W'/'L' string." })
  @IsString()
  @MaxLength(16)
  @Matches(/^[WL]+$/)
  games: string;
}
