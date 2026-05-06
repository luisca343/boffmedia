import { ApiProperty } from '@nestjs/swagger';

export class UsageEntryDto {
  @ApiProperty({ example: 'Close Combat' })
  name: string;

  @ApiProperty({ example: 42.5 })
  percent: number;
}

export class SpreadEntryDto {
  @ApiProperty({ example: 'Jolly' })
  nature: string;

  @ApiProperty({ example: '0/252/4/0/0/252' })
  spread: string;

  @ApiProperty({ example: 33.3 })
  percent: number;
}

export class ChampionsPasteDetailDto {
  @ApiProperty({ example: 'glimmora' })
  speciesId: string;

  @ApiProperty({ example: 'Glimmora' })
  speciesName: string;

  @ApiProperty({ example: 87, description: 'Number of pastes this Pokémon appeared in' })
  pasteCount: number;

  @ApiProperty({ type: [UsageEntryDto] })
  abilities: UsageEntryDto[];

  @ApiProperty({ type: [UsageEntryDto] })
  items: UsageEntryDto[];

  @ApiProperty({ type: [UsageEntryDto] })
  moves: UsageEntryDto[];

  @ApiProperty({ type: [UsageEntryDto] })
  teraTypes: UsageEntryDto[];

  @ApiProperty({ type: [SpreadEntryDto] })
  spreads: SpreadEntryDto[];
}

export class BatchFetchResultDto {
  @ApiProperty({ example: 120, description: 'Total teams with paste URLs that needed fetching' })
  total: number;

  @ApiProperty({ example: 100, description: 'Newly fetched pastes' })
  fetched: number;

  @ApiProperty({ example: 15, description: 'Pastes already cached (skipped)' })
  cached: number;

  @ApiProperty({ example: 5, description: 'Pastes that failed to fetch' })
  failed: number;
}
