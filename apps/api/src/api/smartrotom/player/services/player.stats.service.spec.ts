import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PlayerStatsService } from './player.stats.service';
import { PlayerRepository } from '@api/smartrotom/player/repositories/player.repository';

const mockRepo = {
  fetchPlayerStatsFromAPI: jest.fn(),
};
const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
const UUID = 'abc-123-uuid';

describe('PlayerStatsService', () => {
  let service: PlayerStatsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerStatsService,
        { provide: Logger, useValue: mockLogger },
        { provide: PlayerRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PlayerStatsService>(PlayerStatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerStats()', () => {
    it('returns stats from repo', async () => {
      const stats = { level: 10, badges: 3 };
      mockRepo.fetchPlayerStatsFromAPI.mockResolvedValue(stats);

      await expect(service.getPlayerStats(UUID)).resolves.toEqual(stats);
      expect(mockRepo.fetchPlayerStatsFromAPI).toHaveBeenCalledWith(UUID);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getPlayerStats('')).rejects.toThrow('Player UUID is required');
      expect(mockRepo.fetchPlayerStatsFromAPI).not.toHaveBeenCalled();
    });

    it('throws when uuid is whitespace only', async () => {
      await expect(service.getPlayerStats('   ')).rejects.toThrow('Player UUID is required');
    });

    it('wraps and re-throws repo error with context', async () => {
      mockRepo.fetchPlayerStatsFromAPI.mockRejectedValue(new Error('API timeout'));

      await expect(service.getPlayerStats(UUID)).rejects.toThrow(
        'Player stats retrieval failed: API timeout',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
