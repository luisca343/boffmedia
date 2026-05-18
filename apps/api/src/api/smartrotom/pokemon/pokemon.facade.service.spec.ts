import { Test, TestingModule } from '@nestjs/testing';
import { PokemonFacadeService } from './pokemon.facade.service';
import { PokemonDataManagementService } from './services/pokemon-data-management.service';
import { PokedexManagementService } from './services/pokedex-management.service';
import { PokemonIntegrationService } from './services/pokemon-integration.service';
import { Logger } from 'nestjs-pino';

const mockPokemon = { id: 25, name: 'Pikachu', dex: 25, types: ['Electric'] };

describe('PokemonFacadeService', () => {
  let service: PokemonFacadeService;
  let pokemonDataService: jest.Mocked<PokemonDataManagementService>;
  let pokedexService: jest.Mocked<PokedexManagementService>;
  let integrationService: jest.Mocked<PokemonIntegrationService>;

  beforeEach(async () => {
    const mockPokemonDataService = {
      initializeData: jest.fn(),
      getAllPokemon: jest.fn(),
      getPokemonByDex: jest.fn(),
      getPokemonByName: jest.fn(),
      searchPokemonByName: jest.fn(),
      getPokemonNames: jest.fn(),
      countPokemon: jest.fn(),
      getEvoTree: jest.fn(),
      getNextPrev: jest.fn(),
      getAllMoves: jest.fn(),
      getMove: jest.fn(),
      getPokemonMoves: jest.fn(),
      getPokemonByMove: jest.fn(),
      getAllAbilities: jest.fn(),
      getAbility: jest.fn(),
      getPokemonByAbility: jest.fn(),
      getSpawnByPokemon: jest.fn(),
      getBiomes: jest.fn(),
      getPokemonByBiome: jest.fn(),
      getBiomesByPokemon: jest.fn(),
      getImage: jest.fn(),
      getItemSprite: jest.fn(),
      getWordleData: jest.fn(),
      getSpriteManifest: jest.fn(),
      refreshSpriteManifest: jest.fn(),
      getPmdPortrait: jest.fn(),
    };
    const mockPokedexService = {
      registerPokemon: jest.fn(),
      getPokedexStatistics: jest.fn(),
      getDetailedPokedexStatus: jest.fn(),
      getPokedexRegistries: jest.fn(),
    };
    const mockIntegrationService = {
      updateDexWithSync: jest.fn(),
      getTerasPokemonShowdownData: jest.fn(),
    };
    const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonFacadeService,
        { provide: PokemonDataManagementService, useValue: mockPokemonDataService },
        { provide: PokedexManagementService, useValue: mockPokedexService },
        { provide: PokemonIntegrationService, useValue: mockIntegrationService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PokemonFacadeService>(PokemonFacadeService);
    pokemonDataService = module.get(PokemonDataManagementService);
    pokedexService = module.get(PokedexManagementService);
    integrationService = module.get(PokemonIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initializeService', () => {
    it('should call pokemonDataService.initializeData', async () => {
      (pokemonDataService.initializeData as jest.Mock).mockResolvedValue(undefined);

      await service.initializeService();

      expect(pokemonDataService.initializeData).toHaveBeenCalledTimes(1);
    });

    it('should rethrow error when initialization fails', async () => {
      (pokemonDataService.initializeData as jest.Mock).mockRejectedValue(new Error('DB error'));

      await expect(service.initializeService()).rejects.toThrow('Pokemon service initialization failed');
    });
  });

  describe('getAllPokemon', () => {
    it('should return all Pokémon', () => {
      (pokemonDataService.getAllPokemon as jest.Mock).mockReturnValue([mockPokemon]);

      const result = service.getAllPokemon();

      expect(pokemonDataService.getAllPokemon).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockPokemon]);
    });

    it('should rethrow error on failure', () => {
      (pokemonDataService.getAllPokemon as jest.Mock).mockImplementation(() => {
        throw new Error('Data not loaded');
      });

      expect(() => service.getAllPokemon()).toThrow('Failed to retrieve all Pokemon');
    });
  });

  describe('getPokemonByDex', () => {
    it('should return Pokémon by dex number', () => {
      (pokemonDataService.getPokemonByDex as jest.Mock).mockReturnValue(mockPokemon);

      const result = service.getPokemonByDex(25);

      expect(pokemonDataService.getPokemonByDex).toHaveBeenCalledWith(25);
      expect(result).toEqual(mockPokemon);
    });

    it('should return undefined when not found', () => {
      (pokemonDataService.getPokemonByDex as jest.Mock).mockReturnValue(undefined);

      const result = service.getPokemonByDex(9999);

      expect(result).toBeUndefined();
    });
  });

  describe('getPokemonByName', () => {
    it('should return Pokémon by name', () => {
      (pokemonDataService.getPokemonByName as jest.Mock).mockReturnValue(mockPokemon);

      const result = service.getPokemonByName('Pikachu');

      expect(pokemonDataService.getPokemonByName).toHaveBeenCalledWith('Pikachu');
      expect(result).toEqual(mockPokemon);
    });
  });

  describe('searchPokemonByName', () => {
    it('should search Pokémon by name with default amount', () => {
      const fuseResults = [{ item: mockPokemon, score: 0.9 }];
      (pokemonDataService.searchPokemonByName as jest.Mock).mockReturnValue(fuseResults);

      const result = service.searchPokemonByName('Pika');

      expect(pokemonDataService.searchPokemonByName).toHaveBeenCalledWith('Pika', 16);
      expect(result).toEqual(fuseResults);
    });

    it('should pass custom amount to data service', () => {
      (pokemonDataService.searchPokemonByName as jest.Mock).mockReturnValue([]);

      service.searchPokemonByName('Char', 5);

      expect(pokemonDataService.searchPokemonByName).toHaveBeenCalledWith('Char', 5);
    });
  });

  describe('getPokemonNames', () => {
    it('should return all Pokémon names', () => {
      (pokemonDataService.getPokemonNames as jest.Mock).mockReturnValue(['Pikachu', 'Charizard']);

      const result = service.getPokemonNames();

      expect(result).toEqual(['Pikachu', 'Charizard']);
    });
  });

  describe('countPokemon', () => {
    it('should return total Pokémon count', () => {
      (pokemonDataService.countPokemon as jest.Mock).mockReturnValue(1025);

      const result = service.countPokemon();

      expect(result).toBe(1025);
    });

    it('should return 0 on error', () => {
      (pokemonDataService.countPokemon as jest.Mock).mockImplementation(() => {
        throw new Error('fail');
      });

      const result = service.countPokemon();

      expect(result).toBe(0);
    });
  });

  describe('getEvoTree', () => {
    it('should return evolution tree', () => {
      const tree = { depth: 2, tree: { '25': { id: 25, evolutions: [] } } };
      (pokemonDataService.getEvoTree as jest.Mock).mockReturnValue(tree);

      const result = service.getEvoTree(25);

      expect(pokemonDataService.getEvoTree).toHaveBeenCalledWith(25);
      expect(result).toEqual(tree);
    });
  });

  describe('getNextPrev', () => {
    it('should return adjacent dex entries', () => {
      const nextPrev = { prev: undefined, next: { id: 26, name: 'Raichu' } };
      (pokemonDataService.getNextPrev as jest.Mock).mockReturnValue(nextPrev);

      const result = service.getNextPrev(25);

      expect(pokemonDataService.getNextPrev).toHaveBeenCalledWith(25);
      expect(result).toEqual(nextPrev);
    });
  });

  describe('getAllMoves', () => {
    it('should return all moves', () => {
      const moves = [{ name: 'Tackle', count: 1 }];
      (pokemonDataService.getAllMoves as jest.Mock).mockReturnValue(moves);

      const result = service.getAllMoves();

      expect(result).toEqual(moves);
    });
  });

  describe('getMove', () => {
    it('should return move by name', () => {
      const move = { name: 'Tackle', power: 40 };
      (pokemonDataService.getMove as jest.Mock).mockReturnValue(move);

      const result = service.getMove('Tackle');

      expect(pokemonDataService.getMove).toHaveBeenCalledWith('Tackle');
      expect(result).toEqual(move);
    });
  });

  describe('getPokemonMoves', () => {
    it('should return moves for a Pokémon form', () => {
      const moveset = { levelUp: [], tm: [] };
      (pokemonDataService.getPokemonMoves as jest.Mock).mockReturnValue(moveset);

      const result = service.getPokemonMoves(25, 0);

      expect(pokemonDataService.getPokemonMoves).toHaveBeenCalledWith(25, 0);
      expect(result).toEqual(moveset);
    });
  });

  describe('getPokemonByMove', () => {
    it('should return Pokémon that learn the move', () => {
      const pkmn = [{ speciesID: 25, form: 'default' }];
      (pokemonDataService.getPokemonByMove as jest.Mock).mockReturnValue(pkmn);

      const result = service.getPokemonByMove('Tackle');

      expect(result).toEqual(pkmn);
    });
  });

  describe('getAllAbilities', () => {
    it('should return all abilities', () => {
      const abilities = [{ name: 'Overgrow', count: 3 }];
      (pokemonDataService.getAllAbilities as jest.Mock).mockReturnValue(abilities);

      const result = service.getAllAbilities();

      expect(result).toEqual(abilities);
    });
  });

  describe('getAbility', () => {
    it('should return ability by name', () => {
      const ability = { name: 'Overgrow', effect: '...' };
      (pokemonDataService.getAbility as jest.Mock).mockReturnValue(ability);

      const result = service.getAbility('Overgrow');

      expect(result).toEqual(ability);
    });
  });

  describe('getPokemonByAbility', () => {
    it('should return Pokémon with the ability', () => {
      const list = [{ speciesID: 1, form: 'default', speciesName: 'Bulbasaur' }];
      (pokemonDataService.getPokemonByAbility as jest.Mock).mockReturnValue(list);

      const result = service.getPokemonByAbility('Overgrow');

      expect(result).toEqual(list);
    });
  });

  describe('getSpawnByPokemon', () => {
    it('should return spawn info', () => {
      const spawns = [{ biome: 'forest', rarity: 0.5 }];
      (pokemonDataService.getSpawnByPokemon as jest.Mock).mockReturnValue(spawns);

      const result = service.getSpawnByPokemon('Pikachu');

      expect(result).toEqual(spawns);
    });
  });

  describe('getBiomes', () => {
    it('should return biomes as name/count array', () => {
      (pokemonDataService.getBiomes as jest.Mock).mockReturnValue({ forest: 20, plains: 35 });

      const result = service.getBiomes();

      expect(result).toEqual(
        expect.arrayContaining([
          { name: 'forest', count: 20 },
          { name: 'plains', count: 35 },
        ]),
      );
    });
  });

  describe('getPokemonByBiome', () => {
    it('should return Pokémon grouped by biome variant', () => {
      const data = { forest: [{ dex: 25, species: 'pikachu', form: 'default', palette: 'shiny', rarity: 1, percentage: 10 }] };
      (pokemonDataService.getPokemonByBiome as jest.Mock).mockReturnValue(data);

      const result = service.getPokemonByBiome('forest');

      expect(result).toEqual(data);
    });
  });

  describe('getBiomesByPokemon', () => {
    it('should return biomes for a Pokémon', () => {
      (pokemonDataService.getBiomesByPokemon as jest.Mock).mockReturnValue(['forest', 'plains']);

      const result = service.getBiomesByPokemon('Pikachu');

      expect(result).toEqual(['forest', 'plains']);
    });
  });

  describe('getImage', () => {
    it('should return image data', async () => {
      const imageData = { url: 'http://example.com/pikachu.png' };
      (pokemonDataService.getImage as jest.Mock).mockResolvedValue(imageData);

      const result = await service.getImage({ pokemonId: 25, formName: 'default', uuid: 'test-uuid' });

      expect(pokemonDataService.getImage).toHaveBeenCalledWith({
        pokemonId: 25,
        formName: 'default',
        uuid: 'test-uuid',
      });
      expect(result).toEqual(imageData);
    });
  });

  describe('getItemSprite', () => {
    it('should return item sprite', () => {
      const sprite = { url: 'http://example.com/pokeball.png' };
      (pokemonDataService.getItemSprite as jest.Mock).mockReturnValue(sprite);

      const result = service.getItemSprite('pokeball');

      expect(result).toEqual(sprite);
    });
  });

  describe('registerPokemon', () => {
    it('should register a Pokémon encounter', async () => {
      const registrationResult = { success: true, isNew: true };
      (pokedexService.registerPokemon as jest.Mock).mockResolvedValue(registrationResult);

      const result = await service.registerPokemon('test-uuid', 25, 'default', null, 2);

      expect(pokedexService.registerPokemon).toHaveBeenCalledWith('test-uuid', 25, 'default', null, 2);
      expect(result).toEqual(registrationResult);
    });
  });

  describe('updateDex', () => {
    it('should call integrationService.updateDexWithSync', async () => {
      (integrationService.updateDexWithSync as jest.Mock).mockResolvedValue({ updated: 50 });

      const result = await service.updateDex('test-uuid', { SEEN: [1, 2], CAUGHT: [1] });

      expect(integrationService.updateDexWithSync).toHaveBeenCalledWith('test-uuid', {
        SEEN: [1, 2],
        CAUGHT: [1],
      });
      expect(result).toEqual({ updated: 50 });
    });
  });

  describe('getPokedexStatistics', () => {
    it('should return Pokédex statistics', async () => {
      const stats = { seen: 100, caught: 50 };
      (pokedexService.getPokedexStatistics as jest.Mock).mockResolvedValue(stats);

      const result = await service.getPokedexStatistics('test-uuid');

      expect(result).toEqual(stats);
    });
  });

  describe('getDetailedPokedexStatus', () => {
    it('should return detailed Pokédex status', async () => {
      const status = { caught: [25], seen: [25, 1] };
      (pokedexService.getDetailedPokedexStatus as jest.Mock).mockResolvedValue(status);

      const result = await service.getDetailedPokedexStatus('test-uuid');

      expect(pokedexService.getDetailedPokedexStatus).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual(status);
    });
  });

  describe('getPokedexRegistries', () => {
    it('should return Pokédex registries', async () => {
      const registries = [{ pokemonId: 25, form: 'default', status: 2 }];
      (pokedexService.getPokedexRegistries as jest.Mock).mockResolvedValue(registries);

      const result = await service.getPokedexRegistries('test-uuid');

      expect(result).toEqual(registries);
    });
  });

  describe('getTerasPokemonShowdownData', () => {
    it('should return Showdown data', async () => {
      const data = { pokemon: [] };
      (integrationService.getTerasPokemonShowdownData as jest.Mock).mockResolvedValue(data);

      const result = await service.getTerasPokemonShowdownData();

      expect(integrationService.getTerasPokemonShowdownData).toHaveBeenCalledTimes(1);
      expect(result).toEqual(data);
    });
  });

  describe('getWordleData', () => {
    it('should return Wordle data', () => {
      const wordleData = [{ name: 'Pikachu', types: ['Electric'] }];
      (pokemonDataService.getWordleData as jest.Mock).mockReturnValue(wordleData);

      const result = service.getWordleData();

      expect(result).toEqual(wordleData);
    });
  });

  describe('getSpriteManifest', () => {
    it('should return sprite manifest', () => {
      const manifest = { sprites: ['pikachu', 'charizard'] };
      (pokemonDataService.getSpriteManifest as jest.Mock).mockReturnValue(manifest);

      const result = service.getSpriteManifest();

      expect(result).toEqual(manifest);
    });
  });

  describe('refreshSpriteManifest', () => {
    it('should refresh sprite manifest', async () => {
      (pokemonDataService.refreshSpriteManifest as jest.Mock).mockResolvedValue(undefined);

      await service.refreshSpriteManifest();

      expect(pokemonDataService.refreshSpriteManifest).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPmdPortrait', () => {
    it('should return PMD portrait URL', async () => {
      (pokemonDataService.getPmdPortrait as jest.Mock).mockResolvedValue({
        url: 'http://example.com/pmd/pikachu.png',
      });

      const result = await service.getPmdPortrait('pikachu');

      expect(pokemonDataService.getPmdPortrait).toHaveBeenCalledWith('pikachu');
      expect(result.url).toContain('pikachu');
    });
  });
});
