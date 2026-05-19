import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PlayerTeamService } from './player.team.service';
import { PlayerRepository } from '@api/smartrotom/player/repositories/player.repository';

const mockRepo = {
  fetchPlayerTeamFromAPI: jest.fn(),
};
const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
const UUID = 'abc-123-uuid';

describe('PlayerTeamService', () => {
  let service: PlayerTeamService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerTeamService,
        { provide: Logger, useValue: mockLogger },
        { provide: PlayerRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<PlayerTeamService>(PlayerTeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerTeam()', () => {
    it('returns team from repo', async () => {
      const team = [{ name: 'Pikachu', level: 50 }];
      mockRepo.fetchPlayerTeamFromAPI.mockResolvedValue(team);

      await expect(service.getPlayerTeam(UUID)).resolves.toEqual(team);
      expect(mockRepo.fetchPlayerTeamFromAPI).toHaveBeenCalledWith(UUID);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getPlayerTeam('')).rejects.toThrow(
        'Player UUID is required',
      );
      expect(mockRepo.fetchPlayerTeamFromAPI).not.toHaveBeenCalled();
    });

    it('throws when uuid is whitespace only', async () => {
      await expect(service.getPlayerTeam('   ')).rejects.toThrow(
        'Player UUID is required',
      );
    });

    it('wraps and re-throws repo error with context', async () => {
      mockRepo.fetchPlayerTeamFromAPI.mockRejectedValue(
        new Error('server error'),
      );

      await expect(service.getPlayerTeam(UUID)).rejects.toThrow(
        'Player team retrieval failed: server error',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
