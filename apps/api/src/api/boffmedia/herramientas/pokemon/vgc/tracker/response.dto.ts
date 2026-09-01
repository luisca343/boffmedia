import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresetSlotDto {
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
}

export class PresetVersionDto {
  @ApiProperty()
  version!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  exportString!: string;

  @ApiProperty({ type: PresetSlotDto, isArray: true })
  slots!: PresetSlotDto[];

  @ApiProperty()
  savedAt!: number;
}

export class TeamPresetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  regulationId!: string;

  @ApiProperty()
  exportString!: string;

  @ApiProperty({ type: PresetSlotDto, isArray: true })
  slots!: PresetSlotDto[];

  @ApiProperty()
  createdAt!: number;

  @ApiProperty()
  updatedAt!: number;

  @ApiProperty()
  currentVersion!: number;

  @ApiProperty({ type: PresetVersionDto, isArray: true })
  versions!: PresetVersionDto[];
  @ApiPropertyOptional({
    description:
      'Epoch ms on the device that last wrote this row. The value conflict ' +
      'detection compares — never `updatedAt`, which is the server clock.',
  })
  clientUpdatedAt?: number;

}

export class MatchSlotDto {
  @ApiProperty()
  slotIndex!: number;

  @ApiProperty({ type: String, nullable: true })
  speciesId!: string | null;

  @ApiProperty({ type: String, nullable: true })
  speciesName!: string | null;

  @ApiProperty({ enum: ['lead1', 'lead2', 'back1', 'back2', 'unknown'] })
  role!: 'lead1' | 'lead2' | 'back1' | 'back2' | 'unknown';
}

export class TeamSnapshotDto {
  @ApiPropertyOptional()
  presetId?: string;

  @ApiProperty({ type: MatchSlotDto, isArray: true })
  slots!: MatchSlotDto[];
}

export class MatchNoteDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  createdAt!: number;

  @ApiProperty({ enum: ['live', 'post', 'series'] })
  phase!: 'live' | 'post' | 'series';
}

export class SessionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['ladder', 'tournament'] })
  type!: 'ladder' | 'tournament';

  @ApiProperty()
  label!: string;

  @ApiProperty({ enum: ['BO1', 'BO3'] })
  format!: 'BO1' | 'BO3';

  @ApiProperty()
  regulationId!: string;

  @ApiPropertyOptional()
  activePresetId?: string;

  @ApiPropertyOptional()
  startElo?: number;

  @ApiProperty()
  startedAt!: number;

  @ApiPropertyOptional()
  tournamentName?: string;

  @ApiPropertyOptional()
  limitlessTournamentId?: number;

  @ApiPropertyOptional()
  archivedAt?: number;

  @ApiPropertyOptional()
  sessionNotes?: string;

  @ApiPropertyOptional()
  createdAt?: number;

  @ApiPropertyOptional()
  updatedAt?: number;
  @ApiPropertyOptional({
    description:
      'Epoch ms on the device that last wrote this row. The value conflict ' +
      'detection compares — never `updatedAt`, which is the server clock.',
  })
  clientUpdatedAt?: number;

}

export class MatchDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty({ enum: ['BO1', 'BO3'] })
  format!: 'BO1' | 'BO3';

  @ApiProperty()
  createdAt!: number;

  @ApiPropertyOptional()
  completedAt?: number;

  @ApiProperty({ type: TeamSnapshotDto })
  myTeam!: TeamSnapshotDto;

  @ApiProperty({ type: TeamSnapshotDto })
  opponentTeam!: TeamSnapshotDto;

  @ApiPropertyOptional()
  opponentName?: string;

  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] })
  result?: 'win' | 'loss' | 'draw';

  @ApiPropertyOptional()
  eloAfter?: number;

  @ApiPropertyOptional()
  opponentElo?: number;

  @ApiProperty({ type: MatchNoteDto, isArray: true })
  notes!: MatchNoteDto[];

  @ApiPropertyOptional({ enum: ['skill', 'misplay', 'luck', 'disconnect'] })
  outcomeTag?: 'skill' | 'misplay' | 'luck' | 'disconnect';

  @ApiPropertyOptional()
  turnCount?: number;

  @ApiPropertyOptional()
  opponentArchetype?: string;

  @ApiPropertyOptional()
  updatedAt?: number;
  @ApiPropertyOptional({
    description:
      'Epoch ms on the device that last wrote this row. The value conflict ' +
      'detection compares — never `updatedAt`, which is the server clock.',
  })
  clientUpdatedAt?: number;

}

export class SeriesGameDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: [1, 2, 3] })
  gameNumber!: 1 | 2 | 3;

  @ApiProperty({ type: MatchSlotDto, isArray: true })
  mySlots!: MatchSlotDto[];

  @ApiProperty({ type: MatchSlotDto, isArray: true })
  opponentSlots!: MatchSlotDto[];

  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] })
  result?: 'win' | 'loss' | 'draw';

  @ApiProperty({ type: MatchNoteDto, isArray: true })
  notes!: MatchNoteDto[];

  @ApiPropertyOptional()
  completedAt?: number;

  @ApiPropertyOptional({ enum: ['skill', 'misplay', 'luck', 'disconnect'] })
  outcomeTag?: 'skill' | 'misplay' | 'luck' | 'disconnect';

  @ApiPropertyOptional()
  turnCount?: number;
}

export class SeriesDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  sessionId!: string;

  @ApiProperty()
  createdAt!: number;

  @ApiPropertyOptional()
  completedAt?: number;

  @ApiPropertyOptional()
  roundNumber?: number;

  @ApiPropertyOptional()
  opponentName?: string;

  @ApiPropertyOptional()
  opponentArchetype?: string;

  @ApiProperty({ type: TeamSnapshotDto })
  myTeam!: TeamSnapshotDto;

  @ApiProperty({ type: TeamSnapshotDto })
  opponentTeam!: TeamSnapshotDto;

  @ApiProperty({ type: SeriesGameDto, isArray: true })
  games!: SeriesGameDto[];

  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] })
  seriesResult?: 'win' | 'loss' | 'draw';

  @ApiProperty({ type: MatchNoteDto, isArray: true })
  notes!: MatchNoteDto[];

  @ApiPropertyOptional()
  updatedAt?: number;
  @ApiPropertyOptional({
    description:
      'Epoch ms on the device that last wrote this row. The value conflict ' +
      'detection compares — never `updatedAt`, which is the server clock.',
  })
  clientUpdatedAt?: number;

}

/** Ids the account has deleted, per table. See `TrackerSyncDataDto.deleted`. */
export class TrackerDeletedIdsDto {
  @ApiProperty({ type: String, isArray: true })
  sessions!: string[];

  @ApiProperty({ type: String, isArray: true })
  matches!: string[];

  @ApiProperty({ type: String, isArray: true })
  series!: string[];

  @ApiProperty({ type: String, isArray: true })
  presets!: string[];
}

export class TrackerSyncDataDto {
  @ApiProperty({ type: SessionDto, isArray: true })
  sessions!: SessionDto[];

  @ApiProperty({ type: MatchDto, isArray: true })
  matches!: MatchDto[];

  @ApiProperty({ type: SeriesDto, isArray: true })
  series!: SeriesDto[];

  @ApiProperty({ type: TeamPresetDto, isArray: true })
  presets!: TeamPresetDto[];

  @ApiProperty({
    type: TrackerDeletedIdsDto,
    description:
      'Rows this account has deleted. A client removes these locally instead ' +
      'of treating them as local-only work to push back up.',
  })
  deleted!: TrackerDeletedIdsDto;
}
