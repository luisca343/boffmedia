import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PlayerService } from './player.service';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const UUID = 'abc-123-uuid';

const mockRepo = {
  findPlayerHistory: jest.fn(),
  findTopPlayers: jest.fn(),
  findPlayerRanking: jest.fn(),
  findUnclaimedItems: jest.fn(),
  claimUnclaimedFor: jest.fn(),
  getPlayerStats: jest.fn(),
  findPlayerEnergy: jest.fn(),
};

describe('PlayerService (mine)', () => {
  let service: PlayerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerService,
        { provide: MINE_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPlayerHistory ─────────────────────────────────────────────────────────

  describe('getPlayerHistory()', () => {
    it('groups history entries by game id', async () => {
      mockRepo.findPlayerHistory.mockResolvedValue([
        { id: 1, item: 'sword' },
        { id: 1, item: 'gem' },
        { id: 2, item: 'potion' },
      ]);

      const result = await service.getPlayerHistory(UUID);

      expect(result[1]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });

    it('returns empty object when player has no history', async () => {
      mockRepo.findPlayerHistory.mockResolvedValue([]);

      const result = await service.getPlayerHistory(UUID);

      expect(result).toEqual({});
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getPlayerHistory('')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepo.findPlayerHistory).not.toHaveBeenCalled();
    });
  });

  // ─── getPlayerRanking ─────────────────────────────────────────────────────────

  describe('getPlayerRanking()', () => {
    it('returns top 50 players from repo', async () => {
      const top = [{ uuid: UUID, totalValue: 9000 }] as any;
      mockRepo.findTopPlayers.mockResolvedValue(top);

      await expect(service.getPlayerRanking()).resolves.toEqual(top);
      expect(mockRepo.findTopPlayers).toHaveBeenCalledWith(50);
    });
  });

  // ─── getPlayerRank ────────────────────────────────────────────────────────────

  describe('getPlayerRank()', () => {
    it('returns rank from repo', async () => {
      mockRepo.findPlayerRanking.mockResolvedValue({
        rank: 3,
        totalValue: 5000,
      });

      const result = await service.getPlayerRank(UUID);

      expect(result).toEqual({ rank: 3, totalValue: 5000 });
    });

    it('returns null when player not in ranking', async () => {
      mockRepo.findPlayerRanking.mockResolvedValue(null);

      await expect(service.getPlayerRank(UUID)).resolves.toBeNull();
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getPlayerRank('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── getUnclaimedRewards ──────────────────────────────────────────────────────

  describe('getUnclaimedRewards()', () => {
    it('aggregates multiple instances of the same itemId by summing amounts', async () => {
      mockRepo.findUnclaimedItems.mockResolvedValue([
        { id: 1, itemId: 'gem', type: 'material', amount: 2 },
        { id: 2, itemId: 'gem', type: 'material', amount: 3 },
        { id: 3, itemId: 'sword', type: 'weapon', amount: 1 },
      ]);

      const result = await service.getUnclaimedRewards(UUID);

      expect(result).toHaveLength(2);
      const gem = result.find((r) => r.itemId === 'gem');
      expect(gem!.amount).toBe(5);
    });

    it('defaults amount to 1 when item.amount is falsy', async () => {
      mockRepo.findUnclaimedItems.mockResolvedValue([
        { id: 1, itemId: 'gem', type: 'material', amount: null },
        { id: 2, itemId: 'gem', type: 'material', amount: null },
      ]);

      const result = await service.getUnclaimedRewards(UUID);

      expect(result[0].amount).toBe(2); // 1 + 1
    });

    it('returns distinct items when no duplicates exist', async () => {
      mockRepo.findUnclaimedItems.mockResolvedValue([
        { id: 1, itemId: 'sword', type: 'weapon', amount: 1 },
        { id: 2, itemId: 'potion', type: 'consumable', amount: 2 },
      ]);

      const result = await service.getUnclaimedRewards(UUID);

      expect(result).toHaveLength(2);
    });

    it('returns empty array when no unclaimed items', async () => {
      mockRepo.findUnclaimedItems.mockResolvedValue([]);

      await expect(service.getUnclaimedRewards(UUID)).resolves.toEqual([]);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getUnclaimedRewards('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── claimRewards ─────────────────────────────────────────────────────────────

  describe('claimRewards()', () => {
    it('returns empty claim response when no unclaimed items', async () => {
      mockRepo.claimUnclaimedFor.mockResolvedValue([]);

      const result = await service.claimRewards(UUID);

      expect(result).toEqual({
        claimedItems: [],
        claimedIds: [],
        totalClaimed: 0,
        success: true,
      });
    });

    it('claims all unclaimed items and returns them', async () => {
      const rows = [
        { id: 10, itemId: 'gem', type: 'gema' },
        { id: 11, itemId: 'sword', type: 'item' },
      ];
      mockRepo.claimUnclaimedFor.mockResolvedValue(rows);

      const result = await service.claimRewards(UUID);

      expect(result.claimedItems).toEqual(rows);
      expect(result.claimedIds).toEqual([10, 11]);
      expect(result.totalClaimed).toBe(2);
      expect(result.success).toBe(true);
      expect(mockRepo.claimUnclaimedFor).toHaveBeenCalledWith(UUID);
    });

    it('reports nothing claimed when a concurrent claim won the rows', async () => {
      // The repository is the gate: it returns only the rows THIS caller won.
      // The page grants from claimedItems, so an empty list must grant nothing.
      mockRepo.claimUnclaimedFor.mockResolvedValue([]);

      const result = await service.claimRewards(UUID);

      expect(result.claimedItems).toEqual([]);
      expect(result.totalClaimed).toBe(0);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.claimRewards('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── getPlayerStatistics ──────────────────────────────────────────────────────

  describe('getPlayerStatistics()', () => {
    it('fetches stats and ranking in parallel and merges them', async () => {
      const stats = { totalGames: 10, totalValue: 5000 };
      const ranking = { rank: 3, totalValue: 5000 };
      mockRepo.getPlayerStats.mockResolvedValue(stats);
      mockRepo.findPlayerRanking.mockResolvedValue(ranking);

      const result = await service.getPlayerStatistics(UUID);

      expect(result).toMatchObject({ ...stats, ranking });
    });

    it('includes null ranking when player is not ranked', async () => {
      mockRepo.getPlayerStats.mockResolvedValue({ totalGames: 0 });
      mockRepo.findPlayerRanking.mockResolvedValue(null);

      const result = await service.getPlayerStatistics(UUID);

      expect(result.ranking).toBeNull();
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.getPlayerStatistics('')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── validatePlayerExists ─────────────────────────────────────────────────────

  describe('validatePlayerExists()', () => {
    it('returns true when energy record found', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue({ energy: 5 });

      await expect(service.validatePlayerExists(UUID)).resolves.toBe(true);
    });

    it('returns false when energy record not found', async () => {
      mockRepo.findPlayerEnergy.mockResolvedValue(null);

      await expect(service.validatePlayerExists(UUID)).resolves.toBe(false);
    });
  });
});
