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

export class AccessRowEntity {
  @ApiProperty() uuid!: string;
  @ApiProperty() grantedAt!: Date;
}
