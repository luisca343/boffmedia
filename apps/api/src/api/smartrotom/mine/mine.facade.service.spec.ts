import { Test, TestingModule } from '@nestjs/testing';
import { MineFacadeService } from './mine.facade.service';
import { EnergyService } from './services/energy.service';
import { GameService } from './services/game.service';
import { RewardService } from './services/reward.service';
import { PlayerService } from './services/player.service';
import { Logger } from 'nestjs-pino';

const mockEnergyStatus = { energy: 5, maxEnergy: 5, nextRecharge: null };
const mockGameStart = { sessionId: 'session-123', rewards: [] };
const mockGameEnd = { rewards: [{ id: 1, value: 100 }], total: 100 };
const mockReward = { id: 1, name: 'Diamond', value: 100 };
const mockRanking = [{ uuid: 'test-uuid', totalValue: 500, rank: 1 }];

describe('MineFacadeService', () => {
  let service: MineFacadeService;
  let energyService: jest.Mocked<
    Pick<EnergyService, 'getPlayerEnergy' | 'validateEnergyForPlay' | 'consumeEnergy'>
  >;
  let gameService: jest.Mocked<Pick<GameService, 'startGame' | 'endGame'>>;
  let rewardService: jest.Mocked<
    Pick<RewardService, 'getAllRewards' | 'getRewardsByType' | 'getRewardDropRates' | 'validateRewardsExist'>
  >;
  let playerService: jest.Mocked<
    Pick<
      PlayerService,
      | 'getPlayerHistory'
      | 'getPlayerRanking'
      | 'getPlayerRank'
      | 'getUnclaimedRewards'
      | 'claimRewards'
      | 'getPlayerStatistics'
      | 'validatePlayerExists'
    >
  >;
  let logger: jest.Mocked<Pick<Logger, 'log' | 'warn' | 'error'>>;

  beforeEach(async () => {
    const mockEnergyService = {
      getPlayerEnergy: jest.fn(),
      validateEnergyForPlay: jest.fn(),
      consumeEnergy: jest.fn(),
    };
    const mockGameService = {
      startGame: jest.fn(),
      endGame: jest.fn(),
    };
    const mockRewardService = {
      getAllRewards: jest.fn(),
      getRewardsByType: jest.fn(),
      getRewardDropRates: jest.fn(),
      validateRewardsExist: jest.fn(),
    };
    const mockPlayerService = {
      getPlayerHistory: jest.fn(),
      getPlayerRanking: jest.fn(),
      getPlayerRank: jest.fn(),
      getUnclaimedRewards: jest.fn(),
      claimRewards: jest.fn(),
      getPlayerStatistics: jest.fn(),
      validatePlayerExists: jest.fn(),
    };
    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MineFacadeService,
        { provide: EnergyService, useValue: mockEnergyService },
        { provide: GameService, useValue: mockGameService },
        { provide: RewardService, useValue: mockRewardService },
        { provide: PlayerService, useValue: mockPlayerService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MineFacadeService>(MineFacadeService);
    energyService = module.get(EnergyService);
    gameService = module.get(GameService);
    rewardService = module.get(RewardService);
    playerService = module.get(PlayerService);
    logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerEnergy', () => {
    it('should return energy status', async () => {
      energyService.getPlayerEnergy.mockResolvedValue(mockEnergyStatus as any);

      const result = await service.getPlayerEnergy('test-uuid');

      expect(energyService.getPlayerEnergy).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockEnergyStatus);
    });

    it('should throw descriptive error when energy service fails', async () => {
      energyService.getPlayerEnergy.mockRejectedValue(new Error('DB error'));

      await expect(service.getPlayerEnergy('test-uuid')).rejects.toThrow('Failed to retrieve energy');
    });
  });

  describe('playGame', () => {
    it('should consume energy and start game when player has energy', async () => {
      energyService.validateEnergyForPlay.mockResolvedValue(true);
      energyService.consumeEnergy.mockResolvedValue(undefined);
      gameService.startGame.mockResolvedValue(mockGameStart as any);

      const result = await service.playGame({ uuid: 'test-uuid' });

      expect(energyService.consumeEnergy).toHaveBeenCalledWith('test-uuid', 1);
      expect(gameService.startGame).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(mockGameStart);
    });

    it('should return error when player has no energy', async () => {
      energyService.validateEnergyForPlay.mockResolvedValue(false);

      const result = await service.playGame({ uuid: 'test-uuid' });

      expect(result).toEqual({ error: 'No tienes suficiente energía para jugar.' });
      expect(gameService.startGame).not.toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    it('should end game and return rewards', async () => {
      rewardService.validateRewardsExist.mockResolvedValue(true);
      gameService.endGame.mockResolvedValue(mockGameEnd as any);

      const result = await service.endGame({ uuid: 'test-uuid', rewards: [{ id: 1, value: 100 }] });

      expect(gameService.endGame).toHaveBeenCalled();
      expect(result).toEqual(mockGameEnd);
    });
  });

  describe('getAllRewards', () => {
    it('should return all rewards', async () => {
      rewardService.getAllRewards.mockResolvedValue([mockReward] as any);

      const result = await service.getAllRewards();

      expect(rewardService.getAllRewards).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockReward]);
    });
  });

  describe('getRewardsByType', () => {
    it('should return rewards grouped by type', async () => {
      const grouped = { gem: [mockReward] };
      rewardService.getRewardsByType.mockResolvedValue(grouped as any);

      const result = await service.getRewardsByType();

      expect(result).toEqual(grouped);
    });
  });

  describe('getPlayerHistory', () => {
    it('should return player history', async () => {
      const history = { gamesPlayed: 10, totalValue: 1000 };
      playerService.getPlayerHistory.mockResolvedValue(history as any);

      const result = await service.getPlayerHistory('test-uuid');

      expect(playerService.getPlayerHistory).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(history);
    });
  });

  describe('getPlayerRanking', () => {
    it('should return global ranking', async () => {
      playerService.getPlayerRanking.mockResolvedValue(mockRanking as any);

      const result = await service.getPlayerRanking();

      expect(result).toEqual(mockRanking);
    });
  });

  describe('getPlayerRank', () => {
    it('should return rank for specific player', async () => {
      playerService.getPlayerRank.mockResolvedValue({ rank: 1, totalValue: 500 });

      const result = await service.getPlayerRank('test-uuid');

      expect(playerService.getPlayerRank).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({ rank: 1, totalValue: 500 });
    });

    it('should return null when player has no rank', async () => {
      playerService.getPlayerRank.mockResolvedValue(null);

      const result = await service.getPlayerRank('new-uuid');

      expect(result).toBeNull();
    });
  });

  describe('getUnclaimedRewards', () => {
    it('should return unclaimed rewards', async () => {
      const unclaimed = [{ id: 1, rewardId: 1, value: 100 }];
      playerService.getUnclaimedRewards.mockResolvedValue(unclaimed as any);

      const result = await service.getUnclaimedRewards('test-uuid');

      expect(playerService.getUnclaimedRewards).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(unclaimed);
    });
  });

  describe('claimRewards', () => {
    it('should claim all unclaimed rewards', async () => {
      const claimResponse = { claimed: 3, items: [] };
      playerService.claimRewards.mockResolvedValue(claimResponse as any);

      const result = await service.claimRewards({ uuid: 'test-uuid' });

      expect(playerService.claimRewards).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(claimResponse);
    });
  });

  describe('getPlayerStatistics', () => {
    it('should return player statistics', async () => {
      const stats = { gamesPlayed: 20, totalValue: 5000, bestGame: 500 };
      playerService.getPlayerStatistics.mockResolvedValue(stats as any);

      const result = await service.getPlayerStatistics('test-uuid');

      expect(result).toEqual(stats);
    });
  });

  describe('validatePlayerExists', () => {
    it('should return true when player exists', async () => {
      playerService.validatePlayerExists.mockResolvedValue(true);

      const result = await service.validatePlayerExists('test-uuid');

      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      playerService.validatePlayerExists.mockRejectedValue(new Error('error'));

      const result = await service.validatePlayerExists('test-uuid');

      expect(result).toBe(false);
    });
  });

  describe('validateRewardsExist', () => {
    it('should return true when all rewards exist', async () => {
      rewardService.validateRewardsExist.mockResolvedValue(true);

      const result = await service.validateRewardsExist([1, 2, 3]);

      expect(rewardService.validateRewardsExist).toHaveBeenCalledWith([1, 2, 3]);
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      rewardService.validateRewardsExist.mockRejectedValue(new Error('error'));

      const result = await service.validateRewardsExist([999]);

      expect(result).toBe(false);
    });
  });
});
