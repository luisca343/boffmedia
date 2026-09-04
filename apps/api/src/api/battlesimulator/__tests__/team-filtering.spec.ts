import { describe, it, expect } from '@jest/globals';

/**
 * Pure functions for team filtering and sync detection.
 * These are tested independently to ensure the business logic is correct
 * before integration into the repository and controller.
 */

interface Team {
  id: string;
  name: string;
  tags: string[];
  clientUpdatedAt: number | null;
  updatedAt: Date;
}

/**
 * Filter teams by a single tag.
 * A team matches if it contains the tag (case-insensitive).
 */
function filterByTag(teams: Team[], tag: string): Team[] {
  if (!tag.trim()) return teams;
  const normalized = tag.toLowerCase();
  return teams.filter((t) => t.tags.some((ta) => ta.toLowerCase() === normalized));
}

/**
 * Filter teams by name (search).
 * A team matches if its name contains the search string (case-insensitive).
 */
function filterByName(teams: Team[], searchQuery: string): Team[] {
  if (!searchQuery.trim()) return teams;
  const normalized = searchQuery.toLowerCase();
  return teams.filter((t) => t.name.toLowerCase().includes(normalized));
}

/**
 * Combine tag and name filtering.
 */
function filterTeams(teams: Team[], tag: string, searchQuery: string): Team[] {
  let result = teams;
  if (tag) result = filterByTag(result, tag);
  if (searchQuery) result = filterByName(result, searchQuery);
  return result;
}

/**
 * Detect if the local copy is newer than the cloud copy.
 * Returns true if clientUpdatedAt > updatedAt (converted to epoch ms).
 * clientUpdatedAt is in epoch ms (client clock).
 * updatedAt is a server timestamp.
 */
function isLocalNewer(team: Team): boolean {
  if (team.clientUpdatedAt === null) return false;
  const serverMs = team.updatedAt.getTime();
  return team.clientUpdatedAt > serverMs;
}

describe('Team Filtering', () => {
  describe('filterByTag', () => {
    const teams: Team[] = [
      {
        id: '1',
        name: 'Team A',
        tags: ['competitive', 'doubles'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Team B',
        tags: ['casual'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'Team C',
        tags: ['Competitive', 'singles'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
    ];

    it('should return all teams when tag is empty', () => {
      expect(filterByTag(teams, '')).toEqual(teams);
      expect(filterByTag(teams, '   ')).toEqual(teams);
    });

    it('should filter teams by exact tag (case-insensitive)', () => {
      expect(filterByTag(teams, 'competitive')).toEqual([teams[0], teams[2]]);
      expect(filterByTag(teams, 'COMPETITIVE')).toEqual([teams[0], teams[2]]);
      expect(filterByTag(teams, 'casual')).toEqual([teams[1]]);
    });

    it('should return empty array if no tags match', () => {
      expect(filterByTag(teams, 'nonexistent')).toEqual([]);
    });

    it('should match only one tag if multiple teams have different tags', () => {
      expect(filterByTag(teams, 'doubles')).toEqual([teams[0]]);
      expect(filterByTag(teams, 'singles')).toEqual([teams[2]]);
    });
  });

  describe('filterByName', () => {
    const teams: Team[] = [
      {
        id: '1',
        name: 'VGC 2026 Flyer',
        tags: [],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Casual Team',
        tags: [],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'VGC Trick Room',
        tags: [],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
    ];

    it('should return all teams when search query is empty', () => {
      expect(filterByName(teams, '')).toEqual(teams);
      expect(filterByName(teams, '   ')).toEqual(teams);
    });

    it('should filter teams by name (case-insensitive partial match)', () => {
      expect(filterByName(teams, 'VGC')).toEqual([teams[0], teams[2]]);
      expect(filterByName(teams, 'vgc')).toEqual([teams[0], teams[2]]);
      expect(filterByName(teams, 'casual')).toEqual([teams[1]]);
    });

    it('should match partial strings', () => {
      expect(filterByName(teams, 'Flyer')).toEqual([teams[0]]);
      expect(filterByName(teams, 'VGC')).toEqual([teams[0], teams[2]]);
    });

    it('should return empty array if no names match', () => {
      expect(filterByName(teams, 'nonexistent')).toEqual([]);
    });
  });

  describe('filterTeams', () => {
    const teams: Team[] = [
      {
        id: '1',
        name: 'VGC 2026 Flyer',
        tags: ['competitive', 'vgc'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'Casual Comp',
        tags: ['casual'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: 'VGC Trick Room',
        tags: ['competitive', 'vgc'],
        clientUpdatedAt: null,
        updatedAt: new Date(),
      },
    ];

    it('should apply both tag and name filters', () => {
      // Competitive tag only
      expect(filterTeams(teams, 'competitive', '')).toEqual([teams[0], teams[2]]);
      // VGC tag + "Trick" name
      expect(filterTeams(teams, 'vgc', 'Trick')).toEqual([teams[2]]);
      // Casual tag + "Comp" name
      expect(filterTeams(teams, 'casual', 'Comp')).toEqual([teams[1]]);
    });

    it('should return empty if filters are too restrictive', () => {
      expect(filterTeams(teams, 'competitive', 'Casual')).toEqual([]);
    });

    it('should return all teams if no filters applied', () => {
      expect(filterTeams(teams, '', '')).toEqual(teams);
    });
  });
});

describe('Sync Detection', () => {
  describe('isLocalNewer', () => {
    it('should return false if clientUpdatedAt is null', () => {
      const team: Team = {
        id: '1',
        name: 'Team',
        tags: [],
        clientUpdatedAt: null,
        updatedAt: new Date('2026-09-04T10:00:00Z'),
      };
      expect(isLocalNewer(team)).toBe(false);
    });

    it('should return true if clientUpdatedAt is newer than updatedAt', () => {
      const serverTime = new Date('2026-09-04T10:00:00Z');
      const team: Team = {
        id: '1',
        name: 'Team',
        tags: [],
        clientUpdatedAt: serverTime.getTime() + 60000, // 1 minute newer
        updatedAt: serverTime,
      };
      expect(isLocalNewer(team)).toBe(true);
    });

    it('should return false if clientUpdatedAt is older than updatedAt', () => {
      const serverTime = new Date('2026-09-04T10:00:00Z');
      const team: Team = {
        id: '1',
        name: 'Team',
        tags: [],
        clientUpdatedAt: serverTime.getTime() - 60000, // 1 minute older
        updatedAt: serverTime,
      };
      expect(isLocalNewer(team)).toBe(false);
    });

    it('should return false if clientUpdatedAt equals updatedAt', () => {
      const serverTime = new Date('2026-09-04T10:00:00Z');
      const team: Team = {
        id: '1',
        name: 'Team',
        tags: [],
        clientUpdatedAt: serverTime.getTime(),
        updatedAt: serverTime,
      };
      expect(isLocalNewer(team)).toBe(false);
    });

    it('should detect when local version is 2 days newer (client clock slow)', () => {
      const serverTime = new Date('2026-09-04T10:00:00Z');
      const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
      const team: Team = {
        id: '1',
        name: 'Team',
        tags: [],
        clientUpdatedAt: serverTime.getTime() + twoDaysMs,
        updatedAt: serverTime,
      };
      expect(isLocalNewer(team)).toBe(true);
    });
  });
});
