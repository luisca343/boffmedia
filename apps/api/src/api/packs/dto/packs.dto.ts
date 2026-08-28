import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsObject,
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
const GAME_TYPES = ['minecraft', 'emulator', 'zomboid', 'stardew'] as const;

/** Dashed lowercase UUID — the form `rotom_users.uuid` stores. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A pack's Quick Play target. Mirrors PackServer in @boffmedia/pack-schema so
 *  the stored manifest validates against the same rules the launcher enforces:
 *  `host` is a bare hostname or IP (no scheme, no slash), `port` defaults to the
 *  vanilla 25565. Present = this is a "server pack". */
export class PackServerDto {
  @ApiProperty({ example: 'play.example.com' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(/^[^/\\]+$/, {
    message: 'El host no debe incluir esquema ni barras',
  })
  host!: string;

  @ApiPropertyOptional({ example: 25565, default: 25565 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;
}

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

  @ApiPropertyOptional({
    enum: GAME_TYPES,
    default: 'minecraft',
    description:
      'Qué juego usa el pack. PERMANENTE: no se puede cambiar tras crear el pack (rompería toda instancia instalada). Ausente = minecraft.',
  })
  @IsOptional()
  @IsIn(GAME_TYPES)
  gameType?: (typeof GAME_TYPES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        alt: { type: 'string' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  gallery?: unknown[];

  @ApiProperty({ enum: ACCESS_KINDS, default: 'allowlist' })
  @IsIn(ACCESS_KINDS)
  accessKind!: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({
    description: 'Obligatoria cuando accessKind es "password"',
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  password?: string;

  @ApiPropertyOptional({ type: PackServerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PackServerDto)
  server?: PackServerDto;
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
  @MaxLength(2048)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  iconUrl?: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        alt: { type: 'string' },
      },
    },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  gallery?: unknown[];

  @ApiPropertyOptional({ enum: ACCESS_KINDS })
  @IsOptional()
  @IsIn(ACCESS_KINDS)
  accessKind?: (typeof ACCESS_KINDS)[number];

  @ApiPropertyOptional({
    description: 'Cadena vacía para quitar la contraseña',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    type: PackServerDto,
    nullable: true,
    description: 'null para dejar de ser un pack de servidor',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PackServerDto)
  server?: PackServerDto | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class CreatePackVersionDto {
  @ApiProperty({ example: '1.4.2' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  name!: string;

  // Minecraft/loader are OPTIONAL as of multi-game: required iff the pack is
  // `minecraft` (the shared zod schema is the real gate — see parseManifest).
  // A non-MC version leaves these null.
  @ApiPropertyOptional({ example: '1.21.4' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  minecraft?: string;

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
      'PackFile[] — validado con @boffmedia/pack-schema, el mismo esquema del que la app genera sus tipos de Rust',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  files!: unknown[];

  @ApiPropertyOptional({
    description:
      'BundledWorld[] — validado con @boffmedia/pack-schema (solo minecraft)',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  worlds?: unknown[];

  // Per-game spec blocks — exactly one present, matching the pack's gameType.
  // Shape is validated by the shared zod schema in parseManifest; here they are
  // opaque passthrough objects (content schemas land per game cycle).
  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  emulator?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  zomboid?: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  stardew?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'PackFile[] instalados solo en la primera instalación (initialFiles) — validado con @boffmedia/pack-schema',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  initialFiles?: unknown[];

  @ApiPropertyOptional({
    description:
      'OptionalGroup[] — el contenido opcional que el jugador elige, validado con @boffmedia/pack-schema. ' +
      'La unidad es una FEATURE (varios archivos, una decisión), no un archivo suelto.',
    type: 'array',
    items: { type: 'object' },
  })
  @IsOptional()
  @IsArray()
  optionalGroups?: unknown[];

  @ApiPropertyOptional({
    description:
      'PackRuntime — { memoryMib?, jvmArgs? }: la memoria y los parámetros de JVM que ' +
      'esta versión RECOMIENDA. Solo Minecraft. Cada parámetro se valida contra la lista ' +
      'permitida de @boffmedia/pack-schema: se rechazan -Xmx (usa memoryMib; el valor ' +
      'resuelto se añade el último y ganaría) y todo lo que pueda ejecutar un comando o ' +
      'cargar código sin verificar (-javaagent, -XX:OnError, …). ' +
      'Es una recomendación: el lanzador la usa para inicializar una instancia nueva y no ' +
      'la vuelve a aplicar, así que editarla no re-configura a quien ya tiene el pack.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  runtime?: Record<string, unknown>;
}

/** Grant to an account. The normal path — a pack is a Boffmedia entitlement. */
export class GrantUserAccessDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @Min(1)
  userId!: number;
}

/** Pre-grant to a raw Minecraft UUID, for a player who has not registered yet.
 *  Becomes a real grant when that UUID is linked. */
export class GrantAccessDto {
  @ApiProperty({ example: '069a79f4-44e9-4726-a5be-fca90e38aaf5' })
  @IsString()
  @Matches(UUID_RE, { message: 'UUID de Minecraft no válido' })
  uuid!: string;
}

export class CreatePackInviteDto {
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
const CATALOG_SORTS = [
  'relevance',
  'downloads',
  'updated',
  'name',
  'follows',
] as const;
/** The manifest's loader ids — NOT the catalog ones. */
const META_LOADERS = [
  'forge',
  'neoforge',
  'fabric-loader',
  'quilt-loader',
] as const;

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

  @ApiPropertyOptional({
    description:
      'Amplía el filtro de loader para incluir Fabric, porque el pack lleva ' +
      'Sinytra Connector. Solo Modrinth; CurseForge lo ignora.',
  })
  @IsOptional()
  // A query string carries "true"/"false" as text, and `Type(() => Boolean)`
  // would turn BOTH into `true` — the string "false" is truthy. This is the
  // only conversion that makes `?includeFabricViaConnector=false` mean false.
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeFabricViaConnector?: boolean;

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
    description:
      'Id de categoría de CurseForge, o nombre de categoría de Modrinth',
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
  @Matches(/^https?:\/\//i, {
    message: 'La URL debe empezar por http:// o https://',
  })
  @MaxLength(2048)
  url!: string;
}

// A DTO reached ONLY through a raw $ref is never registered by Swagger: the
// schema is emitted with a dangling pointer and `pnpm generate:shared` dies on
// it. @ApiExtraModels is what puts these three in components/schemas.
@ApiExtraModels(CurseforgeSourceDto, ModrinthSourceDto, UrlSourceDto)
export class ResolveFileDto {
  @ApiProperty({
    description:
      'FileSource de @boffmedia/pack-schema — {kind:"curseforge"|"modrinth"|"url", …}',
    oneOf: [
      { $ref: getSchemaPath(CurseforgeSourceDto) },
      { $ref: getSchemaPath(ModrinthSourceDto) },
      { $ref: getSchemaPath(UrlSourceDto) },
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

export class StartDeviceAuthDto {
  @ApiPropertyOptional({
    description:
      'Cómo se presenta esta instalación en la pantalla de aprobación (SO, versión). Solo informativo.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  clientLabel?: string;
}

export class PollDeviceAuthDto {
  @ApiProperty({ description: 'La mitad secreta devuelta por /auth/device' })
  @IsString()
  @MinLength(16)
  @MaxLength(64)
  deviceCode!: string;
}

export class DeviceLookupDto {
  @ApiProperty({ example: 'K7QM-3BXR' })
  @IsString()
  @MinLength(4)
  @MaxLength(16)
  userCode!: string;
}

export class DeviceDecisionDto extends DeviceLookupDto {}

export class ManifestQueryDto {
  @ApiPropertyOptional({
    description: 'Solo para packs protegidos con contraseña',
  })
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
