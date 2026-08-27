import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaUsers,
  boffMediaRoles,
  boffMediaUserRoles,
} from '@/_db/schema/BoffMedia';

export interface PublicIdentityRow {
  id: number;
  name: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  memberSince: Date | null;
}

@Injectable()
export class PublicProfileRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * The column list here is the privacy boundary, not a convenience.
   *
   * It selects public identity ONLY — never email, password hash or OAuth ids —
   * and the `deletedAt` filter keeps PII-scrubbed accounts from resurfacing. A
   * `select()` with no projection would quietly widen this the moment a column
   * is added to the users table, so it stays explicit.
   */
  async findPublicIdentityByHandle(
    handle: string,
  ): Promise<PublicIdentityRow | null> {
    const [user] = await this.db
      .select({
        id: boffMediaUsers.id,
        name: boffMediaUsers.username,
        avatarUrl: boffMediaUsers.profilePicture,
        coverUrl: boffMediaUsers.coverImage,
        bio: boffMediaUsers.bio,
        memberSince: boffMediaUsers.createdAt,
      })
      .from(boffMediaUsers)
      .where(
        and(
          eq(boffMediaUsers.username, handle),
          isNull(boffMediaUsers.deletedAt),
        ),
      );
    return user ?? null;
  }

  async findRoleNames(userId: number): Promise<string[]> {
    const roles = await this.db
      .select({ name: boffMediaRoles.name })
      .from(boffMediaUserRoles)
      .innerJoin(
        boffMediaRoles,
        eq(boffMediaRoles.id, boffMediaUserRoles.roleId),
      )
      .where(eq(boffMediaUserRoles.userId, userId));
    return roles.map((r) => r.name);
  }
}
