import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class JoinChallengeEntity {
  @ApiProperty({ description: 'Preséntalo a Mojang en session/minecraft/join' })
  serverId!: string;

  @ApiProperty({ example: 60 })
  expiresInSeconds!: number;
}

export class LauncherSessionEntity {
  @ApiProperty({ description: 'Bearer para el resto de rutas del launcher' })
  token!: string;

  @ApiProperty({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  uuid!: string;

  @ApiProperty()
  username!: string;
}

export class LauncherVersionEntity {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() minecraft!: string;
  @ApiPropertyOptional({ nullable: true }) loader!: string | null;
  @ApiPropertyOptional({ nullable: true }) loaderVersion!: string | null;
  @ApiProperty() fileCount!: number;
  @ApiProperty() createdAt!: string;
}

export class LauncherPackEntity {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) iconUrl!: string | null;
  @ApiProperty({ enum: ['public', 'password', 'allowlist'] })
  accessKind!: string;

  @ApiPropertyOptional({ type: LauncherVersionEntity, nullable: true })
  latestVersion!: LauncherVersionEntity | null;
}

export class AdminPackEntity {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) iconUrl!: string | null;
  @ApiProperty() accessKind!: string;
  @ApiProperty() archived!: boolean;
  @ApiProperty() hasPassword!: boolean;
  @ApiProperty() aclCount!: number;
  @ApiProperty() versionCount!: number;
  @ApiPropertyOptional({ nullable: true }) latestVersionId!: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}

export class PackVersionEntity {
  @ApiProperty() id!: string;
  @ApiProperty() packId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() minecraft!: string;
  @ApiPropertyOptional({ nullable: true }) loader!: string | null;
  @ApiPropertyOptional({ nullable: true }) loaderVersion!: string | null;
  @ApiProperty() fileCount!: number;
  @ApiProperty() published!: boolean;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() createdAt!: string;
}

export class PackIdEntity {
  @ApiProperty() id!: string;
}

export class InviteCodeEntity {
  @ApiProperty() code!: string;
}

export class BlobUploadEntity {
  /** Computed by the server from the bytes it received — the manifest must use
   *  this value, not whatever the uploader believed the hash to be. */
  @ApiProperty() sha512!: string;
  @ApiProperty() size!: number;
}

export class ModSearchHitEntity {
  @ApiProperty({ enum: ['curseforge', 'modrinth'] })
  platform!: 'curseforge' | 'modrinth';

  /** String on both platforms even though CurseForge's is numeric — the picker
   *  treats them uniformly and narrows only when building the FileSource. */
  @ApiProperty() projectId!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() summary!: string;
  @ApiPropertyOptional() iconUrl?: string;
  @ApiProperty() downloads!: number;
  @ApiPropertyOptional() author?: string;
  @ApiProperty({ type: [String] }) categories!: string[];
  @ApiPropertyOptional({ description: 'ISO-8601' }) updatedAt?: string;

  @ApiPropertyOptional({ enum: ['required', 'optional', 'unsupported', 'unknown'] })
  clientSide?: 'required' | 'optional' | 'unsupported' | 'unknown';

  @ApiPropertyOptional({ enum: ['required', 'optional', 'unsupported', 'unknown'] })
  serverSide?: 'required' | 'optional' | 'unsupported' | 'unknown';
}

export class ModSearchPageEntity {
  @ApiProperty({ type: [ModSearchHitEntity] }) hits!: ModSearchHitEntity[];

  /** Total matches upstream reports, so the picker can page instead of
   *  guessing when the list has run out. */
  @ApiProperty() total!: number;
}

// Declared before ModFileEntity on purpose: @ApiProperty({ type: [X] }) reads
// the class at decoration time, so a forward reference is a runtime TDZ crash.
export class ModDependencyEntity {
  @ApiProperty({ enum: ['curseforge', 'modrinth'] })
  platform!: 'curseforge' | 'modrinth';

  @ApiProperty() projectId!: string;

  @ApiProperty({ enum: ['required', 'optional', 'incompatible', 'embedded'] })
  relation!: 'required' | 'optional' | 'incompatible' | 'embedded';

