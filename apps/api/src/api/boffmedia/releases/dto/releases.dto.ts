import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DEPLOYMENT_ENVIRONMENTS,
  DEPLOYMENT_STATUSES,
  RELEASE_CHANGELOG_MODES,
  RELEASE_LOCALES,
  RELEASE_SURFACES,
  type DeploymentEnvironment,
  type DeploymentStatus,
  type ReleaseChangelogMode,
  type ReleaseLocale,
  type ReleaseSurface,
  type ReleaseEntryType,
} from '@/_db/schema/BoffMediaReleases';

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

export class ListReleasesQueryDto {
  @ApiPropertyOptional({ enum: RELEASE_LOCALES, default: 'en' })
  @IsOptional()
  @IsIn([...RELEASE_LOCALES])
  locale?: ReleaseLocale;

  @ApiPropertyOptional({ example: '0.9.0' })
  @IsOptional()
  @IsString()
  @Matches(SEMVER_PATTERN)
  after?: string;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class CreateReleaseDto {
  @ApiProperty({ example: '0.9.1' })
  @IsString()
  @Matches(SEMVER_PATTERN)
  version!: string;

  @ApiProperty({
    enum: RELEASE_SURFACES,
    isArray: true,
    example: ['web', 'api'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...RELEASE_SURFACES], { each: true })
  requiredSurfaces!: ReleaseSurface[];

  @ApiPropertyOptional({ enum: RELEASE_CHANGELOG_MODES, default: 'entries' })
  @IsOptional()
  @IsEnum(RELEASE_CHANGELOG_MODES)
  changelogMode?: ReleaseChangelogMode;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceCommitSha?: string;

  @ApiProperty({ maxLength: 64 })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  versionFileSha!: string;
}

/** Normalized form emitted by the repository fragment scanner. */
export class ReleaseFragmentDto {
  @ApiProperty({ example: 'mhwilds-wishlist-2026-09-13' })
  @IsString()
  @MaxLength(128)
  fragmentId!: string;

  @ApiProperty({ example: 'changelog/fragments/mhwilds-wishlist.yaml' })
  @IsString()
  @MaxLength(255)
  sourcePath!: string;

  @ApiProperty({ example: 'a1b2c3d4e5f6' })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  contentHash!: string;

  @ApiProperty({
    enum: ['new', 'improvement', 'fix', 'security', 'deprecated', 'removed'],
  })
  @IsEnum(['new', 'improvement', 'fix', 'security', 'deprecated', 'removed'])
  type!: ReleaseEntryType;

  @ApiProperty({ example: 'Wishlist improvements' })
  @IsString()
  @MaxLength(255)
  titleEn!: string;

  @ApiProperty({
    example: 'The wishlist now keeps item variants grouped together.',
  })
  @IsString()
  @MaxLength(20000)
  descriptionEn!: string;

  @ApiPropertyOptional({ example: 'Mejoras en la lista de deseos' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleEs?: string;

  @ApiPropertyOptional({
    example: 'La lista de deseos agrupa ahora las variantes.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  descriptionEs?: string;
}

export class CreateFragmentReleaseDto {
  @ApiProperty({ example: '0.9.1' })
  @IsString()
  @Matches(SEMVER_PATTERN)
  version!: string;

  @ApiProperty({
    enum: RELEASE_SURFACES,
    isArray: true,
    example: ['web', 'api'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsIn([...RELEASE_SURFACES], { each: true })
  requiredSurfaces!: ReleaseSurface[];

  @ApiPropertyOptional({ enum: RELEASE_CHANGELOG_MODES, default: 'entries' })
  @IsOptional()
  @IsEnum(RELEASE_CHANGELOG_MODES)
  changelogMode?: ReleaseChangelogMode;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  sourceCommitSha?: string;

  @ApiProperty({ maxLength: 64 })
  @IsString()
  @Matches(/^[a-f0-9]{64}$/)
  versionFileSha!: string;

  @ApiProperty({ type: [ReleaseFragmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReleaseFragmentDto)
  fragments!: ReleaseFragmentDto[];
}

export class RecordDeploymentDto {
  @ApiPropertyOptional({
    description: 'Existing product release, when one exists',
  })
  @IsOptional()
  @IsInt()
  releaseId?: number;

  @ApiProperty({ enum: RELEASE_SURFACES })
  @IsEnum(RELEASE_SURFACES)
  surface!: ReleaseSurface;

  @ApiProperty({ enum: DEPLOYMENT_ENVIRONMENTS })
  @IsEnum(DEPLOYMENT_ENVIRONMENTS)
  environment!: DeploymentEnvironment;

  @ApiProperty({ example: '0.9.1' })
  @IsString()
  @Matches(SEMVER_PATTERN)
  productVersion!: string;

  @ApiProperty({ example: 'web-1234' })
  @IsString()
  @MaxLength(128)
  buildId!: string;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  gitSha?: string;

  @ApiPropertyOptional({ maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  versionFileSha?: string;

  @ApiProperty({ enum: DEPLOYMENT_STATUSES })
  @IsEnum(DEPLOYMENT_STATUSES)
  status!: DeploymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  healthCheckUrl?: string;

  @ApiPropertyOptional({ example: '2026-09-13T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  healthCheckedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  failureReason?: string;

  @ApiProperty({ example: 'production:web:web-1234' })
  @IsString()
  @MaxLength(255)
  idempotencyKey!: string;
}

export class WithdrawReleaseDto {
  @ApiProperty({ example: 'Rolled back after a regression in the web build.' })
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  reason!: string;
}
