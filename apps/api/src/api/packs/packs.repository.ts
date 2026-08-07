import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  NewPackVersion,
  Pack,
  PackInvite,
  PackVersion,
  packAcl,
  packAudit,
  packInvites,
  packVersions,
  packs,
} from '@/_db/schema/Packs';
import type { AuditAction } from './types/packs.types';

@Injectable()
export class PacksRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  // ── Packs ────────────────────────────────────────────────────────────────

  /**
   * MariaDB implements JSON as a LONGTEXT alias, so mysql2 hands `gallery` back
   * as a raw string instead of the array `json()` types it (the same trap that
   * bites `pack_versions.files`). Parse it on every read so nothing downstream —
   * the launcher's serde, `PackManifest.safeParse` — ever sees a string where it
   * expects `{ url, alt }[]`.
   */
  private hydratePack<T extends { gallery?: unknown; server?: unknown }>(row: T): T {
    let out = row;
    if (typeof out.gallery === 'string') {
      out = { ...out, gallery: JSON.parse(out.gallery) as unknown[] };
    }
    // Same MariaDB-returns-json-as-string trap as gallery: without this the
    // manifest and the launcher listing carry `server` as a raw string, and
    // PackManifest.safeParse rejects it as "expected object, received string".
    if (typeof out.server === 'string') {
      out = { ...out, server: JSON.parse(out.server) as unknown };
    }
    return out;
  }

  async findById(id: string): Promise<Pack | null> {
    const [row] = await this.db.select().from(packs).where(eq(packs.id, id)).limit(1);
    return row ? this.hydratePack(row) : null;
  }

  async findBySlug(slug: string): Promise<Pack | null> {
    const [row] = await this.db.select().from(packs).where(eq(packs.slug, slug)).limit(1);
    return row ? this.hydratePack(row) : null;
  }

  async listAll(includeArchived: boolean): Promise<Pack[]> {
    const q = this.db.select().from(packs);
    const rows = includeArchived
      ? await q.orderBy(desc(packs.createdAt))
      : await q.where(eq(packs.archived, false)).orderBy(desc(packs.createdAt));
    return rows.map((row) => this.hydratePack(row));
  }

  /**
   * Packs this UUID may see: public ones, password ones (the gate is on the
   * manifest, not the listing), and allowlist ones where a grant exists.
   * Access filtering lives HERE rather than in the service so there is exactly
   * one query that can leak a pack, and it is this one.
   */
  async listVisibleTo(uuid: string): Promise<Pack[]> {
    const rows = await this.db
      .select({
        id: packs.id,
        slug: packs.slug,
        gameType: packs.gameType,
        name: packs.name,
        summary: packs.summary,
        description: packs.description,
        iconUrl: packs.iconUrl,
        gallery: packs.gallery,
        server: packs.server,
        accessKind: packs.accessKind,
        passwordHash: packs.passwordHash,
        latestVersionId: packs.latestVersionId,
        archived: packs.archived,
        createdAt: packs.createdAt,
        updatedAt: packs.updatedAt,
      })
      .from(packs)
      .leftJoin(packAcl, and(eq(packAcl.packId, packs.id), eq(packAcl.uuid, uuid)))
      .where(
        and(
          eq(packs.archived, false),
          or(
            inArray(packs.accessKind, ['public', 'password']),
            sql`${packAcl.uuid} is not null`,
          ),
        ),
      )
      .orderBy(desc(packs.createdAt));
    return rows.map((row) => this.hydratePack(row));
  }

  async insertPack(row: typeof packs.$inferInsert): Promise<void> {
    await this.db.insert(packs).values(row);
  }

  async updatePack(id: string, patch: Partial<typeof packs.$inferInsert>): Promise<void> {
    await this.db.update(packs).set(patch).where(eq(packs.id, id));
  }

  // ── Versions ─────────────────────────────────────────────────────────────

  /**
   * MariaDB implements JSON as a LONGTEXT alias, so mysql2 hands fields back as
   * raw strings instead of the arrays/objects `json()` types them. Every read goes
   * through here so the service can trust the declared types: without it the
   * manifest fails its own schema validation with "expected array, received
   * string" on perfectly good rows.
   */
  private hydrate(row: PackVersion): PackVersion {
    const hydrated: PackVersion = { ...row };
    if (typeof hydrated.files === 'string') {
      hydrated.files = JSON.parse(hydrated.files) as unknown[];
    }
    if (typeof hydrated.worlds === 'string') {
      hydrated.worlds = JSON.parse(hydrated.worlds) as unknown[];
    }
    // Same MariaDB-returns-json-as-string trap as files/worlds, for the
    // per-game spec blocks and first-install-only files.
    if (typeof hydrated.emulator === 'string') {
      hydrated.emulator = JSON.parse(hydrated.emulator) as Record<string, unknown>;
    }
    if (typeof hydrated.zomboid === 'string') {
      hydrated.zomboid = JSON.parse(hydrated.zomboid) as Record<string, unknown>;
    }
    if (typeof hydrated.stardew === 'string') {
      hydrated.stardew = JSON.parse(hydrated.stardew) as Record<string, unknown>;
    }
    if (typeof hydrated.initialFiles === 'string') {
      hydrated.initialFiles = JSON.parse(hydrated.initialFiles) as unknown[];
    }
    return hydrated;
  }

  async findVersion(id: string): Promise<PackVersion | null> {
    const [row] = await this.db
      .select()
      .from(packVersions)
      .where(eq(packVersions.id, id))
      .limit(1);
    return row ? this.hydrate(row) : null;
  }

  async listVersions(packId: string): Promise<PackVersion[]> {
    const rows = await this.db
      .select()
      .from(packVersions)
      .where(eq(packVersions.packId, packId))
      .orderBy(desc(packVersions.createdAt));
    return rows.map((row) => this.hydrate(row));
  }

  async insertVersion(row: NewPackVersion): Promise<void> {
    await this.db.insert(packVersions).values(row);
  }

  async updateVersion(id: string, patch: Partial<NewPackVersion>): Promise<void> {
    await this.db.update(packVersions).set(patch).where(eq(packVersions.id, id));
  }

  async deleteVersion(id: string): Promise<void> {
    await this.db.delete(packVersions).where(eq(packVersions.id, id));
  }

  async publishVersion(id: string): Promise<void> {
    await this.db
      .update(packVersions)
      .set({ published: true })
      .where(eq(packVersions.id, id));
  }

  async countVersions(packId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(packVersions)
      .where(eq(packVersions.packId, packId));
    return Number(row?.n ?? 0);
  }

  // ── ACL ──────────────────────────────────────────────────────────────────

  async hasAccess(packId: string, uuid: string): Promise<boolean> {
    const [row] = await this.db
      .select({ uuid: packAcl.uuid })
      .from(packAcl)
      .where(and(eq(packAcl.packId, packId), eq(packAcl.uuid, uuid)))
      .limit(1);
    return !!row;
  }

  async listAcl(packId: string): Promise<{ uuid: string; grantedAt: Date }[]> {
    return this.db
      .select({ uuid: packAcl.uuid, grantedAt: packAcl.grantedAt })
      .from(packAcl)
      .where(eq(packAcl.packId, packId))
      .orderBy(desc(packAcl.grantedAt));
  }

  async countAcl(packId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(packAcl)
      .where(eq(packAcl.packId, packId));
    return Number(row?.n ?? 0);
  }

  /** Idempotent: re-granting an existing entitlement must not 500. */
  async grant(
    packId: string,
    uuid: string,
    grantedBy: number | null,
    viaInvite: string | null,
  ): Promise<void> {
    await this.db
      .insert(packAcl)
      .values({ packId, uuid, grantedBy, viaInvite })
      .onDuplicateKeyUpdate({ set: { grantedAt: sql`CURRENT_TIMESTAMP()` } });
  }

  async revoke(packId: string, uuid: string): Promise<void> {
    await this.db
      .delete(packAcl)
      .where(and(eq(packAcl.packId, packId), eq(packAcl.uuid, uuid)));
  }

  // ── Invites ──────────────────────────────────────────────────────────────

  async findInvite(code: string): Promise<PackInvite | null> {
    const [row] = await this.db
      .select()
      .from(packInvites)
      .where(eq(packInvites.code, code))
      .limit(1);
    return row ?? null;
  }

  async insertInvite(row: typeof packInvites.$inferInsert): Promise<void> {
    await this.db.insert(packInvites).values(row);
  }

  async listInvites(packId: string): Promise<PackInvite[]> {
    return this.db
      .select()
      .from(packInvites)
      .where(eq(packInvites.packId, packId))
      .orderBy(desc(packInvites.createdAt));
  }

  /**
   * Atomically consume one use. The WHERE carries the limit checks, so two
   * launchers redeeming the last use of a code cannot both win — a read-then-
   * write in the service would let them.
   */
  async consumeInvite(code: string): Promise<boolean> {
    const [res] = await this.db
      .update(packInvites)
      .set({ uses: sql`${packInvites.uses} + 1` })
      .where(
        and(
          eq(packInvites.code, code),
          eq(packInvites.revoked, false),
          sql`${packInvites.uses} < ${packInvites.maxUses}`,
          or(isNull(packInvites.expiresAt), sql`${packInvites.expiresAt} > CURRENT_TIMESTAMP()`),
        ),
      );
    // 0 rows means one of the guards in the WHERE rejected it — expired,
    // revoked, or exhausted. The caller cannot tell which, deliberately.
    return res.affectedRows > 0;
  }

  async revokeInvite(code: string): Promise<void> {
    await this.db.update(packInvites).set({ revoked: true }).where(eq(packInvites.code, code));
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  async audit(
    action: AuditAction,
    packId: string | null,
    uuid: string | null,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await this.db.insert(packAudit).values({ action, packId, uuid, meta: meta ?? null });
  }

  async listAudit(packId: string, limit: number) {
    return this.db
      .select()
      .from(packAudit)
      .where(eq(packAudit.packId, packId))
      .orderBy(desc(packAudit.at))
      .limit(limit);
  }
}
