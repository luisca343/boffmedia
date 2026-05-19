import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BattleAchievementService } from './battle-achievement.service';
import { AchievementsService } from './achievements.service';
import { ReplaysService } from './replays.service';

const mockAchievementsService = {
  validateAchievementExists: jest.fn(),
  checkUserHasAchievement: jest.fn(),
  createUserAchievement: jest.fn(),
};

const mockReplaysService = {
  createReplay: jest.fn(),
  createUserReplay: jest.fn(),
};

const UUID = 'abc-123-uuid';
const LOGRO = 'ach-001';

const validBattle = {
  uuid: UUID,
  logro: LOGRO,
  name1: 'TrainerAsh',
  name2: 'TrainerGary',
  team1: [{ name: 'Pikachu' }],
  team2: [{ name: 'Blastoise' }],
  replay: 'replay-data-base64',
  victoria: true,
};

describe('BattleAchievementService', () => {
  let service: BattleAchievementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleAchievementService,
        { provide: AchievementsService, useValue: mockAchievementsService },
        { provide: ReplaysService, useValue: mockReplaysService },
      ],
    }).compile();

    service = module.get<BattleAchievementService>(BattleAchievementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── processBattleAchievement — happy path ────────────────────────────────────

  describe('processBattleAchievement() — happy path', () => {
    beforeEach(() => {
      mockAchievementsService.validateAchievementExists.mockResolvedValue(true);
      mockAchievementsService.checkUserHasAchievement.mockResolvedValue({
        completed: null,
      });
      mockReplaysService.createReplay.mockResolvedValue({ insertId: 10 });
      mockReplaysService.createUserReplay.mockResolvedValue({ insertId: 99 });
      mockAchievementsService.createUserAchievement.mockResolvedValue({
        insertId: 200,
      });
    });

    it('returns success and unlocks achievement', async () => {
      const result = await service.processBattleAchievement(validBattle);

      expect(result).toEqual({
        success: true,
        message: 'Achievement unlocked successfully',
      });
    });

    it('creates replay with name1 as winner', async () => {
      await service.processBattleAchievement(validBattle);

      expect(mockReplaysService.createReplay).toHaveBeenCalledWith(
        expect.objectContaining({
          side1: 'TrainerAsh',
          side2: 'TrainerGary',
          winner: 'TrainerAsh',
        }),
      );
    });

    it('serializes teams to JSON strings in replay', async () => {
      await service.processBattleAchievement(validBattle);

      expect(mockReplaysService.createReplay).toHaveBeenCalledWith(
        expect.objectContaining({
          team1: JSON.stringify(validBattle.team1),
          team2: JSON.stringify(validBattle.team2),
        }),
      );
    });

    it('creates user-replay association with the replay insertId', async () => {
      await service.processBattleAchievement(validBattle);

      expect(mockReplaysService.createUserReplay).toHaveBeenCalledWith(
        UUID,
        10,
      );
    });

    it('creates user achievement with completed=1 and dataId=replayId', async () => {
      await service.processBattleAchievement(validBattle);

      expect(
        mockAchievementsService.createUserAchievement,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: UUID,
          achievementId: LOGRO,
          progress: 1,
          completed: 1,
          dataId: 10,
        }),
      );
    });

    it('executes steps in order: validate → check status → replay → user-replay → achievement', async () => {
      const callOrder: string[] = [];
      mockAchievementsService.validateAchievementExists.mockImplementation(
        async () => {
          callOrder.push('validateExists');
          return true;
        },
      );
      mockAchievementsService.checkUserHasAchievement.mockImplementation(
        async () => {
          callOrder.push('checkStatus');
          return { completed: null };
        },
      );
      mockReplaysService.createReplay.mockImplementation(async () => {
        callOrder.push('createReplay');
        return { insertId: 10 };
      });
      mockReplaysService.createUserReplay.mockImplementation(async () => {
        callOrder.push('createUserReplay');
        return { insertId: 99 };
      });
      mockAchievementsService.createUserAchievement.mockImplementation(
        async () => {
          callOrder.push('createAchievement');
          return { insertId: 200 };
        },
      );

      await service.processBattleAchievement(validBattle);

      expect(callOrder).toEqual([
        'validateExists',
        'checkStatus',
        'createReplay',
        'createUserReplay',
        'createAchievement',
      ]);
    });
  });

  // ─── processBattleAchievement — early exits ───────────────────────────────────

  describe('processBattleAchievement() — early exits', () => {
    it('throws NotFoundException when achievement does not exist', async () => {
      mockAchievementsService.validateAchievementExists.mockResolvedValue(
        false,
      );

      await expect(
        service.processBattleAchievement(validBattle),
      ).rejects.toThrow(NotFoundException);
      expect(mockReplaysService.createReplay).not.toHaveBeenCalled();
    });

    it('returns already-completed response when achievement is already done', async () => {
      mockAchievementsService.validateAchievementExists.mockResolvedValue(true);
      mockAchievementsService.checkUserHasAchievement.mockResolvedValue({
        completed: 1,
      });

      const result = await service.processBattleAchievement(validBattle);

      expect(result).toEqual({
        success: false,
        message: 'Achievement already completed',
      });
      expect(mockReplaysService.createReplay).not.toHaveBeenCalled();
    });

    it('returns requires-victory response when victoria is false', async () => {
      mockAchievementsService.validateAchievementExists.mockResolvedValue(true);
      mockAchievementsService.checkUserHasAchievement.mockResolvedValue({
        completed: null,
      });

      const result = await service.processBattleAchievement({
        ...validBattle,
        victoria: false,
      });

      expect(result).toEqual({
        success: false,
        message: 'Achievement requires victory',
      });
      expect(mockReplaysService.createReplay).not.toHaveBeenCalled();
    });

    it('proceeds when completed is null (achievement exists but user has not done it)', async () => {
      mockAchievementsService.validateAchievementExists.mockResolvedValue(true);
      mockAchievementsService.checkUserHasAchievement.mockResolvedValue({
        completed: null,
        error: 'Achievement not found',
      });
      mockReplaysService.createReplay.mockResolvedValue({ insertId: 10 });
      mockReplaysService.createUserReplay.mockResolvedValue({ insertId: 99 });
      mockAchievementsService.createUserAchievement.mockResolvedValue({
        insertId: 200,
      });

      const result = await service.processBattleAchievement(validBattle);

      expect(result.success).toBe(true);
    });
  });

  // ─── processBattleAchievement — validation ────────────────────────────────────

  describe('processBattleAchievement() — input validation', () => {
    it.each([
      ['uuid', { uuid: '' }],
      ['logro', { logro: '' }],
      ['name1', { name1: '' }],
      ['name2', { name2: '' }],
      ['replay', { replay: '' }],
    ])('throws BadRequestException when %s is empty', async (_, override) => {
      await expect(
        service.processBattleAchievement({ ...validBattle, ...override }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when team1 is not an array', async () => {
      await expect(
        service.processBattleAchievement({
          ...validBattle,
          team1: null as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when team2 is not an array', async () => {
      await expect(
        service.processBattleAchievement({
          ...validBattle,
          team2: 'not-array' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when victoria is not a boolean', async () => {
      await expect(
        service.processBattleAchievement({
          ...validBattle,
          victoria: undefined as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
