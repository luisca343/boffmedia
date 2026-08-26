import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  NewPackVersion,
  Pack,
  PackInvite,
  PackVersion,
  packAcl,
  packAudit,
  packGrants,
  packInvites,
  packVersions,
  packs,
} from '@/_db/schema/Packs';
import {
  PARTICIPANT_STATUS,
  boffMediaEventParticipants,
  boffMediaEvents,
  boffMediaParticipants,
} from '@/_db/schema/BoffMediaEvents';
import {
  boffMediaRoles,
  boffMediaUserRoles,
  boffMediaUsers,
} from '@/_db/schema/BoffMedia';
import type { AuditAction } from './types/packs.types';

/**
 * Who is asking for a pack. The Boffmedia account is the real principal;
 * `mcUuid` is the legacy key that `pack_acl` rows and pre-grants are stored
 * under, and — until the launcher signs in with a Boffmedia account — the only
 * identity a launcher request carries.
 */
export interface PackPrincipal {
  userId?: number | null;
  mcUuid?: string | null;
}

@Injectable()
export class PacksRepository {
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database) {}

  /** The role names an account holds.
   *
   *  Read here rather than trusted from the token: a desktop session is minted
   *  once and lives for a long time, so a role embedded in it would keep working
   *  after the role was taken away. Publishing is the one desktop capability
   *  where that matters, which is why it is the one that pays for a join. */
  async rolesOf(userId: number): Promise<string[]> {
    const rows = await this.db
      .select({ name: boffMediaRoles.name })
      .from(boffMediaUserRoles)
      .innerJoin(
        boffMediaRoles,
        eq(boffMediaUserRoles.roleId, boffMediaRoles.id),
      )
      .where(eq(boffMediaUserRoles.userId, userId));
    return rows.map((r) => r.name);
  }

  /** Current launcher revocation counter, or null if the account is gone. Single
   *  keyed lookup — the guard runs this on every launcher request. */
  async getDesktopTokenVersion(userId: number): Promise<number | null> {
    const [row] = await this.db
      .select({ v: boffMediaUsers.desktopTokenVersion })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.id, userId))
      .limit(1);
    return row ? row.v : null;
  }

  async incrementLauncherTokenVersion(userId: number): Promise<void> {
    await this.db
      .update(boffMediaUsers)
      .set({
        desktopTokenVersion: sql`${boffMediaUsers.desktopTokenVersion} + 1`,
      })
      .where(eq(boffMediaUsers.id, userId));
  }

  // ── Packs ────────────────────────────────────────────────────────────────

  /**
   * MariaDB implements JSON as a LONGTEXT alias, so mysql2 hands `gallery` back
   * as a raw string instead of the array `json()` types it (the same trap that
   * bites `pack_versions.files`). Parse it on every read so nothing downstream —
   * the launcher's serde, `PackManifest.safeParse` — ever sees a string where it
   * expects `{ url, alt }[]`.
   */
  private hydratePack<T extends { gallery?: unknown; server?: unknown }>(
    row: T,
  ): T {
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
    const [row] = await this.db
      .select()
      .from(packs)
      .where(eq(packs.id, id))
      .limit(1);
    return row ? this.hydratePack(row) : null;
  }

  async findBySlug(slug: string): Promise<Pack | null> {
    const [row] = await this.db
      .select()
      .from(packs)
      .where(eq(packs.slug, slug))
      .limit(1);
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
   * Membership in an event that carries this pack, as a correlated EXISTS.
   *
   * Access is *derived* from membership rather than propagated into a grant
   * row on join: with no stored copy there is nothing to synchronise, so leave,
   * removal, pack swap, event deletion and visibility flips are all correct by
   * construction instead of by a job that has to remember them.
   *
   * `packIdRef` is either `packs.id` (correlated, for the listing) or a literal
   * pack id. Participants with no `user_id` are anonymous and derive nothing.
   */
  private eventMembershipExists(
    packIdRef: SQL | typeof packs.id,
    principal: PackPrincipal,
  ): SQL | null {
    const conditions = [
      eq(boffMediaEvents.packId, packIdRef as never),
      isNull(boffMediaEvents.deletedAt),
      inArray(boffMediaEventParticipants.status, [
        PARTICIPANT_STATUS.REGISTERED,
        PARTICIPANT_STATUS.CONFIRMED,
      ]),
    ];

    let query = this.db
      .select({ one: sql`1` })
      .from(boffMediaEventParticipants)
      .innerJoin(
        boffMediaEvents,
        eq(boffMediaEvents.id, boffMediaEventParticipants.eventId),
      )
      .innerJoin(
        boffMediaParticipants,
        eq(boffMediaParticipants.id, boffMediaEventParticipants.participantId),
      )
      .$dynamic();

    if (principal.userId != null) {
      conditions.push(eq(boffMediaParticipants.userId, principal.userId));
    } else if (principal.mcUuid) {
      // The launcher authenticates as a Minecraft UUID, so membership is
      // reached through the account that UUID is linked to. This join goes away
      // the day the launcher carries a user id directly.
      query = query.innerJoin(
        boffMediaUsers,
        eq(boffMediaUsers.id, boffMediaParticipants.userId),
      );
      conditions.push(eq(boffMediaUsers.uuid, principal.mcUuid));
    } else {
      return null;
    }

    return sql`exists ${query.where(and(...conditions))}`;
  }

  /**
   * Packs this principal may see. Three independent sources, unioned:
   * public/password packs (the password gate is on the manifest, not the
   * listing), a direct ACL grant, and live membership in an event carrying the
   * pack. Access filtering lives HERE rather than in the service so there is
   * exactly one query that can leak a pack, and it is this one.
   */
  async listVisibleTo(principal: PackPrincipal): Promise<Pack[]> {
    const sources = [inArray(packs.accessKind, ['public', 'password'])];

    // Each non-public source is a correlated EXISTS, never a join: a user with
    // both an `admin` and an `invite` grant, or with a grant and an ACL row, must
    // still yield exactly one pack row. A left-join on the (pack_id, user_id,
    // source) PK fans out and lists the pack once per matching grant.
    if (principal.userId != null) {
      const grantExists = this.db
        .select({ one: sql`1` })
        .from(packGrants)
        .where(
          and(
            eq(packGrants.packId, packs.id),
            eq(packGrants.userId, principal.userId),
          ),
        );
      sources.push(sql`exists ${grantExists}`);
    }

    // Legacy pre-grants: a UUID an admin granted before that player registered.
    // When the principal is an account, correlate against the uuid CURRENTLY
    // linked to it — the token's mcUuid claim lives 30 days and goes stale on
    // unlink/relink. The raw-claim path survives only for pre-cutover
    // principals that carry no userId.
    if (principal.userId != null) {
      const aclExists = this.db
        .select({ one: sql`1` })
        .from(packAcl)
        .innerJoin(boffMediaUsers, eq(boffMediaUsers.uuid, packAcl.uuid))
        .where(
          and(
            eq(packAcl.packId, packs.id),
            eq(boffMediaUsers.id, principal.userId),
            isNull(boffMediaUsers.deletedAt),
          ),
        );
      sources.push(sql`exists ${aclExists}`);
    } else if (principal.mcUuid) {
      const aclExists = this.db
        .select({ one: sql`1` })
        .from(packAcl)
        .where(
          and(eq(packAcl.packId, packs.id), eq(packAcl.uuid, principal.mcUuid)),
        );
      sources.push(sql`exists ${aclExists}`);
    }

    const membership = this.eventMembershipExists(packs.id, principal);
    if (membership) sources.push(membership);

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
      .where(and(eq(packs.archived, false), or(...sources)))
      .orderBy(desc(packs.createdAt));
    return rows.map((row) => this.hydratePack(row));
  }

  async insertPack(row: typeof packs.$inferInsert): Promise<void> {
    await this.db.insert(packs).values(row);
  }

  async updatePack(
    id: string,
    patch: Partial<typeof packs.$inferInsert>,
  ): Promise<void> {
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
      hydrated.emulator = JSON.parse(hydrated.emulator) as Record<
        string,
        unknown
      >;
    }
    if (typeof hydrated.zomboid === 'string') {
      hydrated.zomboid = JSON.parse(hydrated.zomboid) as Record<
        string,
        unknown
      >;
    }
    if (typeof hydrated.stardew === 'string') {
      hydrated.stardew = JSON.parse(hydrated.stardew) as Record<
        string,
        unknown
      >;
    }
    if (typeof hydrated.initialFiles === 'string') {
      hydrated.initialFiles = JSON.parse(hydrated.initialFiles) as unknown[];
    }
    if (typeof hydrated.optionalGroups === 'string') {
      hydrated.optionalGroups = JSON.parse(
        hydrated.optionalGroups,
      ) as unknown[];
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

  async updateVersion(
    id: string,
    patch: Partial<NewPackVersion>,
  ): Promise<void> {
    await this.db
      .update(packVersions)
      .set(patch)
      .where(eq(packVersions.id, id));
  }

  async deleteVersion(id: string): Promise<void> {
    await this.db.delete(packVersions).where(eq(packVersions.id, id));
  }

  /** One transaction: a crash between the flip and the pointer move must not
   *  leave a published version that is not `latest` (invisible AND undeletable). */
  async publishVersionAndSetLatest(
    packId: string,
    versionId: string,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .update(packVersions)
        .set({ published: true })
        .where(eq(packVersions.id, versionId));
      await tx
        .update(packs)
        .set({ latestVersionId: versionId })
        .where(eq(packs.id, packId));
    });
  }

  async countVersions(packId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(packVersions)
      .where(eq(packVersions.packId, packId));
    return Number(row?.n ?? 0);
  }

  // ── ACL ──────────────────────────────────────────────────────────────────

  /**
   * The union of the two non-public sources: a direct ACL grant, or membership
   * in an event carrying this pack. Public packs never reach here — the service
   * short-circuits them before asking.
   */
  async hasAccess(packId: string, principal: PackPrincipal): Promise<boolean> {
    if (principal.userId != null) {
      const [row] = await this.db
        .select({ userId: packGrants.userId })
        .from(packGrants)
        .where(
          and(
            eq(packGrants.packId, packId),
            eq(packGrants.userId, principal.userId),
          ),
        )
        .limit(1);
      if (row) return true;
    }

    // Same stale-claim rule as listVisibleTo: an account principal resolves
    // pack_acl through its CURRENT linked uuid, never the token claim.
    if (principal.userId != null) {
      const [row] = await this.db
        .select({ uuid: packAcl.uuid })
        .from(packAcl)
        .innerJoin(boffMediaUsers, eq(boffMediaUsers.uuid, packAcl.uuid))
        .where(
          and(
            eq(packAcl.packId, packId),
            eq(boffMediaUsers.id, principal.userId),
            isNull(boffMediaUsers.deletedAt),
          ),
        )
        .limit(1);
      if (row) return true;
    } else if (principal.mcUuid) {
      const [row] = await this.db
        .select({ uuid: packAcl.uuid })
        .from(packAcl)
        .where(
          and(eq(packAcl.packId, packId), eq(packAcl.uuid, principal.mcUuid)),
        )
        .limit(1);
      if (row) return true;
    }

    const membership = this.eventMembershipExists(
      sql`${packId}` as SQL,
      principal,
    );
    if (!membership) return false;

    const [row] = await this.db
      .select({ ok: membership })
      .from(sql`(select 1) as _`);
    return Boolean(Number(row?.ok ?? 0));
  }

  /** Account picker for the admin grant UI. Deliberately narrow: a pack admin
   *  needs to identify a person, not read their profile. */
  async searchUsers(
    q: string,
    limit = 10,
  ): Promise<{ id: number; username: string; email: string }[]> {
    const term = `%${q}%`;
    return this.db
      .select({
        id: boffMediaUsers.id,
        username: boffMediaUsers.username,
        email: boffMediaUsers.email,
      })
      .from(boffMediaUsers)
      .where(
        and(
          isNull(boffMediaUsers.deletedAt),
          or(
            sql`${boffMediaUsers.username} like ${term}`,
            sql`${boffMediaUsers.email} like ${term}`,
          ),
        ),
      )
      .orderBy(boffMediaUsers.username)
      .limit(limit);
  }

  /** Direct grants on a pack, with the account behind each one. */
  async listGrants(packId: string): Promise<
    {
      userId: number;
      username: string;
      email: string;
      source: string;
      sourceRef: string | null;
      grantedAt: Date;
    }[]
  > {
    return this.db
      .select({
        userId: packGrants.userId,
        username: boffMediaUsers.username,
        email: boffMediaUsers.email,
        source: packGrants.source,
        sourceRef: packGrants.sourceRef,
        grantedAt: packGrants.grantedAt,
      })
      .from(packGrants)
      .innerJoin(boffMediaUsers, eq(boffMediaUsers.id, packGrants.userId))
      .where(eq(packGrants.packId, packId))
      .orderBy(desc(packGrants.grantedAt)) as never;
  }

  /** Idempotent: re-granting an existing entitlement must not 500. */
  async grantToUser(
    packId: string,
    userId: number,
    source: 'admin' | 'invite',
    sourceRef: string | null,
    grantedBy: number | null,
  ): Promise<void> {
    await this.db
      .insert(packGrants)
      .values({ packId, userId, source, sourceRef, grantedBy })
      .onDuplicateKeyUpdate({ set: { grantedAt: sql`CURRENT_TIMESTAMP()` } });
  }

  /** Revokes every source at once — the admin UI's "remove this person". */
  async revokeFromUser(packId: string, userId: number): Promise<void> {
    await this.db
      .delete(packGrants)
      .where(and(eq(packGrants.packId, packId), eq(packGrants.userId, userId)));
  }

  /** Revokes ONE source, leaving the others standing — the invariant the
   *  composite PK exists for. */
  async revokeSourceFromUser(
    packId: string,
    userId: number,
    source: 'admin' | 'invite',
  ): Promise<void> {
    await this.db
      .delete(packGrants)
      .where(
        and(
          eq(packGrants.packId, packId),
          eq(packGrants.userId, userId),
          eq(packGrants.source, source),
        ),
      );
  }

  /**
   * Converts this account's legacy UUID pre-grants into real grants. Called when
   * a Minecraft account is linked, which is the moment a pre-grant finally has
   * an account to belong to.
   */
  async claimLegacyGrants(userId: number, mcUuid: string): Promise<number> {
    const rows = await this.db
      .select({
        packId: packAcl.packId,
        grantedBy: packAcl.grantedBy,
        viaInvite: packAcl.viaInvite,
      })
      .from(packAcl)
      .where(eq(packAcl.uuid, mcUuid));

    for (const row of rows) {
      await this.grantToUser(
        row.packId,
        userId,
        row.viaInvite ? 'invite' : 'admin',
        row.viaInvite,
        row.grantedBy,
      );
    }

    if (rows.length > 0) {
      await this.db.delete(packAcl).where(eq(packAcl.uuid, mcUuid));
    }
    return rows.length;
  }

  async listAcl(packId: string): Promise<{ uuid: string; grantedAt: Date }[]> {
    return this.db
      .select({ uuid: packAcl.uuid, grantedAt: packAcl.grantedAt })
      .from(packAcl)
      .where(eq(packAcl.packId, packId))
      .orderBy(desc(packAcl.grantedAt));
  }

  /**
   * The events whose membership grants this pack, with how many members that
   * currently is. Without this the admin access panel lists only ACL rows and
   * silently under-reports who can actually install the pack.
   */
  async listGrantingEvents(packId: string): Promise<
    {
      eventId: number;
      title: string;
      status: string;
      visibility: string;
      memberCount: number;
    }[]
  > {
    return this.db
      .select({
        eventId: boffMediaEvents.id,
        title: boffMediaEvents.title,
        status: boffMediaEvents.status,
        visibility: boffMediaEvents.visibility,
        memberCount: sql<number>`sum(case when ${inArray(
          boffMediaEventParticipants.status,
          [PARTICIPANT_STATUS.REGISTERED, PARTICIPANT_STATUS.CONFIRMED],
        )} then 1 else 0 end)`,
      })
      .from(boffMediaEvents)
      .leftJoin(
        boffMediaEventParticipants,
        eq(boffMediaEventParticipants.eventId, boffMediaEvents.id),
      )
      .where(
        and(
          eq(boffMediaEvents.packId, packId),
          isNull(boffMediaEvents.deletedAt),
        ),
      )
      .groupBy(
        boffMediaEvents.id,
        boffMediaEvents.title,
        boffMediaEvents.status,
        boffMediaEvents.visibility,
      );
  }

  /** How many people hold a direct grant: real grants plus any legacy UUID
   *  pre-grants still waiting for an account. */
  async countAcl(packId: string): Promise<number> {
    const [grants] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(packGrants)
      .where(eq(packGrants.packId, packId));
    const [legacy] = await this.db
      .select({ n: sql<number>`count(*)` })
      .from(packAcl)
      .where(eq(packAcl.packId, packId));
    return Number(grants?.n ?? 0) + Number(legacy?.n ?? 0);
  }

  /** LEGACY pre-grant for a UUID with no account behind it yet. */
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
          or(
            isNull(packInvites.expiresAt),
            sql`${packInvites.expiresAt} > CURRENT_TIMESTAMP()`,
          ),
        ),
      );
    // 0 rows means one of the guards in the WHERE rejected it — expired,
    // revoked, or exhausted. The caller cannot tell which, deliberately.
    return res.affectedRows > 0;
  }

  async revokeInvite(code: string): Promise<void> {
    await this.db
      .update(packInvites)
      .set({ revoked: true })
      .where(eq(packInvites.code, code));
  }

  // ── Audit ────────────────────────────────────────────────────────────────

  /** `userId` is the acting account. When omitted it falls back to `meta.actorId`
   *  so pre-existing admin call sites record their actor without changing shape. */
  async audit(
    action: AuditAction,
    packId: string | null,
    uuid: string | null,
    meta?: Record<string, unknown>,
    userId?: number | null,
  ): Promise<void> {
    const actor =
      userId !== undefined
        ? userId
        : typeof meta?.actorId === 'number'
          ? meta.actorId
          : null;
    await this.db
      .insert(packAudit)
      .values({ action, packId, userId: actor, uuid, meta: meta ?? null });
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
