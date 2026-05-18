import { Test, TestingModule } from '@nestjs/testing';
import { MhwildsCacheService } from './mhwilds-cache.service';
import { MHWILDS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  clearCache: jest.fn(),
  getCacheStats: jest.fn(),
  getResourceData: jest.fn(),
};

describe('MhwildsCacheService', () => {
  let service: MhwildsCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MhwildsCacheService,
        { provide: MHWILDS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MhwildsCacheService>(MhwildsCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── clearCache ───────────────────────────────────────────────────────────────

  describe('clearCache()', () => {
    it('delegates to the repository', async () => {
      mockRepo.clearCache.mockResolvedValue({ success: true, message: 'Cleared' });

      const result = await service.clearCache('weapons', 'en');

      expect(mockRepo.clearCache).toHaveBeenCalledWith('weapons', 'en');
      expect(result.success).toBe(true);
    });

    it('returns failure object on error', async () => {
      mockRepo.clearCache.mockRejectedValue(new Error('timeout'));

      const result = await service.clearCache();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cache clearing failed');
    });
  });

  // ─── getCacheStatistics ───────────────────────────────────────────────────────

  describe('getCacheStatistics()', () => {
    it('wraps stats in a success response', async () => {
      mockRepo.getCacheStats.mockResolvedValue({ size: 42, hits: 100 });

      const result = await service.getCacheStatistics();

      expect(result.success).toBe(true);
      expect(result.stats).toEqual({ size: 42, hits: 100 });
    });

    it('returns failure object on error', async () => {
      mockRepo.getCacheStats.mockRejectedValue(new Error('db error'));

      const result = await service.getCacheStatistics();

      expect(result.success).toBe(false);
    });
  });

  // ─── warmupCache ──────────────────────────────────────────────────────────────

  describe('warmupCache()', () => {
    it('fetches all 5 resource types and returns success', async () => {
      mockRepo.getResourceData.mockResolvedValue([]);

      const result = await service.warmupCache('en');

      expect(mockRepo.getResourceData).toHaveBeenCalledTimes(5);
      expect(result.success).toBe(true);
    });

    it('still succeeds when some resources fail (partial warmup)', async () => {
      mockRepo.getResourceData
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValue([]);

      const result = await service.warmupCache('en');

      expect(result.success).toBe(true);
      expect(result.message).toContain('completed');
    });
  });
});
