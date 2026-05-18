import { Test, TestingModule } from '@nestjs/testing';
import { AchievementFacadeService } from './achievement.facade.service';
import { AchievementsService } from './services/achievements.service';
import { ReplaysService } from './services/replays.service';
import { BattleAchievementService } from './services/battle-achievement.service';

const mockAchievement = { uuid: 'test-uuid', achievementId: 'first_win', completed: 1 };
const mockReplay = { id: 1, uuid: 'test-uuid', data: 'replay-data' };

describe('AchievementFacadeService', () => {
  let service: AchievementFacadeService;
  let achievementsService: jest.Mocked<
    Pick<
      AchievementsService,
      'getUserAchievements' | 'getUserAchievementById' | 'checkUserHasAchievement' | 'createUserAchievement'
    >
  >;
  let replaysService: jest.Mocked<
    Pick<ReplaysService, 'createReplay' | 'createUserReplay' | 'getUserReplay'>
  >;
  let battleAchievementService: jest.Mocked<
    Pick<BattleAchievementService, 'processBattleAchievement'>
  >;

  beforeEach(async () => {
    const mockAchievementsService = {
      getUserAchievements: jest.fn(),
      getUserAchievementById: jest.fn(),
      checkUserHasAchievement: jest.fn(),
      createUserAchievement: jest.fn(),
    };

    const mockReplaysService = {
      createReplay: jest.fn(),
      createUserReplay: jest.fn(),
      getUserReplay: jest.fn(),
    };

    const mockBattleAchievementService = {
      processBattleAchievement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementFacadeService,
        { provide: AchievementsService, useValue: mockAchievementsService },
        { provide: ReplaysService, useValue: mockReplaysService },
        { provide: BattleAchievementService, useValue: mockBattleAchievementService },
      ],
    }).compile();

    service = module.get<AchievementFacadeService>(AchievementFacadeService);
    achievementsService = module.get(AchievementsService);
    replaysService = module.get(ReplaysService);
    battleAchievementService = module.get(BattleAchievementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserAchievements', () => {
    it('should return all achievements for a player', async () => {
      achievementsService.getUserAchievements.mockResolvedValue([mockAchievement] as any);

      const result = await service.getUserAchievements('test-uuid');

      expect(achievementsService.getUserAchievements).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual([mockAchievement]);
    });
  });

  describe('getUserAchievementById', () => {
    it('should return specific achievement for player', async () => {
      achievementsService.getUserAchievementById.mockResolvedValue(mockAchievement as any);

      const result = await service.getUserAchievementById('test-uuid', 'first_win');

      expect(achievementsService.getUserAchievementById).toHaveBeenCalledWith('test-uuid', 'first_win');
      expect(result).toEqual(mockAchievement);
    });
  });

  describe('checkUserHasAchievement', () => {
    it('should return completed status', async () => {
      achievementsService.checkUserHasAchievement.mockResolvedValue({ completed: 1 });

      const result = await service.checkUserHasAchievement('test-uuid', 'first_win');

      expect(result).toEqual({ completed: 1 });
    });

    it('should return null when achievement not found', async () => {
      achievementsService.checkUserHasAchievement.mockResolvedValue({ completed: null });

      const result = await service.checkUserHasAchievement('test-uuid', 'unknown_achievement');

      expect(result.completed).toBeNull();
    });
  });

  describe('createReplay', () => {
    it('should create a replay', async () => {
      replaysService.createReplay.mockResolvedValue({ insertId: 1 } as any);

      const result = await service.createReplay({ uuid: 'test-uuid' } as any);

      expect(replaysService.createReplay).toHaveBeenCalled();
      expect(result).toEqual({ insertId: 1 });
    });
  });

  describe('createUserReplay', () => {
    it('should link replay to user', async () => {
      replaysService.createUserReplay.mockResolvedValue({ insertId: 1 } as any);

      const result = await service.createUserReplay('test-uuid', 1);

      expect(replaysService.createUserReplay).toHaveBeenCalledWith('test-uuid', 1);
      expect(result).toEqual({ insertId: 1 });
    });
  });

  describe('getUserReplay', () => {
    it('should return replay for player', async () => {
      replaysService.getUserReplay.mockResolvedValue(mockReplay as any);

      const result = await service.getUserReplay('test-uuid', 1);

      expect(replaysService.getUserReplay).toHaveBeenCalledWith('test-uuid', 1);
      expect(result).toEqual(mockReplay);
    });

    it('should return null when replay not found', async () => {
      replaysService.getUserReplay.mockResolvedValue(null);

      const result = await service.getUserReplay('test-uuid', 999);

      expect(result).toBeNull();
    });
  });

  describe('processBattleAchievement', () => {
    it('should process battle and return success', async () => {
      battleAchievementService.processBattleAchievement.mockResolvedValue({
        success: true,
        message: 'Achievement unlocked',
      });

      const result = await service.processBattleAchievement({ uuid: 'test-uuid', won: true } as any);

      expect(result.success).toBe(true);
    });
  });

  describe('unlockAchievement', () => {
    it('should unlock achievement and return success', async () => {
      achievementsService.createUserAchievement.mockResolvedValue(undefined);

      const result = await service.unlockAchievement('test-uuid', 'first_win');

      expect(achievementsService.createUserAchievement).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: 'test-uuid', achievementId: 'first_win', completed: 1 }),
      );
      expect(result).toEqual({ success: true, message: 'Achievement unlocked successfully' });
    });

    it('should return failure if createUserAchievement throws', async () => {
      achievementsService.createUserAchievement.mockRejectedValue(new Error('DB error'));

      const result = await service.unlockAchievement('test-uuid', 'first_win');

      expect(result.success).toBe(false);
      expect(result.message).toBe('DB error');
    });
  });
});
