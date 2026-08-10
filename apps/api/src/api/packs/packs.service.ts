import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PackManifest } from '@boffmedia/pack-schema';
import { PackPrincipal, PacksRepository } from './packs.repository';
import { RandomizerPackLinkRepository } from '@api/_repositories/randomizer/pack-link.repository';
import type { GameType, PackAccessKind, PackLoader } from '@/_db/schema/Packs';
import {
  AUDIT,
  AdminPackView,
  LauncherPrincipal,
  LauncherPackView,
  PackVersionView,
  StoredPackFile,
  StoredPackServer,
} from './types/packs.types';
import {
  CreatePackDto,
  CreatePackVersionDto,
  UpdatePackDto,
} from './dto/packs.dto';

const ID_BYTES = 12;
const INVITE_BYTES = 8;

@Injectable()
export class PacksService {
  private readonly logger = new Logger(PacksService.name);

  constructor(
    private readonly repo: PacksRepository,
    private readonly randomizerLink: RandomizerPackLinkRepository,
  ) {}

  private newId(): string {
    return randomBytes(ID_BYTES).toString('hex');
  }

  // ── Launcher-facing ──────────────────────────────────────────────────────

  /** NULL column → 'minecraft'. One place owns the default so no consumer
   *  re-implements it. */
  private resolveGameType(gameType: GameType | null | undefined): GameType {
    return gameType ?? 'minecraft';
  }

  /** The emulator kind stored in the version's `emulator` json block, if any —
   *  surfaced on list/summary views so the launcher maps a pack to its system
   *  (Game Boy Advance / Nintendo DS) without fetching the manifest. */
  private emulatorKind(
    emulator: Record<string, unknown> | null | undefined,
  ): 'mgba' | 'melonds' | null {
    const kind = emulator?.kind;
    return kind === 'mgba' || kind === 'melonds' ? kind : null;
  }

  /** Packs this UUID may see AND this launcher can parse. Access filtering is a
   *  single repository query (one place can leak a pack); capability filtering
   *  is layered on top — a launcher that does not declare a game type never
   *  lists a pack of that type. `capabilities` is the parsed X-Boff-Game-Types
   *  set (absent header → ['minecraft'], §3.1). */
  async listForLauncher(
    principal: PackPrincipal,
    capabilities: string[],
  ): Promise<LauncherPackView[]> {
    const rows = await this.repo.listVisibleTo(principal);
    const canParse = new Set(capabilities);

    const views = await Promise.all(
      rows.map(async (pack): Promise<LauncherPackView | null> => {
        const gameType = this.resolveGameType(pack.gameType);
        if (!canParse.has(gameType)) return null;

        const version = pack.latestVersionId
          ? await this.repo.findVersion(pack.latestVersionId)
          : null;

        return {
          id: pack.id,
          slug: pack.slug,
          gameType,
          name: pack.name,
          summary: pack.summary,
          iconUrl: pack.iconUrl,
          ...(pack.description ? { description: pack.description } : {}),
          ...(pack.gallery ? { gallery: pack.gallery as any } : {}),
          // The card reads this to mark the pack as a server pack and to ping
          // the server for its live status. Minecraft-only, mirroring the
          // manifest: a non-MC pack never advertises a Quick Play server.
          ...(gameType === 'minecraft' && pack.server
            ? { server: pack.server }
            : {}),
          accessKind: pack.accessKind,
          latestVersion:
            version && version.published
              ? {
                  id: version.id,
                  name: version.name,
                  minecraft: version.minecraft,
                  loader: version.loader,
                  loaderVersion: version.loaderVersion,
                  fileCount: version.files.length,
                  worldCount: version.worlds?.length ?? 0,
                  emulatorKind: this.emulatorKind(version.emulator),
                  createdAt: version.createdAt.toISOString(),
                }
              : null,
        };
      }),
    );
    return views.filter((v): v is LauncherPackView => v !== null);
  }

