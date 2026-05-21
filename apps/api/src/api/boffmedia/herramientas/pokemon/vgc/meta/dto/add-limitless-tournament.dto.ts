import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddLimitlessTournamentDto {
  @ApiProperty({
    example: 'https://play.limitlesstcg.com/tournament/euic-2026/standings',
    description: 'Limitless tournament standings URL',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({
    example: 'vgc2026regma',
    description: 'Regulation identifier to associate this tournament with',
  })
  @IsString()
  @IsNotEmpty()
  regulationId: string;

  @ApiPropertyOptional({
    example: 64,
    description:
      'Maximum number of players to import (top N by placing). Omit for all.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxPlayers?: number;
}
