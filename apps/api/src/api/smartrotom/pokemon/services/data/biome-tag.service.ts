import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { publicPath } from '@/config/paths';
import { BaseDataService } from './base-data.service';
import { SPAWNING_TAG_PREFIX } from '../../utils/biome-keys';
import {
  VANILLA_BIOME_TAGS,
  VANILLA_BIOME_TAGS_MC_VERSION,
} from '../../utils/vanilla-biome-tags';

/** One entry of a datapack tag's `values` array. */
type TagValue = string | { id: string; required?: boolean };

interface TagFile {
  replace?: boolean;
  values?: TagValue[];
}

/**
 * Datapack roots contributing biome tags, lowest priority first. Same two-source
 * treatment `readJsonFiles` gives spawn data: the default pack is the base, the
 * custom `datapack/` overlay layers on top.
 */
const TAG_SOURCES = [
  'smartrotom/packs/default_datapack_9.4.0/data',
  'smartrotom/packs/datapack/data',
] as const;

/** Where biome tags sit inside a `data/<namespace>/` directory. */
const BIOME_TAG_SUBPATH = path.join('tags', 'worldgen', 'biome');

/** `pixelmon:spawning/` — the tag prefix without the leading `#`. */
const SPAWNING_TAG_ID_PREFIX = SPAWNING_TAG_PREFIX.slice(1);

/**
 * Loads biome tags from every pack and expands Pixelmon's spawning categories
 * into concrete biome ids.
 *
 * Pixelmon 9.4.0 moved the category-to-biome table out of
 * `config/betterspawnerconfig.json` and into real datapack tags, so a spawn
 * condition of `#pixelmon:spawning/mesas` is a *reference*, not a label. Without
 * expansion, "what spawns in `minecraft:badlands`" is unanswerable.
 */
@Injectable()
export class BiomeTagService extends BaseDataService {
  private readonly logger = new Logger(BiomeTagService.name);

  /** Merged raw tag contents, keyed by full tag id (`pixelmon:spawning/mesas`). */
  private rawTags: Map<string, TagValue[]> = new Map();

  /** Memoised expansion of a tag id to concrete biome ids. */
  private resolved: Map<string, string[]> = new Map();

  /** Tag ids referenced but defined nowhere - reported once, after loading. */
  private missingTags: Set<string> = new Set();

  async loadBiomeTags(): Promise<void> {
    const startingTime = Date.now();
    this.rawTags.clear();
    this.resolved.clear();
    this.missingTags.clear();

    let fileCount = 0;
    for (const source of TAG_SOURCES) {
      fileCount += await this.loadFromSource(publicPath(source));
    }

    // Fallback last: a real tag file from any pack always wins over the table.
    for (const [tagId, values] of Object.entries(VANILLA_BIOME_TAGS)) {
      if (!this.rawTags.has(tagId)) this.rawTags.set(tagId, [...values]);
    }

    // Warm the cache so unresolved references are reported at boot, not on the
    // first request that happens to touch an ocean.
    for (const tagId of this.rawTags.keys()) this.resolveTag(tagId);

    if (this.missingTags.size > 0) {
      this.logger.warn(
        `${this.missingTags.size} biome tag(s) referenced but never defined - ` +
          `categories depending on them resolve short: ${this.getMissingTags().join(', ')}`,
      );
    }

    this.logger.log(
      `Loaded ${this.rawTags.size} biome tags from ${fileCount} file(s) ` +
        `(vanilla fallback: MC ${VANILLA_BIOME_TAGS_MC_VERSION}) in ` +
        `${Date.now() - startingTime}ms`,
    );
  }

