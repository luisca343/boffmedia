import { Injectable } from '@nestjs/common';
import {
  ActivityItemEntity,
  SiteStatsEntity,
} from './entities/community.entity';
import { CommunityRepository } from './repositories/community.repository';

@Injectable()
export class CommunityService {
  constructor(private readonly repo: CommunityRepository) {}

  /** Aggregate site-wide counters for the landing HUD. */
  async getSiteStats(): Promise<SiteStatsEntity> {
    return this.repo.countSiteStats();
  }

  /**
   * Site-wide recent activity feed: achievement unlocks + event registrations
   * across every participant, newest first.
   *
   * Both halves are fetched at `limit` and merged, so the newest `limit` items
   * overall survive the sort even when one kind dominates the other.
   */
  async getActivity(limit = 15): Promise<ActivityItemEntity[]> {
    const [unlocks, joins] = await Promise.all([
      this.repo.findRecentUnlocks(limit),
      this.repo.findRecentJoins(limit),
    ]);

    const items: ActivityItemEntity[] = [
      ...unlocks
        .filter((u) => u.at)
        .map((u) => ({
          type: 'achievement' as const,
          actor: u.actor ?? 'Anónimo',
          name: u.name,
          icon: u.icon,
          at: (u.at as Date).toISOString(),
        })),
      ...joins
        .filter((j) => j.at)
        .map((j) => ({
          type: 'event_join' as const,
          actor: j.actor ?? 'Anónimo',
          name: j.name,
          icon: j.icon,
          at: (j.at as Date).toISOString(),
        })),
    ];

    items.sort((a, b) => b.at.localeCompare(a.at));
    return items.slice(0, limit);
  }
}
