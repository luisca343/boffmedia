import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PokedexManagementService } from './pokedex-management.service';
import { PokemonDataManagementService } from './pokemon-data-management.service';
import { POKEMON_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  findPokedexRegistry: jest.fn(),
  createPokedexRegistry: jest.fn(),
  updatePokedexRegistry: jest.fn(),
  getAllUserPokedexRegistries: jest.fn(),
  getUserPokedexRegistries: jest.fn(),
  getUserRegistriesForCache: jest.fn(),
  bulkInsertPokedexRegistries: jest.fn(),
  bulkUpdatePokedexRegistriesStatus: jest.fn(),
  getPokedexStatistics: jest.fn(),
};

const mockDataManagement = {
  countPokemon: jest.fn(),
  getPokemonByDex: jest.fn(),
  getAllPokemon: jest.fn(),
};

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('PokedexManagementService', () => {
  let service: PokedexManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokedexManagementService,
        { provide: Logger, useValue: mockLogger },
        { provide: POKEMON_REPOSITORY_TOKEN, useValue: mockRepo },
        { provide: PokemonDataManagementService, useValue: mockDataManagement },
      ],
    }).compile();

    service = module.get<PokedexManagementService>(PokedexManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── registerPokemon ──────────────────────────────────────────────────────────

  describe('registerPokemon()', () => {
    it('creates a new registry when none exists (seen, status=0)', async () => {
      mockRepo.findPokedexRegistry.mockResolvedValue(null);
      mockRepo.createPokedexRegistry.mockResolvedValue({ success: true });

      const result = await service.registerPokemon('uuid-1', 25, 'base', 'none', 0);

      expect(mockRepo.createPokedexRegistry).toHaveBeenCalled();
      expect(result).toMatchObject({ success: true, isNew: true });
    });

    it('sets caughtAt when status=1 on new registry', async () => {
      mockRepo.findPokedexRegistry.mockResolvedValue(null);
      mockRepo.createPokedexRegistry.mockResolvedValue({ success: true });

      await service.registerPokemon('uuid-1', 25, 'base', 'none', 1);

      const callArg = mockRepo.createPokedexRegistry.mock.calls[0][0];
      expect(callArg.caughtAt).toBeInstanceOf(Date);
    });

    it('updates existing registry to caught when status=1 and not yet caught', async () => {
      mockRepo.findPokedexRegistry.mockResolvedValue({ caughtAt: null });
      mockRepo.updatePokedexRegistry.mockResolvedValue({ success: true });

      const result = await service.registerPokemon('uuid-1', 25, 'base', 'none', 1);

      expect(mockRepo.updatePokedexRegistry).toHaveBeenCalled();
      expect(result).toMatchObject({ success: true, wasUpdated: true });
    });

    it('returns already-registered message when registry exists with correct status', async () => {
      mockRepo.findPokedexRegistry.mockResolvedValue({ caughtAt: new Date() });

      const result = await service.registerPokemon('uuid-1', 25, 'base', 'none', 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already registered');
    });

    it('returns failure on repo error', async () => {
      mockRepo.findPokedexRegistry.mockRejectedValue(new Error('db timeout'));

      const result = await service.registerPokemon('uuid-1', 25, 'base', 'none', 0);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Registration failed');
    });

    it('defaults formId to "base" when empty string', async () => {
      mockRepo.findPokedexRegistry.mockResolvedValue(null);
      mockRepo.createPokedexRegistry.mockResolvedValue({ success: true });

      await service.registerPokemon('uuid-1', 25, '', '', 0);

      expect(mockRepo.findPokedexRegistry).toHaveBeenCalledWith('uuid-1', 25, 'base', 'none');
    });
  });

  // ─── bulkUpdateDex ────────────────────────────────────────────────────────────

  describe('bulkUpdateDex()', () => {
    it('inserts new seen and caught pokemon, skipping duplicates', async () => {
      mockRepo.getAllUserPokedexRegistries.mockResolvedValue([
        { pokemonId: 1, formId: 'base', paletteId: 'none', seenAt: new Date(), caughtAt: null },
      ]);
      mockRepo.bulkInsertPokedexRegistries.mockResolvedValue({ insertedCount: 2 });

      const result = await service.bulkUpdateDex('uuid-1', {
        SEEN: [2, 3],
        CAUGHT: [4, 5],
      });

      expect(result.success).toBe(true);
      expect(mockRepo.bulkInsertPokedexRegistries).toHaveBeenCalled();
    });

    it('upgrades seen-only pokemon to caught', async () => {
      mockRepo.getAllUserPokedexRegistries.mockResolvedValue([
        { pokemonId: 25, formId: 'base', paletteId: 'none', seenAt: new Date(), caughtAt: null },
      ]);
      mockRepo.bulkInsertPokedexRegistries.mockResolvedValue({ insertedCount: 0 });
      mockRepo.bulkUpdatePokedexRegistriesStatus.mockResolvedValue({ updatedCount: 1 });

      const result = await service.bulkUpdateDex('uuid-1', { SEEN: [], CAUGHT: [25] });

      expect(mockRepo.bulkUpdatePokedexRegistriesStatus).toHaveBeenCalledWith('uuid-1', [25], 'caught');
      expect(result.success).toBe(true);
    });

    it('skips already-caught pokemon without updating', async () => {
      mockRepo.getAllUserPokedexRegistries.mockResolvedValue([
        { pokemonId: 1, formId: 'base', paletteId: 'none', seenAt: new Date(), caughtAt: new Date() },
      ]);

      await service.bulkUpdateDex('uuid-1', { SEEN: [], CAUGHT: [1] });

      expect(mockRepo.bulkUpdatePokedexRegistriesStatus).not.toHaveBeenCalled();
    });

    it('returns failure on error', async () => {
      mockRepo.getAllUserPokedexRegistries.mockRejectedValue(new Error('db error'));

      const result = await service.bulkUpdateDex('uuid-1', { SEEN: [1], CAUGHT: [] });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Bulk update failed');
    });
  });

  // ─── getPokedexStatistics ─────────────────────────────────────────────────────

  describe('getPokedexStatistics()', () => {
    it('calls repo with uuid and total count from data management service', async () => {
      mockDataManagement.countPokemon.mockReturnValue(1025);
      mockRepo.getPokedexStatistics.mockResolvedValue({ seen: 50, caught: 30 });

      const result = await service.getPokedexStatistics('uuid-1');

      expect(mockRepo.getPokedexStatistics).toHaveBeenCalledWith('uuid-1', 1025);
      expect(result).toEqual({ seen: 50, caught: 30 });
    });

    it('throws descriptive error on failure', async () => {
      mockDataManagement.countPokemon.mockReturnValue(0);
      mockRepo.getPokedexStatistics.mockRejectedValue(new Error('repo error'));

      await expect(service.getPokedexStatistics('uuid-1')).rejects.toThrow('Pokedex statistics retrieval failed');
    });
  });

  // ─── getPokedexRegistries ─────────────────────────────────────────────────────

  describe('getPokedexRegistries()', () => {
    it('enhances each registry with pokemon name', async () => {
      mockRepo.getUserPokedexRegistries.mockResolvedValue([
        { pokemonId: 25, formId: 'base', paletteId: 'none', seenAt: new Date() },
      ]);
      mockDataManagement.getPokemonByDex.mockReturnValue({ name: 'Pikachu' });

      const result = await service.getPokedexRegistries('uuid-1', 10);

      expect(result[0].pokemonName).toBe('Pikachu');
      expect(mockRepo.getUserPokedexRegistries).toHaveBeenCalledWith('uuid-1', 10);
    });

    it('uses "Unknown" when pokemon not found by dex', async () => {
      mockRepo.getUserPokedexRegistries.mockResolvedValue([
        { pokemonId: 9999, formId: 'base', paletteId: 'none', seenAt: new Date() },
      ]);
      mockDataManagement.getPokemonByDex.mockReturnValue(null);

      const result = await service.getPokedexRegistries('uuid-1');

      expect(result[0].pokemonName).toBe('Unknown');
    });
  });

  // ─── cache management ─────────────────────────────────────────────────────────

  describe('getRegistriesForImageStatus()', () => {
    it('fetches from repo on first call and caches result', async () => {
      mockRepo.getUserRegistriesForCache.mockResolvedValue([{ pokemonId: 1 }]);

      await service.getRegistriesForImageStatus('uuid-1');
      await service.getRegistriesForImageStatus('uuid-1');

      expect(mockRepo.getUserRegistriesForCache).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearUserCache()', () => {
    it('forces re-fetch after clearing user cache', async () => {
      mockRepo.getUserRegistriesForCache.mockResolvedValue([]);

      await service.getRegistriesForImageStatus('uuid-1');
      service.clearUserCache('uuid-1');
      await service.getRegistriesForImageStatus('uuid-1');

      expect(mockRepo.getUserRegistriesForCache).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearAllCache()', () => {
    it('forces re-fetch for all users after clearing all caches', async () => {
      mockRepo.getUserRegistriesForCache.mockResolvedValue([]);

      await service.getRegistriesForImageStatus('uuid-1');
      await service.getRegistriesForImageStatus('uuid-2');
      service.clearAllCache();
      await service.getRegistriesForImageStatus('uuid-1');

      expect(mockRepo.getUserRegistriesForCache).toHaveBeenCalledTimes(3);
    });
  });
});
