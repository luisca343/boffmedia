import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UsageStatDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  percent!: number;
}

export class BaseStatsDto {
  @ApiProperty()
  hp!: number;

  @ApiProperty()
  atk!: number;

  @ApiProperty()
  def!: number;

  @ApiProperty()
  spa!: number;

  @ApiProperty()
  spd!: number;

  @ApiProperty()
  spe!: number;
}

export class SpreadUsageDto {
  @ApiProperty()
  nature!: string;

  @ApiProperty()
  spread!: string;

  @ApiProperty()
  percent!: number;
}

export class SmogonSnapshotDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  formatId!: string;

  @ApiProperty()
  month!: string;

  @ApiProperty()
  cutoff!: number;

  @ApiProperty()
  pokemonCount!: number;

  @ApiProperty()
  fetchedAt!: string;
}

export class PokemonUsageEntryDto {
  @ApiProperty()
  speciesId!: string;

  @ApiProperty()
  speciesName!: string;

  @ApiProperty()
  rank!: number;

  @ApiProperty({ type: String, isArray: true })
  types!: string[];

  @ApiProperty()
  usagePercent!: number;

  @ApiProperty()
  rawCount!: number;

  @ApiPropertyOptional()
  topItem?: string;

  @ApiPropertyOptional()
  topMove?: string;

  @ApiPropertyOptional()
  topTeraType?: string;
}

export class PokemonUsageDetailDto extends PokemonUsageEntryDto {
  @ApiProperty({ type: BaseStatsDto })
  baseStats!: BaseStatsDto;

  @ApiProperty({ type: UsageStatDto, isArray: true })
  abilities!: UsageStatDto[];

  @ApiProperty({ type: UsageStatDto, isArray: true })
  items!: UsageStatDto[];

  @ApiProperty({ type: UsageStatDto, isArray: true })
  moves!: UsageStatDto[];

  @ApiProperty({ type: UsageStatDto, isArray: true })
  teraTypes!: UsageStatDto[];

  @ApiProperty({ type: UsageStatDto, isArray: true })
  teammates!: UsageStatDto[];

  @ApiProperty({ type: SpreadUsageDto, isArray: true })
  spreads!: SpreadUsageDto[];
}

export class StatSpreadDto {
  @ApiProperty()
  hp!: number;

  @ApiProperty()
  atk!: number;

  @ApiProperty()
  def!: number;

  @ApiProperty()
  spa!: number;

  @ApiProperty()
  spd!: number;

  @ApiProperty()
  spe!: number;
}

export class VgcMetaSlotDto {
  @ApiProperty()
  slotIndex!: number;

  @ApiProperty()
  speciesId!: string;

  @ApiProperty()
  speciesName!: string;

  @ApiPropertyOptional()
  nickname?: string;

  @ApiPropertyOptional()
  item?: string;

  @ApiPropertyOptional()
  ability?: string;

  @ApiProperty({ type: String, isArray: true })
  moves!: string[];

  @ApiPropertyOptional()
  nature?: string;

  @ApiPropertyOptional({ type: StatSpreadDto })
  spread?: StatSpreadDto;

  @ApiPropertyOptional()
  tera?: string;
}

export class SpeciesTeamEntryDto {
  @ApiProperty({ enum: ['vgcpastes', 'limitless', 'paste'] })
  source!: 'vgcpastes' | 'limitless' | 'paste';

  @ApiProperty()
  playerId!: string;

  @ApiProperty({ nullable: true })
  playerName!: string | null;

  @ApiProperty({ nullable: true })
  record!: string | null;

  @ApiProperty({ nullable: true })
  rank!: string | null;

  @ApiProperty({ type: VgcMetaSlotDto, isArray: true })
  slots!: VgcMetaSlotDto[];

  @ApiProperty()
  rawText!: string;

  @ApiProperty({ nullable: true })
  replicaCode!: string | null;
}

