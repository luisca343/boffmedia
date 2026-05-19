import { Test, TestingModule } from '@nestjs/testing';
import { StreakService } from './streak.service';
import { ARCADE_STREAK_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

jest.mock('@api/smartrotom/_main/_config/daily-rewards.config', () => ({
  loadRewardsConfig: jest.fn().mockReturnValue({
    name: 'Season-1',
    totalDays: 7,
    rewards: [
      { day: 1, type: 'CURRENCY', amount: 100, description: 'Day 1 reward' },
      { day: 2, type: 'CURRENCY', amount: 150, description: 'Day 2 reward' },
      { day: 3, type: 'ITEM', amount: 1, description: 'Day 3 reward' },
      { day: 4, type: 'CURRENCY', amount: 200, description: 'Day 4 reward' },
      { day: 5, type: 'ITEM', amount: 1, description: 'Day 5 reward' },
      { day: 6, type: 'CURRENCY', amount: 250, description: 'Day 6 reward' },
      { day: 7, type: 'ITEM', amount: 1, description: 'Day 7 reward' },
    ],
  }),
}));

const mockRepo = {
  findByUuid: jest.fn(),
  findById: jest.fn(),
  createUserStreak: jest.fn(),
  canClaimToday: jest.fn(),
  incrementStreak: jest.fn(),
  resetStreak: jest.fn(),
  getStreakStats: jest.fn(),
  updateUserStreak: jest.fn(),
};

const UUID = 'player-uuid';

const mockStreak = {
  uuid: UUID,
  streak: 3,
  totalClaims: 3,
  lastClaimed: null,
  lastBanner: 'Season-1',
};

describe('StreakService', () => {
  let service: StreakService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreakService,
        { provide: ARCADE_STREAK_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<StreakService>(StreakService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUserStreak ────────────────────────────────────────────────────────────

  describe('getUserStreak()', () => {
    it('returns streak data for existing user', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockStreak);

      const result = await service.getUserStreak(UUID);

      expect(result.streak).toBe(3);
      expect(result.totalClaims).toBe(3);
      expect(result.currentBanner).toBe('Season-1');
      expect(result.totalDays).toBe(7);
      expect(result.nextResetTime).toBeDefined();
    });

    it('creates new streak record when none exists', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);
      mockRepo.createUserStreak.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue({
        ...mockStreak,
        streak: 0,
        totalClaims: 0,
      });

      const result = await service.getUserStreak(UUID);

      expect(mockRepo.createUserStreak).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: UUID, streak: 0, totalClaims: 0 }),
      );
      expect(result.streak).toBe(0);
    });

    it('returns bannerChanged=true when lastBanner differs from current config', async () => {
      mockRepo.findByUuid.mockResolvedValue({
        ...mockStreak,
        lastBanner: 'Season-0',
      });

      const result = await service.getUserStreak(UUID);

      expect(result.bannerChanged).toBe(true);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getUserStreak('')).rejects.toThrow(
        'UUID is required',
      );
    });
  });

  // ─── canClaimReward ───────────────────────────────────────────────────────────

  describe('canClaimReward()', () => {
    it('returns canClaim from repository and streak data', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockStreak);
      mockRepo.canClaimToday.mockResolvedValue(true);

      const result = await service.canClaimReward(UUID);

      expect(result.canClaim).toBe(true);
      expect(result.streak).toBeDefined();
    });

    it('returns canClaim=false when already claimed today', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockStreak);
      mockRepo.canClaimToday.mockResolvedValue(false);

      const result = await service.canClaimReward(UUID);

      expect(result.canClaim).toBe(false);
    });
  });

  // ─── claimDailyReward ─────────────────────────────────────────────────────────

  describe('claimDailyReward()', () => {
    it('increments streak and returns reward on success', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockStreak);
      mockRepo.canClaimToday.mockResolvedValue(true);
      mockRepo.incrementStreak.mockResolvedValue({ ...mockStreak, streak: 4 });

      const result = await service.claimDailyReward(UUID);

      expect(result.success).toBe(true);
      expect(result.streak.streak).toBe(4);
      expect(result.reward).toBeDefined();
      expect(result.message).toContain('Day 4');
    });

    it('throws when reward already claimed today', async () => {
      mockRepo.findByUuid.mockResolvedValue(mockStreak);
      mockRepo.canClaimToday.mockResolvedValue(false);

      await expect(service.claimDailyReward(UUID)).rejects.toThrow(
        'Daily reward already claimed today',
      );
    });
  });

  // ─── resetUserStreak ──────────────────────────────────────────────────────────

  describe('resetUserStreak()', () => {
    it('resets streak and returns success', async () => {
      mockRepo.resetStreak.mockResolvedValue(true);

      const result = await service.resetUserStreak(UUID);

      expect(result.success).toBe(true);
      expect(result.message).toContain('reset');
    });

    it('throws when streak record not found', async () => {
      mockRepo.resetStreak.mockResolvedValue(false);

      await expect(service.resetUserStreak(UUID)).rejects.toThrow(
        'Streak not found or already reset',
      );
    });
  });

  // ─── updateLastBanner ─────────────────────────────────────────────────────────

  describe('updateLastBanner()', () => {
    it('updates banner name on streak', async () => {
      const updatedStreak = { ...mockStreak, lastBanner: 'Season-2' };
      mockRepo.findByUuid.mockResolvedValue(mockStreak);
      mockRepo.updateUserStreak.mockResolvedValue(updatedStreak);

      const result = await service.updateLastBanner(UUID, 'Season-2');

      expect(result.lastBanner).toBe('Season-2');
      expect(mockRepo.updateUserStreak).toHaveBeenCalledWith(
        UUID,
        expect.objectContaining({ lastBanner: 'Season-2' }),
      );
    });

    it('throws when banner name is empty', async () => {
      await expect(service.updateLastBanner(UUID, '')).rejects.toThrow(
        'Banner name is required',
      );
    });

    it('throws when streak record not found', async () => {
      mockRepo.findByUuid.mockResolvedValue(null);

      await expect(service.updateLastBanner(UUID, 'Season-2')).rejects.toThrow(
        'Streak record not found',
      );
    });
  });
});
