import { Test, TestingModule } from '@nestjs/testing';
import { SpriteManifestService } from './sprite-manifest.service';
import { PokemonDataService } from './data/pokemon-data.service';

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
  },
}));

import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

const mockPokemonDataService = {
  getAllSpecies: jest.fn(),
};

const MISSINGNO =
  '/smartrotom/packs/default_resourcepack/assets/pixelmon/textures/pokemon/000_missingno/all/base/none/sprite.png';

const makeManifest = (sprites: Record<string, any> = {}) => ({
  sprites,
  count: { total: Object.keys(sprites).length, default: Object.keys(sprites).length, custom: 0 },
  lastUpdated: new Date().toISOString(),
});

describe('SpriteManifestService', () => {
  let service: SpriteManifestService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fsPromises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fsPromises.mkdir as jest.Mock).mockResolvedValue(undefined);
    mockPokemonDataService.getAllSpecies.mockReturnValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpriteManifestService,
        { provide: PokemonDataService, useValue: mockPokemonDataService },
      ],
    }).compile();

    service = module.get<SpriteManifestService>(SpriteManifestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getSprite before loading ─────────────────────────────────────────────────

  describe('getSprite() before manifest is loaded', () => {
    it('returns missingno URL when manifest is not loaded', () => {
      expect(service.getSprite(25, 'base', 'none')).toBe(MISSINGNO);
    });

    it('uses default arguments (pokemonId=0, base, none)', () => {
      expect(service.getSprite()).toBe(MISSINGNO);
    });
  });

  // ─── getSprite fallback chain ─────────────────────────────────────────────────

  describe('getSprite() fallback chain', () => {
    beforeEach(() => {
      (service as any).manifest = makeManifest({
        '25:base:none': { path: '/pikachu/base/none.png', isDefault: true },
        '25:base:shiny': { path: '/pikachu/base/shiny.png', isDefault: false },
        '25:mega:none': { path: '/pikachu/mega/none.png', isDefault: false },
      });
    });

    it('returns exact match when key exists', () => {
      expect(service.getSprite(25, 'base', 'shiny')).toBe('/pikachu/base/shiny.png');
    });

    it('falls back to none palette when specific palette not found', () => {
      expect(service.getSprite(25, 'base', 'unknownpalette')).toBe('/pikachu/base/none.png');
    });

    it('falls back to base form when specific form not found', () => {
      // '25:unknownform:none' → not found; fallback checks '25:base:none' → found
      expect(service.getSprite(25, 'unknownform', 'none')).toBe('/pikachu/base/none.png');
    });

    it('falls back to base+none when both form and palette are unknown', () => {
      expect(service.getSprite(25, 'unknownform', 'unknownpalette')).toBe('/pikachu/base/none.png');
    });

    it('returns missingno when no matching key exists', () => {
      expect(service.getSprite(999, 'base', 'none')).toBe(MISSINGNO);
    });
  });

  // ─── loadSpriteManifest ───────────────────────────────────────────────────────

  describe('loadSpriteManifest()', () => {
    it('reads from file when manifest path exists', async () => {
      const storedManifest = makeManifest();
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(storedManifest));

      await service.loadSpriteManifest();

      expect(fsPromises.readFile).toHaveBeenCalled();
      expect(service.getManifest()).toMatchObject({ sprites: {}, count: { total: 0 } });
    });

    it('generates manifest when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPokemonDataService.getAllSpecies.mockReturnValue([]);

      await service.loadSpriteManifest();

      expect(fsPromises.readFile).not.toHaveBeenCalled();
    });

    it('generates manifest when reading file fails', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fsPromises.readFile as jest.Mock).mockRejectedValue(new Error('disk error'));
      mockPokemonDataService.getAllSpecies.mockReturnValue([]);

      await expect(service.loadSpriteManifest()).resolves.not.toThrow();
      expect(service.getManifest()).toBeDefined();
    });
  });

  // ─── generateManifest ────────────────────────────────────────────────────────

  describe('generateManifest()', () => {
    it('initializes manifest with zero counts when no species are loaded', async () => {
      mockPokemonDataService.getAllSpecies.mockReturnValue([]);

      await service.generateManifest();

      const manifest = service.getManifest();
      expect(manifest.count.total).toBe(0);
      expect(manifest.sprites).toEqual({});
    });

    it('adds sprite entries for each palette in each form', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        {
          dex: 25,
          name: 'pikachu',
          forms: [
            {
              name: 'base',
              genderProperties: [
                {
                  palettes: [
                    {
                      name: 'shiny',
                      sprite: { resource: 'pixelmon:pokemon/025_pikachu/all/base/shiny/sprite.png' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      await service.generateManifest();

      const manifest = service.getManifest();
      expect(manifest.count.total).toBeGreaterThan(0);
    });

    it('uses missingno fallback for forms without a sprite resource', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        {
          dex: 25,
          name: 'pikachu',
          forms: [
            {
              name: 'base',
              genderProperties: [
                {
                  palettes: [{ name: 'none', sprite: null }],
                },
              ],
            },
          ],
        },
      ]);

      await service.generateManifest();

      const manifest = service.getManifest();
      const entry = manifest.sprites['25:base:none'];
      expect(entry.path).toContain('000_missingno');
    });

    it('saves manifest to disk when species exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPokemonDataService.getAllSpecies.mockReturnValue([
        {
          dex: 25,
          name: 'pikachu',
          forms: [
            {
              name: 'base',
              genderProperties: [
                {
                  palettes: [
                    {
                      name: 'none',
                      sprite: { resource: 'pixelmon:pokemon/025_pikachu/all/base/none/sprite.png' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);

      await service.generateManifest();

      expect(fsPromises.writeFile).toHaveBeenCalled();
    });
  });

  // ─── getManifest ─────────────────────────────────────────────────────────────

  describe('getManifest()', () => {
    it('returns the current manifest after generation', async () => {
      await service.generateManifest();

      const manifest = service.getManifest();
      expect(manifest).toBeDefined();
      expect(manifest.sprites).toBeDefined();
      expect(manifest.lastUpdated).toBeDefined();
    });
  });

  // ─── refreshManifest ─────────────────────────────────────────────────────────

  describe('refreshManifest()', () => {
    it('resets the manifest to a fresh empty state', async () => {
      (service as any).manifest = makeManifest({
        '25:base:none': { path: '/old.png', isDefault: true },
      });
      mockPokemonDataService.getAllSpecies.mockReturnValue([]);

      await service.refreshManifest();

      const manifest = service.getManifest();
      expect(manifest.count.total).toBe(0);
      expect(manifest.sprites['25:base:none']).toBeUndefined();
    });
  });
});
