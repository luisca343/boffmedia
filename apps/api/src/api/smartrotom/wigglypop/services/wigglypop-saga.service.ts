import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { env } from '@/config/env';
import type { WigglypopOrderLine } from '@/_db/schema/SmartRotomWigglypop';
import {
  OrderWithLines,
  WigglypopOrdersRepository,
} from '../repositories/wigglypop-orders.repository';
import { WigglypopCustodyService } from './wigglypop-custody.service';
import { DELIVERY, IN_FLIGHT, TERMINAL } from '../_shared/custody-state';

// ─────────────────────────────────────────────────────────────────────────────
// R5 — the compensation saga for atomic custody.
//
// WigglypopCustodyService owns the dangerous half: what it means to take a
// Pokémon off a seller, give one to a buyer, and move the money. This service
// owns the boring half that makes the dangerous half survivable — deciding what
// to do with an order that stopped half-way, and doing it exactly once.
//
// Why it is a separate service: settleAtomic runs inside the buyer's HTTP
// request and must return the moment they are charged. Delivery is remote, slow
// and failure-prone, so it is driven from here instead, by two paths that
// deliberately overlap:
//
//   • The OUTBOX, for the normal case. settleAtomic enqueues one row per order;
//     the dispatcher calls deliverOrder within a minute and retries with backoff.
//   • The SWEEPER, for everything the outbox cannot see — an enqueue that never
//     landed, a row that exhausted its retries, a process killed mid-call.
//
// The sweeper's window must outlast the outbox ladder (see
// WIGGLYPOP_SAGA_STALE_MINUTES), so the two never fight over the same order.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class WigglypopSagaService {
  constructor(
    private readonly logger: Logger,
    private readonly ordersRepository: WigglypopOrdersRepository,
    private readonly custody: WigglypopCustodyService,
  ) {}

  /**
   * Drive one order from wherever it stopped to a terminal state.
   *
   * Idempotent by construction: every step is a conditional write that only the
   * first caller wins, so the dispatcher, a retry and the sweeper can all be
   * inside this method for the same order at once without giving a Pokémon away
   * twice.
   *
   * Throws when the order is still owed something. That is the contract the
   * outbox needs — a resolved call means "nothing left to do", so returning
   * quietly on an incomplete order would mark the row delivered and strand it.
   */
  async deliverOrder(orderId: number): Promise<void> {
    const order = await this.ordersRepository.findById(orderId);
    if (!order) throw new Error(`Wigglypop order ${orderId} not found`);

    // Manual custody never reaches this service, and must not: its orders park at
    // `escrow` waiting on two humans, which looks exactly like a stalled atomic
    // order from the outside. Delivering one would call givePokemon with no
    // matching take — the duplication the flag exists to prevent.
    if (!this.custody.isAtomic()) return;
    if (order.status === 'completado' || order.status === 'cancelado') return;

    // Tell the sweeper this order has an owner right now.
    await this.ordersRepository.touch(orderId);

    for (const line of order.lines) {
      await this.advanceLine(order, line);
    }

    const settled = await this.custody.finalizeAtomicOrder(orderId);
    const outstanding = settled.lines.filter(
      (l) => !TERMINAL.includes(l.deliveryStatus),
    );
    if (outstanding.length > 0) {
      throw new Error(
        `Wigglypop ${settled.code}: ${outstanding.length} line(s) still undelivered ` +
          `(${outstanding.map((l) => `#${l.id}:${l.deliveryStatus}`).join(', ')})`,
      );
    }
  }

  /**
   * Move one line as far as it can go in a single pass.
   *
   * A line in an in-flight state is skipped rather than resumed. It belongs to
   * whoever wrote that marker — either an attempt running right now, or a crashed
   * one that only the sweeper is allowed to adjudicate, because only the sweeper
   * knows the order has gone quiet.
   */
  private async advanceLine(
    order: OrderWithLines,
    line: WigglypopOrderLine,
  ): Promise<void> {
    if (TERMINAL.includes(line.deliveryStatus)) return;
    if (IN_FLIGHT.includes(line.deliveryStatus)) return;

    // Nothing was ever taken for this line, so there is nothing to hand over. It
    // cannot be taken here either: taking is Phase A and belongs to the buyer's
    // request, where a failure can still cancel the sale for free.
    if (line.deliveryStatus === DELIVERY.PENDING) return;

    if (line.deliveryStatus === DELIVERY.TAKEN) {
      const taken = this.custody.takenFromLine(line);
      if (!taken) {
        // The line says goods left the seller but recorded nothing about them.
        // There is no safe give to make and no safe restore either.
        await this.custody.escalate(
          line,
          'marked as taken but carries no takenPayload',
        );
        return;
      }
      const delivered = await this.custody.deliverLine(
        order.buyerUuid,
        line,
        taken,
      );
      if (!delivered) return; // another attempt owns it
      // The row moved under us; pay out against the state we just wrote.
      await this.custody.payOutTakenLine(order, {
        ...line,
        deliveryStatus: DELIVERY.GIVEN,
      });
      return;
    }

    if (line.deliveryStatus === DELIVERY.GIVEN) {
      // The buyer already has the goods and the seller is owed. Paying is all
      // that is left, and it is safe to retry because escrow.release either
      // happens or refuses.
      await this.custody.payOutTakenLine(order, line);
    }
  }

  /**
   * The backstop. Finds atomic orders that have gone quiet mid-delivery and
   * either resumes them or, when they were interrupted inside a call whose
   * outcome cannot be known, hands them to a human.
   *
   * Runs every five minutes rather than every minute: the outbox already covers
   * the fast path, and this exists for the failures the outbox cannot represent.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep(): Promise<void> {
    if (!this.custody.isAtomic()) return;

    const staleMs = env.WIGGLYPOP_SAGA_STALE_MINUTES * 60_000;

    try {
      const stalled = await this.ordersRepository.findStalled(staleMs);
      if (stalled.length === 0) return;

      this.logger.warn(
        `Wigglypop saga: ${stalled.length} order(s) stalled for over ` +
          `${env.WIGGLYPOP_SAGA_STALE_MINUTES}m — resuming`,
      );

      for (const order of stalled) {
        await this.recover(order);
      }
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      this.logger.error(`Wigglypop saga sweep failed: ${error?.message}`);
    }
  }

  /**
   * Adjudicate one stalled order.
   *
   * The escalation happens FIRST and deliberately. An interrupted call is the one
   * thing this service will not guess about, and leaving those lines in place
   * while trying to deliver the rest would let a later pass read a stale marker
   * as if it were live.
   */
  private async recover(order: OrderWithLines): Promise<void> {
    try {
      for (const line of order.lines) {
        if (!IN_FLIGHT.includes(line.deliveryStatus)) continue;
        await this.custody.escalate(
          line,
          `interrupted mid-call and the order has been quiet for over ` +
            `${env.WIGGLYPOP_SAGA_STALE_MINUTES}m`,
          'the API cannot tell whether the game-server call landed, and both ' +
            'guesses are unsafe: re-giving mints a Pokémon, re-paying pays twice',
        );
      }

      await this.deliverOrder(order.id);
    } catch (error: any) {
      // deliverOrder throws while work remains, which is normal here — the order
      // is logged and picked up on the next sweep. Escalated lines are terminal,
      // so a permanently stuck order converges instead of looping forever.
      this.logger.warn(
        `Wigglypop saga: order ${order.code} not fully recovered (${error?.message})`,
      );
    }
  }
}
