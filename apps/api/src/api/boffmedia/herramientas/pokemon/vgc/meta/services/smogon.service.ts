import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { SmogonRepository } from '../repositories/smogon.repository';
import { PokemonUsageEntry, PokemonUsageDetail } from '../entities/pokemon-usage.entity';

/** Phase 1 â€” Smogon chaos JSON fetch + parse */
@Injectable()
export class SmogonService {
  private readonly logger = new Logger(SmogonService.name);

  constructor(private readonly smogonRepository: SmogonRepository) {}

  async getUsageList(formatId: string, month: string, cutoff: number): Promise<PokemonUsageEntry[]> {
    // TODO Phase 1: check cache in SmogonRepository; if stale, fetch smogonChaosUrl(formatId, month, cutoff)
    throw new NotImplementedException('SmogonService.getUsageList â€” Phase 1');
  }

  async getPokemonDetail(
    formatId: string,
    month: string,
    cutoff: number,
    speciesId: string,
  ): Promise<PokemonUsageDetail> {
    // TODO Phase 1: deserialize cached snapshot, return per-PokÃ©mon detail
    throw new NotImplementedException('SmogonService.getPokemonDetail â€” Phase 1');
  }

  async resolveLatestMonth(_formatId: string): Promise<string> {
    // TODO Phase 1: probe Smogon stats index or fall back to previous month
    throw new NotImplementedException('SmogonService.resolveLatestMonth â€” Phase 1');
  }
}
