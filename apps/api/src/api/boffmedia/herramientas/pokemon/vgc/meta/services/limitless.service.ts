import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { LimitlessRepository } from '../repositories/limitless.repository';
import { PokemonUsageEntry } from '../entities/pokemon-usage.entity';

/** Phase 5 â€” Limitless TCG HTML scraping */
@Injectable()
export class LimitlessService {
  private readonly logger = new Logger(LimitlessService.name);

  constructor(private readonly limitlessRepository: LimitlessRepository) {}

  async importTournament(url: string): Promise<{ tournamentId: number; playerCount: number }> {
    // TODO Phase 5: extract limitlessId from URL, scrape standings HTML, batch-scrape team pages
    throw new NotImplementedException('LimitlessService.importTournament â€” Phase 5');
  }

  async getUsageList(tournamentId: number): Promise<PokemonUsageEntry[]> {
    // TODO Phase 5: aggregate parsedSlots from vgcLimitlessTeams for this tournament
    throw new NotImplementedException('LimitlessService.getUsageList â€” Phase 5');
  }

  async listTournaments() {
    return this.limitlessRepository.findAllTournaments();
  }
}
