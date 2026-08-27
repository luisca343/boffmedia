import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicProfileEntity } from './entities/public-profile.entity';
import { PublicProfileRepository } from './repositories/public-profile.repository';

@Injectable()
export class PublicProfileService {
  constructor(private readonly repo: PublicProfileRepository) {}

  /**
   * Public-safe profile by handle (username). Exposes ONLY public identity —
   * never email, password, or OAuth ids. Excludes soft-deleted users to prevent
   * leaking PII-scrubbed accounts. Per-user trophies/activity are served
   * by the already-public `/events/users/:id/{trophies,activity}` endpoints.
   */
  async getByHandle(handle: string): Promise<PublicProfileEntity> {
    const user = await this.repo.findPublicIdentityByHandle(handle);

    if (!user) {
      throw new NotFoundException('Profile not found');
    }

    const roles = await this.repo.findRoleNames(user.id);

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl ?? null,
      coverUrl: user.coverUrl ?? null,
      bio: user.bio ?? null,
      roles,
      memberSince: user.memberSince ? user.memberSince.toISOString() : null,
    };
  }
}
