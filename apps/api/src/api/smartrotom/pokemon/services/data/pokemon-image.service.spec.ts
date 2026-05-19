import { Test, TestingModule } from '@nestjs/testing';
import { PokemonImageService } from './pokemon-image.service';
import { PokemonDataService } from './pokemon-data.service';
import { POKEMON_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
}));

import * as fs from 'fs';

const mockPokemonDataService = {
  getSpeciesByDex: jest.fn(),
  getSpeciesByName: jest.fn(),
};

const mockPokemonRepository = {
  getUserRegistriesForCache: jest.fn(),
};

const MISSING_SPRITE =
  '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';

const mockForm = {
  name: 'base',
  genderProperties: [
    {
      palettes: [
        {
          name: 'none',
          sprite: {
            resource: 'pixelmon:pokemon/025_pikachu/all/base/none/sprite.png',
          },
        },
      ],
    },
  ],
};

const mockPikachu = {
  dex: 25,
  name: 'pikachu',
  forms: [mockForm],
};

describe('PokemonImageService', () => {
  let service: PokemonImageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonImageService,
        { provide: PokemonDataService, useValue: mockPokemonDataService },
        { provide: POKEMON_REPOSITORY_TOKEN, useValue: mockPokemonRepository },
      ],
    }).compile();

    service = module.get<PokemonImageService>(PokemonImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getItemSprite ────────────────────────────────────────────────────────────

  describe('getItemSprite()', () => {
    it('returns fallback url when neither sprite file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      const result = service.getItemSprite('pokeball');
      expect(result.url).toBe('/smartrotom/img/sprites/items/000.png');
    });

    it('returns primary path when main sprite file exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(true);
      const result = service.getItemSprite('pokeball');
      expect(result.url).toContain('POKEBALL.png');
    });

    it('returns secondary path when only secondary sprite exists', () => {
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      const result = service.getItemSprite('pokeball');
      expect(result.url).toContain('other');
    });
  });

  // ─── getSimpleSprite ──────────────────────────────────────────────────────────

  describe('getSimpleSprite()', () => {
    it('returns missing sprite url when pokemon not found', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue(undefined);
      const result = service.getSimpleSprite(999);
      expect(result).toBe(MISSING_SPRITE);
    });

    it('returns missing sprite url when form has no genderProperties', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue({
        ...mockPikachu,
        forms: [{ name: 'base', genderProperties: null }],
      });
      const result = service.getSimpleSprite(25);
      expect(result).toBe(MISSING_SPRITE);
    });

    it('returns default resourcepack path when default sprite file exists', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue(mockPikachu);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = service.getSimpleSprite(25, 'base', 'none');

      expect(result).toContain('default_resourcepack');
    });

    it('returns custom resourcepack path when only custom sprite exists', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue(mockPikachu);
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result = service.getSimpleSprite(25, 'base', 'none');

      expect(result).toContain('resourcepack');
    });

    it('returns missing sprite when no file exists', () => {
      mockPokemonDataService.getSpeciesByDex.mockReturnValue(mockPikachu);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = service.getSimpleSprite(25, 'base', 'none');

      expect(result).toBe(MISSING_SPRITE);
    });
  });

  // ─── getSpriteURL ─────────────────────────────────────────────────────────────

  describe('getSpriteURL()', () => {
    it('returns hardcoded Minior URL for pokemonId 774', () => {
      const result = service.getSpriteURL({}, 774);
      expect(result).toContain('774_minior');
    });

    it('returns palette.sprite.resource when available', () => {
      const palette = {
        sprite: { resource: 'pixelmon:pokemon/025/sprite.png' },
      };
      const result = service.getSpriteURL(palette, 25);
      expect(result).toBe('pixelmon:pokemon/025/sprite.png');
    });

    it('returns palette.sprite string when resource is not available', () => {
      const palette = { sprite: 'pixelmon:pokemon/025/sprite.png' };
      const result = service.getSpriteURL(palette, 25);
      expect(result).toBe('pixelmon:pokemon/025/sprite.png');
    });
  });
});
