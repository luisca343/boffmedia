import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PokemonDataManagementService } from './pokemon-data-management.service';
import { PokemonDataService } from './data/pokemon-data.service';
import { MoveDataService } from './data/move-data.service';
import { SpawnDataService } from './data/spawn-data.service';
import { PokemonImageService } from './data/pokemon-image.service';
import { SpriteManifestService } from './sprite-manifest.service';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockPokemonDataService = {
  loadPokemonData: jest.fn(),
  getAllSpecies: jest.fn(),
  getSpeciesByDex: jest.fn(),
  getSpeciesByName: jest.fn(),
  getCustomSpecies: jest.fn(),
  getAllMovesSortedByCount: jest.fn(),
  getAllSpeciesByAbility: jest.fn(),
  getSpeciesByAbility: jest.fn(),
  getSpeciesByMove: jest.fn(),
  sortByDex: jest.fn(),
  getWordleData: jest.fn(),
  getEvoTree: jest.fn(),
};

const mockMoveDataService = {
  loadMoveData: jest.fn(),
  getMove: jest.fn(),
};

const mockSpawnDataService = {
  loadSpawnData: jest.fn(),
  getSpawnByPokemon: jest.fn(),
  getAllBiomes: jest.fn(),
  getPokemonByBiome: jest.fn(),
  getBiomesByPokemon: jest.fn(),
};

const mockPokemonImageService = {
  getImage: jest.fn(),
  getItemSprite: jest.fn(),
  getSimpleSprite: jest.fn(),
};

const mockSpriteManifestService = {
  loadSpriteManifest: jest.fn(),
  getManifest: jest.fn(),
  refreshManifest: jest.fn(),
};

const makePokemon = (dex: number, name: string) => ({ dex, name, forms: [] });

