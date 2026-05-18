import { Test, TestingModule } from '@nestjs/testing';
import { PokemonShowdownService } from './pokemon-showdown.service';
import { PokemonDataService } from './data/pokemon-data.service';

const mockPokemonDataService = {
  getCustomSpecies: jest.fn(),
};

const makeForm = (overrides: Partial<any> = {}) => ({
  name: 'base',
  types: ['fire', ''],
  eggGroups: ['field'],
  abilities: {
    abilities: ['Blaze', 'SuctionCups'],
    hiddenAbilities: ['SolarPower'],
  },
  battleStats: {
    hp: 45,
    attack: 60,
    defense: 40,
    specialAttack: 70,
    specialDefense: 50,
    speed: 65,
  },
  weight: 6.9,
  preEvolutions: [],
  evolutions: [],
  ...overrides,
});

const makePokemon = (overrides: Partial<any> = {}) => ({
  dex: 1026,
  name: 'testmon',
  forms: [makeForm()],
  ...overrides,
});

describe('PokemonShowdownService', () => {
  let service: PokemonShowdownService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonShowdownService,
        { provide: PokemonDataService, useValue: mockPokemonDataService },
      ],
    }).compile();

    service = module.get<PokemonShowdownService>(PokemonShowdownService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTerasPokemonShowdownData ──────────────────────────────────────────────

  describe('getTerasPokemonShowdownData()', () => {
    it('returns empty object when no custom species', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([]);
      const result = await service.getTerasPokemonShowdownData();
      expect(result).toEqual({});
    });

    it('skips pokemon with dex <= 0', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([
        makePokemon({ dex: 0 }),
        makePokemon({ dex: -1 }),
      ]);
      const result = await service.getTerasPokemonShowdownData();
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('produces a single-form entry for pokemon with one form', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([makePokemon()]);
      const result = await service.getTerasPokemonShowdownData();

      expect(result['testmon']).toBeDefined();
      expect(result['testmon'].num).toBe(1026);
      expect(result['testmon'].name).toBe('testmon');
    });

    it('capitalizes types in the output', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([makePokemon()]);
      const result = await service.getTerasPokemonShowdownData();

      expect(result['testmon'].types).toContain('Fire');
    });

    it('maps battleStats fields to baseStats structure', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([makePokemon()]);
      const result = await service.getTerasPokemonShowdownData();
      const { baseStats } = result['testmon'];

      expect(baseStats.hp).toBe(45);
      expect(baseStats.atk).toBe(60);
      expect(baseStats.def).toBe(40);
      expect(baseStats.spa).toBe(70);
      expect(baseStats.spd).toBe(50);
      expect(baseStats.spe).toBe(65);
    });

    it('converts Pixelmon ability names to Showdown format', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([makePokemon()]);
      const result = await service.getTerasPokemonShowdownData();
      const { abilities } = result['testmon'];

      expect(abilities['0']).toBe('Blaze');
      expect(abilities['1']).toBe('Suction Cups');
      expect(abilities['H']).toBe('Solar Power');
    });

    it('produces a multi-form base entry with otherFormes for alternate forms', async () => {
      const multiForm = makePokemon({
        dex: 1027,
        name: 'formmon',
        defaultForms: ['base'],
        forms: [
          makeForm({ name: 'base', abilities: { abilities: ['Torrent'], hiddenAbilities: [] } }),
          makeForm({ name: 'shadow', abilities: { abilities: ['Hustle'], hiddenAbilities: [] } }),
        ],
      });
      mockPokemonDataService.getCustomSpecies.mockReturnValue([multiForm]);

      const result = await service.getTerasPokemonShowdownData();

      const baseEntry = result['formmon'] as any;
      expect(baseEntry).toBeDefined();
      expect(baseEntry.otherFormes).toBeDefined();
      expect(baseEntry.otherFormes).toHaveLength(1);
    });

    it('creates a separate entry for each alternate form', async () => {
      const multiForm = makePokemon({
        dex: 1027,
        name: 'formmon',
        defaultForms: ['base'],
        forms: [
          makeForm({ name: 'base', abilities: { abilities: ['Torrent'], hiddenAbilities: [] } }),
          makeForm({ name: 'shadow', abilities: { abilities: ['Hustle'], hiddenAbilities: [] } }),
        ],
      });
      mockPokemonDataService.getCustomSpecies.mockReturnValue([multiForm]);

      const result = await service.getTerasPokemonShowdownData();
      const keys = Object.keys(result);

      // base entry + shadow form entry
      expect(keys).toHaveLength(2);
      const shadowEntry = Object.values(result).find((e: any) => e.baseSpecies === 'formmon');
      expect(shadowEntry).toBeDefined();
      expect((shadowEntry as any).forme).toBeDefined();
    });

    it('alternate form entry includes changesFrom for non-special forms', async () => {
      const multiForm = makePokemon({
        dex: 1027,
        name: 'formmon',
        defaultForms: ['base'],
        forms: [
          makeForm({ name: 'base', abilities: { abilities: ['Torrent'], hiddenAbilities: [] } }),
          makeForm({ name: 'shadow', abilities: { abilities: ['Hustle'], hiddenAbilities: [] } }),
        ],
      });
      mockPokemonDataService.getCustomSpecies.mockReturnValue([multiForm]);

      const result = await service.getTerasPokemonShowdownData();
      const shadowEntry = Object.values(result).find((e: any) => e.baseSpecies === 'formmon') as any;

      expect(shadowEntry.changesFrom).toBe('formmon');
    });

    it('mega/gmax forms are excluded from otherFormes (but still processed)', async () => {
      const pokemonWithMega = makePokemon({
        dex: 1028,
        name: 'megamon',
        defaultForms: ['base'],
        forms: [
          makeForm({ name: 'base', abilities: { abilities: ['Blaze'], hiddenAbilities: [] } }),
          makeForm({ name: 'mega', abilities: { abilities: ['TurboBlazer'], hiddenAbilities: [] } }),
        ],
      });
      mockPokemonDataService.getCustomSpecies.mockReturnValue([pokemonWithMega]);

      const result = await service.getTerasPokemonShowdownData();

      // mega excluded from alternateFormNames → base entry goes through single-form branch
      expect(result['megamon']).toBeDefined();
      expect((result['megamon'] as any).otherFormes).toBeUndefined();

      // mega form is still added to the output via the form loop
      const megaEntry = Object.values(result).find((e: any) => e.baseSpecies === 'megamon');
      expect(megaEntry).toBeDefined();
    });

    it('handles pokemon with no hidden abilities', async () => {
      mockPokemonDataService.getCustomSpecies.mockReturnValue([
        makePokemon({
          forms: [makeForm({ abilities: { abilities: ['Overgrow'], hiddenAbilities: [] } })],
        }),
      ]);
      const result = await service.getTerasPokemonShowdownData();
      const { abilities } = result['testmon'];

      expect(abilities['0']).toBe('Overgrow');
      expect(abilities['H']).toBeUndefined();
    });
  });
});
