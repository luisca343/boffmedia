import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** Leaderboard self-submission: the caller's own score + evidence line. */
export class SubmitScoreDto {
  @ApiProperty({ description: 'Score (or time in the tournament unit).' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score: number;

  @ApiPropertyOptional({
    description: 'Evidence / context line (clip URL, seed, character…).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  meta?: string;
}
