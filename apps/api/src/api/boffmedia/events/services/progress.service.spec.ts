import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { AchievementsService } from './achievements.service';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { ProgressRepository } from '../repositories/progress.repository';

const mockProgress = {
  participantId: 1,
  achievementId: 2,
  currentProgress: 3,
  isCompleted: false,
  completedAt: null,
  lastUpdated: new Date(),
  createdAt: new Date(),
};

const mockAchievement = {
  id: 2,
  maxProgress: 5,
  points: 100,
  name: 'Collector',
  itemType: 'achievement',
  eventId: 7,
};

describe('ProgressService', () => {
  let service: ProgressService;

  const repo = {
    runInTransaction: jest.fn(),
    canReceiveAchievement: jest.fn(),
    isCompleted: jest.fn(),
    upsertProgress: jest.fn(),
    recomputeTeamScore: jest.fn(),
    findParticipantUserId: jest.fn(),
    findProgress: jest.fn(),
    findAllProgress: jest.fn(),
  };
  const mockAchievementsService = { getAchievementById: jest.fn() };
  const notifications = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    repo.canReceiveAchievement.mockResolvedValue(true);
    repo.isCompleted.mockResolvedValue(false);
    repo.findProgress.mockResolvedValue(mockProgress);
    repo.findParticipantUserId.mockResolvedValue(42);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: ProgressRepository, useValue: repo },
        { provide: AchievementsService, useValue: mockAchievementsService },
        { provide: NotificationsService, useValue: notifications },
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
      mockAchievementsService.getAchievementById.mockResolvedValue(
        mockAchievement,
      );
    });

    it('writes progress and returns the stored row', async () => {
      const result = await service.updateProgress(1, 2, 3);

      expect(repo.upsertProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          participantId: 1,
          achievementId: 2,
          currentProgress: 3,
        }),
      );
      expect(result).toEqual(mockProgress);
    });

    it('marks isCompleted=true when progress meets maxProgress', async () => {
      await service.updateProgress(1, 2, 5);

      expect(repo.upsertProgress).toHaveBeenCalledWith(
        expect.objectContaining({ isCompleted: true }),
      );
    });

    it('marks isCompleted=false when progress is below maxProgress', async () => {
      await service.updateProgress(1, 2, 2);

      expect(repo.upsertProgress).toHaveBeenCalledWith(
        expect.objectContaining({ isCompleted: false, completedAt: null }),
      );
    });

    // The DTO only bounds progress at >= 0, so an over-large value must be
    // clamped here or it is read back as a nonsensical "999/5".
    it('clamps progress to the achievement maximum', async () => {
      await service.updateProgress(1, 2, 999);

      expect(repo.upsertProgress).toHaveBeenCalledWith(
        expect.objectContaining({ currentProgress: 5, isCompleted: true }),
      );
    });

    it('recomputes the team score when completed and a teamId is given', async () => {
      await service.updateProgress(1, 2, 5, 99);

      expect(repo.recomputeTeamScore).toHaveBeenCalledWith(99);
    });

    it('does not recompute the team score when not completed', async () => {
      await service.updateProgress(1, 2, 2, 99);

      expect(repo.recomputeTeamScore).not.toHaveBeenCalled();
    });

    it('does not recompute the team score when completed but no teamId', async () => {
      await service.updateProgress(1, 2, 5);

      expect(repo.recomputeTeamScore).not.toHaveBeenCalled();
    });

    it('notifies on a FRESH unlock only', async () => {
      await service.updateProgress(1, 2, 5);

      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 42, type: 'achievement' }),
      );
    });

    it('does not notify again for an achievement already completed', async () => {
      repo.isCompleted.mockResolvedValue(true);

      await service.updateProgress(1, 2, 5);

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it('does not notify an anonymous participant', async () => {
      repo.findParticipantUserId.mockResolvedValue(null);

      await service.updateProgress(1, 2, 5);

      expect(notifications.create).not.toHaveBeenCalled();
    });

    // Awarding must survive a broken notifier — the unlock is the real work.
    it('still awards when the notification throws', async () => {
      notifications.create.mockRejectedValue(new Error('notifier down'));

      await expect(service.updateProgress(1, 2, 5)).resolves.toEqual(
        mockProgress,
      );
      expect(repo.upsertProgress).toHaveBeenCalled();
    });

    it('throws when participant is not eligible for achievement', async () => {
      repo.canReceiveAchievement.mockResolvedValue(false);

      await expect(service.updateProgress(1, 2, 3)).rejects.toThrow(
        'Participant is not eligible to receive this achievement',
      );
      expect(repo.upsertProgress).not.toHaveBeenCalled();
    });

    it('throws when achievement is not found', async () => {
      mockAchievementsService.getAchievementById.mockResolvedValue(null);

      await expect(service.updateProgress(1, 2, 3)).rejects.toThrow(
        'Achievement not found',
      );
    });
  });

  // ─── transaction ──────────────────────────────────────────────────────────────

  describe('transaction()', () => {
    it('runs the callback against a service bound to the transaction repository', async () => {
      const txRepo = { ...repo };
      repo.runInTransaction.mockImplementation((work: any) => work(txRepo));

      const seen = await service.transaction(async (s) => s);

      expect(seen).toBeInstanceOf(ProgressService);
      // A distinct instance — the point is that it writes through txRepo.
      expect(seen).not.toBe(service);
    });
  });

  // ─── getParticipantProgress ───────────────────────────────────────────────────

  describe('getParticipantProgress()', () => {
    it('returns the stored row', async () => {
      const result = await service.getParticipantProgress(1, 2);

      expect(result).toEqual(mockProgress);
      expect(repo.findProgress).toHaveBeenCalledWith(1, 2);
    });

    it('returns undefined when no progress record exists', async () => {
      repo.findProgress.mockResolvedValue(undefined);

      const result = await service.getParticipantProgress(1, 999);

      expect(result).toBeUndefined();
    });
  });

  // ─── getAllParticipantProgress ─────────────────────────────────────────────────

  describe('getAllParticipantProgress()', () => {
    it('returns all progress records for a participant', async () => {
      const allProgress = [mockProgress, { ...mockProgress, achievementId: 3 }];
      repo.findAllProgress.mockResolvedValue(allProgress);

      const result = await service.getAllParticipantProgress(1);

      expect(result).toEqual(allProgress);
    });

    it('returns empty array when participant has no progress', async () => {
      repo.findAllProgress.mockResolvedValue([]);

      const result = await service.getAllParticipantProgress(999);

      expect(result).toEqual([]);
    });
  });
});
