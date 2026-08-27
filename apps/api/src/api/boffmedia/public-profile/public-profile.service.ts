import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaUsers,
  boffMediaRoles,
  boffMediaUserRoles,
} from '@/_db/schema/BoffMedia';
import { PublicProfileEntity } from './entities/public-profile.entity';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class PublicProfileService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Public-safe profile by handle (username). Exposes ONLY public identity —
   * never email, password, or OAuth ids. Excludes soft-deleted users to prevent
   * leaking PII-scrubbed accounts. Per-user trophies/activity are served
   * by the already-public `/events/users/:id/{trophies,activity}` endpoints.
   */
  async getByHandle(handle: string): Promise<PublicProfileEntity> {
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

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const roles = await this.db
      .select({ name: boffMediaRoles.name })
      .from(boffMediaUserRoles)
      .innerJoin(
        boffMediaRoles,
        eq(boffMediaRoles.id, boffMediaUserRoles.roleId),
      )
      .where(eq(boffMediaUserRoles.userId, user.id));

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl ?? null,
      coverUrl: user.coverUrl ?? null,
      bio: user.bio ?? null,
      roles: roles.map((r) => r.name),
      memberSince: user.memberSince ? user.memberSince.toISOString() : null,
    };
  }
}
