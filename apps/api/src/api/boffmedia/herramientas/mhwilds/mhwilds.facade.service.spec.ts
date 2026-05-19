import { Test, TestingModule } from '@nestjs/testing';
import { MhwildsFacadeService } from './mhwilds.facade.service';
import { MhwildsDataService } from './services/mhwilds-data.service';
import { MhwildsCacheService } from './services/mhwilds-cache.service';

const mockDataService = {
  getWeapons: jest.fn(),
  getArmor: jest.fn(),
  getCharms: jest.fn(),
  getDecorations: jest.fn(),
  getSkills: jest.fn(),
  getAllCharmRanks: jest.fn(),
  createWeaponTree: jest.fn(),
  searchWeaponsByName: jest.fn(),
  getWeaponsByKind: jest.fn(),
  getArmorByRarity: jest.fn(),
  getDataStatistics: jest.fn(),
};

const mockCacheService = {
  clearCache: jest.fn(),
  getCacheStatistics: jest.fn(),
  warmupCache: jest.fn(),
  validateCache: jest.fn(),
  optimizeCache: jest.fn(),
  formatCacheSize: jest.fn(),
  formatCacheAge: jest.fn(),
};

describe('MhwildsFacadeService', () => {
  let service: MhwildsFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MhwildsFacadeService,
        { provide: MhwildsDataService, useValue: mockDataService },
        { provide: MhwildsCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<MhwildsFacadeService>(MhwildsFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── basic data operations ────────────────────────────────────────────────────

  describe('getWeapons()', () => {
    it('returns the data array from MhwildsDataService', async () => {
      const weapons = [{ id: 1 }];
      mockDataService.getWeapons.mockResolvedValue({ data: weapons });

      const result = await service.getWeapons('en');

      expect(mockDataService.getWeapons).toHaveBeenCalledWith('en');
      expect(result).toEqual(weapons);
    });

    it('defaults locale to "es"', async () => {
      mockDataService.getWeapons.mockResolvedValue({ data: [] });
      await service.getWeapons();
      expect(mockDataService.getWeapons).toHaveBeenCalledWith('es');
    });

    it('throws on data service error', async () => {
      mockDataService.getWeapons.mockRejectedValue(new Error('fail'));
      await expect(service.getWeapons('en')).rejects.toThrow(
        'Failed to get weapons',
      );
    });
  });

  describe('getArmor()', () => {
    it('delegates to data service', async () => {
      mockDataService.getArmor.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await service.getArmor('en');
      expect(result).toHaveLength(1);
    });
  });

  describe('getCharms()', () => {
    it('delegates to data service', async () => {
      mockDataService.getCharms.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await service.getCharms('en');
      expect(result).toHaveLength(1);
    });
  });

  describe('getDecorations()', () => {
    it('delegates to data service', async () => {
      mockDataService.getDecorations.mockResolvedValue({ data: [] });
      const result = await service.getDecorations('en');
      expect(result).toEqual([]);
    });
  });

  describe('getSkills()', () => {
    it('delegates to data service', async () => {
      mockDataService.getSkills.mockResolvedValue({ data: [] });
      const result = await service.getSkills('en');
      expect(result).toEqual([]);
    });
  });

  // ─── processed data operations ────────────────────────────────────────────────

  describe('getAllCharmRanks()', () => {
    it('returns flattened charm ranks', async () => {
      const ranks = [{ id: 1 }, { id: 2 }];
      mockDataService.getAllCharmRanks.mockResolvedValue({ data: ranks });

      const result = await service.getAllCharmRanks('en');

      expect(result).toEqual(ranks);
    });
  });

  describe('createWeaponTree()', () => {
    it('delegates to data service', async () => {
      const tree = {
        tree: [],
        treeByKind: {},
        totalWeapons: 0,
        weaponKinds: [],
      };
      mockDataService.createWeaponTree.mockResolvedValue(tree);

      const result = await service.createWeaponTree('en');

      expect(result).toEqual(tree);
    });
  });

  // ─── search and filter operations ─────────────────────────────────────────────

  describe('searchWeaponsByName()', () => {
    it('delegates when search term is valid', async () => {
      mockDataService.searchWeaponsByName.mockResolvedValue({
        data: [{ id: 1 }],
      });

      const result = await service.searchWeaponsByName('en', 'sword');

      expect(mockDataService.searchWeaponsByName).toHaveBeenCalledWith(
        'en',
        'sword',
      );
      expect(result).toHaveLength(1);
    });

    it('throws for search term shorter than 2 characters', async () => {
      await expect(service.searchWeaponsByName('en', 'a')).rejects.toThrow(
        'at least 2 characters',
      );
    });

    it('throws for empty search term', async () => {
      await expect(service.searchWeaponsByName('en', '')).rejects.toThrow();
    });
  });

  describe('getWeaponsByKind()', () => {
    it('delegates when kind is provided', async () => {
      mockDataService.getWeaponsByKind.mockResolvedValue({ data: [] });
      await service.getWeaponsByKind('en', 'bow');
      expect(mockDataService.getWeaponsByKind).toHaveBeenCalledWith(
        'en',
        'bow',
      );
    });

    it('throws for empty kind', async () => {
      await expect(service.getWeaponsByKind('en', '')).rejects.toThrow(
        'Weapon kind is required',
      );
    });
  });

  describe('getArmorByRarity()', () => {
    it('delegates for valid rarity (1-10)', async () => {
      mockDataService.getArmorByRarity.mockResolvedValue({ data: [{ id: 1 }] });
      const result = await service.getArmorByRarity('en', 5);
      expect(result).toHaveLength(1);
    });

    it('throws for rarity 0', async () => {
      await expect(service.getArmorByRarity('en', 0)).rejects.toThrow(
        'between 1 and 10',
      );
    });

    it('throws for rarity 11', async () => {
      await expect(service.getArmorByRarity('en', 11)).rejects.toThrow(
        'between 1 and 10',
      );
    });

    it('throws for non-integer rarity', async () => {
      await expect(service.getArmorByRarity('en', 3.5)).rejects.toThrow(
        'integer',
      );
    });
  });

  // ─── statistics ───────────────────────────────────────────────────────────────

  describe('getDataStatistics()', () => {
    it('returns statistics from data service', async () => {
      const stats = {
        weapons: { total: 10, byKind: {} },
        armor: { total: 5, byRarity: {} },
        charms: { total: 3, totalRanks: 9 },
        decorations: { total: 7, byRarity: {} },
        skills: { total: 20 },
      };
      mockDataService.getDataStatistics.mockResolvedValue(stats);

      const result = await service.getDataStatistics('en');

      expect(result).toEqual(stats);
    });
  });

  // ─── cache management ─────────────────────────────────────────────────────────

  describe('clearCache()', () => {
    it('delegates to cache service', async () => {
      mockCacheService.clearCache.mockResolvedValue({
        success: true,
        message: 'Cleared',
      });
      const result = await service.clearCache('weapons', 'en');
      expect(mockCacheService.clearCache).toHaveBeenCalledWith('weapons', 'en');
      expect(result.success).toBe(true);
    });

    it('returns failure on exception', async () => {
      mockCacheService.clearCache.mockRejectedValue(new Error('fail'));
      const result = await service.clearCache();
      expect(result.success).toBe(false);
    });
  });

  describe('getCacheStatistics()', () => {
    it('delegates to cache service', async () => {
      mockCacheService.getCacheStatistics.mockResolvedValue({
        success: true,
        stats: { size: 1 },
      });
      const result = await service.getCacheStatistics();
      expect(result.success).toBe(true);
    });
  });

  describe('warmupCache()', () => {
    it('delegates to cache service', async () => {
      mockCacheService.warmupCache.mockResolvedValue({
        success: true,
        message: 'Done',
      });
      const result = await service.warmupCache('en');
      expect(result.success).toBe(true);
    });
  });

  // ─── utility operations ───────────────────────────────────────────────────────

  describe('getSupportedLocales()', () => {
    it('returns locales from cache stats when available', async () => {
      mockCacheService.getCacheStatistics.mockResolvedValue({
        success: true,
        stats: { locales: ['es', 'en', 'ja'] },
      });

      const result = await service.getSupportedLocales();
      expect(result).toContain('en');
    });

    it('returns default locales when cache stats fails', async () => {
      mockCacheService.getCacheStatistics.mockResolvedValue({ success: false });
      const result = await service.getSupportedLocales();
      expect(result).toContain('es');
    });
  });

  describe('getAvailableResources()', () => {
    it('returns resources from cache stats when available', async () => {
      mockCacheService.getCacheStatistics.mockResolvedValue({
        success: true,
        stats: { resources: ['weapons', 'armor'] },
      });

      const result = await service.getAvailableResources();
      expect(result).toContain('weapons');
    });

    it('returns default resources when cache stats fails', async () => {
      mockCacheService.getCacheStatistics.mockResolvedValue({ success: false });
      const result = await service.getAvailableResources();
      expect(result).toContain('skills');
    });
  });

  describe('formatCacheSize()', () => {
    it('delegates to cache service', () => {
      mockCacheService.formatCacheSize.mockReturnValue('1.2 MB');
      expect(service.formatCacheSize(1200000)).toBe('1.2 MB');
    });
  });

  describe('formatCacheAge()', () => {
    it('delegates to cache service', () => {
      mockCacheService.formatCacheAge.mockReturnValue('5 minutes');
      expect(service.formatCacheAge(300000)).toBe('5 minutes');
    });
  });
});
