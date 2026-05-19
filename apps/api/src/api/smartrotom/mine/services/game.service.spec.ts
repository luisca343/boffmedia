import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameService, ItemRarity } from './game.service';
import { MINE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const UUID = 'abc-123-uuid';

const mockRepo = {
  createGameSession: jest.fn(),
  findLatestGameSession: jest.fn(),
  findRewardsByIds: jest.fn(),
  createGameRewards: jest.fn(),
  createInventoryEntries: jest.fn(),
  findGameSession: jest.fn(),
};

const mockSession = { id: 42, uuid: UUID };

const mockRewards = [
  {
    id: 1,
    itemId: 'item-sword',
    type: 'weapon',
    name: 'Iron Sword',
    value: 300,
  },
  { id: 2, itemId: 'item-gem', type: 'material', name: 'Ruby', value: 1200 },
];

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: MINE_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── startGame ────────────────────────────────────────────────────────────────

  describe('startGame()', () => {
    it('creates a game session and returns idPartida', async () => {
      mockRepo.createGameSession.mockResolvedValue({ insertId: 42 });

      const result = await service.startGame(UUID);

      expect(result).toEqual({ idPartida: 42 });
      expect(mockRepo.createGameSession).toHaveBeenCalledWith(UUID);
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.startGame('')).rejects.toThrow(BadRequestException);
      expect(mockRepo.createGameSession).not.toHaveBeenCalled();
    });
  });

  // ─── endGame ──────────────────────────────────────────────────────────────────

  describe('endGame()', () => {
    const rewards = [
      { id: 1, value: 300 },
      { id: 2, value: 1200 },
    ];

    beforeEach(() => {
      mockRepo.findLatestGameSession.mockResolvedValue(mockSession);
      mockRepo.findRewardsByIds.mockResolvedValue(mockRewards);
      mockRepo.createGameRewards.mockResolvedValue(undefined);
      mockRepo.createInventoryEntries.mockResolvedValue(undefined);
    });

    it('returns success response with rewardsProcessed count', async () => {
      const result = await service.endGame(UUID, rewards);

      expect(result).toEqual({
        idPartida: 42,
        success: true,
        rewardsProcessed: 2,
      });
    });

    it('creates game rewards with rewardId and value', async () => {
      await service.endGame(UUID, rewards);

      expect(mockRepo.createGameRewards).toHaveBeenCalledWith(42, [
        { rewardId: 1, value: 300 },
        { rewardId: 2, value: 1200 },
      ]);
    });

    it('creates inventory entries with correct rarity from weight', async () => {
      await service.endGame(UUID, rewards);

      const entries = mockRepo.createInventoryEntries.mock.calls[0][0];
      // reward id=1 value=300 → RARE; id=2 value=1200 → LEGENDARY
      expect(entries[0]).toMatchObject({
        rarity: ItemRarity.RARE,
        sourceType: 'mine',
        uuid: UUID,
      });
      expect(entries[1]).toMatchObject({ rarity: ItemRarity.LEGENDARY });
    });

    it('throws NotFoundException when no active game session found', async () => {
      mockRepo.findLatestGameSession.mockResolvedValue(null);

      await expect(service.endGame(UUID, rewards)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws when rewards count does not match valid rewards count', async () => {
      mockRepo.findRewardsByIds.mockResolvedValue([mockRewards[0]]); // only 1 of 2

      await expect(service.endGame(UUID, rewards)).rejects.toThrow(
        'Some rewards do not exist',
      );
      expect(mockRepo.createGameRewards).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when uuid is empty', async () => {
      await expect(service.endGame('', rewards)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when rewards is not an array', async () => {
      await expect(service.endGame(UUID, null as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── rarity calculation (via endGame) ────────────────────────────────────────

  describe('calculateRarityFromWeight() — tested via endGame()', () => {
    const runWithWeight = async (weight: number): Promise<string> => {
      const reward = { id: 1, value: weight };
      const rewardData = [
        { id: 1, itemId: 'item-x', type: 'misc', name: 'X', value: weight },
      ];
      mockRepo.findLatestGameSession.mockResolvedValue(mockSession);
      mockRepo.findRewardsByIds.mockResolvedValue(rewardData);
      mockRepo.createGameRewards.mockResolvedValue(undefined);
      mockRepo.createInventoryEntries.mockResolvedValue(undefined);

      await service.endGame(UUID, [reward]);
      const entries = mockRepo.createInventoryEntries.mock.calls[0][0];
      jest.clearAllMocks();
      return entries[0].rarity;
    };

    it.each([
      [1000, ItemRarity.LEGENDARY],
      [500, ItemRarity.EPIC],
      [200, ItemRarity.RARE],
      [50, ItemRarity.UNCOMMON],
      [49, ItemRarity.COMMON],
      [0, ItemRarity.COMMON],
    ])('weight=%i → %s', async (weight, expected) => {
      expect(await runWithWeight(weight)).toBe(expected);
    });
  });

  // ─── validateGameSession ──────────────────────────────────────────────────────

  describe('validateGameSession()', () => {
    it('returns true when session uuid matches', async () => {
      mockRepo.findGameSession.mockResolvedValue({ id: 1, uuid: UUID });

      await expect(service.validateGameSession(1, UUID)).resolves.toBe(true);
    });

    it('returns false when session uuid does not match', async () => {
      mockRepo.findGameSession.mockResolvedValue({ id: 1, uuid: 'other-uuid' });

      await expect(service.validateGameSession(1, UUID)).resolves.toBe(false);
    });

    it('returns false (undefined) when session not found', async () => {
      mockRepo.findGameSession.mockResolvedValue(null);

      await expect(service.validateGameSession(99, UUID)).resolves.toBeFalsy();
    });
  });
});
