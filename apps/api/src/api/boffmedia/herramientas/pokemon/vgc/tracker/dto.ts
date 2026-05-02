import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, IsArray, IsObject } from 'class-validator';

export class CreatePresetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() id?: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() regulationId: string;
  @ApiProperty() @IsString() exportString: string;
  @ApiProperty({ type: 'array' }) @IsArray() slots: any[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() currentVersion?: number;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() versions?: any[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() createdAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() updatedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() clientUpdatedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class CreateSessionDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() label: string;
  @ApiProperty({ enum: ['BO1', 'BO3'] }) @IsIn(['BO1', 'BO3']) format: 'BO1' | 'BO3';
  @ApiProperty() @IsString() regulationId: string;
  @ApiPropertyOptional({ enum: ['ladder', 'tournament'] }) @IsOptional() @IsIn(['ladder', 'tournament']) type?: 'ladder' | 'tournament';
  @ApiPropertyOptional() @IsOptional() @IsString() activePresetId?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() startElo?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() startedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() archivedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() tournamentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() limitlessTournamentId?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() sessionNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() clientUpdatedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class CreateMatchDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty({ enum: ['BO1', 'BO3'] }) @IsIn(['BO1', 'BO3']) format: 'BO1' | 'BO3';
  @ApiProperty() @IsObject() myTeam: any;
  @ApiProperty() @IsObject() opponentTeam: any;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentArchetype?: string;
  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] }) @IsOptional() @IsIn(['win', 'loss', 'draw']) result?: 'win' | 'loss' | 'draw';
  @ApiPropertyOptional() @IsOptional() @IsString() outcomeTag?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() turnCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eloAfter?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() opponentElo?: number;
  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() notes?: any[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() createdAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() completedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() clientUpdatedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}

export class UpdateMatchDto {
  @ApiPropertyOptional() @IsOptional() @IsObject() myTeam?: any;
  @ApiPropertyOptional() @IsOptional() @IsObject() opponentTeam?: any;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentArchetype?: string;
  @ApiPropertyOptional({ enum: ['win', 'loss', 'draw'] })
  @IsOptional() @IsIn(['win', 'loss', 'draw']) result?: 'win' | 'loss' | 'draw';
  @ApiPropertyOptional() @IsOptional() @IsString() outcomeTag?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() turnCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() eloAfter?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() opponentElo?: number;
  @ApiPropertyOptional() @IsOptional() notes?: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() completedAt?: string;
}

export class UpsertSeriesDto {
  @ApiProperty() @IsString() id: string;
  @ApiProperty() @IsString() sessionId: string;
  @ApiProperty() @IsNumber() createdAt: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() completedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() roundNumber?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() opponentArchetype?: string;
  @ApiProperty() @IsObject() myTeam: any;
  @ApiProperty() @IsObject() opponentTeam: any;
  @ApiProperty({ type: 'array' }) @IsArray() games: any[];
  @ApiPropertyOptional() @IsOptional() @IsString() seriesResult?: string;
  @ApiProperty({ type: 'array' }) @IsArray() notes: any[];
  @ApiPropertyOptional() @IsOptional() @IsNumber() clientUpdatedAt?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() userId?: number;
}
