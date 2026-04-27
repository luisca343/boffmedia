import { Injectable, Logger } from '@nestjs/common';
import { PastesRepository } from '../repositories/pastes.repository';
import { VgcMetaSlot } from '@/_db/schema/Vgc';
import { parsePasteMeta } from './parse-paste-meta';
import { POKEPASTE_BASE } from '../config/smogon.config';

interface FetchResult {
  pasteId:   number;
  slots:     VgcMetaSlot[];
  wasCached: boolean;
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
   * If already cached by pokepasteId, returns the stored slots without a network call.
   */
  async fetchAndCache(pasteUrl: string, formatId?: string): Promise<FetchResult> {
    const pokepasteId = this.extractPokepasteId(pasteUrl);
    if (!pokepasteId) throw new Error(`Invalid pokepaste URL: ${pasteUrl}`);

    // Cache hit — return stored parsed slots immediately
    const existing = await this.pastesRepository.findByPokepasteId(pokepasteId);
    if (existing) {
      return {
        pasteId:   existing.id,
        slots:     JSON.parse(existing.parsedSlots) as VgcMetaSlot[],
        wasCached: true,
      };
    }

    // Fetch from pokepast.es JSON API
    const res = await fetch(`${POKEPASTE_BASE}/${pokepasteId}/json`);
    if (!res.ok) throw new Error(`pokepast.es fetch failed: HTTP ${res.status} for ${pokepasteId}`);

    const json = await res.json() as { paste: string; author?: string; title?: string };
    const slots = parsePasteMeta(json.paste ?? '');

    const pasteId = await this.pastesRepository.upsertPaste({
      pokepasteId,
      rawText:     json.paste ?? '',
      parsedSlots: slots,
      author:      json.author  ?? null,
      title:       json.title   ?? null,
      formatId:    formatId     ?? null,
    });

    this.logger.debug(`Fetched paste ${pokepasteId} (${slots.length} slots)`);
    return { pasteId, slots, wasCached: false };
  }
}
