import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantsService } from './participants.service';
import { ParticipantsRepository } from '../../../_repositories/boffmedia/participants.repository';

const mockRepo = {
  findByUserId: jest.fn(),
  findUserById: jest.fn(),
  createParticipant: jest.fn(),
  findParticipantAchievements: jest.fn(),
  findEventParticipation: jest.fn(),
  createEventParticipation: jest.fn(),
  findEventParticipationById: jest.fn(),
  findEventParticipants: jest.fn(),
  deleteEventParticipation: jest.fn(),
};

const mockParticipant = {
  id: 5,
  userId: 1,
  nickname: 'TrainerAsh',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEventParticipation = {
  id: 10,
  participantId: 5,
  eventId: 20,
  status: 'registered',
  comment: null,
};

describe('ParticipantsService', () => {
  let service: ParticipantsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: ParticipantsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ParticipantsService>(ParticipantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getOrCreateParticipantByUserId ───────────────────────────────────────────

  describe('getOrCreateParticipantByUserId()', () => {
    it('returns existing participant when found', async () => {
      mockRepo.findByUserId.mockResolvedValue(mockParticipant);

      const result = await service.getOrCreateParticipantByUserId(1);

      expect(result).toEqual(mockParticipant);
      expect(mockRepo.findUserById).not.toHaveBeenCalled();
      expect(mockRepo.createParticipant).not.toHaveBeenCalled();
    });

    it('creates and returns participant when user has no participant record', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.findUserById.mockResolvedValue({
        id: 1,
        username: 'TrainerAsh',
      });
      mockRepo.createParticipant.mockResolvedValue({ insertId: 5 });

      const result = await service.getOrCreateParticipantByUserId(1);

      expect(mockRepo.createParticipant).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, nickname: 'TrainerAsh' }),
      );
      expect(result.id).toBe(5);
      expect(result.nickname).toBe('TrainerAsh');
    });

    it('throws when user is not found in the system', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);
      mockRepo.findUserById.mockResolvedValue(null);

      await expect(service.getOrCreateParticipantByUserId(999)).rejects.toThrow(
        'User not found',
      );
      expect(mockRepo.createParticipant).not.toHaveBeenCalled();
    });
  });

  // ─── getParticipantAchievements ───────────────────────────────────────────────

  describe('getParticipantAchievements()', () => {
    const rawAchievement = {
      id: 1,
      eventId: 10,
      name: 'First Catch',
      description: 'Catch your first Pokémon',
      icon: 'pokeball.png',
      points: 100,
      maxProgress: 5,
      itemType: 'badge',
      category: 'catching',
      rarity: 'common',
      order: 2,
      progress: 3,
    };

    it('transforms raw achievement data into AchievementWithProgress shape', async () => {
      mockRepo.findParticipantAchievements.mockResolvedValue([rawAchievement]);

      const result = await service.getParticipantAchievements(5);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        eventId: 10,
        name: 'First Catch',
        currentProgress: 3,
        isCompleted: 0,
        active: 1,
      });
    });

    it('defaults eventId to 0 when not present in raw data', async () => {
      mockRepo.findParticipantAchievements.mockResolvedValue([
        { ...rawAchievement, eventId: undefined },
      ]);

      const result = await service.getParticipantAchievements(5);

      expect(result[0].eventId).toBe(0);
    });

    it('defaults currentProgress to 0 when progress is falsy', async () => {
      mockRepo.findParticipantAchievements.mockResolvedValue([
        { ...rawAchievement, progress: null },
      ]);

      const result = await service.getParticipantAchievements(5);

      expect(result[0].currentProgress).toBe(0);
    });

    it('defaults order to 0 when not present', async () => {
      mockRepo.findParticipantAchievements.mockResolvedValue([
        { ...rawAchievement, order: undefined },
      ]);

      const result = await service.getParticipantAchievements(5);

      expect(result[0].order).toBe(0);
    });
  });

  // ─── joinEvent ────────────────────────────────────────────────────────────────

  describe('joinEvent()', () => {
    const joinDto = { userId: 1, comment: 'Excited!' };

    it('creates participation and returns record by insertId', async () => {
      mockRepo.findEventParticipation.mockResolvedValue(null);
      mockRepo.createEventParticipation.mockResolvedValue({ insertId: 10 });
      mockRepo.findEventParticipationById.mockResolvedValue(
        mockEventParticipation,
      );

      const result = await service.joinEvent(20, 5, joinDto);

      expect(result).toEqual(mockEventParticipation);
      expect(mockRepo.createEventParticipation).toHaveBeenCalledWith(
        expect.objectContaining({
          participantId: 5,
          eventId: 20,
          status: 'registered',
          comment: 'Excited!',
        }),
      );
      expect(mockRepo.findEventParticipationById).toHaveBeenCalledWith(10);
    });

    it('uses null comment when not provided', async () => {
      mockRepo.findEventParticipation.mockResolvedValue(null);
      mockRepo.createEventParticipation.mockResolvedValue({ insertId: 10 });
      mockRepo.findEventParticipationById.mockResolvedValue(
        mockEventParticipation,
      );

      await service.joinEvent(20, 5, { userId: 1 });

      expect(mockRepo.createEventParticipation).toHaveBeenCalledWith(
        expect.objectContaining({ comment: null }),
      );
    });

    it('throws when participant is already registered', async () => {
      mockRepo.findEventParticipation.mockResolvedValue(mockEventParticipation);

      await expect(service.joinEvent(20, 5, joinDto)).rejects.toThrow(
        'Participant is already registered for this event',
      );
      expect(mockRepo.createEventParticipation).not.toHaveBeenCalled();
    });
  });

  // ─── getEventParticipants ─────────────────────────────────────────────────────

  describe('getEventParticipants()', () => {
    it('returns participants from repo', async () => {
      const participants = [{ id: 1, nickname: 'TrainerAsh' }] as any;
      mockRepo.findEventParticipants.mockResolvedValue(participants);

      await expect(service.getEventParticipants(20)).resolves.toEqual(
        participants,
      );
      expect(mockRepo.findEventParticipants).toHaveBeenCalledWith(20);
    });
  });

  // ─── leaveEvent ───────────────────────────────────────────────────────────────

  describe('leaveEvent()', () => {
    it('delegates deletion to repo', async () => {
      mockRepo.deleteEventParticipation.mockResolvedValue(undefined);

      await service.leaveEvent(20, 5);

      expect(mockRepo.deleteEventParticipation).toHaveBeenCalledWith(20, 5);
    });
  });

  // ─── validateParticipantExists ────────────────────────────────────────────────

  describe('validateParticipantExists()', () => {
    it('always returns true (stub implementation)', async () => {
      await expect(service.validateParticipantExists(1)).resolves.toBe(true);
    });
  });

  // ─── validateEventParticipation ───────────────────────────────────────────────

  describe('validateEventParticipation()', () => {
    it('returns true when participation status is confirmed', async () => {
      mockRepo.findEventParticipation.mockResolvedValue({
        ...mockEventParticipation,
        status: 'confirmed',
      });

      await expect(service.validateEventParticipation(5, 20)).resolves.toBe(
        true,
      );
    });

    it('returns false when status is not confirmed', async () => {
      mockRepo.findEventParticipation.mockResolvedValue({
        ...mockEventParticipation,
        status: 'registered',
      });

      await expect(service.validateEventParticipation(5, 20)).resolves.toBe(
        false,
      );
    });

    it('returns false when no participation record exists', async () => {
      mockRepo.findEventParticipation.mockResolvedValue(null);

      await expect(service.validateEventParticipation(5, 999)).resolves.toBe(
        false,
      );
    });
  });
});