  /**
   * Merge every biome tag under one `data/` root.
   *
   * Merge rules follow the datapack spec: `replace: false` (the default) unions
   * onto whatever is already there and is therefore order-independent, while
   * `replace: true` discards the values accumulated for that tag so far.
   */
  private async loadFromSource(dataRoot: string): Promise<number> {
    let namespaces: string[];
    try {
      namespaces = await fsPromises.readdir(dataRoot);
    } catch {
      // A pack root that does not exist is not an error - the overlay is optional.
      return 0;
    }

    let fileCount = 0;
    for (const namespace of namespaces) {
      const tagRoot = path.join(dataRoot, namespace, BIOME_TAG_SUBPATH);
      const files = await this.listJsonFilesRecursive(tagRoot);

      for (const file of files) {
        // `<tagRoot>/spawning/mesas.json` -> `pixelmon:spawning/mesas`
        const relative = path
          .relative(tagRoot, file)
          .split(path.sep)
          .join('/')
          .replace(/\.json$/, '');
        const tagId = `${namespace}:${relative}`;

        let tag: TagFile;
        try {
          tag = await this.readJsonFile(file);
        } catch {
          // readJsonFile already logged it; one malformed tag must not abort boot.
          continue;
        }
        fileCount++;

        const incoming = tag.values ?? [];
        const existing = tag.replace ? [] : (this.rawTags.get(tagId) ?? []);
        this.rawTags.set(tagId, [...existing, ...incoming]);
      }
    }

    return fileCount;
  }

  private async listJsonFilesRecursive(dir: string): Promise<string[]> {
    let entries;
    try {
      entries = await fsPromises.readdir(dir, { withFileTypes: true });
    } catch {
      return [];
    }

    const out: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...(await this.listJsonFilesRecursive(full)));
      } else if (entry.name.endsWith('.json')) {
        out.push(full);
      }
    }
    return out;
  }

  /**
   * Expand a tag id to concrete biome ids, following `#` references transitively.
   *
   * They genuinely nest (`freezing` -> `#freezing_land` -> `#freezing_forests`),
   * so `seen` guards against a cycle turning a bad datapack into a stack overflow.
   *
   * Optional entries (`{"id": ..., "required": false}`) are kept: they name
   * modded biomes, and with no biome registry to check against, dropping them
   * would discard the Biomes O Plenty and BYG biomes this server actually runs.
   */
  resolveTag(tagId: string, seen: Set<string> = new Set()): string[] {
    const isTopLevel = seen.size === 0;
    if (isTopLevel) {
      const cached = this.resolved.get(tagId);
      if (cached) return cached;
    }

    if (seen.has(tagId)) return [];
    seen.add(tagId);

    const values = this.rawTags.get(tagId);
    if (!values) {
      this.missingTags.add(tagId);
      return [];
    }

    const out = new Set<string>();
    for (const value of values) {
      const id = typeof value === 'string' ? value : value?.id;
      if (!id) continue;

      if (id.startsWith('#')) {
        for (const biome of this.resolveTag(id.slice(1), seen)) out.add(biome);
      } else {
        out.add(id);
      }
    }

    const result = [...out];
    if (isTopLevel) this.resolved.set(tagId, result);
    return result;
  }

  /**
   * Expand one raw `condition` entry to concrete biome ids.
   *
   * A literal `namespace:id` is already concrete and resolves to itself, so
   * callers can map a whole condition array through this uniformly.
   */
  resolveBiomeReference(raw: string): string[] {
    if (raw.startsWith('#')) return this.resolveTag(raw.slice(1));

    // 1.16.5 overlay conditions are bare category names ("all forests"), which
    // name the same categories 9.4.0 ships as tags.
    if (!raw.includes(':')) {
      const tagId = `${SPAWNING_TAG_ID_PREFIX}${raw.split(' ').join('_')}`;
      return this.rawTags.has(tagId) ? this.resolveTag(tagId) : [];
    }

    return [raw];
  }

  /** Canonical category name -> concrete biome ids, for diagnostics and callers. */
  getSpawningCategories(): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const tagId of this.rawTags.keys()) {
      if (!tagId.startsWith(SPAWNING_TAG_ID_PREFIX)) continue;
      out[tagId.slice(SPAWNING_TAG_ID_PREFIX.length)] = this.resolveTag(tagId);
    }
    return out;
  }

  getMissingTags(): string[] {
    return [...this.missingTags].sort();
  }
}
