import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { WingullPlayerService } from './wingull-player.service';
import { WINGULL_USER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  getStatsFromAPI: jest.fn(),
  getTeamFromAPI: jest.fn(),
  getPCFromAPI: jest.fn(),
  movePokemonInAPI: jest.fn(),
  updateDexInAPI: jest.fn(),
  getQuestsFromAPI: jest.fn(),
  sendMessageInAPI: jest.fn(),
  globalchatInAPI: jest.fn(),
  givePokemonInAPI: jest.fn(),
  giveItemsInAPI: jest.fn(),
  getBattleTeamsFromAPI: jest.fn(),
  updateBattleTeamInAPI: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const UUID = 'abc-123-uuid';

describe('WingullPlayerService', () => {
  let service: WingullPlayerService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullPlayerService,
        { provide: Logger, useValue: mockLogger },
        { provide: WINGULL_USER_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WingullPlayerService>(WingullPlayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getStats ─────────────────────────────────────────────────────────────────

  describe('getStats()', () => {
    it('returns stats from repo', async () => {
      const stats = { level: 10, badges: 3 } as any;
      mockRepo.getStatsFromAPI.mockResolvedValue(stats);

      await expect(service.getStats(UUID)).resolves.toEqual(stats);
      expect(mockRepo.getStatsFromAPI).toHaveBeenCalledWith(UUID);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getStatsFromAPI.mockRejectedValue(new Error('not found'));

      await expect(service.getStats(UUID)).rejects.toThrow(
        'Stats retrieval failed: not found',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── getTeam ──────────────────────────────────────────────────────────────────

  describe('getTeam()', () => {
    it('returns team from repo', async () => {
      const team = [{ id: 1, name: 'Pikachu' }] as any;
      mockRepo.getTeamFromAPI.mockResolvedValue(team);

      await expect(service.getTeam(UUID)).resolves.toEqual(team);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getTeamFromAPI.mockRejectedValue(new Error('api error'));

      await expect(service.getTeam(UUID)).rejects.toThrow(
        'Team retrieval failed: api error',
      );
    });
  });

  // ─── getPC ────────────────────────────────────────────────────────────────────

  describe('getPC()', () => {
    it('returns PC data from repo', async () => {
      mockRepo.getPCFromAPI.mockResolvedValue({ boxes: [] });

      await expect(service.getPC(UUID)).resolves.toEqual({ boxes: [] });
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getPCFromAPI.mockRejectedValue(new Error('timeout'));

      await expect(service.getPC(UUID)).rejects.toThrow(
        'PC retrieval failed: timeout',
      );
    });
  });

  // ─── movePokemon ──────────────────────────────────────────────────────────────

  describe('movePokemon()', () => {
    const dto = { uuid: UUID, from: 1, to: 2 };

    it('delegates to repo and returns result', async () => {
      mockRepo.movePokemonInAPI.mockResolvedValue({ success: true });

      await expect(service.movePokemon(dto)).resolves.toEqual({
        success: true,
      });
      expect(mockRepo.movePokemonInAPI).toHaveBeenCalledWith(dto);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.movePokemonInAPI.mockRejectedValue(new Error('slot occupied'));

      await expect(service.movePokemon(dto)).rejects.toThrow(
        'Pokémon move failed: slot occupied',
      );
    });
  });

  // ─── updateDex ────────────────────────────────────────────────────────────────

  describe('updateDex()', () => {
    it('returns updated dex from repo', async () => {
      mockRepo.updateDexInAPI.mockResolvedValue({ seen: 150 });

      await expect(service.updateDex(UUID)).resolves.toEqual({ seen: 150 });
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.updateDexInAPI.mockRejectedValue(new Error('sync failed'));

      await expect(service.updateDex(UUID)).rejects.toThrow(
        'Dex update failed: sync failed',
      );
    });
  });

  // ─── getQuests ────────────────────────────────────────────────────────────────

  describe('getQuests()', () => {
    it('returns quests from repo', async () => {
      const quests = [{ id: 1, name: 'Catch 10 Pokémon' }];
      mockRepo.getQuestsFromAPI.mockResolvedValue(quests);

      await expect(service.getQuests(UUID)).resolves.toEqual(quests);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getQuestsFromAPI.mockRejectedValue(new Error('server error'));

      await expect(service.getQuests(UUID)).rejects.toThrow(
        'Quests retrieval failed: server error',
      );
    });
  });

  // ─── sendMessage ──────────────────────────────────────────────────────────────

  describe('sendMessage()', () => {
    it('constructs MessageRequestDto and delegates to repo', async () => {
      mockRepo.sendMessageInAPI.mockResolvedValue({ delivered: true });

      await service.sendMessage(UUID, 'Hello!');

      expect(mockRepo.sendMessageInAPI).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: UUID, message: 'Hello!' }),
      );
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.sendMessageInAPI.mockRejectedValue(new Error('offline'));

      await expect(service.sendMessage(UUID, 'Hi')).rejects.toThrow(
        'Message sending failed: offline',
      );
    });
  });

  // ─── globalchat ───────────────────────────────────────────────────────────────

  describe('globalchat()', () => {
    it('constructs MessageRequestDto and delegates to repo', async () => {
      mockRepo.globalchatInAPI.mockResolvedValue({ sent: true });

      await service.globalchat(UUID, 'Hello world!');

      expect(mockRepo.globalchatInAPI).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: UUID, message: 'Hello world!' }),
      );
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.globalchatInAPI.mockRejectedValue(new Error('chat blocked'));

      await expect(service.globalchat(UUID, 'Hi')).rejects.toThrow(
        'Global chat message sending failed: chat blocked',
      );
    });
  });

  // ─── givePokemon ──────────────────────────────────────────────────────────────

  describe('givePokemon()', () => {
    it('constructs PokemonGiveRequestDto with sendMessage defaulting to true', async () => {
      mockRepo.givePokemonInAPI.mockResolvedValue({ received: true });

      await service.givePokemon(UUID, 'Pikachu');

      expect(mockRepo.givePokemonInAPI).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: UUID,
          pokespec: 'Pikachu',
          sendMessage: true,
        }),
      );
    });

    it('respects explicit sendMessage=false', async () => {
      mockRepo.givePokemonInAPI.mockResolvedValue({ received: true });

      await service.givePokemon(UUID, 'Bulbasaur', false);

      expect(mockRepo.givePokemonInAPI).toHaveBeenCalledWith(
        expect.objectContaining({ sendMessage: false }),
      );
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.givePokemonInAPI.mockRejectedValue(new Error('inventory full'));

      await expect(service.givePokemon(UUID, 'Charmander')).rejects.toThrow(
        'Pokémon giving failed: inventory full',
      );
    });
  });

  // ─── giveItems ────────────────────────────────────────────────────────────────

  describe('giveItems()', () => {
    const items = [{ id: 'potion', amount: 3 }];

    it('delegates to repo with uuid and items', async () => {
      mockRepo.giveItemsInAPI.mockResolvedValue({ success: true });

      await service.giveItems(UUID, items);

      expect(mockRepo.giveItemsInAPI).toHaveBeenCalledWith(UUID, items);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.giveItemsInAPI.mockRejectedValue(new Error('item not found'));

      await expect(service.giveItems(UUID, items)).rejects.toThrow(
        'Items giving failed: item not found',
      );
    });
  });

  // ─── getBattleTeams ───────────────────────────────────────────────────────────

  describe('getBattleTeams()', () => {
    it('returns battle teams from repo', async () => {
      const teams = [{ id: 1, name: 'Team A' }];
      mockRepo.getBattleTeamsFromAPI.mockResolvedValue(teams);

      await expect(service.getBattleTeams(UUID)).resolves.toEqual(teams);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getBattleTeamsFromAPI.mockRejectedValue(new Error('not found'));

      await expect(service.getBattleTeams(UUID)).rejects.toThrow(
        'Battle teams retrieval failed: not found',
      );
    });
  });

  // ─── updateBattleTeam ─────────────────────────────────────────────────────────

  describe('updateBattleTeam()', () => {
    const dto = { uuid: UUID, team: [] } as any;

    it('delegates DTO to repo and returns result', async () => {
      mockRepo.updateBattleTeamInAPI.mockResolvedValue({ updated: true });

      await expect(service.updateBattleTeam(dto)).resolves.toEqual({
        updated: true,
      });
      expect(mockRepo.updateBattleTeamInAPI).toHaveBeenCalledWith(dto);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.updateBattleTeamInAPI.mockRejectedValue(
        new Error('invalid team'),
      );

      await expect(service.updateBattleTeam(dto)).rejects.toThrow(
        'Battle team update failed: invalid team',
      );
    });
  });
});
