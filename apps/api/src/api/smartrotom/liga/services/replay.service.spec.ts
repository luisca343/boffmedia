import { Test, TestingModule } from '@nestjs/testing';
import { ReplayService } from './replay.service';
import { LigaRepository } from '@api/smartrotom/liga/repositories/liga.repository';

const mockRepo = {
  findReplayById: jest.fn(),
  findRecentReplays: jest.fn(),
  findReplaysByPlayer: jest.fn(),
  findReplaysByPlayers: jest.fn(),
};

const PLAYER1 = 'uuid-player-one';
const PLAYER2 = 'uuid-player-two';

const mockReplay = {
  id: 1,
  side1: PLAYER1,
  side2: PLAYER2,
  winner: PLAYER1,
  createdAt: new Date(),
} as any;

describe('ReplayService', () => {
  let service: ReplayService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReplayService,
        { provide: LigaRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReplayService>(ReplayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getReplayById ────────────────────────────────────────────────────────────

  describe('getReplayById()', () => {
    it('returns replay when found', async () => {
      mockRepo.findReplayById.mockResolvedValue(mockReplay);

      await expect(service.getReplayById(1)).resolves.toEqual(mockReplay);
      expect(mockRepo.findReplayById).toHaveBeenCalledWith(1);
    });

    it('throws when replay not found', async () => {
      mockRepo.findReplayById.mockResolvedValue(null);

      await expect(service.getReplayById(999)).rejects.toThrow(
        'Replay not found',
      );
    });

    it('throws when id is 0', async () => {
      await expect(service.getReplayById(0)).rejects.toThrow(
        'Valid replay ID is required',
      );
      expect(mockRepo.findReplayById).not.toHaveBeenCalled();
    });

    it('throws when id is negative', async () => {
      await expect(service.getReplayById(-1)).rejects.toThrow(
        'Valid replay ID is required',
      );
    });
  });

  // ─── getRecentReplays ─────────────────────────────────────────────────────────

  describe('getRecentReplays()', () => {
    it('returns replays with default limit of 10', async () => {
      mockRepo.findRecentReplays.mockResolvedValue([mockReplay]);

      await expect(service.getRecentReplays()).resolves.toEqual([mockReplay]);
      expect(mockRepo.findRecentReplays).toHaveBeenCalledWith(10);
    });

    it('passes custom limit to repo', async () => {
      mockRepo.findRecentReplays.mockResolvedValue([]);

      await service.getRecentReplays(25);

      expect(mockRepo.findRecentReplays).toHaveBeenCalledWith(25);
    });

    it('throws when limit is 0', async () => {
      await expect(service.getRecentReplays(0)).rejects.toThrow(
        'Limit must be between 1 and 100',
      );
    });

    it('throws when limit exceeds 100', async () => {
      await expect(service.getRecentReplays(101)).rejects.toThrow(
        'Limit must be between 1 and 100',
      );
    });
  });

  // ─── getPlayerReplays ─────────────────────────────────────────────────────────

  describe('getPlayerReplays()', () => {
    it('returns replays for a player', async () => {
      mockRepo.findReplaysByPlayer.mockResolvedValue([mockReplay]);

      await expect(service.getPlayerReplays(PLAYER1)).resolves.toEqual([
        mockReplay,
      ]);
      expect(mockRepo.findReplaysByPlayer).toHaveBeenCalledWith(PLAYER1);
    });

    it('throws when playerUuid is empty', async () => {
      await expect(service.getPlayerReplays('')).rejects.toThrow(
        'Player UUID is required',
      );
      expect(mockRepo.findReplaysByPlayer).not.toHaveBeenCalled();
    });
  });

  // ─── getMatchHistory ──────────────────────────────────────────────────────────

  describe('getMatchHistory()', () => {
    it('returns head-to-head replays between two players', async () => {
      mockRepo.findReplaysByPlayers.mockResolvedValue([mockReplay]);

      await expect(service.getMatchHistory(PLAYER1, PLAYER2)).resolves.toEqual([
        mockReplay,
      ]);
      expect(mockRepo.findReplaysByPlayers).toHaveBeenCalledWith(
        PLAYER1,
        PLAYER2,
      );
    });

    it('throws when player1 is empty', async () => {
      await expect(service.getMatchHistory('', PLAYER2)).rejects.toThrow(
        'Both player UUIDs are required',
      );
    });

    it('throws when player2 is empty', async () => {
      await expect(service.getMatchHistory(PLAYER1, '')).rejects.toThrow(
        'Both player UUIDs are required',
      );
    });

    it('throws when both players are the same', async () => {
      await expect(service.getMatchHistory(PLAYER1, PLAYER1)).rejects.toThrow(
        'Players must be different',
      );
    });
  });

  // ─── validateReplayExists ─────────────────────────────────────────────────────

  describe('validateReplayExists()', () => {
    it('returns true when replay is found', async () => {
      mockRepo.findReplayById.mockResolvedValue(mockReplay);

      await expect(service.validateReplayExists(1)).resolves.toBe(true);
    });

    it('returns false when replay is not found', async () => {
      mockRepo.findReplayById.mockResolvedValue(null);

      await expect(service.validateReplayExists(999)).resolves.toBe(false);
    });

    it('returns false when id is invalid (swallows the error)', async () => {
      await expect(service.validateReplayExists(0)).resolves.toBe(false);
    });
  });
});
