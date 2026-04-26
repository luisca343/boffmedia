import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PokepasteRepository } from '../repositories/pokepaste.repository';
import { VgcMetaSlot } from '@/_db/schema/Vgc';

/** Phase 3 â€” pokepast.es batch fetch and paste parsing */
@Injectable()
export class PokepasteService {
  private readonly logger = new Logger(PokepasteService.name);

  constructor(private readonly pokepasteRepository: PokepasteRepository) {}

  async fetchAndCache(pasteId: string, formatId?: string): Promise<VgcMetaSlot[]> {
    // TODO Phase 3: GET pokepast.es/{pasteId}/json, parse via parsePasteMeta(), upsert
    throw new NotImplementedException('PokepasteService.fetchAndCache â€” Phase 3');
  }

  async batchFetch(pasteIds: string[], formatId?: string): Promise<void> {
    // TODO Phase 3: process in chunks of POKEPASTE_CONCURRENCY, call fetchAndCache for each
    throw new NotImplementedException('PokepasteService.batchFetch â€” Phase 3');
  }
}
