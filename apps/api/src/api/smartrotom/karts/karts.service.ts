import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { KARTS_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { SaveRaceDto } from './dto/save-race.dto';
import { KartRankingEntry } from './entities/kart-ranking-entry.entity';
import { KartPlayerStats } from './entities/kart-player-stats.entity';
import { SaveRaceResponse } from './entities/save-race-response.entity';
import { IKartsRepository } from './repositories/interfaces/karts.repository.interface';

const MAX_RANKING_LIMIT = 100;

/** The only mode whose clock is comparable between races — see the repository. */
const TIMED_MODE = 'clasica';

@Injectable()
export class KartsService {
  constructor(
    @Inject(KARTS_REPOSITORY_TOKEN)
    private readonly repository: IKartsRepository,
  ) {}

  async saveRace(body: SaveRaceDto): Promise<SaveRaceResponse> {
    const { participantes, fecha, server, ...race } = body;

    const { insertId } = await this.repository.saveRace(
      { ...race, server, fecha: new Date(fecha) },
      participantes,
    );

    return { saved: true, id: insertId };
  }

  /**
   * `modo` is accepted for symmetry with the mod's vocabulary but only `clasica` can be
   * ranked on time: an elimination winner never had to cover the distance. Asking for
   * another mode is rejected rather than answered with a leaderboard that means nothing.
   */
  async getRanking(
    circuito?: string,
    modo?: string,
    limit?: number,
  ): Promise<KartRankingEntry[]> {
    if (modo && modo !== TIMED_MODE) {
      throw new BadRequestException(
        `Only '${TIMED_MODE}' races can be ranked on time`,
      );
    }

    const capped = Math.min(Math.max(limit ?? 10, 1), MAX_RANKING_LIMIT);
    return await this.repository.findTopTimes({ circuito, limit: capped });
  }

  async getPlayerStats(uuid: string): Promise<KartPlayerStats> {
    const stats = await this.repository.findPlayerStats(uuid);

    if (!stats) {
      throw new NotFoundException(`No kart races found for ${uuid}`);
    }

    return stats;
  }
}
