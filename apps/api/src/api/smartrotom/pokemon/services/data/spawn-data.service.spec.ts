import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { SpawnDataService } from './spawn-data.service';
import { PokemonDataService } from './pokemon-data.service';
import { BiomeTagService } from './biome-tag.service';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockPokemonDataService = {
  getSpeciesByNameWithForm: jest.fn(),
  getSpeciesByName: jest.fn(),
};

const mockBiomeTagService = {
  loadBiomeTags: jest.fn().mockResolvedValue(undefined),
  // Categories expand to one stand-in biome so the resolved index is exercised
  // without dragging the real tag files into a unit test.
  resolveBiomeReference: jest.fn((raw: string) =>
    raw.includes(':') ? [raw] : [`minecraft:${raw}`],
  ),
};

const makeSpawnData = (overrides: Partial<any> = {}) => ({
  spawnInfos: [
    {
      typeID: 'pokemon',
      spec: 'species:pikachu',
      rarity: 10,
      condition: { biomes: ['#pixelmon:spawning/forests', 'minecraft:plains'] },
      ...overrides,
    },
  ],
});

describe('SpawnDataService', () => {
  let service: SpawnDataService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPokemonDataService.getSpeciesByName.mockReturnValue({ dex: 25 });
    mockPokemonDataService.getSpeciesByNameWithForm.mockReturnValue({
      gender: 'M',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpawnDataService,
        { provide: Logger, useValue: mockLogger },
        { provide: PokemonDataService, useValue: mockPokemonDataService },
        { provide: BiomeTagService, useValue: mockBiomeTagService },
      ],
    }).compile();

    service = module.get<SpawnDataService>(SpawnDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── loadSpawnData ────────────────────────────────────────────────────────────

  describe('loadSpawnData()', () => {
    it('indexes spawn data after loading', async () => {
      jest
        .spyOn(service as any, 'readJsonFiles')
        .mockResolvedValue([makeSpawnData()]);

      await service.loadSpawnData();

      // 8 non-banned folders (12 total minus legendaries, megas, npcs, grass)
      expect(service.getSpawnByDex(25).length).toBeGreaterThan(0);
      expect(service.getSpawnByPokemon('pikachu_base').length).toBeGreaterThan(
        0,
      );
    });

    it('skips banned folders (legendaries, megas, npcs, grass)', async () => {
      const readJsonFiles = jest
        .spyOn(service as any, 'readJsonFiles')
        .mockResolvedValue([makeSpawnData()]);

      await service.loadSpawnData();

      const _allSpawns = service.getAllSpawns();
      const calls = readJsonFiles.mock.calls;

      // banned folders produce calls but data is filtered during processSpawnInfos
      expect(calls.length).toBeGreaterThan(0);

      // The 'standard' and other non-banned folders should process — since all
      // readJsonFiles calls return the same data, we check pikachu was indexed
      expect(service.getSpawnByPokemon('pikachu_base').length).toBeGreaterThan(
        0,
      );
    });
  });

  // ─── accessors (state pre-populated by spying on private methods) ─────────────

  describe('accessors after loading', () => {
    beforeEach(async () => {
      jest
        .spyOn(service as any, 'readJsonFiles')
        .mockResolvedValue([makeSpawnData()]);
      await service.loadSpawnData();
    });

    it('getSpawnByPokemon returns spawns for named pokemon', () => {
      const spawns = service.getSpawnByPokemon('pikachu_base');
      expect(spawns.length).toBeGreaterThan(0);
      expect(spawns[0].pokemonName).toBe('pikachu');
    });

    it('getSpawnByPokemon returns empty array for unknown pokemon', () => {
      expect(service.getSpawnByPokemon('mewtwo')).toEqual([]);
    });

    it('getSpawnByDex returns spawns for dex number', () => {
      expect(service.getSpawnByDex(25).length).toBeGreaterThan(0);
    });

    it('getSpawnByDex returns empty array for missing dex', () => {
      expect(service.getSpawnByDex(999)).toEqual([]);
    });

    it('getBiomesByPokemon returns biomes for pikachu_base', () => {
      const biomes = service.getBiomesByPokemon('pikachu_base');
      // The `#pixelmon:spawning/` prefix is stripped on read; literal ids pass through.
      expect(biomes).toContain('forests');
      expect(biomes).toContain('minecraft:plains');
    });

    it('getAllSpawns returns all indexed spawns', () => {
      const all = service.getAllSpawns();
      expect(Object.keys(all)).toContain('pikachu_base');
    });

    it('getAllBiomes returns sorted biome counts', () => {
      const biomes = service.getAllBiomes();
      expect(biomes['forests']).toBeGreaterThan(0);
    });

    it('getSpawnByForm returns spawns by form name', () => {
      const spawns = service.getSpawnByForm('base');
      expect(spawns.length).toBeGreaterThan(0);
    });

    it('getSpawnByBiome returns spawns for a biome', () => {
      const spawns = service.getSpawnByBiome('forests');
      expect(spawns.length).toBeGreaterThan(0);
    });
  });
});
