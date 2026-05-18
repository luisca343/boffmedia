import { Test, TestingModule } from '@nestjs/testing';
import { QuestCacheService } from './quest.cache.service';
import { QUEST_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  fetchAllQuestsFromAPI: jest.fn(),
};

const rawApiData = {
  quests: { q1: { id: 1, name: 'Quest 1' }, q2: { id: 2, name: 'Quest 2' } },
  dialogs: { d1: { id: 1, text: 'Hello' } },
  categories: { c1: { id: 1, name: 'Main' } },
  npcs: [{ id: 1, name: 'NPC 1' }],
};

describe('QuestCacheService', () => {
  let service: QuestCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestCacheService,
        { provide: QUEST_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<QuestCacheService>(QuestCacheService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getQuestSystemData ───────────────────────────────────────────────────────

  describe('getQuestSystemData()', () => {
    it('fetches from API when cache is empty', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);

      const result = await service.getQuestSystemData();

      expect(result.quests).toHaveLength(2);
      expect(result.dialogs).toHaveLength(1);
      expect(result.categories).toHaveLength(1);
      expect(result.npcs).toHaveLength(1);
      expect(mockRepo.fetchAllQuestsFromAPI).toHaveBeenCalledTimes(1);
    });

    it('returns cached data without refetching when cache is fresh', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);

      await service.getQuestSystemData(); // populates cache
      await service.getQuestSystemData(); // should use cache

      expect(mockRepo.fetchAllQuestsFromAPI).toHaveBeenCalledTimes(1);
    });

    it('refetches when cache is expired (> 4 hours)', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);

      await service.getQuestSystemData(); // initial fetch

      jest.advanceTimersByTime(4 * 60 * 60 * 1000 + 1); // advance past 4h TTL

      await service.getQuestSystemData(); // should refetch

      expect(mockRepo.fetchAllQuestsFromAPI).toHaveBeenCalledTimes(2);
    });

    it('refetches when force=true even if cache is fresh', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);

      await service.getQuestSystemData();
      await service.getQuestSystemData(true); // forced

      expect(mockRepo.fetchAllQuestsFromAPI).toHaveBeenCalledTimes(2);
    });

    it('throws when API fetch fails', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockRejectedValue(new Error('API down'));

      await expect(service.getQuestSystemData()).rejects.toThrow('API down');
    });
  });

  // ─── updateNPCs ───────────────────────────────────────────────────────────────

  describe('updateNPCs()', () => {
    it('updates npcs in the cache', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);
      await service.getQuestSystemData(); // populate cache

      const newNPCs = [{ id: 99, name: 'New NPC' }] as any[];
      service.updateNPCs(newNPCs);

      const data = await service.getQuestSystemData();
      expect(data.npcs).toEqual(newNPCs);
    });

    it('does nothing when cache is not initialized', () => {
      // Should not throw even if cache is null
      expect(() => service.updateNPCs([])).not.toThrow();
    });
  });

  // ─── getCacheStatus ───────────────────────────────────────────────────────────

  describe('getCacheStatus()', () => {
    it('returns cached=false when no cache exists', () => {
      const status = service.getCacheStatus();

      expect(status.cached).toBe(false);
    });

    it('returns cached=true with age and nextRefresh when cache exists', async () => {
      mockRepo.fetchAllQuestsFromAPI.mockResolvedValue(rawApiData);
      await service.getQuestSystemData();

      jest.advanceTimersByTime(60_000); // advance 1 minute

      const status = service.getCacheStatus();

      expect(status.cached).toBe(true);
      expect(status.age).toBeGreaterThanOrEqual(60_000);
      expect(status.nextRefresh).toBeLessThan(4 * 60 * 60 * 1000);
    });
  });
});
