import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, inArray, like, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import {
  boffMediaRoles,
  boffMediaUserRoles,
  boffMediaUsers,
} from '@/_db/schema/BoffMedia';
import {
  gobiernoBuscados,
  gobiernoMultas,
} from '@/_db/schema/SmartRotomGobierno';
import { GOBIERNO_ROLE_NAMES } from './dto/poblacion.dto';

@Injectable()
export class PoblacionRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== CENSO ====================

  async listUsers(page: number, limit: number, search?: string) {
    const where = search ? like(rotomUsers.username, `%${search}%`) : undefined;
    const [items, totalRows] = await Promise.all([
      this.db
        .select({
          uuid: rotomUsers.uuid,
          username: rotomUsers.username,
        })
        .from(rotomUsers)
        .where(where)
        .orderBy(rotomUsers.username)
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(rotomUsers)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  /**
   * Every user, unpaginated. Only used when the caller filters on `standing`, which is
   * DERIVED from other registers and therefore cannot be expressed in this query's WHERE
   * clause — the rows have to exist before the predicate can be evaluated.
   */
  async listAllUsers(search?: string) {
    const where = search ? like(rotomUsers.username, `%${search}%`) : undefined;
    return this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(where)
      .orderBy(rotomUsers.username);
  }

  async findUserByUuid(
    uuid: string,
  ): Promise<{ uuid: string; username: string } | null> {
    const rows = await this.db
      .select({
        uuid: rotomUsers.uuid,
        username: rotomUsers.username,
      })
      .from(rotomUsers)
      .where(eq(rotomUsers.uuid, uuid));
    return rows[0] ?? null;
  }

  async getActiveBuscadoUuids(): Promise<Set<string>> {
    const rows = await this.db
      .select({ uuid: gobiernoBuscados.playerUuid })
      .from(gobiernoBuscados)
      .where(eq(gobiernoBuscados.status, 'active'));
    return new Set(rows.map((r) => r.uuid));
  }

  async hasActiveBuscado(uuid: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: gobiernoBuscados.id })
      .from(gobiernoBuscados)
      .where(
        and(
          eq(gobiernoBuscados.playerUuid, uuid),
          eq(gobiernoBuscados.status, 'active'),
        ),
      );
    return rows.length > 0;
  }

  async getPendingMultaCounts(): Promise<Map<string, number>> {
    const rows = await this.db
      .select({ uuid: gobiernoMultas.playerUuid, count: sql<number>`count(*)` })
      .from(gobiernoMultas)
      .where(eq(gobiernoMultas.status, 'pending'))
      .groupBy(gobiernoMultas.playerUuid);
    return new Map(rows.map((r) => [r.uuid, Number(r.count)]));
  }

  async countPendingMultas(uuid: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(gobiernoMultas)
      .where(
        and(
          eq(gobiernoMultas.playerUuid, uuid),
          eq(gobiernoMultas.status, 'pending'),
        ),
      );
    return Number(rows[0]?.count ?? 0);
  }

  // ==================== OFICIALES ====================

  async listOfficerHolders(): Promise<
    {
      uuid: string;
      userId: number;
      username: string;
      profilePicture: string | null;
      role: string;
    }[]
  > {
    const roles = await this.db
      .select({ id: boffMediaRoles.id, name: boffMediaRoles.name })
      .from(boffMediaRoles)
      .where(inArray(boffMediaRoles.name, [...GOBIERNO_ROLE_NAMES]));
    if (roles.length === 0) return [];

    const roleById = new Map(roles.map((r) => [r.id, r.name]));

    return this.db
      .select({
        uuid: boffMediaUsers.uuid,
        userId: boffMediaUsers.id,
        username: boffMediaUsers.username,
        profilePicture: boffMediaUsers.profilePicture,
        roleId: boffMediaUserRoles.roleId,
      })
      .from(boffMediaUserRoles)
      .innerJoin(
        boffMediaUsers,
        eq(boffMediaUserRoles.userId, boffMediaUsers.id),
      )
      .where(
        inArray(
          boffMediaUserRoles.roleId,
          roles.map((r) => r.id),
        ),
      )
      .then((rows) =>
        rows
          .filter((r) => r.uuid !== null)
          .map((r) => ({
            uuid: r.uuid as string,
            userId: r.userId,
            username: r.username,
            profilePicture: r.profilePicture,
            role: roleById.get(r.roleId) as string,
          })),
      );
  }

  async findBoffmediaUserByUuid(
    uuid: string,
  ): Promise<{ id: number; uuid: string | null } | null> {
    const rows = await this.db
      .select({ id: boffMediaUsers.id, uuid: boffMediaUsers.uuid })
      .from(boffMediaUsers)
      .where(eq(boffMediaUsers.uuid, uuid));
    return rows[0] ?? null;
  }

  async findRoleByName(
    name: string,
  ): Promise<{ id: number; name: string } | null> {
    const rows = await this.db
      .select()
      .from(boffMediaRoles)
      .where(eq(boffMediaRoles.name, name));
    return rows[0] ?? null;
  }

  async grantRole(userId: number, roleId: number): Promise<void> {
    const existing = await this.db
      .select({ id: boffMediaUserRoles.id })
      .from(boffMediaUserRoles)
      .where(
        and(
          eq(boffMediaUserRoles.userId, userId),
          eq(boffMediaUserRoles.roleId, roleId),
        ),
      );
    if (existing.length === 0) {
      await this.db.insert(boffMediaUserRoles).values({ userId, roleId });
    }
  }

  async revokeRole(userId: number, roleId: number): Promise<void> {
    await this.db
      .delete(boffMediaUserRoles)
      .where(
        and(
          eq(boffMediaUserRoles.userId, userId),
          eq(boffMediaUserRoles.roleId, roleId),
        ),
      );
  }
}
