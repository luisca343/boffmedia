import { Test, TestingModule } from '@nestjs/testing';
import { RewardService } from './reward.service';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  findAllRewards: jest.fn(),
  findRewardsByIds: jest.fn(),
};

const makeReward = (id: number, type: string, name: string, value: number) =>
  ({ id, type, name, value } as any);

describe('RewardService', () => {
  let service: RewardService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardService,
        { provide: MINE_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<RewardService>(RewardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllRewards ────────────────────────────────────────────────────────────

  describe('getAllRewards()', () => {
    it('returns all rewards from repo', async () => {
      const rewards = [makeReward(1, 'weapon', 'Sword', 100)];
      mockRepo.findAllRewards.mockResolvedValue(rewards);

      await expect(service.getAllRewards()).resolves.toEqual(rewards);
      expect(mockRepo.findAllRewards).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getRewardsByType ─────────────────────────────────────────────────────────

  describe('getRewardsByType()', () => {
    const rewards = [
      makeReward(1, 'weapon', 'Sword', 300),
      makeReward(2, 'weapon', 'Axe', 200),
      makeReward(3, 'material', 'Ruby', 1000),
    ];

    beforeEach(() => {
      mockRepo.findAllRewards.mockResolvedValue(rewards);
    });

    it('groups rewards by type', async () => {
      const result = await service.getRewardsByType();

      expect(result.drops['weapon'].items).toHaveLength(2);
      expect(result.drops['material'].items).toHaveLength(1);
    });

    it('accumulates totalValue per type', async () => {
      const result = await service.getRewardsByType();

      expect(result.drops['weapon'].totalValue).toBe(500); // 300 + 200
      expect(result.drops['material'].totalValue).toBe(1000);
    });

    it('sorts types by totalValue descending', async () => {
      const result = await service.getRewardsByType();

      const keys = Object.keys(result.drops);
      expect(keys[0]).toBe('material'); // 1000 > 500
      expect(keys[1]).toBe('weapon');
    });

    it('computes overall totalValue across all types', async () => {
      const result = await service.getRewardsByType();

      expect(result.totalValue).toBe(1500); // 300 + 200 + 1000
    });

    it('returns zero totalValue and empty drops when no rewards exist', async () => {
      mockRepo.findAllRewards.mockResolvedValue([]);

      const result = await service.getRewardsByType();

      expect(result.totalValue).toBe(0);
      expect(result.drops).toEqual({});
    });
  });

  // ─── getRewardById ────────────────────────────────────────────────────────────

  describe('getRewardById()', () => {
    it('returns the first reward from findRewardsByIds', async () => {
      const reward = makeReward(1, 'weapon', 'Sword', 300);
      mockRepo.findRewardsByIds.mockResolvedValue([reward]);

      await expect(service.getRewardById(1)).resolves.toEqual(reward);
      expect(mockRepo.findRewardsByIds).toHaveBeenCalledWith([1]);
    });

    it('returns null when no reward found', async () => {
      mockRepo.findRewardsByIds.mockResolvedValue([]);

      await expect(service.getRewardById(999)).resolves.toBeNull();
    });
  });

  // ─── validateRewardsExist ─────────────────────────────────────────────────────

  describe('validateRewardsExist()', () => {
    it('returns true immediately when given an empty array', async () => {
      await expect(service.validateRewardsExist([])).resolves.toBe(true);
      expect(mockRepo.findRewardsByIds).not.toHaveBeenCalled();
    });

    it('returns true when all reward ids are found', async () => {
      mockRepo.findRewardsByIds.mockResolvedValue([
        makeReward(1, 'weapon', 'Sword', 100),
        makeReward(2, 'material', 'Ruby', 200),
      ]);

      await expect(service.validateRewardsExist([1, 2])).resolves.toBe(true);
    });

    it('returns false when some ids are not found', async () => {
      mockRepo.findRewardsByIds.mockResolvedValue([makeReward(1, 'weapon', 'Sword', 100)]);

      await expect(service.validateRewardsExist([1, 999])).resolves.toBe(false);
    });
  });

  // ─── getRewardDropRates ───────────────────────────────────────────────────────

  describe('getRewardDropRates()', () => {
    it('calculates each reward drop rate as (value / totalWeight) * 100', async () => {
      mockRepo.findAllRewards.mockResolvedValue([
        makeReward(1, 'weapon', 'Sword', 300),
        makeReward(2, 'material', 'Ruby', 700),
      ]);

      const result = await service.getRewardDropRates();

      expect(result[1].dropRate).toBeCloseTo(30); // 300/1000 * 100
      expect(result[2].dropRate).toBeCloseTo(70); // 700/1000 * 100
    });

    it('includes the reward name in each entry', async () => {
      mockRepo.findAllRewards.mockResolvedValue([makeReward(1, 'weapon', 'Iron Sword', 100)]);

      const result = await service.getRewardDropRates();

      expect(result[1].name).toBe('Iron Sword');
    });

    it('returns empty object when no rewards exist', async () => {
      mockRepo.findAllRewards.mockResolvedValue([]);

      await expect(service.getRewardDropRates()).resolves.toEqual({});
    });
  });
});
