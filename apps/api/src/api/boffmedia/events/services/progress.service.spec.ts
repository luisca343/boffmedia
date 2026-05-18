import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { AchievementsService } from './achievements.service';
import { TeamsService } from './teams.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

jest.mock('@/_db/schema/Events', () => ({
  boffMediaParticipantProgress: { participantId: 'participantId', achievementId: 'achievementId' },
  validateParticipantCanReceiveAchievement: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validateParticipantCanReceiveAchievement } = require('@/_db/schema/Events');

const mockWhere = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
const mockOnDuplicateKeyUpdate = jest.fn();
const mockValues = jest.fn().mockReturnValue({ onDuplicateKeyUpdate: mockOnDuplicateKeyUpdate });

const mockDb = {
  select: jest.fn().mockReturnValue({ from: mockFrom }),
  insert: jest.fn().mockReturnValue({ values: mockValues }),
};

const mockAchievementsService = {
  getAchievementById: jest.fn(),
};

const mockTeamsService = {
  updateTeamScore: jest.fn(),
};

const mockProgress = {
  participantId: 1,
  achievementId: 2,
  currentProgress: 3,
  isCompleted: 0,
  completedAt: null,
  lastUpdated: new Date(),
  createdAt: new Date(),
};

const mockAchievement = {
  id: 2,
  maxProgress: 5,
  points: 100,
  name: 'Collector',
};

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Reset chainable mock defaults
    mockDb.select.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockResolvedValue([mockProgress]);
    mockDb.insert.mockReturnValue({ values: mockValues });
    mockValues.mockReturnValue({ onDuplicateKeyUpdate: mockOnDuplicateKeyUpdate });
    mockOnDuplicateKeyUpdate.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: AchievementsService, useValue: mockAchievementsService },
        { provide: TeamsService, useValue: mockTeamsService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── updateProgress ───────────────────────────────────────────────────────────

  describe('updateProgress()', () => {
    beforeEach(() => {
      validateParticipantCanReceiveAchievement.mockResolvedValue(true);
      mockAchievementsService.getAchievementById.mockResolvedValue(mockAchievement);
    });

    it('inserts/updates progress record and returns result', async () => {
      mockWhere.mockResolvedValue([mockProgress]);

      const result = await service.updateProgress(1, 2, 3);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ participantId: 1, achievementId: 2, currentProgress: 3 }),
      );
      expect(result).toEqual(mockProgress);
    });

    it('marks isCompleted=1 when progress meets maxProgress', async () => {
      const completedProgress = { ...mockProgress, isCompleted: 1 };
      mockWhere.mockResolvedValue([completedProgress]);

      await service.updateProgress(1, 2, 5);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ isCompleted: 1 }),
      );
    });

    it('marks isCompleted=0 when progress is below maxProgress', async () => {
      await service.updateProgress(1, 2, 2);

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ isCompleted: 0, completedAt: null }),
      );
    });

    it('updates team score when achievement is completed and teamId is provided', async () => {
      mockWhere.mockResolvedValue([{ ...mockProgress, isCompleted: 1 }]);

      await service.updateProgress(1, 2, 5, 99);

      expect(mockTeamsService.updateTeamScore).toHaveBeenCalledWith(99);
    });

    it('does not update team score when not completed', async () => {
      await service.updateProgress(1, 2, 2, 99);

      expect(mockTeamsService.updateTeamScore).not.toHaveBeenCalled();
    });

    it('does not update team score when completed but no teamId', async () => {
      await service.updateProgress(1, 2, 5);

      expect(mockTeamsService.updateTeamScore).not.toHaveBeenCalled();
    });

    it('throws when participant is not eligible for achievement', async () => {
      validateParticipantCanReceiveAchievement.mockResolvedValue(false);

      await expect(service.updateProgress(1, 2, 3)).rejects.toThrow(
        'Participant is not eligible to receive this achievement',
      );
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('throws when achievement is not found', async () => {
      mockAchievementsService.getAchievementById.mockResolvedValue(null);

      await expect(service.updateProgress(1, 2, 3)).rejects.toThrow(
        'Achievement not found',
      );
    });
  });

  // ─── getParticipantProgress ───────────────────────────────────────────────────

  describe('getParticipantProgress()', () => {
    it('returns first result from db query', async () => {
      mockWhere.mockResolvedValue([mockProgress]);

      const result = await service.getParticipantProgress(1, 2);

      expect(result).toEqual(mockProgress);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('returns undefined when no progress record exists', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.getParticipantProgress(1, 999);

      expect(result).toBeUndefined();
    });
  });

  // ─── getAllParticipantProgress ─────────────────────────────────────────────────

  describe('getAllParticipantProgress()', () => {
    it('returns all progress records for a participant', async () => {
      const allProgress = [mockProgress, { ...mockProgress, achievementId: 3 }];
      mockWhere.mockResolvedValue(allProgress);

      const result = await service.getAllParticipantProgress(1);

      expect(result).toEqual(allProgress);
    });

    it('returns empty array when participant has no progress', async () => {
      mockWhere.mockResolvedValue([]);

      const result = await service.getAllParticipantProgress(999);

      expect(result).toEqual([]);
    });
  });
});
