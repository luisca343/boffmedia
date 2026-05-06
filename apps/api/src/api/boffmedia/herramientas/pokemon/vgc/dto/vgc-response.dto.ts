import { ApiProperty } from '@nestjs/swagger';

import { BaseStatsDto } from '../meta/dto/meta-response.dto';

export class VgcPokemonDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  num!: number;

  @ApiProperty({ type: String, isArray: true })
  types!: string[];

  @ApiProperty({ type: BaseStatsDto })
  baseStats!: BaseStatsDto;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  abilities!: Record<string, string>;

  @ApiProperty()
  weightkg!: number;

  @ApiProperty()
  isRestricted!: boolean;

  @ApiProperty()
  isMythical!: boolean;

  @ApiProperty({ nullable: true })
  requiredItem!: string | null;
}

export class SpeedTierValuesDto {
  @ApiProperty()
  min!: number;

  @ApiProperty()
  minPlus!: number;

  @ApiProperty()
  max!: number;

  @ApiProperty()
  maxPlus!: number;

  @ApiProperty({ nullable: true })
  scarf!: number | null;

  @ApiProperty({ nullable: true })
  scarfPlus!: number | null;
}

export class SpeedTierEntryDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  num!: number;

  @ApiProperty({ type: String, isArray: true })
  types!: string[];

  @ApiProperty()
  baseSpeed!: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  abilities!: Record<string, string>;

  @ApiProperty()
  isRestricted!: boolean;

  @ApiProperty()
  isMythical!: boolean;

  @ApiProperty({ nullable: true })
  requiredItem!: string | null;

  @ApiProperty({ type: SpeedTierValuesDto })
  speedTiers!: SpeedTierValuesDto;
}