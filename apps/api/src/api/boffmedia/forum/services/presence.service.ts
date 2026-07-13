import { Injectable } from '@nestjs/common';
import { ForumPresenceRepository } from '../repositories/forum-presence.repository';
import { ForumStats } from '../entities/forum-stats.entity';
import { ForumMember } from '../entities/forum-member.entity';
import { toForumAuthor } from '../forum.mapper';

@Injectable()
export class PresenceService {
  constructor(private readonly repo: ForumPresenceRepository) {}

  async getStats(): Promise<ForumStats> {
    const [posts, threads, members, online, newest] = await Promise.all([
      this.repo.postCount(),
      this.repo.threadCount(),
      this.repo.memberCount(),
      this.repo.onlineCount(),
      this.repo.newestUsername(),
    ]);

    return { posts, threads, members, online, newest: newest ?? '' };
  }

  async touchLastSeen(userId: number): Promise<void> {
    await this.repo.touchLastSeen(userId);
  }

  async getOnline(): Promise<ForumMember[]> {
    const rows = await this.repo.findOnline();
    // This endpoint only returns members seen in the last 15 min, so status is
    // 'online' (<=5 min) or 'idle' — never 'offline'.
    return rows.map((r) => ({
      ...toForumAuthor({
        id: r.id,
        username: r.username,
        profilePicture: r.picture,
      }),
      status: Number(r.isOnline) >= 1 ? 'online' : 'idle',
    }));
  }
}
