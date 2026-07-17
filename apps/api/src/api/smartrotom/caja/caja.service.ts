import { Injectable } from '@nestjs/common';
import { CajaRepository, ClaimedRow } from './repositories/caja.repository';
import {
  ClaimCajaResponse,
  ConfirmCajaResponse,
  ReserveCajaResponse,
} from './entities/objeto-mc.entity';
import { CajaSource } from './dto/claim-caja.dto';

@Injectable()
export class CajaService {
  constructor(private readonly cajaRepository: CajaRepository) {}

  /**
   * One-shot claim: spends and returns in one step, so the caller must deliver what it
   * gets or the reward is lost. Prefer `reserve` + `confirm` when delivery can drop (DARCAJA.md §7).
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

    return this.toGrant(rows);
  }

  /**
   * Phase one: soft-locks what the player is owed and returns the grant plus a
   * `reservationId` without spending it. The deliverer then calls `confirm`; if it
   * never does, the reservation expires and the rows free up. Null id when nothing was owed.
   */
  async reserve(
    uuid: string,
    source: CajaSource,
    ids?: number[],
  ): Promise<ReserveCajaResponse> {
    const { reservationId, rows } =
      ids && ids.length > 0
        ? await this.cajaRepository.reserveByIds(uuid, ids)
        : await this.cajaRepository.reserve(uuid, source);

    return { reservationId, ...this.toGrant(rows) };
  }

  /** Phase two: finalize a delivered reservation. Idempotent — a replay or expired reservation reports `confirmed: 0`. */
  async confirm(uuid: string, reservationId: string): Promise<ConfirmCajaResponse> {
    const confirmed = await this.cajaRepository.confirm(uuid, reservationId);
    return { confirmed };
  }

  /** Splits rows into the two delivery channels: items → `objetos` (chested), Pokémon → `pokemon` (party). Both empty = nothing owed. */
  private toGrant(rows: ClaimedRow[]): ClaimCajaResponse {
    return {
      objetos: rows
        .filter((r) => r.itemType !== 'pokemon')
        .map((r) => ({ id: r.itemId, cantidad: r.granted })),
      pokemon: rows
        .filter((r) => r.itemType === 'pokemon')
        .map((r) => ({ spec: r.itemData || r.itemId, cantidad: r.granted })),
    };
  }
}
