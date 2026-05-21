import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PokemonDataService } from './pokemon-data.service';
import { MoveDataService } from './move-data.service';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn().mockResolvedValue([]),
  },
}));

import { promises as fsPromises } from 'fs';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockMoveDataService = {};

const makePokemon = (overrides: Partial<any> = {}) => ({
  dex: 25,
  name: 'pikachu',
  generation: 1,
  forms: [
    {
      name: 'base',
      types: ['electric', ''],
      eggGroups: ['field', 'fairy'],
      abilities: { abilities: ['static'], hiddenAbilities: ['lightningrod'] },
      moves: {
        level: ['thunderbolt'],
        tutor: [],
        tm: [],
        egg: [],
      },
      preEvolutions: [],
      evolutions: [],
      genderProperties: null,
      weight: 6,
      dimensions: { height: 4 },
    },
  ],
  ...overrides,
});

describe('PokemonDataService', () => {
  let service: PokemonDataService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fsPromises.readdir as jest.Mock).mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonDataService,
        { provide: Logger, useValue: mockLogger },
        { provide: MoveDataService, useValue: mockMoveDataService },
      ],
    }).compile();

    service = module.get<PokemonDataService>(PokemonDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── before load (empty state) ────────────────────────────────────────────────

  describe('accessors before loadPokemonData()', () => {
    it('getAllSpecies returns empty array', () => {
      expect(service.getAllSpecies()).toEqual([]);
    });

    it('getSpeciesByDex returns undefined for any dex', () => {
      expect(service.getSpeciesByDex(25)).toBeUndefined();
    });

    it('getSpeciesByName returns undefined for any name', () => {
      expect(service.getSpeciesByName('pikachu')).toBeUndefined();
    });

    it('getWordleData returns empty array', () => {
      expect(service.getWordleData()).toEqual([]);
    });
  });

  // ─── after loadPokemonData ────────────────────────────────────────────────────

  describe('after loadPokemonData()', () => {
    beforeEach(async () => {
      jest
        .spyOn(service as any, 'readJsonFiles')
        .mockResolvedValue([makePokemon()]);
      await service.loadPokemonData();
    });

    it('getAllSpecies returns the loaded pokemon', () => {
      expect(service.getAllSpecies()).toHaveLength(1);
      expect(service.getAllSpecies()[0].name).toBe('pikachu');
    });

    it('getSpeciesByDex returns the pokemon by dex number', () => {
      const pkm = service.getSpeciesByDex(25);
      expect(pkm).toBeDefined();
      expect(pkm!.name).toBe('pikachu');
    });

    it('getSpeciesByDex returns undefined for unknown dex', () => {
      expect(service.getSpeciesByDex(999)).toBeUndefined();
    });

    it('getSpeciesByName is case-insensitive', () => {
      expect(service.getSpeciesByName('PIKACHU')).toBeDefined();
      expect(service.getSpeciesByName('pikachu')).toBeDefined();
    });

    it('getSpeciesByName returns undefined for unknown name', () => {
      expect(service.getSpeciesByName('mewtwo')).toBeUndefined();
    });

    it('getSpeciesByNameWithForm returns the base form', () => {
      expect(service.getSpeciesByNameWithForm('pikachu_base')).toBeDefined();
    });

    it('getSpeciesByForm returns forms by name', () => {
      expect(service.getSpeciesByForm('base')).toHaveLength(1);
    });

    it('getSpeciesByType returns pokemon by type (lowercase)', () => {
      expect(service.getSpeciesByType('electric')).toHaveLength(1);
    });

    it('getSpeciesByEggGroup returns pokemon by egg group', () => {
      expect(service.getSpeciesByEggGroup('field')).toHaveLength(1);
    });

    it('getSpeciesByAbility returns pokemon with that ability', () => {
      expect(service.getSpeciesByAbility('static')).toHaveLength(1);
    });

    it('getWordleData has an entry for each non-gmax form', () => {
      const data = service.getWordleData();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe('pikachu_base');
    });

    it('getAllMovesSortedByCount returns sorted moves', () => {
      const moves = service.getAllMovesSortedByCount();
      expect(moves).toHaveLength(1);
      expect(moves[0].name).toBe('thunderbolt');
    });

    it('getCustomSpecies returns empty array when no custom species loaded', () => {
      expect(service.getCustomSpecies()).toEqual([]);
    });

    it('getFinalForms includes pikachu since it has no evolutions', () => {
      const finals = service.getFinalForms();
      expect(finals['pikachu']).toBeDefined();
    });

    it('getPokemonNamePalette includes pikachu_base_none (no palettes)', () => {
      const palette = service.getPokemonNamePalette();
      expect(palette['pikachu_base_none']).toBeDefined();
    });
  });
});