export class VgcIngestionJobDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    enum: ['smogon_snapshot', 'champions_regulation', 'limitless_tournament'],
  })
  type!: 'smogon_snapshot' | 'champions_regulation' | 'limitless_tournament';

  @ApiProperty({ enum: ['idle', 'queued', 'running', 'done', 'error'] })
  status!: 'idle' | 'queued' | 'running' | 'done' | 'error';

  @ApiProperty()
  revisionKey!: string;

  @ApiPropertyOptional()
  progress?: number;

  @ApiPropertyOptional()
  total?: number;

  @ApiPropertyOptional()
  startedAt?: string;

  @ApiPropertyOptional()
  completedAt?: string;

  @ApiPropertyOptional()
  lastError?: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;
}

export class PersonalMetaComparisonRowDto {
  @ApiProperty()
  speciesId!: string;

  @ApiProperty()
  speciesName!: string;

  @ApiProperty()
  personalUsagePercent!: number;

  @ApiProperty()
  metaUsagePercent!: number;

  @ApiProperty()
  deltaPercent!: number;

  @ApiProperty()
  absDeltaPercent!: number;

  @ApiProperty()
  personalRawCount!: number;

  @ApiProperty()
  metaRawCount!: number;
}

export class PersonalMetaComparisonDto {
  @ApiProperty()
  regulationId!: string;

  @ApiProperty({ enum: ['smogon', 'champions', 'limitless'] })
  source!: 'smogon' | 'champions' | 'limitless';

  @ApiProperty()
  personalSampleSize!: number;

  @ApiProperty()
  rowCount!: number;

  @ApiProperty({ type: PersonalMetaComparisonRowDto, isArray: true })
  rows!: PersonalMetaComparisonRowDto[];
}

export class ChampionsRegulationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  formatId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  gameType!: string;

  @ApiProperty({ nullable: true })
  vgcPastesGid!: string | null;

  @ApiPropertyOptional({
    enum: ['idle', 'running_csv', 'running_pastes', 'done', 'error'],
  })
  importStatus?: 'idle' | 'running_csv' | 'running_pastes' | 'done' | 'error';

  @ApiPropertyOptional({ nullable: true })
  importError?: string | null;

  @ApiPropertyOptional()
  importTeamCount?: number;

  @ApiPropertyOptional()
  importFetchedCount?: number;

  @ApiPropertyOptional({ nullable: true })
  importStartedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  importCompletedAt?: string | null;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  createdAt!: string;
}

export class LimitlessPlayerTeamDto {
  @ApiProperty()
  playerSlug!: string;

  @ApiProperty()
  playerName!: string;

  @ApiProperty()
  placing!: number;

  @ApiProperty()
  record!: string;

  @ApiProperty()
  rawText!: string;

  @ApiProperty({ type: VgcMetaSlotDto, isArray: true })
  slots!: VgcMetaSlotDto[];
}

export class DivergenceRowDto {
  @ApiProperty()
  speciesId!: string;

  @ApiProperty()
  speciesName!: string;

  @ApiProperty()
  ladderPercent!: number;

  @ApiProperty()
  tournamentPercent!: number;

  @ApiProperty()
  deltaPercent!: number;

  @ApiProperty()
  absDeltaPercent!: number;

  @ApiProperty({ enum: ['ladder-trap', 'tournament-staple'], nullable: true })
  badge!: 'ladder-trap' | 'tournament-staple' | null;
}

export class DivergenceResultDto {
  @ApiProperty()
  regulationId!: string;

  @ApiProperty({ nullable: true })
  tournamentId!: number | null;

  @ApiProperty()
  ladderFormat!: string;

  @ApiProperty()
  ladderMonth!: string;

  @ApiProperty()
  ladderCutoff!: number;

  @ApiProperty()
  rowCount!: number;

  @ApiProperty({ type: DivergenceRowDto, isArray: true })
  rows!: DivergenceRowDto[];
}

export class CountResultDto {
  @ApiProperty()
  count!: number;
}

export class TournamentImportStartDto {
  @ApiProperty()
  tournamentId!: number;
}
