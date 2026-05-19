import { Test, TestingModule } from '@nestjs/testing';
import { PokemonDataService } from './pokemon-data.service';
import { PokemonFacadeService } from '@api/smartrotom/pokemon/pokemon.facade.service';
import { MessagePartType } from '../dto/message-part.dto';

const mockPokemonService = {
  getAllPokemon: jest.fn(),
  searchPokemonByName: jest.fn(),
  getBiomesByPokemon: jest.fn(),
};

const makePokemon = (name: string, types = ['fire'], hp = 45) => ({
  name,
  dex: 1,
  forms: [
    {
      name: 'base',
      types,
      battleStats: {
        hp,
        attack: 49,
        defense: 49,
        specialAttack: 65,
        specialDefense: 65,
        speed: 45,
      },
      moves: { levelUpMoves: [{ name: 'Scratch' }] },
    },
  ],
});

describe('PokemonDataService', () => {
  let service: PokemonDataService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonDataService,
        { provide: PokemonFacadeService, useValue: mockPokemonService },
      ],
    }).compile();

    service = module.get<PokemonDataService>(PokemonDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPokemonCount ──────────────────────────────────────────────────────────

  describe('getPokemonCount()', () => {
    it('returns count of all pokemon with text description', () => {
      mockPokemonService.getAllPokemon.mockReturnValue(
        new Array(151).fill(null),
      );

      const result = service.getPokemonCount();

      expect(result[0].type).toBe('pokemonCount');
      expect(result[0].content.count).toBe(151);
      expect(result[1].type).toBe('text');
      expect(result[1].content).toContain('151');
    });
  });

  // ─── getRandomPokemon ─────────────────────────────────────────────────────────

  describe('getRandomPokemon()', () => {
    it('returns a random pokemon with basic parts', () => {
      const charmander = makePokemon('charmander');
      mockPokemonService.getAllPokemon.mockReturnValue([charmander]);

      const result = service.getRandomPokemon(['basic']);

      expect(result.pokemon).toEqual(charmander);
      expect(
        result.parts.some((p) => p.type === MessagePartType.POKEMON_DATA),
      ).toBe(true);
    });

    it('returns empty parts message when no pokemon available', () => {
      mockPokemonService.getAllPokemon.mockReturnValue([]);

      const result = service.getRandomPokemon();

      expect(result.pokemon).toBeNull();
      expect(result.parts[0].type).toBe(MessagePartType.TEXT);
    });
  });

  // ─── getPokemonDataParts ──────────────────────────────────────────────────────

  describe('getPokemonDataParts()', () => {
    it('returns POKEMON_DATA part with type info when dataTypes includes "type"', () => {
      const charmander = makePokemon('charmander', ['fire']);
      mockPokemonService.searchPokemonByName.mockReturnValue([
        { item: charmander },
      ]);

      const parts = service.getPokemonDataParts('charmander', ['type']);

      expect(parts).not.toBeNull();
      expect(parts![0].type).toBe(MessagePartType.POKEMON_DATA);
      expect((parts![0].content as any).types).toContain('fire');
    });

    it('returns POKEMON_DATA part with stats when dataTypes includes "stats"', () => {
      const charmander = makePokemon('charmander');
      mockPokemonService.searchPokemonByName.mockReturnValue([
        { item: charmander },
      ]);

      const parts = service.getPokemonDataParts('charmander', ['stats']);

      expect((parts![0].content as any).stats.hp).toBe(45);
    });

    it('returns POKEMON_DATA part with habitat when dataTypes includes "habitat"', () => {
      const charmander = makePokemon('charmander');
      mockPokemonService.searchPokemonByName.mockReturnValue([
        { item: charmander },
      ]);
      mockPokemonService.getBiomesByPokemon.mockReturnValue([
        'volcano',
        'mountain',
      ]);

      const parts = service.getPokemonDataParts('charmander', ['habitat']);

      expect((parts![0].content as any).habitat).toEqual([
        'volcano',
        'mountain',
      ]);
    });

    it('returns null when pokemon not found', () => {
      mockPokemonService.searchPokemonByName.mockReturnValue([]);

      const parts = service.getPokemonDataParts('nonexistent', ['type']);

      expect(parts).toBeNull();
    });

    it('returns null when search result has no item', () => {
      mockPokemonService.searchPokemonByName.mockReturnValue([{ item: null }]);

      const parts = service.getPokemonDataParts('ghost', ['type']);

      expect(parts).toBeNull();
    });
  });

  // ─── pokemonExists ────────────────────────────────────────────────────────────

  describe('pokemonExists()', () => {
    it('returns true when pokemon is found', () => {
      mockPokemonService.searchPokemonByName.mockReturnValue([
        { item: makePokemon('charmander') },
      ]);

      expect(service.pokemonExists('charmander')).toBe(true);
    });

    it('returns false when not found', () => {
      mockPokemonService.searchPokemonByName.mockReturnValue([]);

      expect(service.pokemonExists('fakemon')).toBe(false);
    });
  });

  // ─── getSimilarPokemonNames ───────────────────────────────────────────────────

  describe('getSimilarPokemonNames()', () => {
    it('returns empty array when no pokemon available', () => {
      mockPokemonService.getAllPokemon.mockReturnValue(null);

      expect(service.getSimilarPokemonNames('charmandr')).toEqual([]);
    });

    it('returns matching pokemon names via fuzzy search', () => {
      mockPokemonService.getAllPokemon.mockReturnValue([
        makePokemon('charmander'),
        makePokemon('charmeleon'),
        makePokemon('pikachu'),
      ]);

      const results = service.getSimilarPokemonNames('charmandr', 3);

      expect(Array.isArray(results)).toBe(true);
    });
  });
});
