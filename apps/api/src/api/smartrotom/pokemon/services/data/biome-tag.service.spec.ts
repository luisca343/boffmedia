import { Test, TestingModule } from '@nestjs/testing';
import { BiomeTagService } from './biome-tag.service';
import { VANILLA_BIOME_TAGS } from '../../utils/vanilla-biome-tags';

/**
 * The loader walks the real pack tree, so these tests drive `resolveTag` /
 * `resolveBiomeReference` against a hand-built tag table instead. What matters
 * is the expansion algebra: transitive `#` refs, cycles, `replace`, optional
 * entries, and the vanilla fallback.
 */
describe('BiomeTagService', () => {
  let service: BiomeTagService;

  const seed = (tags: Record<string, readonly any[]>) => {
    (service as any).rawTags = new Map(
      Object.entries(tags).map(([tagId, values]) => [tagId, [...values]]),
    );
    (service as any).resolved = new Map();
    (service as any).missingTags = new Set();
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiomeTagService],
    }).compile();
    service = module.get<BiomeTagService>(BiomeTagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveTag()', () => {
    it('resolves plain literal values', () => {
      seed({ 'pixelmon:spawning/drowned': ['minecraft:river'] });
      expect(service.resolveTag('pixelmon:spawning/drowned')).toEqual([
        'minecraft:river',
      ]);
    });

    it('follows nested tag references transitively', () => {
      // The real chain: freezing -> #freezing_land -> #freezing_forests
      seed({
        'pixelmon:spawning/freezing': [
          '#pixelmon:spawning/freezing_land',
          'minecraft:frozen_river',
        ],
        'pixelmon:spawning/freezing_land': [
          '#pixelmon:spawning/freezing_forests',
          'minecraft:snowy_plains',
        ],
        'pixelmon:spawning/freezing_forests': ['minecraft:snowy_taiga'],
      });

      expect(service.resolveTag('pixelmon:spawning/freezing').sort()).toEqual([
        'minecraft:frozen_river',
        'minecraft:snowy_plains',
        'minecraft:snowy_taiga',
      ]);
    });

    it('keeps optional modded entries', () => {
      seed({
        'pixelmon:spawning/mesas': [
          'minecraft:badlands',
          { id: 'biomesoplenty:mesa', required: false },
        ],
      });

      expect(service.resolveTag('pixelmon:spawning/mesas')).toContain(
        'biomesoplenty:mesa',
      );
    });

    it('deduplicates a biome reached through two branches', () => {
      seed({
        a: ['#b', '#c'],
        b: ['minecraft:plains'],
        c: ['minecraft:plains'],
      });
      expect(service.resolveTag('a')).toEqual(['minecraft:plains']);
    });

    it('survives a reference cycle', () => {
      seed({ a: ['#b', 'minecraft:plains'], b: ['#a', 'minecraft:forest'] });
      expect(service.resolveTag('a').sort()).toEqual([
        'minecraft:forest',
        'minecraft:plains',
      ]);
    });

    it('records an undefined tag as missing rather than throwing', () => {
      seed({ 'pixelmon:spawning/oceanic': ['#minecraft:is_ocean'] });
      expect(service.resolveTag('pixelmon:spawning/oceanic')).toEqual([]);
      expect(service.getMissingTags()).toEqual(['minecraft:is_ocean']);
    });
  });

  describe('resolveBiomeReference()', () => {
    beforeEach(() =>
      seed({
        'pixelmon:spawning/all_forests': ['minecraft:forest'],
        'pixelmon:spawning/mesas': ['minecraft:badlands'],
      }),
    );

    it('expands a 9.4.0 tag reference', () => {
      expect(
        service.resolveBiomeReference('#pixelmon:spawning/mesas'),
      ).toEqual(['minecraft:badlands']);
    });

    it('expands a 1.16.5 bare category name, spaces and all', () => {
      // The live overlay is still 1.16.5-shaped: "all forests", not "all_forests".
      expect(service.resolveBiomeReference('all forests')).toEqual([
        'minecraft:forest',
      ]);
    });

    it('passes a literal biome id through untouched', () => {
      expect(service.resolveBiomeReference('teras:pueblo_yume')).toEqual([
        'teras:pueblo_yume',
      ]);
    });

    it('returns nothing for a category no pack defines', () => {
      expect(service.resolveBiomeReference('not a category')).toEqual([]);
    });
  });

  describe('vanilla fallback table', () => {
    it('resolves is_ocean through its is_deep_ocean nesting', () => {
      seed({ ...VANILLA_BIOME_TAGS });
      const ocean = service.resolveTag('minecraft:is_ocean');

      expect(ocean).toContain('minecraft:ocean');
      // The nesting the handoff called out: without it, deep oceans vanish.
      expect(ocean).toContain('minecraft:deep_ocean');
      expect(ocean).toContain('minecraft:deep_frozen_ocean');
    });

    it('covers every external tag the Pixelmon spawning tags reference', () => {
      // These six are referenced by data/pixelmon/tags/worldgen/biome/spawning/*
      // but ship in the Minecraft and NeoForge jars, neither of which is on disk.
      for (const tag of [
        'minecraft:is_forest',
        'minecraft:is_ocean',
        'minecraft:is_badlands',
        'minecraft:is_jungle',
        'minecraft:is_savanna',
        'c:is_cave',
      ]) {
        expect(Object.keys(VANILLA_BIOME_TAGS)).toContain(tag);
      }
    });
  });
});