  /** The game-type-specific half of a version block, shared by the served
   *  manifest and the create/edit validator so the two can never disagree.
   *  Minecraft gets `dependencies` (+ optional `worlds`); a non-MC game gets its
   *  own spec block. `initialFiles` is game-agnostic. Anything absent is omitted
   *  so a minecraft manifest stays byte-identical to the pre-multi-game shape. */
  private versionGameFields(
    gameType: GameType,
    v: {
      minecraft?: string | null;
      loader?: string | null;
      loaderVersion?: string | null;
      worlds?: unknown[] | null;
      emulator?: unknown;
      zomboid?: unknown;
      stardew?: unknown;
      initialFiles?: unknown[] | null;
    },
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (gameType === 'minecraft') {
      out.dependencies = {
        minecraft: v.minecraft,
        ...(v.loader && v.loaderVersion ? { [v.loader]: v.loaderVersion } : {}),
      };
      if (v.worlds && v.worlds.length > 0) out.worlds = v.worlds;
    } else {
      const spec = v[gameType];
      if (spec !== undefined && spec !== null) out[gameType] = spec;
    }
    if (v.initialFiles && v.initialFiles.length > 0)
      out.initialFiles = v.initialFiles;
    return out;
  }

  /**
   * The manifest a launcher installs from. This is the gate: entitlement is
   * re-checked here rather than trusted from the listing, because the listing
   * and the download are separate requests and access can be revoked between
   * them (§7.4 — revocation is the whole point).
   *
   * `capabilities` is the parsed X-Boff-Game-Types set. A pack whose game type
   * the caller cannot parse returns 409 (not 404): the pack exists, the client
   * is what is lacking, so the launcher can surface "update to play this". This
   * closes the side-door a shared id / redeemed invite would otherwise open.
   */
  async manifestFor(
    principal: PackPrincipal,
    packId: string,
    password: string | null,
    capabilities: string[],
  ): Promise<unknown> {
    const pack = await this.repo.findById(packId);
    if (!pack || pack.archived)
      throw new NotFoundException('Pack no encontrado');

    const gameType = this.resolveGameType(pack.gameType);
    if (!capabilities.includes(gameType)) {
      throw new ConflictException({
        error: 'needs_newer_launcher',
        gameType,
        message: 'Este pack necesita una versión más reciente del launcher',
      });
    }

    await this.assertAccess(
      pack.id,
      pack.accessKind,
      pack.passwordHash,
      principal,
      password,
    );

    if (!pack.latestVersionId) {
      throw new NotFoundException(
        'Este pack todavía no tiene ninguna versión publicada',
      );
    }
    const version = await this.repo.findVersion(pack.latestVersionId);
    if (!version || !version.published) {
      throw new NotFoundException(
        'Este pack todavía no tiene ninguna versión publicada',
      );
    }

    await this.repo.audit(
      AUDIT.MANIFEST_SERVED,
      pack.id,
      principal.mcUuid ?? null,
      { versionId: version.id },
      principal.userId ?? null,
    );

    // Any attached non-draft config injects, regardless of event lifecycle
    // status: a normal active→completed flip must not leave the pack
    // installable with no anti-cheat gate. Minting (elsewhere) still requires
    // an active event; injection is only the gate.
    const linked = await this.randomizerLink.findByPackId(pack.id, {
      anyEventStatus: true,
    });
    const randomizerConfig = linked && linked.status !== 'draft' ? linked : null;

    // Belt-and-braces for the clean-ROM invariant: if the version's declared
    // ROM hash disagrees with the config's pinned clean hash, the launcher's
    // gate would disarm on first install. Refuse to serve rather than ship an
    // unprotected pack.
    if (randomizerConfig) {
      const romPath = (version.emulator as { rom?: unknown } | null)?.rom;
      if (typeof romPath === 'string' && romPath) {
        const norm = (p: string) => p.toLowerCase().replace(/\\/g, '/');
        const romEntry = (version.files as StoredPackFile[]).find(
          (f) => norm(f.path) === norm(romPath),
        );
        if (
          !romEntry ||
          romEntry.sha512.toLowerCase() !==
            randomizerConfig.cleanRomSha512.toLowerCase()
        ) {
          this.logger.error(
            `Pack ${pack.id} version ${version.id}: emulator.rom hash ${romEntry?.sha512 ?? 'MISSING'} does not match randomizer config ${randomizerConfig.id} cleanRomSha512 ${randomizerConfig.cleanRomSha512} — refusing to serve an unprotected manifest`,
          );
          throw new ConflictException({
            error: 'randomizer_rom_mismatch',
            message:
              'La ROM de la versión publicada no coincide con la ROM limpia fijada por el randomizer del evento. Un administrador debe corregir la versión del pack o la configuración del randomizer.',
          });
        }
      }
    }

    // Built to the shape @boffmedia/pack-schema defines and validated with it
    // before leaving the server: the launcher parses these exact bytes with the
    // Rust types generated from the same schema, so a malformed manifest must
    // fail here, where it is debuggable, not there.
    const manifest: any = {
      formatVersion: 1 as const,
      pack: {
        id: pack.id,
        slug: pack.slug,
        // Omitted for minecraft (absent = minecraft) so a MC manifest is
        // byte-identical to the pre-multi-game shape; present for non-MC.
        ...(gameType !== 'minecraft' ? { gameType } : {}),
        name: pack.name,
        ...(pack.summary ? { summary: pack.summary } : {}),
        ...(pack.description ? { description: pack.description } : {}),
        ...(pack.iconUrl ? { iconUrl: pack.iconUrl } : {}),
        ...(pack.gallery ? { gallery: pack.gallery } : {}),
        // Carried into the manifest too, so the installed pack can Quick Play
        // into the server offline (the listing is not consulted at launch).
        // Minecraft-only: a legacy non-MC row with a stored server must never
        // ship a Quick Play target. Only when it has a host: a legacy `{}` must
        // not fail PackManifest validation and block the whole install.
        ...(gameType === 'minecraft' && pack.server?.host
          ? { server: pack.server }
          : {}),
        access: this.accessPayload(pack.accessKind),
        latestVersionId: version.id,
      },
      version: {
        id: version.id,
        name: version.name,
        createdAt: version.createdAt.toISOString(),
        files: version.files,
        ...this.versionGameFields(gameType, version),
      },
      // Injected at serve time (never stored in manifests); pack-level linkage.
      ...(randomizerConfig
        ? {
            randomizer: {
              eventId: randomizerConfig.eventId,
              cleanRomSha512: randomizerConfig.cleanRomSha512,
            },
          }
        : {}),
    };

    const parsed = PackManifest.safeParse(manifest);
    if (!parsed.success) {
      // A stored version that no longer satisfies the schema is a server bug,
      // not a client one — say so rather than returning a 400.
      throw new BadRequestException(
        `El manifiesto almacenado no es válido: ${parsed.error.issues[0]?.message ?? 'desconocido'}`,
      );
    }
    return parsed.data;
  }

