import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const ACCESS_KINDS = ['public', 'password', 'allowlist'] as const;
const LOADERS = ['forge', 'neoforge', 'fabric-loader', 'quilt-loader'] as const;

/** Dashed lowercase UUID — the form `rotom_users.uuid` stores. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreatePackDto {
  @ApiProperty({ example: 'boff-smp' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug debe ser kebab-case en minúsculas',
  })
  @MaxLength(64)
  slug!: string;

  @ApiProperty({ example: 'Boff SMP' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiProperty({ enum: ACCESS_KINDS, default: 'allowlist' })
  @IsIn(ACCESS_KINDS)
  accessKind!: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({ description: 'Obligatoria cuando accessKind es "password"' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;
}

export class UpdatePackDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiPropertyOptional({ enum: ACCESS_KINDS })
  @IsOptional()
  @IsIn(ACCESS_KINDS)
  accessKind?: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({ description: 'Cadena vacía para quitar la contraseña' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreateVersionDto {
  @ApiProperty({ example: '1.4.2' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  @ApiProperty({ example: '1.21.4' })
  @IsString()
  @MaxLength(32)
  minecraft!: string;

  @ApiPropertyOptional({ enum: LOADERS })
  @IsOptional()
  @IsIn(LOADERS)
  loader?: (typeof LOADERS)[number];

  @ApiPropertyOptional({ example: '21.4.30' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  loaderVersion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description:
      'PackFile[] — validado con @boffmedia/pack-schema, el mismo esquema del que el launcher genera sus tipos de Rust',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  files!: unknown[];
}

export class GrantAccessDto {
  @ApiProperty({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  @IsString()
  @Matches(UUID_RE, { message: 'UUID de Minecraft no válido' })
  uuid!: string;
}

export class CreateInviteDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ description: 'ISO-8601' })
  @IsOptional()
  // @Type is mandatory alongside @IsDate: without it a round-tripped ISO string
  // arrives as a string and fails validation, 400-ing the whole request.
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

// ── Mod catalog (admin picker) ─────────────────────────────────────────────

const PLATFORMS = ['curseforge', 'modrinth'] as const;
/** The loader names both APIs understand; CurseForge maps them to its numeric
 *  modLoaderType, Modrinth uses them verbatim as category facets. */
const CATALOG_LOADERS = ['forge', 'neoforge', 'fabric', 'quilt'] as const;
/** A pack ships more than jars, and each platform files these separately. */
const PROJECT_TYPES = ['mod', 'resourcepack', 'shader', 'datapack'] as const;
const CATALOG_SORTS = ['relevance', 'downloads', 'updated', 'name', 'follows'] as const;
/** The manifest's loader ids — NOT the catalog ones. */
const META_LOADERS = ['forge', 'neoforge', 'fabric-loader', 'quilt-loader'] as const;

export class CatalogSearchQueryDto {
  @ApiProperty({ enum: PLATFORMS })
  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ example: 'jei' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  query?: string;

  @ApiPropertyOptional({ example: '1.21.4' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gameVersion?: string;

  @ApiPropertyOptional({ enum: CATALOG_LOADERS })
  @IsOptional()
  @IsIn(CATALOG_LOADERS)
  loader?: (typeof CATALOG_LOADERS)[number];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ default: 20, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @ApiPropertyOptional({ enum: PROJECT_TYPES, default: 'mod' })
  @IsOptional()
  @IsIn(PROJECT_TYPES)
  projectType?: (typeof PROJECT_TYPES)[number];

  @ApiPropertyOptional({ enum: CATALOG_SORTS, default: 'downloads' })
  @IsOptional()
  @IsIn(CATALOG_SORTS)
  sort?: (typeof CATALOG_SORTS)[number];

  @ApiPropertyOptional({
    description: 'Id de categoría de CurseForge, o nombre de categoría de Modrinth',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string;
}

export class CatalogCategoriesQueryDto {
  @ApiProperty({ enum: PLATFORMS })
  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @ApiPropertyOptional({ enum: PROJECT_TYPES, default: 'mod' })
  @IsOptional()
  @IsIn(PROJECT_TYPES)
  projectType?: (typeof PROJECT_TYPES)[number];
}

export class CatalogProjectsQueryDto {
  @ApiProperty({ enum: PLATFORMS })
  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @ApiProperty({ description: 'Ids separados por coma' })
  @IsString()
  @MaxLength(2048)
  ids!: string;
}

export class LoaderVersionsQueryDto {
  @ApiProperty({ enum: META_LOADERS })
  @IsIn(META_LOADERS)
  loader!: (typeof META_LOADERS)[number];

  @ApiProperty({ example: '1.21.4' })
  @IsString()
  @MaxLength(32)
  minecraft!: string;
}

export class CatalogFilesQueryDto {
  @ApiPropertyOptional({ example: '1.21.4' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  gameVersion?: string;

  @ApiPropertyOptional({ enum: CATALOG_LOADERS })
  @IsOptional()
  @IsIn(CATALOG_LOADERS)
  loader?: (typeof CATALOG_LOADERS)[number];

  @ApiPropertyOptional({ default: 30, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}

export class CurseforgeSourceDto {
  @ApiProperty({ enum: ['curseforge'] })
  @IsIn(['curseforge'])
  kind!: 'curseforge';

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileId!: number;
}

export class ModrinthSourceDto {
  @ApiProperty({ enum: ['modrinth'] })
  @IsIn(['modrinth'])
  kind!: 'modrinth';

  @ApiProperty()
  @IsString()
  @MinLength(1)
  projectId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  versionId!: string;
}

export class UrlSourceDto {
  @ApiProperty({ enum: ['url'] })
  @IsIn(['url'])
  kind!: 'url';

  @ApiProperty({ example: 'https://example.com/mod.jar' })
  @IsString()
  @Matches(/^https?:\/\//i, { message: 'La URL debe empezar por http:// o https://' })
  @MaxLength(2048)
  url!: string;
}

export class ResolveFileDto {
  @ApiProperty({
    description:
      'FileSource de @boffmedia/pack-schema — {kind:"curseforge"|"modrinth"|"url", …}',
    oneOf: [
      { $ref: '#/components/schemas/CurseforgeSourceDto' },
      { $ref: '#/components/schemas/ModrinthSourceDto' },
      { $ref: '#/components/schemas/UrlSourceDto' },
    ],
  })
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'kind',
      subTypes: [
        { value: CurseforgeSourceDto, name: 'curseforge' },
        { value: ModrinthSourceDto, name: 'modrinth' },
        { value: UrlSourceDto, name: 'url' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  source!: CurseforgeSourceDto | ModrinthSourceDto | UrlSourceDto;
}

// ── Launcher-facing ────────────────────────────────────────────────────────

export class VerifyJoinDto {
  @ApiProperty({ description: 'Nombre de usuario de Minecraft' })
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username!: string;

  @ApiProperty({ description: 'El serverId devuelto por /packs/auth/challenge' })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  serverId!: string;
}

export class ManifestQueryDto {
  @ApiPropertyOptional({ description: 'Solo para packs protegidos con contraseña' })
  @IsOptional()
  @IsString()
  password?: string;
}

/** The download routes re-check entitlement exactly like the manifest route
 *  does, so a password pack needs the password on every one of them too. */
export class DownloadQueryDto extends ManifestQueryDto {}

export class RedeemInviteDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  @MaxLength(32)
  code!: string;
}
