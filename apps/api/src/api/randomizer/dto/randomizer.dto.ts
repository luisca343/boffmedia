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
  RandomizerConfigStatus,
  RandomizerAssignmentStatus,
} from '@/_db/schema/Randomizer';

// ==================== CONFIG DTOS ====================

export class CreateConfigDto {
  @ApiProperty({ example: 1, description: 'BoffMedia Event ID' })
  @IsNotEmpty()
  @IsInt()
  eventId: number;

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
      'Preset whose settings snapshot pins the config (settingsBlobSha512 is derived from it)',
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
}

export class UpdateConfigDto {
  @ApiProperty({ example: 'Pokémon FireRed (Spain)', required: false })
  @IsOptional()
  @IsString()
  romHint?: string;
}

export class ConfigResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  eventId: number;

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
    example: 'draft',
    enum: ['draft', 'open', 'closed', 'published'],
  })
  status: RandomizerConfigStatus;

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
    example: 'claimed',
    enum: ['claimed', 'patched', 'verified'],
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

  @ApiProperty({ example: 'open' })
  configStatus: RandomizerConfigStatus;

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
  configId: number;

  @ApiProperty({ type: Number, nullable: true, description: 'BoffMedia User ID if linked' })
  boffmediaUserId: number | null;

  @ApiProperty()
  mcUuid: string;

  @ApiProperty({ description: 'Only present if config.status === published' })
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

// ==================== CONFIG LIFECYCLE DTOS ====================

export class OpenConfigDto {
  // No additional fields needed
}

export class CloseConfigDto {
  // No additional fields needed
}

export class PublishConfigDto {
  // No additional fields needed
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

// ==================== PUBLIC DTOS (No Auth) ====================

/**
 * Public config listing for events (pre-publish: no seeds).
 * Matches the admin ConfigResponseDto but excludes seed.
 */
export class PublicConfigDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 'gba' })
  gamePlatform: string;

  @ApiProperty({ example: 'pokered' })
  gameTitle: string;

  @ApiProperty()
  cleanRomSha512: string;

  @ApiProperty({ type: String, nullable: true })
  romHint: string | null;

  @ApiProperty()
  fvxJarSha512: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Only included when config status is published',
  })
  settingsBlobSha512?: string | null;

  @ApiProperty({
    example: 'draft',
    enum: ['draft', 'open', 'closed', 'published'],
  })
  status: RandomizerConfigStatus;

  @ApiProperty()
  createdAt: Date;
}

/**
 * Public assignment listing (per-participant row).
 * Seed only visible when config status === published.
 */
export class PublicAssignmentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  configId: number;

  @ApiProperty({ description: 'User display name (from boffMediaUsers)' })
  @IsString()
  displayName: string;

  @ApiProperty({
    example: 'claimed',
    enum: ['claimed', 'patched', 'verified'],
  })
  status: RandomizerAssignmentStatus;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Only present if config.status === published',
  })
  seed?: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Sha512 of the randomized ROM output',
  })
  outputSha512: string | null;

  @ApiProperty({ type: Date, nullable: true })
  claimedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  patchedAt: Date | null;

  @ApiProperty({ type: Date, nullable: true })
  verifiedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
