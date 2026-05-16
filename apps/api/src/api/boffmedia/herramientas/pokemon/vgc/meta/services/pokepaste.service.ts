import { Injectable, Logger } from '@nestjs/common';
import { PastesRepository } from '../repositories/pastes.repository';
import { VgcMetaSlot } from '@/_db/schema/Vgc';
import { parsePasteMeta } from './parse-paste-meta';
import { POKEPASTE_BASE } from '../config/smogon.config';

interface FetchResult {
  pasteId: number;
  slots: VgcMetaSlot[];
  wasCached: boolean;
}

/** Metadata sourced from the importing CSV, preferred over pokepast.es scrape values. */
interface PasteMeta {
  author?: string | null;
  title?: string | null;
  sourceKey?: string | null;
  replicaCode?: string | null;
}

@Injectable()
export class PokepasteService {
  private readonly logger = new Logger(PokepasteService.name);

  constructor(private readonly pastesRepository: PastesRepository) {}

  /** Extract the pokepaste ID from a full URL like https://pokepast.es/0039fa7d566e65c8 */
  private extractPokepasteId(url: string): string | null {
    const match = url.match(/pokepast\.es\/([a-f0-9]+)/i);
    return match ? match[1] : null;
  }

  /**
   * Fetch a paste from pokepast.es and cache it.
   * If already cached by pokepasteId, skips the network call but still applies `meta`
   * overrides so that re-imports can correct stale author/title/replicaCode values.
   *
   * `meta` values (from the importing CSV) take precedence over pokepast.es JSON fields.
   */
  async fetchAndCache(
    pasteUrl: string,
    formatId?: string,
    meta?: PasteMeta,
  ): Promise<FetchResult> {
    const pokepasteId = this.extractPokepasteId(pasteUrl);
    if (!pokepasteId) throw new Error(`Invalid pokepaste URL: ${pasteUrl}`);

    // Cache hit — update metadata if provided, then return
    const existing = await this.pastesRepository.findByPokepasteId(pokepasteId);
    if (existing) {
      if (meta) await this.pastesRepository.updateMeta(existing.id, meta);
      return {
        pasteId: existing.id,
        slots: JSON.parse(existing.parsedSlots) as VgcMetaSlot[],
        wasCached: true,
      };
    }

    // Fetch from pokepast.es JSON API
    const res = await fetch(`${POKEPASTE_BASE}/${pokepasteId}/json`);
    if (!res.ok)
      throw new Error(
        `pokepast.es fetch failed: HTTP ${res.status} for ${pokepasteId}`,
      );

    const json = (await res.json()) as {
      paste: string;
      author?: string;
      title?: string;
    };
    const slots = parsePasteMeta(json.paste ?? '');

    const pasteId = await this.pastesRepository.upsertPaste({
      pokepasteId,
      rawText: json.paste ?? '',
      parsedSlots: slots,
      // CSV metadata takes precedence over pokepast.es fields
      author: meta?.author ?? json.author ?? null,
      title: meta?.title ?? json.title ?? null,
      sourceKey: meta?.sourceKey ?? null,
      replicaCode: meta?.replicaCode ?? null,
      formatId: formatId ?? null,
    });

    this.logger.debug(`Fetched paste ${pokepasteId} (${slots.length} slots)`);
    return { pasteId, slots, wasCached: false };
  }
}
