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
   * One-shot claim: spends and returns the grant in one step. The caller must
   * deliver what it gets, because the reward is spent the moment this returns — a
   * failed delivery is a lost reward. Prefer `reserve` + `confirm` for anything
   * that can drop the connection mid-delivery (DARCAJA.md §7). Kept for callers
   * that accept the one-shot contract.
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
   * Phase one of a two-phase delivery: soft-locks what the player is owed and
   * returns the grant plus a `reservationId`, WITHOUT spending it. The deliverer
   * hands the items over, then calls `confirm(reservationId)`. If it never does,
   * the reservation expires and the rows become claimable again — so a dropped
   * delivery loses nothing. `reservationId` is null when nothing was owed.
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

  /**
   * Phase two: finalize a reservation once its items are delivered. Idempotent —
   * a replay, or a confirm of an expired/already-claimed reservation, spends
   * nothing and reports `confirmed: 0`.
   */
  async confirm(uuid: string, reservationId: string): Promise<ConfirmCajaResponse> {
    const confirmed = await this.cajaRepository.confirm(uuid, reservationId);
    return { confirmed };
  }

  /**
   * Splits spent/reserved rows into the two delivery channels: items go to
   * `objetos` (chested), Pokémon to `pokemon` (party) — the deliverer handles them
   * differently, so they cannot share one list. Both empty means nothing was owed,
   * which is a valid outcome, not an error.
   */
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
