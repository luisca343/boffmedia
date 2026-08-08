import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsInt,
  IsString,
  IsOptional,
  IsIn,
} from 'class-validator';
import {
  RandomizerEventStatus,
  RandomizerAssignmentStatus,
} from '@/_db/schema/Randomizer';

// ==================== EVENT DTOS ====================

export class CreateEventDto {
  @ApiProperty({ example: 1, description: 'Tournament ID' })
  @IsNotEmpty()
  @IsInt()
  tournamentId: number;

  @ApiProperty({ example: 'gba', description: 'Game platform' })
  @IsNotEmpty()
  @IsString()
  gamePlatform: string;

  @ApiProperty({ example: 'pokered', description: 'FVX game identifier' })
  @IsNotEmpty()
  @IsString()
  gameTitle: string;

  @ApiProperty({
    example: 1,
    description:
      'Preset whose settings snapshot pins the event (settingsBlobSha512 is derived from it)',
  })
  @IsNotEmpty()
  @IsInt()
  presetId: number;

  @ApiProperty({
    example: 'c'.repeat(128),
    description: 'SHA-512 of clean ROM',
  })
  @IsNotEmpty()
  @IsString()
  cleanRomSha512: string;

  @ApiProperty({
    example: 'Pokémon FireRed (Spain)',
    description: 'Human-readable ROM hint',
  })
  @IsOptional()
  @IsString()
  romHint?: string;

  @ApiProperty({
    example: 'pack-uuid-1234',
    description: 'Pack ID for randomlocke event linkage',
    required: false,
  })
  @IsOptional()
  @IsString()
  packId?: string;
}

export class UpdateEventDto {
  @ApiProperty({ example: 'Pokémon FireRed (Spain)', required: false })
  @IsOptional()
  @IsString()
  romHint?: string;

  @ApiProperty({
    example: 'pack-uuid-1234',
    description: 'Pack ID for randomlocke event linkage',
    required: false,
  })
  @IsOptional()
  @IsString()
  packId?: string;
}

export class EventResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tournamentId: number;

  @ApiProperty({ example: 'gba' })
  gamePlatform: string;

  @ApiProperty({ example: 'pokered' })
  gameTitle: string;

  @ApiProperty()
  settingsBlobSha512: string;

  @ApiProperty()
  fvxJarSha512: string;

  @ApiProperty()
  cleanRomSha512: string;

  @ApiProperty()
  romHint: string | null;

  @ApiProperty({
    type: String,
    example: 'pack-uuid-1234',
    required: false,
    nullable: true,
  })
  packId: string | null;

  @ApiProperty({
    example: 'draft',
    enum: ['draft', 'locked', 'running', 'finished'],
  })
  status: RandomizerEventStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== ASSIGNMENT DTOS ====================

export class AssignmentClaimedDto {
  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'claimed', 'patched', 'verified'],
  })
  status: RandomizerAssignmentStatus;

  @ApiProperty({ example: 'gba' })
  gamePlatform: string;

  @ApiProperty({ example: 'pokered' })
  gameTitle: string;

  @ApiProperty()
  cleanRomSha512: string;

  @ApiProperty()
  romHint: string | null;

  @ApiProperty({ example: 'draft' })
  eventStatus: RandomizerEventStatus;

  @ApiProperty({
    type: String,
    description: 'SHA-512 of randomized output ROM; present only if patched',
    nullable: true,
  })
  outputSha512: string | null;
}

export class AssignmentAdminDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 1 })
  participantId: number;

  @ApiProperty()
  mcUuid: string | null;

  @ApiProperty({ description: 'Only present if event.status === finished' })
  seed?: number;

  @ApiProperty()
  status: RandomizerAssignmentStatus;

  @ApiProperty()
  outputSha512: string | null;

  @ApiProperty()
  logBlobSha512: string | null;

  @ApiProperty()
  claimedAt: Date | null;

  @ApiProperty()
  patchedAt: Date | null;

  @ApiProperty()
  verifiedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== PRESET DTOS ====================

export class CreatePresetDto {
  @ApiProperty({ example: 'Chaos Mode' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'gba', required: false })
  @IsOptional()
  @IsString()
  gameScope?: string;

  @ApiProperty({ example: { restrictDuplicates: true } })
  @IsNotEmpty()
  settingsJson: Record<string, unknown>;
}

export class UpdatePresetDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  gameScope?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  settingsJson?: Record<string, unknown>;
}

export class PresetResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  gameScope: string | null;

  @ApiProperty()
  settingsJson: Record<string, unknown>;

  @ApiProperty()
  rnqsBlobSha512: string | null;

  @ApiProperty()
  updatedBy: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== LOCK/FINISH DTOS ====================

export class LockEventDto {
  // No additional fields needed — lock uses checked-in participants
}

export class FinishEventDto {
  // No additional fields needed for basic finish
}

export class DryRunDto {
  // File is passed via multipart, not in body — no properties needed
}

// ==================== QUICK RANDOMIZE DTO ====================

/**
 * Direct, event-less randomization: pick a preset + upload a ROM, get the
 * randomized ROM back. Multipart fields arrive as strings, so numeric fields
 * are coerced via @Type (transform is enabled globally).
 */
export class QuickRandomizeDto {
  @ApiProperty({ example: 1, description: 'Preset supplying the FVX settings' })
  @Type(() => Number)
  @IsInt()
  presetId: number;

  @ApiProperty({ example: 'gba', enum: ['gba', 'nds'] })
  @IsString()
  @IsIn(['gba', 'nds'])
  gamePlatform: string;

  @ApiProperty({
    required: false,
    description: 'Optional fixed seed; a random one is used when omitted',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  seed?: number;
}
