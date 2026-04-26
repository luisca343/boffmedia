import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { VgcPastesRepository } from '../repositories/vgcpastes.repository';
import { PokemonUsageEntry } from '../entities/pokemon-usage.entity';

/** Phase 2 â€” VGCPastes CSV fetch + usage aggregation */
@Injectable()
export class VgcPastesService {
  private readonly logger = new Logger(VgcPastesService.name);

  constructor(private readonly vgcPastesRepository: VgcPastesRepository) {}

  async refreshRegulation(regulationId: string, gid: string): Promise<void> {
    // TODO Phase 2: fetch VGCPASTES_SHEET_BASE + gid, parse CSV, upsert all rows
    throw new NotImplementedException('VgcPastesService.refreshRegulation â€” Phase 2');
  }

  async getUsageList(regulationId: string): Promise<PokemonUsageEntry[]> {
    // TODO Phase 2: aggregate species column, compute usage %
    throw new NotImplementedException('VgcPastesService.getUsageList â€” Phase 2');
  }
}
