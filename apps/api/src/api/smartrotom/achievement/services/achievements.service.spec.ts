import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AchievementsService } from './achievements.service';
import { ACHIEVEMENTS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  findUserAchievements: jest.fn(),
  findUserAchievementById: jest.fn(),
  findUserAchievementStatus: jest.fn(),
  achievementExists: jest.fn(),
  createUserAchievement: jest.fn(),
};

const UUID = 'abc-123-uuid';
const ACHIEVEMENT_ID = 'ach-001';

const mockAchievement = {
  uuid: UUID,
  achievementId: ACHIEVEMENT_ID,
  progress: 1,
  completed: 1,
  completedAt: new Date(),
};

describe('AchievementsService (smartrotom)', () => {
  let service: AchievementsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: ACHIEVEMENTS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUserAchievements ──────────────────────────────────────────────────────

  describe('getUserAchievements()', () => {
    it('returns achievements from repo', async () => {
      mockRepo.findUserAchievements.mockResolvedValue([mockAchievement]);

      await expect(service.getUserAchievements(UUID)).resolves.toEqual([
        mockAchievement,
      ]);
      expect(mockRepo.findUserAchievements).toHaveBeenCalledWith(UUID);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getUserAchievements('')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepo.findUserAchievements).not.toHaveBeenCalled();
    });
  });

  // ─── getUserAchievementById ───────────────────────────────────────────────────

  describe('getUserAchievementById()', () => {
    it('returns achievement when found', async () => {
      mockRepo.findUserAchievementById.mockResolvedValue(mockAchievement);

      await expect(
        service.getUserAchievementById(UUID, ACHIEVEMENT_ID),
      ).resolves.toEqual(mockAchievement);
      expect(mockRepo.findUserAchievementById).toHaveBeenCalledWith(
        UUID,
        ACHIEVEMENT_ID,
      );
    });

    it('throws NotFoundException when achievement not found', async () => {
      mockRepo.findUserAchievementById.mockResolvedValue(null);

      await expect(
        service.getUserAchievementById(UUID, ACHIEVEMENT_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(
        service.getUserAchievementById('', ACHIEVEMENT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when achievementId is empty', async () => {
      await expect(service.getUserAchievementById(UUID, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── checkUserHasAchievement ──────────────────────────────────────────────────

  describe('checkUserHasAchievement()', () => {
    it('returns completed status when achievement found for user', async () => {
      mockRepo.findUserAchievementStatus.mockResolvedValue({ completed: 1 });

      const result = await service.checkUserHasAchievement(
        UUID,
        ACHIEVEMENT_ID,
      );

      expect(result).toEqual({ completed: 1 });
    });

    it('returns error object with null completed when status not found', async () => {
      mockRepo.findUserAchievementStatus.mockResolvedValue(null);

      const result = await service.checkUserHasAchievement(
        UUID,
        ACHIEVEMENT_ID,
      );

      expect(result).toEqual({
        error: 'Achievement not found',
        completed: null,
      });
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(
        service.checkUserHasAchievement('', ACHIEVEMENT_ID),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when achievementId is empty', async () => {
      await expect(service.checkUserHasAchievement(UUID, '')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── validateAchievementExists ────────────────────────────────────────────────

  describe('validateAchievementExists()', () => {
    it('returns true when achievement exists', async () => {
      mockRepo.achievementExists.mockResolvedValue(true);

      await expect(
        service.validateAchievementExists(ACHIEVEMENT_ID),
      ).resolves.toBe(true);
    });

    it('returns false when achievement does not exist', async () => {
      mockRepo.achievementExists.mockResolvedValue(false);

      await expect(
        service.validateAchievementExists(ACHIEVEMENT_ID),
      ).resolves.toBe(false);
    });

    it('returns false when repo throws (swallows error)', async () => {
      mockRepo.achievementExists.mockRejectedValue(new Error('DB error'));

      await expect(
        service.validateAchievementExists(ACHIEVEMENT_ID),
      ).resolves.toBe(false);
    });
  });

  // ─── createUserAchievement ────────────────────────────────────────────────────

  describe('createUserAchievement()', () => {
    const data = {
      uuid: UUID,
      achievementId: ACHIEVEMENT_ID,
      progress: 1,
      completed: 1,
      completedAt: new Date(),
    };

    it('delegates to repo and returns result', async () => {
      mockRepo.createUserAchievement.mockResolvedValue({ insertId: 42 });

      await expect(service.createUserAchievement(data as any)).resolves.toEqual(
        { insertId: 42 },
      );
      expect(mockRepo.createUserAchievement).toHaveBeenCalledWith(data);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(
        service.createUserAchievement({ ...data, uuid: '' } as any),
      ).rejects.toThrow(BadRequestException);
      expect(mockRepo.createUserAchievement).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when achievementId is empty', async () => {
      await expect(
        service.createUserAchievement({ ...data, achievementId: '' } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