  /**
   * The file-level gate behind every download route.
   *
   * Re-checks entitlement exactly like `manifestFor` does — the manifest and the
   * download are separate requests and access can be revoked between them — and
   * then requires the requested file to actually BE in that pack's published
   * version. Without the second half the CurseForge proxy would be an open relay
   * for our API key: anyone with a launcher session could name any projectId and
   * make us fetch it.
   */
  async entitledFile(
    principal: PackPrincipal,
    packId: string,
    password: string | null,
    match: (file: StoredPackFile) => boolean,
    opts?: { includeWorlds?: boolean },
  ): Promise<StoredPackFile> {
    const pack = await this.repo.findById(packId);
    if (!pack || pack.archived)
      throw new NotFoundException('Pack no encontrado');

    await this.assertAccess(
      pack.id,
      pack.accessKind,
      pack.passwordHash,
      principal,
      password,
    );

    const version = pack.latestVersionId
      ? await this.repo.findVersion(pack.latestVersionId)
      : null;
    if (!version || !version.published) {
      throw new NotFoundException(
        'Este pack todavía no tiene ninguna versión publicada',
      );
    }

    // `initialFiles` ship override/url sources through the SAME download route
    // as `files` — matching only files[] made every emulator starting save
    // silently 404 at install.
    const candidates: StoredPackFile[] = [
      ...(version.files as StoredPackFile[]),
      ...((version.initialFiles ?? []) as StoredPackFile[]),
    ];
    let file = candidates.find(match);

    // Bundled worlds also ride the override route. Only that route opts in, so
    // the CurseForge proxy stays pinned to files[] and cannot become a relay.
    if (!file && opts?.includeWorlds) {
      const world = (
        (version.worlds ?? []) as {
          folder: string;
          sha512: string;
          sizeBytes: number;
          source: StoredPackFile['source'];
        }[]
      )
        .map(
          (w): StoredPackFile => ({
            path: w.folder,
            sha512: w.sha512,
            fileSize: w.sizeBytes,
            source: w.source,
          }),
        )
        .find(match);
      file = world;
    }

    if (!file) {
      throw new NotFoundException(
        'Ese archivo no pertenece a esta versión del pack',
      );
    }

    await this.repo.audit(
      AUDIT.FILE_SERVED,
      pack.id,
      principal.mcUuid ?? null,
      { versionId: version.id, path: file.path, source: file.source.kind },
      principal.userId ?? null,
    );
    return file;
  }

