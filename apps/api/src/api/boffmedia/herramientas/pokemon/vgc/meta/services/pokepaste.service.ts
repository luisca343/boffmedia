import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { PastesRepository } from '../repositories/pastes.repository';
import { VgcMetaSlot } from '@/_db/schema/Vgc';

/** Phase 3 - pokepast.es batch fetch and paste parsing */
@Injectable()
export class PokepasteService {
  private readonly logger = new Logger(PokepasteService.name);

  constructor(private readonly pastesRepository: PastesRepository) {}

  async fetchAndCache(pokepasteId: string, formatId?: string): Promise<VgcMetaSlot[]> {
    // TODO Phase 3: GET pokepast.es/{pokepasteId}/json, parse via parsePasteMeta(), upsert via pastesRepository
    throw new NotImplementedException('PokepasteService.fetchAndCache - Phase 3');
  }

  async batchFetch(pokepasteIds: string[], formatId?: string): Promise<void> {
    // TODO Phase 3: process in chunks of POKEPASTE_CONCURRENCY, call fetchAndCache for each
    throw new NotImplementedException('PokepasteService.batchFetch - Phase 3');
  }
}
