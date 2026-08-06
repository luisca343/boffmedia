import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PackManifest } from '@boffmedia/pack-schema';
import { PacksRepository } from './packs.repository';
import type { PackAccessKind, PackLoader } from '@/_db/schema/Packs';
import {
  AUDIT,
  AdminPackView,
  LauncherPackView,
  PackVersionView,
  StoredPackFile,
} from './types/packs.types';
import { CreatePackDto, CreateVersionDto, UpdatePackDto } from './dto/packs.dto';

const ID_BYTES = 12;
const INVITE_BYTES = 8;

@Injectable()
export class PacksService {
  constructor(private readonly repo: PacksRepository) {}

  private newId(): string {
    return randomBytes(ID_BYTES).toString('hex');
  }

  // ── Launcher-facing ──────────────────────────────────────────────────────

  /** Packs this UUID may see. The filtering is a single repository query so
   *  there is exactly one place that can leak a pack. */
  async listForLauncher(uuid: string): Promise<LauncherPackView[]> {
    const rows = await this.repo.listVisibleTo(uuid);

    return Promise.all(
      rows.map(async (pack) => {
        const version = pack.latestVersionId
          ? await this.repo.findVersion(pack.latestVersionId)
          : null;

        return {
          id: pack.id,
          slug: pack.slug,
          name: pack.name,
          summary: pack.summary,
          iconUrl: pack.iconUrl,
          ...(pack.description ? { description: pack.description } : {}),
          ...(pack.gallery ? { gallery: pack.gallery as any } : {}),
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
                  createdAt: version.createdAt.toISOString(),
                }
              : null,
        };
      }),
    );
  }

  /**
   * The manifest a launcher installs from. This is the gate: entitlement is
   * re-checked here rather than trusted from the listing, because the listing
   * and the download are separate requests and access can be revoked between
   * them (§7.4 — revocation is the whole point).
   */
  async manifestFor(
    uuid: string,
    packId: string,
    password: string | null,
  ): Promise<unknown> {
    const pack = await this.repo.findById(packId);
    if (!pack || pack.archived) throw new NotFoundException('Pack no encontrado');

    await this.assertAccess(pack.id, pack.accessKind, pack.passwordHash, uuid, password);

    if (!pack.latestVersionId) {
      throw new NotFoundException('Este pack todavía no tiene ninguna versión publicada');
    }
    const version = await this.repo.findVersion(pack.latestVersionId);
    if (!version || !version.published) {
      throw new NotFoundException('Este pack todavía no tiene ninguna versión publicada');
    }

    await this.repo.audit(AUDIT.MANIFEST_SERVED, pack.id, uuid, {
      versionId: version.id,
    });

    // Built to the shape @boffmedia/pack-schema defines and validated with it
    // before leaving the server: the launcher parses these exact bytes with the
    // Rust types generated from the same schema, so a malformed manifest must
    // fail here, where it is debuggable, not there.
    const manifest = {
      formatVersion: 1 as const,
      pack: {
        id: pack.id,
        slug: pack.slug,
        name: pack.name,
        ...(pack.summary ? { summary: pack.summary } : {}),
        ...(pack.description ? { description: pack.description } : {}),
        ...(pack.iconUrl ? { iconUrl: pack.iconUrl } : {}),
        ...(pack.gallery ? { gallery: pack.gallery } : {}),
        access: this.accessPayload(pack.accessKind),
        latestVersionId: version.id,
      },
      version: {
        id: version.id,
        name: version.name,
        createdAt: version.createdAt.toISOString(),
        dependencies: {
          minecraft: version.minecraft,
          ...(version.loader && version.loaderVersion
            ? { [version.loader]: version.loaderVersion }
            : {}),
        },
        files: version.files,
        ...(version.worlds && version.worlds.length > 0 ? { worlds: version.worlds } : {}),
      },
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
    uuid: string,
    packId: string,
    password: string | null,
    match: (file: StoredPackFile) => boolean,
  ): Promise<StoredPackFile> {
    const pack = await this.repo.findById(packId);
    if (!pack || pack.archived) throw new NotFoundException('Pack no encontrado');

    await this.assertAccess(pack.id, pack.accessKind, pack.passwordHash, uuid, password);

    const version = pack.latestVersionId
      ? await this.repo.findVersion(pack.latestVersionId)
      : null;
    if (!version || !version.published) {
      throw new NotFoundException('Este pack todavía no tiene ninguna versión publicada');
    }

    const file = (version.files as StoredPackFile[]).find(match);
    if (!file) {
      throw new NotFoundException('Ese archivo no pertenece a esta versión del pack');
    }

    await this.repo.audit(AUDIT.FILE_SERVED, pack.id, uuid, {
      versionId: version.id,
      path: file.path,
      source: file.source.kind,
    });
    return file;
  }

  async redeemInvite(uuid: string, code: string): Promise<{ packId: string }> {
    const invite = await this.repo.findInvite(code);
    if (!invite) throw new NotFoundException('Código de invitación no válido');

    const consumed = await this.repo.consumeInvite(code);
    if (!consumed) {
      throw new ForbiddenException('Este código ya no se puede usar');
    }

    await this.repo.grant(invite.packId, uuid, null, code);
    await this.repo.audit(AUDIT.INVITE_REDEEMED, invite.packId, uuid, { code });
    return { packId: invite.packId };
  }

  // ── Admin-facing ─────────────────────────────────────────────────────────

  async listForAdmin(includeArchived: boolean): Promise<AdminPackView[]> {
    const rows = await this.repo.listAll(includeArchived);
    return Promise.all(
      rows.map(async (pack) => ({
        id: pack.id,
        slug: pack.slug,
        name: pack.name,
        summary: pack.summary,
        iconUrl: pack.iconUrl,
        accessKind: pack.accessKind,
        archived: pack.archived,
        hasPassword: !!pack.passwordHash,
        aclCount: await this.repo.countAcl(pack.id),
        versionCount: await this.repo.countVersions(pack.id),
        latestVersionId: pack.latestVersionId,
        createdAt: pack.createdAt.toISOString(),
        updatedAt: pack.updatedAt.toISOString(),
      })),
    );
  }

  async createPack(dto: CreatePackDto, actorId: number | null): Promise<{ id: string }> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) throw new BadRequestException('Ya existe un pack con ese slug');

    if (dto.accessKind === 'password' && !dto.password) {
      throw new BadRequestException('Un pack con contraseña necesita una contraseña');
    }

    const id = this.newId();
    await this.repo.insertPack({
      id,
      slug: dto.slug,
      name: dto.name,
      summary: dto.summary ?? null,
      description: dto.description ?? null,
      iconUrl: dto.iconUrl ?? null,
      gallery: dto.gallery ?? null,
      accessKind: dto.accessKind,
      passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
    });
    await this.repo.audit(AUDIT.PACK_CREATED, id, null, { actorId, slug: dto.slug });
    return { id };
  }

  async updatePack(id: string, dto: UpdatePackDto, actorId: number | null): Promise<void> {
    const pack = await this.repo.findById(id);
    if (!pack) throw new NotFoundException('Pack no encontrado');

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.summary !== undefined) patch.summary = dto.summary;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.gallery !== undefined) patch.gallery = dto.gallery;
    if (dto.iconUrl !== undefined) patch.iconUrl = dto.iconUrl;
    if (dto.archived !== undefined) patch.archived = dto.archived;
    if (dto.accessKind !== undefined) patch.accessKind = dto.accessKind;
    if (dto.password !== undefined) {
      // An explicit empty string clears the password; undefined leaves it alone.
      patch.passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
    }

    const targetAccess = dto.accessKind ?? pack.accessKind;
    const targetHash =
      dto.password !== undefined ? patch.passwordHash : pack.passwordHash;
    if (targetAccess === 'password' && !targetHash) {
      throw new BadRequestException('Un pack con contraseña necesita una contraseña');
    }

    if (Object.keys(patch).length === 0) return;
    await this.repo.updatePack(id, patch);
    await this.repo.audit(AUDIT.PACK_UPDATED, id, null, { actorId, fields: Object.keys(patch) });
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
  ): Promise<PackVersionView & { files: unknown[]; worlds?: unknown[] }> {
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
      published: version.published,
      notes: version.notes,
      createdAt: version.createdAt.toISOString(),
      files: version.files,
      ...(version.worlds ? { worlds: version.worlds } : {}),
    };
  }

  /** Editing is draft-only. A published version is what launchers have already
   *  installed from: changing its files under them would leave every existing
   *  install disagreeing with the manifest it verified against. */
  async updateVersion(
    packId: string,
    versionId: string,
    dto: CreateVersionDto,
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
    const parsed = this.parseManifest(await this.requirePack(packId), versionId, dto);
    await this.repo.updateVersion(versionId, {
      name: dto.name,
      minecraft: dto.minecraft,
      loader: (dto.loader as PackLoader) ?? null,
      loaderVersion: dto.loaderVersion ?? null,
      files: parsed.version.files,
      worlds: (parsed.version as any).worlds ?? null,
      notes: dto.notes ?? null,
    });
    await this.repo.audit(AUDIT.VERSION_UPDATED, packId, null, { actorId, versionId });
  }

  async deleteVersion(packId: string, versionId: string, actorId: number | null): Promise<void> {
    const existing = await this.repo.findVersion(versionId);
    if (!existing || existing.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    if (existing.published) {
      throw new BadRequestException('Una versión publicada no se puede borrar');
    }
    await this.repo.deleteVersion(versionId);
    await this.repo.audit(AUDIT.VERSION_DELETED, packId, null, { actorId, versionId });
  }

  private async requirePack(packId: string) {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    return pack;
  }

  /** Create and edit share this: both must reject exactly what the launcher
   *  would refuse to parse, and by construction they cannot drift. */
  private parseManifest(
    pack: { id: string; slug: string; name: string; accessKind: PackAccessKind },
    versionId: string,
    dto: CreateVersionDto,
  ) {
    const candidate = {
      formatVersion: 1 as const,
      pack: {
        id: pack.id,
        slug: pack.slug,
        name: pack.name,
        access: this.accessPayload(pack.accessKind),
      },
      version: {
        id: versionId,
        name: dto.name,
        createdAt: new Date().toISOString(),
        dependencies: {
          minecraft: dto.minecraft,
          ...(dto.loader && dto.loaderVersion ? { [dto.loader]: dto.loaderVersion } : {}),
        },
        files: dto.files,
        ...(dto.worlds && dto.worlds.length > 0 ? { worlds: dto.worlds } : {}),
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
    dto: CreateVersionDto,
    actorId: number | null,
  ): Promise<{ id: string }> {
    const pack = await this.requirePack(packId);
    const id = this.newId();
    const parsed = this.parseManifest(pack, id, dto);

    await this.repo.insertVersion({
      id,
      packId,
      name: dto.name,
      minecraft: dto.minecraft,
      loader: (dto.loader as PackLoader) ?? null,
      loaderVersion: dto.loaderVersion ?? null,
      files: parsed.version.files,
      worlds: (parsed.version as any).worlds ?? null,
      notes: dto.notes ?? null,
      published: false,
    });
    await this.repo.audit(AUDIT.VERSION_CREATED, packId, null, { actorId, versionId: id });
    return { id };
  }

  /** Publishing is what makes a version visible to launchers, and it is also
   *  what makes it the pack's `latestVersionId`. One step, so the two can never
   *  disagree. */
  async publishVersion(packId: string, versionId: string, actorId: number | null): Promise<void> {
    const version = await this.repo.findVersion(versionId);
    if (!version || version.packId !== packId) {
      throw new NotFoundException('Versión no encontrada');
    }
    await this.repo.publishVersion(versionId);
    await this.repo.updatePack(packId, { latestVersionId: versionId });
    await this.repo.audit(AUDIT.VERSION_PUBLISHED, packId, null, { actorId, versionId });
  }

  async listAccess(packId: string) {
    return this.repo.listAcl(packId);
  }

  async grant(packId: string, uuid: string, actorId: number | null): Promise<void> {
    const pack = await this.repo.findById(packId);
    if (!pack) throw new NotFoundException('Pack no encontrado');
    await this.repo.grant(packId, uuid.toLowerCase(), actorId, null);
    await this.repo.audit(AUDIT.ACCESS_GRANTED, packId, uuid.toLowerCase(), { actorId });
  }

  async revoke(packId: string, uuid: string, actorId: number | null): Promise<void> {
    await this.repo.revoke(packId, uuid.toLowerCase());
    await this.repo.audit(AUDIT.ACCESS_REVOKED, packId, uuid.toLowerCase(), { actorId });
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
    await this.repo.insertInvite({ code, packId, createdBy: actorId, maxUses, expiresAt });
    await this.repo.audit(AUDIT.INVITE_CREATED, packId, null, { actorId, code, maxUses });
    return { code };
  }

  async listInvites(packId: string) {
    return this.repo.listInvites(packId);
  }

  async revokeInvite(code: string): Promise<void> {
    await this.repo.revokeInvite(code);
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
    uuid: string,
    password: string | null,
  ): Promise<void> {
    if (accessKind === 'public') return;

    if (accessKind === 'password') {
      if (!passwordHash) throw new ForbiddenException('Este pack no está configurado');
      if (!password || !(await bcrypt.compare(password, passwordHash))) {
        throw new ForbiddenException('Contraseña incorrecta');
      }
      return;
    }

    if (!(await this.repo.hasAccess(packId, uuid))) {
      throw new ForbiddenException('Tu cuenta no tiene acceso a este pack');
    }
  }
}