  async redeemInvite(
    principal: LauncherPrincipal,
    code: string,
  ): Promise<{ packId: string }> {
    const invite = await this.repo.findInvite(code);
    if (!invite) throw new NotFoundException('Código de invitación no válido');

    // Idempotent: a re-redemption (double click, retry) must not burn a second
    // use for an entitlement the account already holds.
    const grants = (await this.repo.listGrants(invite.packId)) ?? [];
    if (grants.some((g) => g.userId === principal.userId)) {
      return { packId: invite.packId };
    }

    const consumed = await this.repo.consumeInvite(code);
    if (!consumed) {
      throw new ForbiddenException('Este código ya no se puede usar');
    }

    await this.repo.grantToUser(
      invite.packId,
      principal.userId,
      'invite',
      code,
      null,
    );
    await this.repo.audit(
      AUDIT.INVITE_REDEEMED,
      invite.packId,
      principal.mcUuid ?? null,
      { code, userId: principal.userId },
      principal.userId,
    );
    return { packId: invite.packId };
  }

  // ── Admin-facing ─────────────────────────────────────────────────────────

  private async toAdminView(pack: {
    id: string;
    slug: string;
    gameType: GameType | null;
    name: string;
    summary: string | null;
    iconUrl: string | null;
    description: string | null;
    gallery: unknown[] | null;
    server: StoredPackServer | null;
    accessKind: PackAccessKind;
    passwordHash: string | null;
    latestVersionId: string | null;
    archived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Promise<AdminPackView> {
    return {
      id: pack.id,
      slug: pack.slug,
      gameType: this.resolveGameType(pack.gameType),
      name: pack.name,
      summary: pack.summary,
      iconUrl: pack.iconUrl,
      ...(pack.description ? { description: pack.description } : {}),
      ...(pack.gallery ? { gallery: pack.gallery as never } : {}),
      accessKind: pack.accessKind,
      ...(pack.server ? { server: pack.server } : {}),
      archived: pack.archived,
      hasPassword: !!pack.passwordHash,
      aclCount: await this.repo.countAcl(pack.id),
      versionCount: await this.repo.countVersions(pack.id),
      latestVersionId: pack.latestVersionId,
      createdAt: pack.createdAt.toISOString(),
      updatedAt: pack.updatedAt.toISOString(),
    };
  }

  async listForAdmin(includeArchived: boolean): Promise<AdminPackView[]> {
    const rows = await this.repo.listAll(includeArchived);
    return Promise.all(rows.map((pack) => this.toAdminView(pack)));
  }

  /** The full pack for the admin detail/edit view — the list view alone left
   *  `description`/`gallery` write-only. */
  async adminPack(id: string): Promise<AdminPackView> {
    const pack = await this.repo.findById(id);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    return this.toAdminView(pack);
  }

  /** A server pack must have a host; anything hostless (including a stray `{}`)
   *  stores as null — a client pack — so a malformed row is never created here.
   *  The port is left OUT when the admin gives none: a bare host is an SRV host,
   *  and Minecraft (join) and the launcher's own SRV lookup (status ping) find
   *  the real port. Only a port the admin actually typed is stored. */
  private normalizeServer(
    server?: { host?: string; port?: number | null } | null,
  ): { host: string; port?: number } | null {
    if (!server?.host) return null;
    return server.port != null
      ? { host: server.host, port: server.port }
      : { host: server.host };
  }

  async createPack(
    dto: CreatePackDto,
    actorId: number | null,
  ): Promise<{ id: string }> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing)
      throw new BadRequestException('Ya existe un pack con ese slug');

    // Password packs are deprecated: the write path is closed while existing
    // rows stay readable (listVisibleTo/assertAccess still honour them). New
    // private packs use invites/grants instead.
    if (dto.accessKind === 'password') {
      throw new ConflictException(
        'Los packs con contraseña están obsoletos; usa invitaciones o concede acceso por cuenta',
      );
    }

    const id = this.newId();
    // NULL = minecraft (zero-backfill semantics): an explicit 'minecraft' is
    // normalized to NULL so the stored value matches every pre-multi-game row.
    const gameType =
      dto.gameType && dto.gameType !== 'minecraft'
        ? (dto.gameType as GameType)
        : null;
    // Quick Play targets are minecraft-only: an emulator/zomboid/stardew pack
    // that happens to send `server` gets it stripped, never persisted.
    const isMinecraft = this.resolveGameType(gameType) === 'minecraft';
    await this.repo.insertPack({
      id,
      slug: dto.slug,
      gameType,
      name: dto.name,
      summary: dto.summary ?? null,
      description: dto.description ?? null,
      iconUrl: dto.iconUrl ?? null,
      gallery: dto.gallery ?? null,
      server: isMinecraft ? this.normalizeServer(dto.server) : null,
      accessKind: dto.accessKind,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
    });
    await this.repo.audit(AUDIT.PACK_CREATED, id, null, {
      actorId,
      slug: dto.slug,
      gameType: this.resolveGameType(gameType),
    });
    return { id };
  }