describe('PokemonDataManagementService', () => {
  let service: PokemonDataManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPokemonDataService.getAllSpecies.mockReturnValue([]);
    mockPokemonDataService.loadPokemonData.mockResolvedValue(undefined);
    mockMoveDataService.loadMoveData.mockResolvedValue(undefined);
    mockSpawnDataService.loadSpawnData.mockResolvedValue(undefined);
    mockSpriteManifestService.loadSpriteManifest.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonDataManagementService,
        { provide: Logger, useValue: mockLogger },
        { provide: PokemonDataService, useValue: mockPokemonDataService },
        { provide: MoveDataService, useValue: mockMoveDataService },
        { provide: SpawnDataService, useValue: mockSpawnDataService },
        { provide: PokemonImageService, useValue: mockPokemonImageService },
        { provide: SpriteManifestService, useValue: mockSpriteManifestService },
      ],
    }).compile();

    service = module.get<PokemonDataManagementService>(PokemonDataManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── initializeData ───────────────────────────────────────────────────────────

  describe('initializeData()', () => {
    it('loads all data services in order', async () => {
      const order: string[] = [];
      mockPokemonDataService.loadPokemonData.mockImplementation(async () => { order.push('pokemon'); });
      mockMoveDataService.loadMoveData.mockImplementation(async () => { order.push('move'); });
      mockSpawnDataService.loadSpawnData.mockImplementation(async () => { order.push('spawn'); });
      mockSpriteManifestService.loadSpriteManifest.mockImplementation(async () => { order.push('sprite'); });

      await service.initializeData();

      expect(order).toEqual(['pokemon', 'move', 'spawn', 'sprite']);
    });

    it('rethrows initialization errors', async () => {
      mockPokemonDataService.loadPokemonData.mockRejectedValue(new Error('disk read failed'));

      await expect(service.initializeData()).rejects.toThrow('Data initialization failed');
    });
  });

  // ─── pokemon operations ───────────────────────────────────────────────────────

  describe('getAllPokemon()', () => {
    it('delegates to pokemonDataService.getAllSpecies', () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([makePokemon(25, 'pikachu')]);
      expect(service.getAllPokemon()).toHaveLength(1);
    });
  });

  describe('getPokemonByDex()', () => {
    it('delegates to pokemonDataService.getSpeciesByDex', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue(makePokemon(25, 'pikachu'));
      expect(service.getPokemonByDex(25)?.name).toBe('pikachu');
    });
  });

  describe('getPokemonByName()', () => {
    it('delegates to pokemonDataService.getSpeciesByName', () => {
      mockPokemonDataService.getSpeciesByName.mockReturnValue(makePokemon(25, 'pikachu'));
      expect(service.getPokemonByName('pikachu')?.name).toBe('pikachu');
    });
  });

  describe('countPokemon()', () => {
    it('returns the length of getAllSpecies', () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        makePokemon(25, 'pikachu'),
        makePokemon(26, 'raichu'),
      ]);
      expect(service.countPokemon()).toBe(2);
    });
  });

  describe('getCustomSpecies()', () => {
    it('delegates to pokemonDataService.getCustomSpecies', () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([makePokemon(1026, 'terasmon')]);
      expect(service.getCustomSpecies()).toHaveLength(1);
    });
  });

  // ─── searchPokemonByName ──────────────────────────────────────────────────────

  describe('searchPokemonByName()', () => {
    it('returns fuzzy matches from the species list', () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        makePokemon(25, 'pikachu'),
        makePokemon(26, 'raichu'),
        makePokemon(172, 'pichu'),
      ]);
      // Fuse is initialised lazily on first call
      const results = service.searchPokemonByName('pikachu', 5);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].item.name).toBe('pikachu');
    });

    it('returns an empty array when nothing matches', () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        makePokemon(25, 'pikachu'),
      ]);
      const results = service.searchPokemonByName('zzzzzzz', 5);
      expect(results).toEqual([]);
    });

    it('limits results to the requested amount', () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        makePokemon(25, 'pikachu'),
        makePokemon(172, 'pichu'),
        makePokemon(26, 'raichu'),
      ]);
      const results = service.searchPokemonByName('pi', 1);
      expect(results).toHaveLength(1);
    });
  });

  // ─── getNextPrev ──────────────────────────────────────────────────────────────

  describe('getNextPrev()', () => {
    const species = [makePokemon(1, 'bulbasaur'), makePokemon(2, 'ivysaur'), makePokemon(3, 'venusaur')];

    beforeEach(() => {
      mockPokemonDataService.getAllSpecies.mockReturnValue(species);
    });

    it('returns prev and next for a middle entry', () => {
      const { prev, next } = service.getNextPrev(2);
      expect(prev?.dex).toBe(1);
      expect(next?.dex).toBe(3);
    });

    it('wraps prev to the last when at the first entry', () => {
      const { prev, next } = service.getNextPrev(1);
      expect(prev?.dex).toBe(3); // wraps to last
      expect(next?.dex).toBe(2);
    });

    it('wraps next to the first when at the last entry', () => {
      const { prev, next } = service.getNextPrev(3);
      expect(prev?.dex).toBe(2);
      expect(next?.dex).toBe(1); // wraps to first
    });

    it('returns undefined for both when dex is not found', () => {
      const { prev, next } = service.getNextPrev(999);
      expect(prev).toBeUndefined();
      expect(next).toBeUndefined();
    });
  });

  // ─── move operations ──────────────────────────────────────────────────────────

  describe('getAllMoves()', () => {
    it('delegates to pokemonDataService.getAllMovesSortedByCount', () => {
      mockPokemonDataService.getAllMovesSortedByCount.mockReturnValue([{ name: 'thunderbolt', count: 5 }]);
      expect(service.getAllMoves()).toHaveLength(1);
    });
  });

  describe('getMove()', () => {
    it('delegates to moveDataService.getMove', () => {
      mockMoveDataService.getMove.mockReturnValue({ attackName: 'Thunderbolt' });
      expect(service.getMove('thunderbolt')?.attackName).toBe('Thunderbolt');
    });
  });

  // ─── spawn operations ─────────────────────────────────────────────────────────

  describe('getSpawnByPokemon()', () => {
    it('delegates to spawnDataService.getSpawnByPokemon', () => {
      mockSpawnDataService.getSpawnByPokemon.mockReturnValue([{ pokemonName: 'pikachu' }]);
      expect(service.getSpawnByPokemon('pikachu_base')).toHaveLength(1);
    });
  });

  describe('getBiomes()', () => {
    it('delegates to spawnDataService.getAllBiomes', () => {
      mockSpawnDataService.getAllBiomes.mockReturnValue({ forest: 3 });
      expect(service.getBiomes()['forest']).toBe(3);
    });
  });

  // ─── wordle / sprite manifest ─────────────────────────────────────────────────

  describe('getWordleData()', () => {
    it('delegates to pokemonDataService.getWordleData', () => {
      mockPokemonDataService.getWordleData.mockReturnValue([{ name: 'pikachu_base' }]);
      expect(service.getWordleData()).toHaveLength(1);
    });
  });

  describe('getSpriteManifest()', () => {
    it('delegates to spriteManifestService.getManifest', () => {
      const manifest = { sprites: {}, count: { total: 0 } };
      mockSpriteManifestService.getManifest.mockReturnValue(manifest);
      expect(service.getSpriteManifest()).toBe(manifest);
    });
  });

  describe('refreshSpriteManifest()', () => {
    it('delegates to spriteManifestService.refreshManifest', async () => {
      mockSpriteManifestService.refreshManifest.mockResolvedValue(undefined);
      await service.refreshSpriteManifest();
      expect(mockSpriteManifestService.refreshManifest).toHaveBeenCalled();
    });
  });

  // ─── getPmdPortrait ───────────────────────────────────────────────────────────

  describe('getPmdPortrait()', () => {
    it('returns the default portrait when no match found', async () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([]);
      const result = await service.getPmdPortrait('nonexistent');
      expect(result.url).toBe('/smartrotom/img/pmd/portrait/0000/Normal.png');
    });

    it('returns a dex-formatted portrait URL for a matched pokemon', async () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([makePokemon(25, 'pikachu')]);
      const result = await service.getPmdPortrait('pikachu');
      expect(result.url).toBe('/smartrotom/img/pmd/portrait/0025/Normal.png');
    });
  });
});
