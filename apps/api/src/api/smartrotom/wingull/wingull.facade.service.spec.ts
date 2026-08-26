import { Test, TestingModule } from '@nestjs/testing';
import { WingullFacadeService } from './wingull.facade.service';
import { WingullEconomyService } from './services/wingull-economy.service';
import { WingullPlayerService } from './services/wingull-player.service';
import { WingullWorldService } from './services/wingull-world.service';
import { WingullTransportService } from './services/wingull-transport.service';
import { WingullRepository } from './repositories/wingull.repository';
import { Logger } from 'nestjs-pino';

describe('WingullFacadeService', () => {
  let service: WingullFacadeService;
  let economyService: jest.Mocked<
    Pick<
      WingullEconomyService,
      'updateBalance' | 'getCurrentBalance' | 'getMoney'
    >
  >;
  let playerService: jest.Mocked<
    Pick<
      WingullPlayerService,
      | 'getStats'
      | 'getTeam'
      | 'getPC'
      | 'movePokemon'
      | 'updateDex'
      | 'getQuests'
      | 'sendMessage'
      | 'globalchat'
      | 'givePokemon'
      | 'giveItems'
      | 'getBattleTeams'
      | 'updateBattleTeam'
    >
  >;
  let worldService: jest.Mocked<
    Pick<
      WingullWorldService,
      'getPerformance' | 'getRegions' | 'getWeather' | 'updateNPCs'
    >
  >;
  let transportService: jest.Mocked<
    Pick<WingullTransportService, 'getTaxiStops' | 'teleportPlayer'>
  >;
  let wingullRepository: jest.Mocked<
    Pick<WingullRepository, 'getPlayersOwnedRegions' | 'getAllPlots'>
  >;
  let _logger: jest.Mocked<Pick<Logger, 'log' | 'warn' | 'error'>>;

  beforeEach(async () => {
    const mockEconomyService = {
      updateBalance: jest.fn(),
      getCurrentBalance: jest.fn(),
      getMoney: jest.fn(),
    };

    const mockPlayerService = {
      getStats: jest.fn(),
      getTeam: jest.fn(),
      getPC: jest.fn(),
      movePokemon: jest.fn(),
      updateDex: jest.fn(),
      getQuests: jest.fn(),
      sendMessage: jest.fn(),
      globalchat: jest.fn(),
      givePokemon: jest.fn(),
      giveItems: jest.fn(),
      getBattleTeams: jest.fn(),
      updateBattleTeam: jest.fn(),
    };

    const mockWorldService = {
      getPerformance: jest.fn(),
      getRegions: jest.fn(),
      getWeather: jest.fn(),
      updateNPCs: jest.fn(),
    };

    const mockTransportService = {
      getTaxiStops: jest.fn(),
      teleportPlayer: jest.fn(),
    };

    const mockWingullRepository = {
      getPlayersOwnedRegions: jest.fn(),
      getAllPlots: jest.fn(),
    };

    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullFacadeService,
        { provide: WingullEconomyService, useValue: mockEconomyService },
        { provide: WingullPlayerService, useValue: mockPlayerService },
        { provide: WingullWorldService, useValue: mockWorldService },
        { provide: WingullTransportService, useValue: mockTransportService },
        { provide: WingullRepository, useValue: mockWingullRepository },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<WingullFacadeService>(WingullFacadeService);
    economyService = module.get(WingullEconomyService);
    playerService = module.get(WingullPlayerService);
    worldService = module.get(WingullWorldService);
    transportService = module.get(WingullTransportService);
    wingullRepository = module.get(WingullRepository);
    _logger = module.get(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateBalance', () => {
    it('should update balance via economy service', async () => {
      economyService.updateBalance.mockResolvedValue({ success: true });
      const dto = { uuid: 'test-uuid', balance: 500, type: 'MAIN' };

      const result = await service.updateBalance(dto as any);

      expect(economyService.updateBalance).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ success: true });
    });

    it('should throw descriptive error when economy service fails', async () => {
      economyService.updateBalance.mockRejectedValue(new Error('server down'));

      await expect(
        service.updateBalance({
          uuid: 'test',
          balance: 0,
          type: 'MAIN',
        } as any),
      ).rejects.toThrow('Failed to update balance');
    });
  });

  describe('getCurrentBalance', () => {
    it('should return current balance', async () => {
      economyService.getCurrentBalance.mockResolvedValue(1000);

      const result = await service.getCurrentBalance('test-uuid');

      expect(economyService.getCurrentBalance).toHaveBeenCalledWith(
        'test-uuid',
        undefined,
      );
      expect(result).toBe(1000);
    });

    it('should throw when economy service fails', async () => {
      economyService.getCurrentBalance.mockRejectedValue(new Error('timeout'));

      await expect(service.getCurrentBalance('test-uuid')).rejects.toThrow(
        'Failed to get current balance',
      );
    });
  });

  describe('getMoney', () => {
    it('should return money for player', async () => {
      economyService.getMoney.mockResolvedValue(500);

      const result = await service.getMoney('test-uuid');

      expect(result).toBe(500);
    });

    it('should throw when service fails', async () => {
      economyService.getMoney.mockRejectedValue(new Error('network error'));

      await expect(service.getMoney('test-uuid')).rejects.toThrow(
        'Failed to get money',
      );
    });
  });

  describe('getStats', () => {
    it('should return player stats', async () => {
      const stats = { wins: 10, losses: 5 };
      playerService.getStats.mockResolvedValue(stats as any);

      const result = await service.getStats('test-uuid');

      expect(playerService.getStats).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(stats);
    });

    it('should throw when service fails', async () => {
      playerService.getStats.mockRejectedValue(new Error('error'));

      await expect(service.getStats('test-uuid')).rejects.toThrow(
        'Failed to get stats',
      );
    });
  });

  describe('getTeam', () => {
    it('should return player team', async () => {
      const team = [{ id: 1, name: 'Pikachu' }];
      playerService.getTeam.mockResolvedValue(team as any);

      const result = await service.getTeam('test-uuid');

      expect(result).toEqual(team);
    });
  });

  describe('getPC', () => {
    it('should return player PC', async () => {
      playerService.getPC.mockResolvedValue([]);

      const result = await service.getPC('test-uuid');

      expect(result).toEqual([]);
    });
  });

  describe('sendMessage', () => {
    it('should send message to player', async () => {
      playerService.sendMessage.mockResolvedValue({ success: true });

      const _result = await service.sendMessage('test-uuid', 'Hello!');

      expect(playerService.sendMessage).toHaveBeenCalledWith(
        'test-uuid',
        'Hello!',
      );
    });
  });

  describe('givePokemon', () => {
    it('should give Pokémon to player', async () => {
      playerService.givePokemon.mockResolvedValue({ success: true });

      const _result = await service.givePokemon('test-uuid', 'pikachu lvl:5');

      expect(playerService.givePokemon).toHaveBeenCalledWith(
        'test-uuid',
        'pikachu lvl:5',
        true,
      );
    });
  });

  describe('getBattleTeams', () => {
    it('should return battle teams', async () => {
      const teams = { teams: [], maxTeams: 3, activeTeamId: 0 };
      playerService.getBattleTeams.mockResolvedValue(teams as any);

      const result = await service.getBattleTeams('test-uuid');

      expect(result).toEqual(teams);
    });
  });

  describe('getPerformance', () => {
    it('should return server performance data', async () => {
      const perf = { tps: '20', players: 5, memory: 4.2, uptime: '1d 2h' };
      worldService.getPerformance.mockResolvedValue(perf);

      const result = await service.getPerformance();

      expect(worldService.getPerformance).toHaveBeenCalledTimes(1);
      expect(result).toEqual(perf);
    });
  });

  describe('getTaxiStops', () => {
    it('should return taxi stops', async () => {
      const stops = [{ id: '1', name: 'Pueblo Paleta' }];
      transportService.getTaxiStops.mockResolvedValue(stops as any);

      const result = await service.getTaxiStops();

      expect(result).toEqual(stops);
    });
  });

  describe('teleportPlayer', () => {
    it('should teleport player and return result', async () => {
      transportService.teleportPlayer.mockResolvedValue({ ok: true });

      const result = await service.teleportPlayer('stop-1', 'test-uuid');

      expect(transportService.teleportPlayer).toHaveBeenCalledWith(
        'stop-1',
        'test-uuid',
      );
      expect(result).toEqual({ ok: true });
    });

    // The refusal reason is what the taxi charges (or does not charge) on, so the facade must
    // hand it back untouched rather than throwing or flattening it.
    it('passes a refusal through with its reason', async () => {
      const refusal = {
        ok: false as const,
        reason: 'offline' as const,
        status: 422,
        message: 'Player not online',
      };
      transportService.teleportPlayer.mockResolvedValue(refusal);

      await expect(
        service.teleportPlayer('stop-1', 'test-uuid'),
      ).resolves.toEqual(refusal);
    });
  });

  describe('getAllPlots', () => {
    it('should return all plots', async () => {
      wingullRepository.getAllPlots.mockResolvedValue([]);

      const result = await service.getAllPlots();

      expect(result).toEqual([]);
    });
  });
});
