import { Test, TestingModule } from '@nestjs/testing';
import { MhwildsDataService } from './mhwilds-data.service';
import { MHWILDS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const makeWeaponsResult = (data: any[] = []) => ({
  data,
  fromCache: false,
  fetchTime: new Date(),
});

const mockRepo = {
  getWeapons: jest.fn(),
  getArmor: jest.fn(),
  getCharms: jest.fn(),
  getDecorations: jest.fn(),
  getSkills: jest.fn(),
  getProcessedData: jest.fn(),
  saveProcessedData: jest.fn(),
};

describe('MhwildsDataService', () => {
  let service: MhwildsDataService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MhwildsDataService,
        { provide: MHWILDS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MhwildsDataService>(MhwildsDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── basic data retrieval ─────────────────────────────────────────────────────

  describe('getWeapons()', () => {
    it('returns data and cacheInfo from repository', async () => {
      const weapons = [{ id: 1, name: 'Sword', kind: 'sword-and-shield' }];
      mockRepo.getWeapons.mockResolvedValue(makeWeaponsResult(weapons));

      const result = await service.getWeapons('en');

      expect(mockRepo.getWeapons).toHaveBeenCalledWith('en');
      expect(result.data).toEqual(weapons);
      expect(result.cacheInfo).toBeDefined();
      expect(result.cacheInfo.fromCache).toBe(false);
    });

    it('throws on repository error', async () => {
      mockRepo.getWeapons.mockRejectedValue(new Error('timeout'));
      await expect(service.getWeapons('en')).rejects.toThrow('Failed to get weapons');
    });
  });

  describe('getArmor()', () => {
    it('returns armor data', async () => {
      mockRepo.getArmor.mockResolvedValue(makeWeaponsResult([{ id: 1, rarity: 5 }]));
      const result = await service.getArmor('en');
      expect(result.data[0].rarity).toBe(5);
    });

    it('throws on repository error', async () => {
      mockRepo.getArmor.mockRejectedValue(new Error('fail'));
      await expect(service.getArmor('en')).rejects.toThrow('Failed to get armor');
    });
  });

  describe('getCharms()', () => {
    it('returns charms data', async () => {
      mockRepo.getCharms.mockResolvedValue(makeWeaponsResult([{ id: 1 }]));
      const result = await service.getCharms('en');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getDecorations()', () => {
    it('returns decorations data', async () => {
      mockRepo.getDecorations.mockResolvedValue(makeWeaponsResult([{ id: 1 }]));
      const result = await service.getDecorations('en');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getSkills()', () => {
    it('returns skills data', async () => {
      mockRepo.getSkills.mockResolvedValue(makeWeaponsResult([{ id: 1 }]));
      const result = await service.getSkills('en');
      expect(result.data).toHaveLength(1);
    });
  });

  // ─── getAllCharmRanks ─────────────────────────────────────────────────────────

  describe('getAllCharmRanks()', () => {
    it('flattens all charm ranks with charm reference', async () => {
      const charms = [
        { id: 10, gameId: 100, ranks: [{ id: 1, level: 1 }, { id: 2, level: 2 }] },
        { id: 11, gameId: 101, ranks: [{ id: 3, level: 1 }] },
      ];
      mockRepo.getCharms.mockResolvedValue(makeWeaponsResult(charms));

      const result = await service.getAllCharmRanks('en');

      expect(result.data).toHaveLength(3);
      expect(result.data[0].charm).toEqual({ id: 10, gameId: 100 });
      expect(result.data[2].charm).toEqual({ id: 11, gameId: 101 });
    });

    it('throws on repository error', async () => {
      mockRepo.getCharms.mockRejectedValue(new Error('db fail'));
      await expect(service.getAllCharmRanks('en')).rejects.toThrow('Failed to get charm ranks');
    });
  });

  // ─── createWeaponTree ─────────────────────────────────────────────────────────

  describe('createWeaponTree()', () => {
    it('returns cached tree when both cached entries exist', async () => {
      const cachedTree = [{ id: 1, name: 'Iron Sword', children: [] }];
      const cachedTreeByKind = { 'sword-and-shield': cachedTree };
      mockRepo.getProcessedData
        .mockResolvedValueOnce(cachedTree)
        .mockResolvedValueOnce(cachedTreeByKind);

      const result = await service.createWeaponTree('en');

      expect(result.tree).toEqual(cachedTree);
      expect(result.weaponKinds).toContain('sword-and-shield');
      expect(mockRepo.getWeapons).not.toHaveBeenCalled();
    });

    it('builds and saves tree when cache is empty', async () => {
      mockRepo.getProcessedData.mockResolvedValue(null);
      const weapons = [
        {
          id: 1,
          name: 'Iron Sword',
          kind: 'sword-and-shield',
          rarity: 1,
          crafting: { craftable: true, previous: null, branches: [] },
        },
      ];
      mockRepo.getWeapons.mockResolvedValue(makeWeaponsResult(weapons));
      mockRepo.saveProcessedData.mockResolvedValue(undefined);

      const result = await service.createWeaponTree('en');

      expect(mockRepo.saveProcessedData).toHaveBeenCalledTimes(2);
      expect(result.totalWeapons).toBe(1);
      expect(result.weaponKinds).toContain('sword-and-shield');
    });

    it('throws on error', async () => {
      mockRepo.getProcessedData.mockRejectedValue(new Error('fail'));
      await expect(service.createWeaponTree('en')).rejects.toThrow('Failed to create weapon tree');
    });
  });

  // ─── searchWeaponsByName ──────────────────────────────────────────────────────

  describe('searchWeaponsByName()', () => {
    it('returns weapons matching the search term (case-insensitive)', async () => {
      const weapons = [
        { id: 1, name: 'Iron Sword', kind: 'sword-and-shield' },
        { id: 2, name: 'Bone Bow', kind: 'bow' },
      ];
      mockRepo.getWeapons.mockResolvedValue(makeWeaponsResult(weapons));

      const result = await service.searchWeaponsByName('en', 'sword');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Iron Sword');
    });
  });

  // ─── getWeaponsByKind ─────────────────────────────────────────────────────────

  describe('getWeaponsByKind()', () => {
    it('filters weapons by kind (case-insensitive)', async () => {
      const weapons = [
        { id: 1, name: 'Iron Sword', kind: 'sword-and-shield' },
        { id: 2, name: 'Bone Bow', kind: 'bow' },
      ];
      mockRepo.getWeapons.mockResolvedValue(makeWeaponsResult(weapons));

      const result = await service.getWeaponsByKind('en', 'BOW');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Bone Bow');
    });
  });

  // ─── getArmorByRarity ─────────────────────────────────────────────────────────

  describe('getArmorByRarity()', () => {
    it('filters armor by exact rarity', async () => {
      const armor = [{ id: 1, rarity: 5 }, { id: 2, rarity: 3 }];
      mockRepo.getArmor.mockResolvedValue(makeWeaponsResult(armor));

      const result = await service.getArmorByRarity('en', 5);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].rarity).toBe(5);
    });
  });

  // ─── getDataStatistics ────────────────────────────────────────────────────────

  describe('getDataStatistics()', () => {
    it('returns aggregate counts across all resource types', async () => {
      mockRepo.getWeapons.mockResolvedValue(makeWeaponsResult([{ kind: 'bow' }, { kind: 'bow' }, { kind: 'sword-and-shield' }]));
      mockRepo.getArmor.mockResolvedValue(makeWeaponsResult([{ rarity: 5 }, { rarity: 5 }]));
      mockRepo.getCharms.mockResolvedValue(makeWeaponsResult([{ ranks: [{ level: 1 }] }]));
      mockRepo.getDecorations.mockResolvedValue(makeWeaponsResult([{ rarity: 3 }]));
      mockRepo.getSkills.mockResolvedValue(makeWeaponsResult([{ id: 1 }, { id: 2 }]));

      const result = await service.getDataStatistics('en');

      expect(result.weapons.total).toBe(3);
      expect(result.weapons.byKind['bow']).toBe(2);
      expect(result.armor.total).toBe(2);
      expect(result.charms.totalRanks).toBe(1);
      expect(result.skills.total).toBe(2);
    });

    it('throws on any sub-fetch error', async () => {
      mockRepo.getWeapons.mockRejectedValue(new Error('db fail'));
      await expect(service.getDataStatistics('en')).rejects.toThrow('Failed to get data statistics');
    });
  });
});
