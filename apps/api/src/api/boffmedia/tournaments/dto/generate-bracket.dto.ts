import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export const SEEDING_MODE = {
  AS_SEEDED: 'as-seeded', // honour the seed column (fallback to add order)
  RANDOM: 'random', // shuffle then seed
  AS_ADDED: 'as-added', // registration order
} as const;

export type SeedingMode = (typeof SEEDING_MODE)[keyof typeof SEEDING_MODE];

/** Options for `POST /tournaments/:id/generate` (build the bracket/schedule). */
export class GenerateBracketDto {
  @ApiPropertyOptional({ enum: Object.values(SEEDING_MODE) })
  @IsOptional()
  @IsEnum(SEEDING_MODE)
  seeding?: SeedingMode;

  @ApiPropertyOptional({ description: 'Groups format: number of groups.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupCount?: number;

  @ApiPropertyOptional({ description: 'Groups format: advancers per group.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  advanceCount?: number;

  @ApiPropertyOptional({ description: 'Swiss format: number of rounds.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rounds?: number;

  @ApiPropertyOptional({
    description: 'Confirm regenerating a bracket that already has results.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
