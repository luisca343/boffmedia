import { Injectable } from '@nestjs/common';
import { CajaRepository, ClaimedRow } from './repositories/caja.repository';
import { ClaimCajaResponse } from './entities/objeto-mc.entity';
import { CajaSource } from './dto/claim-caja.dto';

@Injectable()
export class CajaService {
  constructor(private readonly cajaRepository: CajaRepository) {}

  /**
   * Decides what a player receives. The caller supplies a source, and an optional
   * id selector — never an item list — so a modified client cannot name its own
   * rewards. Items go to `objetos` (chested), Pokémon to `pokemon` (party). Both
   * empty means nothing was owed, which is a valid outcome, not an error.
   */
  async claim(
    uuid: string,
    source: CajaSource,
    ids?: number[],
  ): Promise<ClaimCajaResponse> {
    const rows =
      ids && ids.length > 0
        ? await this.cajaRepository.spendByIds(uuid, ids)
        : await this.cajaRepository.spend(uuid, source);

    return {
      objetos: rows
        .filter((r) => r.itemType !== 'pokemon')
        .map((r) => ({ id: r.itemId, cantidad: r.granted })),
      pokemon: rows
        .filter((r) => r.itemType === 'pokemon')
        .map((r: ClaimedRow) => ({
          spec: r.itemData || r.itemId,
          cantidad: r.granted,
        })),
    };
  }
}
