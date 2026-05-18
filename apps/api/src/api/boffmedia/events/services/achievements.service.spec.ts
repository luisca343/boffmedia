import { Test, TestingModule } from '@nestjs/testing';
import { AchievementsService } from './achievements.service';
import { AchievementsRepository } from '../../../_repositories/boffmedia/achievements.repository';

const mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEventId: jest.fn(),
  checkEventExists: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getParticipantProgress: jest.fn(),
  getParticipantProgressByEvent: jest.fn(),
};

const mockAchievement = {
  id: 1,
  eventId: 10,
  name: 'First Catch',
  description: 'Catch your first Pokémon',
  icon: 'pokeball.png',
  maxProgress: 1,
  points: 100,
  itemType: 'badge',
  category: 'catching',
  rarity: 'common',
  order: 0,
};

describe('AchievementsService', () => {
  let service: AchievementsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AchievementsService,
        { provide: AchievementsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AchievementsService>(AchievementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllAchievements ───────────────────────────────────────────────────────

  describe('getAllAchievements()', () => {
    it('returns all achievements from repo', async () => {
      mockRepo.findAll.mockResolvedValue([mockAchievement]);

      await expect(service.getAllAchievements()).resolves.toEqual([mockAchievement]);
      expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // ─── getAchievementById ───────────────────────────────────────────────────────

  describe('getAchievementById()', () => {
    it('returns achievement by id', async () => {
      mockRepo.findById.mockResolvedValue(mockAchievement);

      await expect(service.getAchievementById(1)).resolves.toEqual(mockAchievement);
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
    });
  });

  // ─── getAchievementsByEventId ─────────────────────────────────────────────────

  describe('getAchievementsByEventId()', () => {
    it('returns achievements when event exists', async () => {
      mockRepo.checkEventExists.mockResolvedValue(true);
      mockRepo.findByEventId.mockResolvedValue([mockAchievement]);

      const result = await service.getAchievementsByEventId(10);

      expect(result).toEqual([mockAchievement]);
      expect(mockRepo.checkEventExists).toHaveBeenCalledWith(10);
      expect(mockRepo.findByEventId).toHaveBeenCalledWith(10);
    });

    it('returns empty array when event does not exist', async () => {
      mockRepo.checkEventExists.mockResolvedValue(false);

      const result = await service.getAchievementsByEventId(999);

      expect(result).toEqual([]);
      expect(mockRepo.findByEventId).not.toHaveBeenCalled();
    });
  });

  // ─── createAchievement ────────────────────────────────────────────────────────

  describe('createAchievement()', () => {
    const dto = {
      name: 'First Catch',
      description: 'Catch your first Pokémon',
      icon: 'pokeball.png',
      maxProgress: 5,
      points: 100,
      itemType: 'achievement' as const,
      category: 'competition' as const,
      rarity: 'gold' as const,
      order: 2,
    };

    it('creates achievement with provided dto fields', async () => {
      mockRepo.create.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue(mockAchievement);

      const result = await service.createAchievement(10, dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 10,
          name: dto.name,
          maxProgress: 5,
          order: 2,
        }),
      );
      expect(result).toEqual(mockAchievement);
    });

    it('defaults maxProgress to 1 when not provided', async () => {
      mockRepo.create.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue(mockAchievement);

      await service.createAchievement(10, { ...dto, maxProgress: undefined });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ maxProgress: 1 }),
      );
    });

    it('defaults order to 0 when not provided', async () => {
      mockRepo.create.mockResolvedValue({ insertId: 1 });
      mockRepo.findById.mockResolvedValue(mockAchievement);

      await service.createAchievement(10, { ...dto, order: undefined });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0 }),
      );
    });

    it('fetches created achievement by insertId', async () => {
      mockRepo.create.mockResolvedValue({ insertId: 42 });
      mockRepo.findById.mockResolvedValue({ ...mockAchievement, id: 42 });

      await service.createAchievement(10, dto);

      expect(mockRepo.findById).toHaveBeenCalledWith(42);
    });
  });

  // ─── updateAchievement ────────────────────────────────────────────────────────

  describe('updateAchievement()', () => {
    const dto = {
      name: 'Updated Name',
      description: 'Updated desc',
      icon: 'new.png',
      maxProgress: 3,
      points: 200,
      category: 'challenge' as const,
      rarity: 'silver' as const,
      order: 1,
    };

    it('updates and returns refreshed achievement', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue({ ...mockAchievement, name: 'Updated Name' });

      const result = await service.updateAchievement(1, dto);

      expect(mockRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: 'Updated Name' }));
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(result.name).toBe('Updated Name');
    });

    it('defaults maxProgress to 1 when not provided in update', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.findById.mockResolvedValue(mockAchievement);

      await service.updateAchievement(1, { ...dto, maxProgress: undefined });

      expect(mockRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({ maxProgress: 1 }));
    });
  });

  // ─── validateAchievementExists ────────────────────────────────────────────────

  describe('validateAchievementExists()', () => {
    it('returns true when achievement is found', async () => {
      mockRepo.findById.mockResolvedValue(mockAchievement);

      await expect(service.validateAchievementExists(1)).resolves.toBe(true);
    });

    it('returns false when achievement is not found', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.validateAchievementExists(999)).resolves.toBe(false);
    });
  });

  // ─── validateEventExists ──────────────────────────────────────────────────────

  describe('validateEventExists()', () => {
    it('delegates to repo and returns result', async () => {
      mockRepo.checkEventExists.mockResolvedValue(true);

      await expect(service.validateEventExists(10)).resolves.toBe(true);
      expect(mockRepo.checkEventExists).toHaveBeenCalledWith(10);
    });
  });

  // ─── getParticipantProgress ───────────────────────────────────────────────────

  describe('getParticipantProgress()', () => {
    it('returns progress from repo', async () => {
      const progress = [{ achievementId: 1, currentProgress: 2 }];
      mockRepo.getParticipantProgress.mockResolvedValue(progress);

      await expect(service.getParticipantProgress(5)).resolves.toEqual(progress);
      expect(mockRepo.getParticipantProgress).toHaveBeenCalledWith(5);
    });
  });

  // ─── getParticipantProgressByEvent ───────────────────────────────────────────

  describe('getParticipantProgressByEvent()', () => {
    it('returns progress when event exists', async () => {
      mockRepo.checkEventExists.mockResolvedValue(true);
      const progress = [{ achievementId: 1, currentProgress: 1 }];
      mockRepo.getParticipantProgressByEvent.mockResolvedValue(progress);

      const result = await service.getParticipantProgressByEvent(5, 10);

      expect(result).toEqual(progress);
      expect(mockRepo.getParticipantProgressByEvent).toHaveBeenCalledWith(5, 10);
    });

    it('returns empty array when event does not exist', async () => {
      mockRepo.checkEventExists.mockResolvedValue(false);

      const result = await service.getParticipantProgressByEvent(5, 999);

      expect(result).toEqual([]);
      expect(mockRepo.getParticipantProgressByEvent).not.toHaveBeenCalled();
    });
  });
});
