import { Injectable } from '@nestjs/common';
import { CajaRepository } from './repositories/caja.repository';
import { ObjetoMC } from './entities/objeto-mc.entity';
import { CajaSource } from './dto/claim-caja.dto';

@Injectable()
export class CajaService {
  constructor(private readonly cajaRepository: CajaRepository) {}

  /**
   * Decides what a player receives. The caller supplies only a uuid and a
   * source — never an item list — so a modified client cannot name its own
   * rewards. Returns [] when nothing is owed; that is a valid outcome, not an
   * error, and the mod grants nothing for it.
   */
  async claim(uuid: string, source: CajaSource): Promise<ObjetoMC[]> {
    return await this.cajaRepository.spend(uuid, source);
  }
}
