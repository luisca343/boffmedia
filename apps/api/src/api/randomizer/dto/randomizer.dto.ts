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
    example: 1,
    description:
      'Library ROM to pin as the clean base. The server copies its sha512 (execution value) and records rom_id (provenance); the platform must match gamePlatform.',
  })
  @IsNotEmpty()
  @IsInt()
  romId: number;

  @ApiProperty({
    example: '5b1f88208cfdad6834c7bbec',
    description:
      'Emulator pack to attach to the event. The launcher resolves pack → event → config, so this is what makes the config reachable in the launcher.',
  })
  @IsNotEmpty()
  @IsString()
  packId: string;

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

  @ApiProperty({
    example: '5b1f88208cfdad6834c7bbec',
    required: false,
    description: 'Re-attach the event to a different emulator pack (draft only)',
  })
  @IsOptional()
  @IsString()
  packId?: string;

  @ApiProperty({
    example: 1,
    required: false,
    description:
      'Select / re-select the base library ROM. Allowed while draft, or on a config that has no ROM yet (re-pins sha512 + rom_id).',
  })
  @IsOptional()
  @IsInt()
  romId?: number;
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

  @ApiProperty({
    type: Number,
    nullable: true,
    required: false,
    description:
      'Provenance: the library ROM this config was pinned from. Null for pre-library configs, which the editor flags for re-selection.',
  })
  romId?: number | null;

  @ApiProperty()
  romHint: string | null;

  @ApiProperty({
    example: 'draft',
    enum: ['draft', 'open', 'closed', 'published'],
  })
  status: RandomizerConfigStatus;

  @ApiProperty({
    example: '5b1f88208cfdad6834c7bbec',
    nullable: true,
    required: false,
    description: 'Emulator pack attached to this config’s event (event.pack_id)',
  })
  packId?: string | null;

  @ApiProperty({
    example: true,
    required: false,
    description:
      'Whether the full launcher chain resolves: event has a pack, event is active, and config is open.',
  })
  launcherResolvable?: boolean;

  @ApiProperty({
    example: 'event-not-active',
    nullable: true,
    required: false,
    enum: ['no-pack', 'event-not-active', 'config-not-open', null],
    description: 'The first broken gate, or null when launcherResolvable.',
  })
  resolutionIssue?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ==================== ASSIGNMENT DTOS ====================

export class AssignmentClaimedDto {
  // Serialized as a string: the launcher (and web) treat eventId as an opaque
  // id (URL path param for the ROM patch), and the launcher's Rust struct
  // deserializes it as a String. Sending a JSON number breaks that parse.
  @ApiProperty({ example: '1' })
  eventId: string;

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

// ==================== ROM LIBRARY DTOS ====================

/**
 * Upload a clean ROM to the central library. The file arrives as a multipart
 * field ("rom"); name + platform come as form fields (strings from multipart).
 */
export class CreateRomDto {
  @ApiProperty({ example: 'Pokémon FireRed (USA)', description: 'Human label' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'gba', enum: ['gba', 'nds'] })
  @IsString()
  @IsIn(['gba', 'nds'])
  gamePlatform: string;
}

export class RomResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Pokémon FireRed (USA)' })
  name: string;

  @ApiProperty({ example: 'gba', enum: ['gba', 'nds'] })
  gamePlatform: string;

  @ApiProperty({ description: 'SHA-512 content address in the blob store' })
  sha512: string;

  @ApiProperty({ example: 16777216 })
  fileSize: number;

  @ApiProperty({
    example: 0,
    description: 'How many configs pin this ROM (by rom_id or clean hash).',
  })
  referencedBy: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
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
