import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeviceAuthorizationEntity {
  @ApiProperty({ description: 'La mitad secreta: solo la guarda la app' })
  deviceCode!: string;

  @ApiProperty({
    example: 'K7QM-3BXR',
    description: 'La mitad legible: el jugador la escribe en la web',
  })
  userCode!: string;

  @ApiProperty({ example: 'https://boffmedia.es/app/autorizar' })
  verificationUri!: string;

  @ApiProperty({ example: 600 })
  expiresIn!: number;

  @ApiProperty({ example: 3 })
  intervalSeconds!: number;
}

export class DesktopSessionUserEntity {
  @ApiProperty({ example: 42 })
  id!: number;

  @ApiProperty()
  username!: string;

  @ApiProperty({
    example: '069a79f4-44e9-4726-a5be-fca90e38aaf5',
    nullable: true,
    description: 'Solo si la cuenta tiene Minecraft vinculado.',
  })
  mcUuid!: string | null;

  @ApiProperty({
    example: 'https://boffmedia.es/uploads/profiles/42.png?v=1756375200000',
    nullable: true,
    description:
      'URL ABSOLUTA del avatar, o null si la cuenta nunca ha puesto uno (la app dibuja su monograma). Se absolutiza aquí porque la columna guarda rutas relativas además de URLs de Discord/Twitch, y en `tauri://localhost` una ruta relativa no resuelve a nada. El `?v=` es `updated_at`: la caché de iconos del launcher indexa por URL y no caduca, así que sin él un avatar cambiado nunca se refrescaría.',
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: ['BOFF_ADMIN'],
    isArray: true,
    type: String,
    description:
      'Los roles de la cuenta. La app los usa SOLO para decidir qué mostrar — qué herramientas listar en su rejilla —, nunca para autorizar: cada ruta protegida sigue comprobando el rol por su cuenta. Sin ellos la app no puede ocultar una herramienta de administración y la enseñaría a todo el mundo, con un 403 esperando detrás. Vacío para una cuenta sin roles.',
  })
  roles!: string[];
}

export class DevicePollEntity {
  @ApiProperty({ enum: ['pending', 'approved', 'denied', 'expired'] })
  status!: 'pending' | 'approved' | 'denied' | 'expired';

  @ApiPropertyOptional({
    description: 'Bearer para el resto de rutas de la app. Solo en approved.',
  })
  token?: string;

  @ApiPropertyOptional({ type: DesktopSessionUserEntity })
  user?: DesktopSessionUserEntity;
}

/** The approval screen shows this before the player commits to anything. */
export class DeviceRequestEntity {
  @ApiProperty({ example: 'K7QM-3BXR' })
  userCode!: string;

  @ApiProperty({ nullable: true, example: 'Boffmedia App 0.3 · Windows' })
  clientLabel!: string | null;

  @ApiProperty({ enum: ['pending', 'approved', 'denied'] })
  status!: string;

  @ApiProperty()
  expiresAt!: Date;
}

const GAME_TYPES = ['minecraft', 'emulator', 'zomboid', 'stardew'] as const;

export class DesktopVersionEntity {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional({ nullable: true }) minecraft!: string | null;
  @ApiPropertyOptional({ nullable: true }) loader!: string | null;
  @ApiPropertyOptional({ nullable: true }) loaderVersion!: string | null;
  @ApiProperty() fileCount!: number;
  @ApiProperty() worldCount!: number;
  @ApiPropertyOptional({ enum: ['mgba', 'melonds'], nullable: true })
  emulatorKind?: 'mgba' | 'melonds' | null;
  @ApiProperty() createdAt!: string;
}

/** A pack's Quick Play target — present only for "server packs". `port` is
 *  omitted for a bare SRV host; both fields are optional so a legacy `{}` row
 *  still documents. */
export class PackServerEntity {
  @ApiPropertyOptional({ example: 'play.example.com' }) host?: string;
  @ApiPropertyOptional({ example: 25565 }) port?: number;
}

export class LauncherPackEntity {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    enum: GAME_TYPES,
    description: 'Resuelto: NULL en BD → minecraft',
  })
  gameType!: (typeof GAME_TYPES)[number];
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) description!: string | null;
  @ApiPropertyOptional({ nullable: true }) iconUrl!: string | null;
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    nullable: true,
  })
  gallery?: unknown[];
  @ApiProperty({ enum: ['public', 'password', 'allowlist'] })
  accessKind!: string;

  @ApiPropertyOptional({ type: PackServerEntity, nullable: true })
  server?: PackServerEntity | null;

  @ApiPropertyOptional({ type: DesktopVersionEntity, nullable: true })
  latestVersion!: DesktopVersionEntity | null;
}

export class AdminPackEntity {
  @ApiProperty() id!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    enum: GAME_TYPES,
    description: 'Resuelto: NULL en BD → minecraft',
  })
  gameType!: (typeof GAME_TYPES)[number];
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) iconUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'object' },
    nullable: true,
  })
  gallery?: unknown[];
  @ApiProperty() accessKind!: string;
  @ApiPropertyOptional({ type: PackServerEntity, nullable: true })
  server?: PackServerEntity | null;
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
  @ApiPropertyOptional({ nullable: true }) minecraft!: string | null;
  @ApiPropertyOptional({ nullable: true }) loader!: string | null;
  @ApiPropertyOptional({ nullable: true }) loaderVersion!: string | null;
  @ApiProperty() fileCount!: number;
  @ApiProperty() worldCount!: number;
  @ApiPropertyOptional({ enum: ['mgba', 'melonds'], nullable: true })
  emulatorKind?: 'mgba' | 'melonds' | null;
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

  @ApiPropertyOptional({
    enum: ['required', 'optional', 'unsupported', 'unknown'],
  })
  clientSide?: 'required' | 'optional' | 'unsupported' | 'unknown';

  @ApiPropertyOptional({
    enum: ['required', 'optional', 'unsupported', 'unknown'],
  })
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

/** A direct grant, keyed on the account that holds it. */
export class AccessRowEntity {
  @ApiProperty() userId!: number;
  @ApiProperty() username!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ enum: ['admin', 'invite'] }) source!: string;
  @ApiPropertyOptional({ nullable: true }) sourceRef!: string | null;
  @ApiProperty() grantedAt!: Date;
}

/** A pre-grant to a raw Minecraft UUID with no account behind it yet. Becomes a
 *  real grant the moment that UUID is linked. */
export class LegacyAccessRowEntity {
  @ApiProperty() uuid!: string;
  @ApiProperty() grantedAt!: Date;
}

/** An event whose membership entitles its members to this pack. Access derives
 *  from membership live, so these people hold no ACL row of their own. */
export class GrantingEventEntity {
  @ApiProperty() eventId!: number;
  @ApiProperty() title!: string;
  @ApiProperty() status!: string;
  @ApiProperty() visibility!: string;
  @ApiProperty() memberCount!: number;
}

export class UserSearchHitEntity {
  @ApiProperty() id!: number;
  @ApiProperty() username!: string;
  @ApiProperty() email!: string;
}

export class PackAccessEntity {
  @ApiProperty({ type: [AccessRowEntity] }) grants!: AccessRowEntity[];
  @ApiProperty({ type: [LegacyAccessRowEntity] })
  legacy!: LegacyAccessRowEntity[];
  @ApiProperty({ type: [GrantingEventEntity] }) events!: GrantingEventEntity[];
}
