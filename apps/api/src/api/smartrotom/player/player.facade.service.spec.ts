import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PlayerFacadeService } from './player.facade.service';
import { PlayerStatsService } from './services/player.stats.service';
import { PlayerTeamService } from './services/player.team.service';

const mockStatsService = {
  getPlayerStats: jest.fn(),
};

const mockTeamService = {
  getPlayerTeam: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
const UUID = 'player-uuid';

describe('PlayerFacadeService', () => {
  let service: PlayerFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: PlayerStatsService, useValue: mockStatsService },
        { provide: PlayerTeamService, useValue: mockTeamService },
      ],
    }).compile();

    service = module.get<PlayerFacadeService>(PlayerFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getStats ─────────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('delegates to PlayerStatsService', async () => {
      const stats = { level: 10, badges: 3 };
      mockStatsService.getPlayerStats.mockResolvedValue(stats);

      await expect(service.getStats(UUID)).resolves.toEqual(stats);
      expect(mockStatsService.getPlayerStats).toHaveBeenCalledWith(UUID);
    });

    it('wraps and re-throws on error', async () => {
      mockStatsService.getPlayerStats.mockRejectedValue(new Error('API down'));

      await expect(service.getStats(UUID)).rejects.toThrow(
        'Failed to retrieve player stats',
      );
    });
  });

  // ─── getTeam ──────────────────────────────────────────────────────────────────

  describe('getTeam()', () => {
    it('delegates to PlayerTeamService', async () => {
      const team = [{ name: 'Pikachu', level: 50 }];
      mockTeamService.getPlayerTeam.mockResolvedValue(team);

      await expect(service.getTeam(UUID)).resolves.toEqual(team);
      expect(mockTeamService.getPlayerTeam).toHaveBeenCalledWith(UUID);
    });

    it('wraps and re-throws on error', async () => {
      mockTeamService.getPlayerTeam.mockRejectedValue(new Error('timeout'));

      await expect(service.getTeam(UUID)).rejects.toThrow(
        'Failed to retrieve player team',
      );
    });
  });
});
