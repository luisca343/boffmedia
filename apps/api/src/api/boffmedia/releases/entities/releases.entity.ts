import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ReleaseEntryType,
  ReleaseLocale,
  ReleaseSurface,
} from '@/_db/schema/BoffMediaReleases';

export class ReleaseEntryEntity {
  @ApiProperty() id!: number;
  @ApiProperty({
    enum: ['new', 'improvement', 'fix', 'security', 'deprecated', 'removed'],
  })
  type!: ReleaseEntryType;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ example: 'Reports load faster' })
  title!: string;
  @ApiProperty({
    example: 'The reports screen now opens without waiting for a full refresh.',
  })
  description!: string;
  @ApiProperty({ enum: ['en', 'es'] })
  locale!: ReleaseLocale;
}

export class ReleaseEntity {
  @ApiProperty() id!: number;
  @ApiProperty({ example: '0.9.1' }) version!: string;
  @ApiProperty({ enum: ['web', 'api', 'desktop'], isArray: true })
  requiredSurfaces!: ReleaseSurface[];
  @ApiProperty({ enum: ['draft', 'published', 'archived'] })
  status!: string;
  @ApiProperty({ enum: ['fragments', 'manual', 'migration'] })
  creationSource!: string;
  @ApiProperty({ enum: ['entries', 'none'] })
  changelogMode!: string;
  @ApiProperty() approved!: boolean;
  @ApiProperty() published!: boolean;
  @ApiProperty() withdrawn!: boolean;
  @ApiPropertyOptional({ type: String, nullable: true })
  withdrawalReason!: string | null;
  @ApiPropertyOptional({
    description: 'Whether the authenticated user has seen this release',
  })
  seen?: boolean;
  @ApiProperty({ type: [ReleaseEntryEntity] })
  entries!: ReleaseEntryEntity[];
  @ApiPropertyOptional({ type: String, nullable: true }) publishedAt!:
    | string
    | null;
  @ApiPropertyOptional({ type: String, nullable: true }) sourceCommitSha!:
    | string
    | null;
  @ApiPropertyOptional({ type: String, nullable: true }) versionFileSha!:
    | string
    | null;
  @ApiProperty() createdAt!: string;
}

export class ReleaseReadinessEntity {
  @ApiProperty() releaseId!: number;
  @ApiProperty({ example: '0.9.1' }) version!: string;
  @ApiProperty({ enum: ['web', 'api', 'desktop'], isArray: true })
  requiredSurfaces!: ReleaseSurface[];
  @ApiProperty({ enum: ['web', 'api', 'desktop'], isArray: true })
  verifiedSurfaces!: ReleaseSurface[];
  @ApiProperty({ enum: ['web', 'api', 'desktop'], isArray: true })
  missingSurfaces!: ReleaseSurface[];
  @ApiProperty() eligible!: boolean;
}

export class ReleaseFragmentRegistryEntity {
  @ApiProperty({
    type: [String],
    description: 'Fragment ids already claimed by releases',
  })
  fragmentIds!: string[];
}

export class DeploymentEntity {
  @ApiProperty() id!: number;
  @ApiPropertyOptional({ type: Number, nullable: true }) releaseId!:
    | number
    | null;
  @ApiProperty({ enum: ['web', 'api', 'desktop'] }) surface!: ReleaseSurface;
  @ApiProperty({ enum: ['development', 'staging', 'production'] })
  environment!: string;
  @ApiProperty() productVersion!: string;
  @ApiProperty() buildId!: string;
  @ApiPropertyOptional({ type: String, nullable: true }) gitSha!: string | null;
  @ApiProperty({ enum: ['verified', 'failed'] }) status!: string;
  @ApiProperty() idempotencyKey!: string;
  @ApiProperty() recordedBy!: string;
  @ApiProperty() deployedAt!: string;
}

export class DeploymentResultEntity {
  @ApiProperty({ type: DeploymentEntity }) deployment!: DeploymentEntity;
  @ApiProperty({ type: ReleaseReadinessEntity, nullable: true })
  readiness!: ReleaseReadinessEntity | null;
  @ApiProperty() releasePublished!: boolean;
}
