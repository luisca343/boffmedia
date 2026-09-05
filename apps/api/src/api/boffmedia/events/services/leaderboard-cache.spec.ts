import { LeaderboardCacheService } from './leaderboard-cache.service';
import { LeaderboardsService } from './leaderboards.service';
import { LeaderboardsRepository } from '../repositories/leaderboards.repository';

/**
 * Audit A10 — the leaderboard cache.
 *
 * These drive the REAL `LeaderboardsService` against a real
 * `LeaderboardCacheService` with only the repository faked, so what is being
 * asserted is that the service actually reads through the cache. A test that
 * exercised the cache class alone would pass just as well if nothing in the
 * application ever called it — which is how this backlog has repeatedly
 * shipped a data layer with no consumers.
 */
describe('LeaderboardsService — caching (A10)', () => {
  let cache: LeaderboardCacheService;
  let repo: {
    findGlobalTotals: jest.Mock;
    findEventTotals: jest.Mock;
    findTeamTotals: jest.Mock;
  };
  let service: LeaderboardsService;

  beforeEach(() => {
    cache = new LeaderboardCacheService();
    repo = {
      findGlobalTotals: jest
        .fn()
        .mockResolvedValue([{ participantId: 1, totalPoints: 10 }]),
      findEventTotals: jest
        .fn()
        .mockResolvedValue([{ participantId: 2, totalPoints: 5 }]),
      findTeamTotals: jest.fn().mockResolvedValue([{ teamId: 7, score: 3 }]),
    };
    service = new LeaderboardsService(
      repo as unknown as LeaderboardsRepository,
      cache,
    );
  });

  it('queries once for repeated reads of the global board', async () => {
    const a = await service.getGlobalLeaderboard();
    const b = await service.getGlobalLeaderboard();

    expect(repo.findGlobalTotals).toHaveBeenCalledTimes(1);
    expect(b).toEqual(a);
    expect(a[0]).toMatchObject({ participantId: 1, rank: 1 });
  });

  it('keys event boards separately, so one event cannot serve another', async () => {
    await service.getEventLeaderboard(1);
    await service.getEventLeaderboard(2);
    await service.getEventLeaderboard(1);

    expect(repo.findEventTotals).toHaveBeenCalledTimes(2);
    expect(repo.findEventTotals).toHaveBeenNthCalledWith(1, 1);
    expect(repo.findEventTotals).toHaveBeenNthCalledWith(2, 2);
  });

  it('keys the team board apart from the participant board for the same event', async () => {
    // Both are "event 1". If they shared a key, the second read would return
    // the first one's rows — a board of the wrong SHAPE, silently.
    const participants = await service.getEventLeaderboard(1);
    const teams = await service.getTeamLeaderboard(1);

    expect(repo.findEventTotals).toHaveBeenCalledTimes(1);
    expect(repo.findTeamTotals).toHaveBeenCalledTimes(1);
    expect(participants[0]).toMatchObject({ participantId: 2 });
    expect(teams[0]).toMatchObject({ teamId: 7 });
  });

  it('re-queries after invalidation — the half that makes a write visible', async () => {
    await service.getGlobalLeaderboard();
    expect(repo.findGlobalTotals).toHaveBeenCalledTimes(1);

    cache.invalidateAll();

    await service.getGlobalLeaderboard();
    expect(repo.findGlobalTotals).toHaveBeenCalledTimes(2);
  });

  it('serves the NEW rows after invalidation, not just a new query', async () => {
    await service.getGlobalLeaderboard();
    repo.findGlobalTotals.mockResolvedValue([
      { participantId: 9, totalPoints: 99 },
    ]);

    // Still cached: the stale board is what a caller gets until invalidation.
    expect((await service.getGlobalLeaderboard())[0]).toMatchObject({
      participantId: 1,
    });

    cache.invalidateAll();
    expect((await service.getGlobalLeaderboard())[0]).toMatchObject({
      participantId: 9,
    });
  });

  it('does not cache a failure', async () => {
    repo.findGlobalTotals.mockRejectedValueOnce(new Error('db blip'));

    await expect(service.getGlobalLeaderboard()).rejects.toThrow('db blip');

    // A cached rejection would turn one blip into 30s of guaranteed failure.
    await expect(service.getGlobalLeaderboard()).resolves.toHaveLength(1);
    expect(repo.findGlobalTotals).toHaveBeenCalledTimes(2);
  });

  it('expires entries once the TTL has passed', async () => {
    jest.useFakeTimers();
    try {
      await service.getGlobalLeaderboard();
      expect(repo.findGlobalTotals).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(29_000);
      await service.getGlobalLeaderboard();
      expect(repo.findGlobalTotals).toHaveBeenCalledTimes(1); // still fresh

      jest.advanceTimersByTime(2_000);
      await service.getGlobalLeaderboard();
      expect(repo.findGlobalTotals).toHaveBeenCalledTimes(2); // expired
    } finally {
      jest.useRealTimers();
    }
  });

  it('stays bounded rather than growing one entry per requested event id', async () => {
    for (let i = 0; i < 600; i++) {
      await service.getEventLeaderboard(i);
    }
    expect(cache.size).toBeLessThanOrEqual(500);
  });
});