  @ApiPropertyOptional({ description: 'Versión concreta exigida, si la hay' })
  versionId?: string;

  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() slug?: string;
  @ApiPropertyOptional() iconUrl?: string;
}

export class ModFileEntity {
  @ApiProperty({ enum: ['curseforge', 'modrinth'] })
  platform!: 'curseforge' | 'modrinth';

  /** CurseForge file id, or the Modrinth *version* id. */
  @ApiProperty() fileId!: string;

  @ApiPropertyOptional({ description: 'Solo Modrinth' }) versionNumber?: string;
  @ApiProperty() displayName!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty({ type: [String] }) gameVersions!: string[];
  @ApiProperty({ enum: ['release', 'beta', 'alpha'] })
  releaseType!: 'release' | 'beta' | 'alpha';
  @ApiProperty({ description: 'ISO-8601' }) datePublished!: string;

  /** Always null on CurseForge (its API exposes only sha1/md5); use the resolve
   *  route, which hashes the bytes, to get the value the manifest needs. */
  @ApiPropertyOptional({ nullable: true }) sha512!: string | null;

  /** False when CurseForge reports a null downloadUrl — the author forbids
   *  third-party distribution and no automatic install is possible. */
  @ApiProperty() downloadable!: boolean;

  @ApiProperty({ type: [String] }) loaders!: string[];

  /** What this file needs alongside it. A pack that skips these installs and
   *  then crashes at launch with a missing-library error. */
  @ApiProperty({ type: [ModDependencyEntity] })
  dependencies!: ModDependencyEntity[];
}

export class GameVersionEntity {
  @ApiProperty({ example: '1.21.4' }) id!: string;

  @ApiProperty({ enum: ['release', 'snapshot', 'old_beta', 'old_alpha'] })
  type!: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';

  @ApiProperty({ description: 'ISO-8601' }) releaseTime!: string;

  /** True for the newest release and the newest snapshot. */
  @ApiProperty() latest!: boolean;
}

export class LoaderVersionEntity {
  @ApiProperty({ example: '21.4.30' }) version!: string;
  @ApiProperty() stable!: boolean;
  @ApiProperty() latest!: boolean;

  /** Forge names one build per Minecraft version as "recommended"; for the
   *  others this is the newest stable build. */
  @ApiProperty() recommended!: boolean;
}

export class ModProjectEntity {
  @ApiProperty({ enum: ['curseforge', 'modrinth'] })
  platform!: 'curseforge' | 'modrinth';

  @ApiProperty() projectId!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty() summary!: string;

  /** Markdown (Modrinth) or HTML (CurseForge) — the picker renders it as text. */
  @ApiProperty() description!: string;
  @ApiPropertyOptional() iconUrl?: string;
  @ApiProperty() downloads!: number;
  @ApiPropertyOptional() author?: string;
  @ApiProperty({ type: [String] }) categories!: string[];
  @ApiProperty({ type: [String] }) gameVersions!: string[];
  @ApiProperty({ type: [String] }) loaders!: string[];
  @ApiProperty({ type: [String] }) gallery!: string[];
  @ApiPropertyOptional() sourceUrl?: string;
  @ApiPropertyOptional() issuesUrl?: string;
  @ApiPropertyOptional() websiteUrl?: string;

  @ApiProperty({ enum: ['required', 'optional', 'unsupported', 'unknown'] })
  clientSide!: 'required' | 'optional' | 'unsupported' | 'unknown';

  @ApiProperty({ enum: ['required', 'optional', 'unsupported', 'unknown'] })
  serverSide!: 'required' | 'optional' | 'unsupported' | 'unknown';
}

export class CategoryEntity {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() iconUrl?: string;
}

export class ResolvedFileEntity {
  @ApiProperty({ description: '128 hex — calculado por el servidor' })
  sha512!: string;

  @ApiProperty() fileSize!: number;
  @ApiProperty() fileName!: string;

  @ApiProperty({
    description: 'El FileSource listo para el manifiesto',
    type: 'object',
    additionalProperties: true,
  })
  source!: Record<string, unknown> | object;
}

export class AccessRowEntity {
  @ApiProperty() uuid!: string;
  @ApiProperty() grantedAt!: Date;
}