  async updatePack(
    id: string,
    dto: UpdatePackDto,
    actorId: number | null,
  ): Promise<void> {
    const pack = await this.repo.findById(id);
    if (!pack) throw new NotFoundException('Pack no encontrado');

    // Password packs are deprecated: converting a pack TO password is rejected,
    // while an existing password pack can still be edited (read-compat).
    if (dto.accessKind === 'password') {
      throw new ConflictException(
        'Los packs con contraseña están obsoletos; usa invitaciones o concede acceso por cuenta',
      );
    }

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.summary !== undefined) patch.summary = dto.summary;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.gallery !== undefined) patch.gallery = dto.gallery;
    if (dto.iconUrl !== undefined) patch.iconUrl = dto.iconUrl;
    // `null` clears the server (back to a client pack); an object sets it.
    // gameType is immutable, so a non-minecraft pack never persists a server:
    // whatever the admin sends is stripped to null (Quick Play is MC-only).
    if (dto.server !== undefined)
      patch.server =
        this.resolveGameType(pack.gameType) === 'minecraft'
          ? this.normalizeServer(dto.server)
          : null;
    if (dto.archived !== undefined) patch.archived = dto.archived;
    if (dto.accessKind !== undefined) patch.accessKind = dto.accessKind;
    if (dto.password !== undefined) {
      // An explicit empty string clears the password; undefined leaves it alone.
      patch.passwordHash = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : null;
    }

    const targetAccess = dto.accessKind ?? pack.accessKind;
    const targetHash =
      dto.password !== undefined ? patch.passwordHash : pack.passwordHash;
    if (targetAccess === 'password' && !targetHash) {
      throw new BadRequestException(
        'Un pack con contraseña necesita una contraseña',
      );
    }

    if (Object.keys(patch).length === 0) return;
    await this.repo.updatePack(id, patch);
    await this.repo.audit(AUDIT.PACK_UPDATED, id, null, {
      actorId,
      fields: Object.keys(patch),
    });
    if (dto.archived === true && !pack.archived) {
      await this.repo.audit(AUDIT.PACK_ARCHIVED, id, null, { actorId });
    }
  }

  async listVersions(packId: string): Promise<PackVersionView[]> {
    const rows = await this.repo.listVersions(packId);
    return rows.map((v) => ({
      id: v.id,
      packId: v.packId,
      name: v.name,
      minecraft: v.minecraft,
      loader: v.loader,
      loaderVersion: v.loaderVersion,
      fileCount: v.files.length,
      worldCount: v.worlds?.length ?? 0,
      emulatorKind: this.emulatorKind(v.emulator),
      published: v.published,
      notes: v.notes,
      createdAt: v.createdAt.toISOString(),
    }));
  }

  /** A version WITH its files — what "clone" and "edit draft" both start from.
   *  The list endpoint deliberately omits `files`, which can be thousands of
   *  entries across a pack's history. */
  async versionDetail(
    packId: string,
    versionId: string,
  ): Promise<
    PackVersionView & {
      files: unknown[];
      worlds?: unknown[];
      emulator?: unknown;
      zomboid?: unknown;
      stardew?: unknown;
      initialFiles?: unknown[];
    }
  > {
    const version = await this.repo.findVersion(versionId);
    if (!version || version.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    return {
      id: version.id,
      packId: version.packId,
      name: version.name,
      minecraft: version.minecraft,
      loader: version.loader,
      loaderVersion: version.loaderVersion,
      fileCount: version.files.length,
      worldCount: version.worlds?.length ?? 0,
      emulatorKind: this.emulatorKind(version.emulator),
      published: version.published,
      notes: version.notes,
      createdAt: version.createdAt.toISOString(),
      files: version.files,
      ...(version.worlds ? { worlds: version.worlds } : {}),
      ...(version.emulator ? { emulator: version.emulator } : {}),
      ...(version.zomboid ? { zomboid: version.zomboid } : {}),
      ...(version.stardew ? { stardew: version.stardew } : {}),
      ...(version.initialFiles ? { initialFiles: version.initialFiles } : {}),
    };
  }

  /** Editing is draft-only. A published version is what launchers have already
   *  installed from: changing its files under them would leave every existing
   *  install disagreeing with the manifest it verified against. */
  async updateVersion(
    packId: string,
    versionId: string,
    dto: CreatePackVersionDto,
    actorId: number | null,
  ): Promise<void> {
    const existing = await this.repo.findVersion(versionId);
    if (!existing || existing.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    if (existing.published) {
      throw new BadRequestException(
        'Una versión publicada no se puede editar; crea una nueva a partir de ella',
      );
    }
    const parsed = this.parseManifest(
      await this.requirePack(packId),
      versionId,
      dto,
    );
    const pv = parsed.version as any;
    await this.repo.updateVersion(versionId, {
      name: dto.name,
      minecraft: dto.minecraft ?? null,
      loader: (dto.loader as PackLoader) ?? null,
      loaderVersion: dto.loaderVersion ?? null,
      files: parsed.version.files,
      worlds: pv.worlds ?? null,
      emulator: pv.emulator ?? null,
      zomboid: pv.zomboid ?? null,
      stardew: pv.stardew ?? null,
      initialFiles: pv.initialFiles ?? null,
      notes: dto.notes ?? null,
    });
    await this.repo.audit(AUDIT.VERSION_UPDATED, packId, null, {
      actorId,
      versionId,
    });
  }

  async deleteVersion(
    packId: string,
    versionId: string,
    actorId: number | null,
  ): Promise<void> {
    const existing = await this.repo.findVersion(versionId);
    if (!existing || existing.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    if (existing.published) {
      throw new BadRequestException('Una versión publicada no se puede borrar');
    }
    await this.repo.deleteVersion(versionId);
    await this.repo.audit(AUDIT.VERSION_DELETED, packId, null, {
      actorId,
      versionId,
    });
  }

  private async requirePack(packId: string) {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    return pack;
  }

  /** Create and edit share this: both must reject exactly what the launcher
   *  would refuse to parse, and by construction they cannot drift. Branches on
   *  the pack's game type (immutable, set at creation) so a non-MC version is
   *  validated against its own spec block — a mismatch fails here as a 400, never
   *  on a player's machine. */
  private parseManifest(
    pack: {
      id: string;
      slug: string;
      name: string;
      accessKind: PackAccessKind;
      gameType?: GameType | null;
    },
    versionId: string,
    dto: CreatePackVersionDto,
  ) {
    const gameType = this.resolveGameType(pack.gameType);
    const candidate = {
      formatVersion: 1 as const,
      pack: {
        id: pack.id,
        slug: pack.slug,
        ...(gameType !== 'minecraft' ? { gameType } : {}),
        name: pack.name,
        access: this.accessPayload(pack.accessKind),
      },
      version: {
        id: versionId,
        name: dto.name,
        createdAt: new Date().toISOString(),
        files: dto.files,
        ...this.versionGameFields(gameType, {
          minecraft: dto.minecraft,
          loader: dto.loader,
          loaderVersion: dto.loaderVersion,
          worlds: dto.worlds,
          emulator: dto.emulator,
          zomboid: dto.zomboid,
          stardew: dto.stardew,
          initialFiles: dto.initialFiles,
        }),
      },
    };
    const parsed = PackManifest.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new BadRequestException(
        `Manifiesto no válido en ${issue?.path.join('.') || 'raíz'}: ${issue?.message}`,
      );
    }
    return parsed.data;
  }

  /**
   * Creating a version validates the whole manifest through the SAME zod schema
   * the launcher generates its Rust types from. A version that would not parse
   * on the client cannot be stored — that is the entire point of pack-schema.
   */
  async createVersion(
    packId: string,
    dto: CreatePackVersionDto,
    actorId: number | null,
  ): Promise<{ id: string }> {
    const pack = await this.requirePack(packId);
    const id = this.newId();
    const parsed = this.parseManifest(pack, id, dto);
    const pv = parsed.version as any;

    await this.repo.insertVersion({
      id,
      packId,
      name: dto.name,
      minecraft: dto.minecraft ?? null,
      loader: (dto.loader as PackLoader) ?? null,
      loaderVersion: dto.loaderVersion ?? null,
      files: parsed.version.files,
      worlds: pv.worlds ?? null,
      emulator: pv.emulator ?? null,
      zomboid: pv.zomboid ?? null,
      stardew: pv.stardew ?? null,
      initialFiles: pv.initialFiles ?? null,
      notes: dto.notes ?? null,
      published: false,
      createdBy: actorId,
    });
    await this.repo.audit(AUDIT.VERSION_CREATED, packId, null, {
      actorId,
      versionId: id,
    });
    return { id };
  }

  /** Publishing is what makes a version visible to launchers, and it is also
   *  what makes it the pack's `latestVersionId`. One transaction, so the two
   *  can never disagree. Moving `latestVersionId` to an OLDER version is a
   *  rollback and must be asked for explicitly, not the accident of publishing
   *  the wrong row. */
  async publishVersion(
    packId: string,
    versionId: string,
    actorId: number | null,
    allowRollback = false,
  ): Promise<void> {
    const version = await this.repo.findVersion(versionId);
    if (!version || version.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');

    let rollback = false;
    if (pack.latestVersionId && pack.latestVersionId !== versionId) {
      const current = await this.repo.findVersion(pack.latestVersionId);
      if (current && current.createdAt > version.createdAt) {
        if (!allowRollback) {
          throw new ConflictException({
            error: 'version_rollback',
            message:
              'Esa versión es anterior a la publicada actualmente; confirma el retroceso para publicarla',
          });
        }
        rollback = true;
      }
    }

    await this.repo.publishVersionAndSetLatest(packId, versionId);
    await this.repo.audit(AUDIT.VERSION_PUBLISHED, packId, null, {
      actorId,
      versionId,
      gameType: this.resolveGameType(pack.gameType),
      ...(rollback ? { rollback: true } : {}),
    });
  }

  /** All three answers to "who can install this": direct grants, legacy UUID
   *  pre-grants still waiting for an account, and the events whose membership
   *  derives access without any row of its own. */
  async listAccess(packId: string) {
    const [grants, legacy, events] = await Promise.all([
      this.repo.listGrants(packId),
      this.repo.listAcl(packId),
      this.repo.listGrantingEvents(packId),
    ]);
    return { grants, legacy, events };
  }

  async searchUsers(q: string) {
    return q.trim().length < 2 ? [] : this.repo.searchUsers(q.trim());
  }

  /** Grant to an ACCOUNT. This is the normal path. */
  async grantToUser(
    packId: string,
    userId: number,
    actorId: number | null,
  ): Promise<void> {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    await this.repo.grantToUser(packId, userId, 'admin', null, actorId);
    await this.repo.audit(AUDIT.ACCESS_GRANTED, packId, null, {
      actorId,
      userId,
    });
  }

  /** With `source`, revokes only that grant source (the admin UI lists one row
   *  per source); without it, every source at once. */
  async revokeFromUser(
    packId: string,
    userId: number,
    actorId: number | null,
    source?: 'admin' | 'invite',
  ): Promise<void> {
    if (source) {
      await this.repo.revokeSourceFromUser(packId, userId, source);
    } else {
      await this.repo.revokeFromUser(packId, userId);
    }
    await this.repo.audit(AUDIT.ACCESS_REVOKED, packId, null, {
      actorId,
      userId,
      ...(source ? { source } : {}),
    });
  }

  /**
   * Pre-grant to a raw Minecraft UUID. Kept for the one case accounts cannot
   * cover: granting to a player who has not registered yet. Becomes a real
   * grant when that UUID is linked (`claimLegacyGrants`).
   */
  async grant(
    packId: string,
    uuid: string,
    actorId: number | null,
  ): Promise<void> {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    await this.repo.grant(packId, uuid.toLowerCase(), actorId, null);
    await this.repo.audit(AUDIT.ACCESS_GRANTED, packId, uuid.toLowerCase(), {
      actorId,
    });
  }

  async revoke(
    packId: string,
    uuid: string,
    actorId: number | null,
  ): Promise<void> {
    await this.repo.revoke(packId, uuid.toLowerCase());
    await this.repo.audit(AUDIT.ACCESS_REVOKED, packId, uuid.toLowerCase(), {
      actorId,
    });
  }

  /** Called when a Minecraft account is linked: the moment a pre-grant finally
   *  has an account to belong to. */
  async claimLegacyGrants(userId: number, mcUuid: string): Promise<number> {
    return this.repo.claimLegacyGrants(userId, mcUuid.toLowerCase());
  }

  async createInvite(
    packId: string,
    maxUses: number,
    expiresAt: Date | null,
    actorId: number | null,
  ): Promise<{ code: string }> {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');

    const code = randomBytes(INVITE_BYTES).toString('hex');
    await this.repo.insertInvite({
      code,
      packId,
      createdBy: actorId,
      maxUses,
      expiresAt,
    });
    await this.repo.audit(AUDIT.INVITE_CREATED, packId, null, {
      actorId,
      code,
      maxUses,
    });
    return { code };
  }

  async listInvites(packId: string) {
    return this.repo.listInvites(packId);
  }

  async revokeInvite(code: string, actorId: number | null): Promise<void> {
    const invite = await this.repo.findInvite(code);
    if (!invite) throw new NotFoundException('Código de invitación no válido');
    await this.repo.revokeInvite(code);
    await this.repo.audit(AUDIT.INVITE_REVOKED, invite.packId, null, {
      actorId,
      code,
    });
  }

  async listAudit(packId: string, limit: number) {
    return this.repo.listAudit(packId, Math.min(Math.max(limit, 1), 200));
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private accessPayload(kind: string) {
    // The manifest never carries the allowlist itself: the launcher has no use
    // for other people's UUIDs, and shipping them would leak the membership of
    // every pack to everyone who can read one.
    if (kind === 'public') return { kind: 'public' as const };
    if (kind === 'password') return { kind: 'password' as const };
    return { kind: 'allowlist' as const, uuids: [] };
  }

  private async assertAccess(
    packId: string,
    accessKind: string,
    passwordHash: string | null,
    principal: PackPrincipal,
    password: string | null,
  ): Promise<void> {
    if (accessKind === 'public') return;

    if (accessKind === 'password') {
      if (!passwordHash)
        throw new ForbiddenException('Este pack no está configurado');
      if (!password || !(await bcrypt.compare(password, passwordHash))) {
        throw new ForbiddenException('Contraseña incorrecta');
      }
      return;
    }

    if (!(await this.repo.hasAccess(packId, principal))) {
      throw new ForbiddenException('Tu cuenta no tiene acceso a este pack');
    }
  }
}
