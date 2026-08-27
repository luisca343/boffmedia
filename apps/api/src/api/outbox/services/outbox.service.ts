import { Inject, Injectable, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { OutboxRepository } from '../repositories/outbox.repository';
import type { Outbox } from '@/_db/schema/BoffMediaOutbox';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { TournamentAnnouncerService } from '@api/boffmedia/tournaments/services/tournament-announcer.service';
import { TournamentsRepository } from '@api/boffmedia/tournaments/repositories/tournaments.repository';
import { WigglypopCustodyService } from '@api/smartrotom/wigglypop/services/wigglypop-custody.service';
import { WigglypopOrdersRepository } from '@api/smartrotom/wigglypop/repositories/wigglypop-orders.repository';
import { WigglypopSagaService } from '@api/smartrotom/wigglypop/services/wigglypop-saga.service';
import { MailService } from '@api/mail/mail.service';

type Handler = (payload: Record<string, unknown>) => Promise<void>;

/**
 * Outbox dispatcher: claims and delivers enqueued side effects.
 *
 * R3 — post-commit side effects are lost silently, and duplicate requests do
 * duplicate work (P2). The outbox routes all async side effects (notifications,
 * Discord announcements, money/Pokémon transfers, mail) through a persisted
 * queue. Producers write a single row INSIDE their business transaction;
 * the dispatcher claims due rows atomically, executes the handler, and marks
 * delivered. Rows that exhaust retries stay as `failed` for visibility.
 *
 * Handlers are registered by topic. The dispatcher runs every minute, so an
 * outbox entry is retried within a minute of the first attempt, then with
 * exponential backoff.
 */
@Injectable()
export class OutboxService {
  private handlers = new Map<string, Handler>();

  constructor(
    private readonly logger: Logger,
    private readonly repo: OutboxRepository,
    @Optional() private readonly notifications?: NotificationsService,
    @Optional() private readonly announcer?: TournamentAnnouncerService,
    @Optional() private readonly tournamentsRepo?: TournamentsRepository,
    @Optional() private readonly custody?: WigglypopCustodyService,
    @Optional() private readonly ordersRepo?: WigglypopOrdersRepository,
    @Optional() private readonly saga?: WigglypopSagaService,
    @Optional() private readonly mail?: MailService,
  ) {
    // Handlers are registered by topic. Topics are explicit to keep the
    // mapping clear and avoid plugin-framework complexity.
    this.register('notification:create', (payload) =>
      this.handleNotificationCreate(payload),
    );
    this.register('tournament:announce:champion', (payload) =>
      this.handleTournamentAnnounce(payload),
    );
    this.register('tournament:announce:start', (payload) =>
      this.handleTournamentAnnounce(payload),
    );
    this.register('tournament:announce:registration-open', (payload) =>
      this.handleTournamentAnnounce(payload),
    );
    this.register('wigglypop:settle-order', (payload) =>
      this.handleWigglypopSettle(payload),
    );
    this.register('wigglypop:confirm-order', (payload) =>
      this.handleWigglypopConfirm(payload),
    );
    this.register('wigglypop:cancel-order', (payload) =>
      this.handleWigglypopCancel(payload),
    );
    // R5 — the retryable half of atomic custody. settleAtomic charges the buyer
    // and then enqueues this; the handler gives the goods to the buyer and pays
    // the sellers, one conditional write at a time.
    this.register('wigglypop:deliver-order', (payload) =>
      this.handleWigglypopDeliver(payload),
    );
    this.register('mail:send-verification', (payload) =>
      this.handleMailVerification(payload),
    );
    this.register('mail:send-password-reset', (payload) =>
      this.handleMailPasswordReset(payload),
    );
  }

  private register(topic: string, handler: Handler): void {
    this.handlers.set(topic, handler);
  }

  /**
   * Claim and deliver pending outbox rows. Runs every minute so recently-enqueued
   * items begin retry immediately. Failure must never crash the tick.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async dispatch(): Promise<void> {
    const BATCH_SIZE = 100;

    try {
      const claimed = await this.repo.claim(BATCH_SIZE);
      if (claimed.length === 0) return;

      (this.logger as any).debug(
        `Outbox: claimed ${claimed.length} rows for dispatch`,
      );

      for (const row of claimed) {
        await this.deliver(row);
      }
    } catch (error: any) {
      // Housekeeping — a failure must never crash the scheduler tick.
      this.logger.error(`Outbox dispatch failed: ${error?.message}`);
    }
  }

  private async deliver(row: Outbox): Promise<void> {
    const handler = this.handlers.get(row.topic);
    if (!handler) {
      this.logger.warn(
        `Outbox row #${row.id} (${row.topic}): no handler registered — marking failed`,
      );
      await this.repo.markFailed(
        row.id,
        new Error(`No handler for topic: ${row.topic}`),
      );
      return;
    }

    try {
      await handler(row.payload);
      await this.repo.markDelivered(row.id);
    } catch (error: any) {
      this.logger.error(
        `Outbox row #${row.id} (${row.topic}): delivery failed: ${error?.message}`,
      );
      await this.repo.markFailed(row.id, error);
    }
  }

  // ─── Handlers ────────────────────────────────────────────────────────────

  private async handleNotificationCreate(payload: Record<string, unknown>): Promise<void> {
    if (!this.notifications) {
      throw new Error('NotificationsService not wired into OutboxModule');
    }
    const { userId, type, title, body, link, dedupeKey } = payload as {
      userId: number;
      type: string;
      title: string;
      body?: string;
      link?: string;
      dedupeKey?: string;
    };
    await this.notifications.create(
      { userId, type: type as any, title, body, link },
      dedupeKey,
    );
  }

  private async handleTournamentAnnounce(payload: Record<string, unknown>): Promise<void> {
    if (!this.announcer || !this.tournamentsRepo) {
      throw new Error('TournamentAnnouncerService not wired into OutboxModule');
    }
    const { tournamentId, eventType, participantId } = payload as {
      tournamentId: number;
      eventType: 'champion' | 'start' | 'registration-open';
      participantId?: number;
    };

    const tournament = await this.tournamentsRepo.findById(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament ${tournamentId} not found`);
    }

    switch (eventType) {
      case 'champion':
        if (!participantId) throw new Error('participantId required for champion');
        await this.announcer.post({
          title: `🏆 ${await this.tournamentsRepo.findParticipant(participantId).then(p => p?.name ?? 'Campeón')} gana ${tournament.name}`,
          url: `${process.env.NEXTAUTH_URL ?? 'https://ficuslab.es'}/torneos/${tournament.slug}`,
          color: 0xeab308,
        });
        break;
      case 'start':
        await this.announcer.post({
          title: `🏁 ¡Comienza ${tournament.name}!`,
          description: 'Sigue los cruces y resultados en directo.',
          url: `${process.env.NEXTAUTH_URL ?? 'https://ficuslab.es'}/torneos/${tournament.slug}`,
          color: 0xf59e0b,
        });
        break;
      case 'registration-open':
        await this.announcer.post({
          title: `📝 Inscripción abierta — ${tournament.name}`,
          description: tournament.description ?? undefined,
          url: `${process.env.NEXTAUTH_URL ?? 'https://ficuslab.es'}/torneos/${tournament.slug}`,
          color: 0x22c55e,
        });
        break;
    }
  }

  private async handleWigglypopSettle(payload: Record<string, unknown>): Promise<void> {
    if (!this.custody || !this.ordersRepo) {
      throw new Error('WigglypopCustodyService not wired into OutboxModule');
    }
    const { orderId } = payload as { orderId: number };
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    await this.custody.settleNewOrder(order);
  }

  private async handleWigglypopConfirm(payload: Record<string, unknown>): Promise<void> {
    if (!this.custody || !this.ordersRepo) {
      throw new Error('WigglypopCustodyService not wired into OutboxModule');
    }
    const { orderId } = payload as { orderId: number };
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    await this.custody.confirmOrder(order);
  }

  private async handleWigglypopCancel(payload: Record<string, unknown>): Promise<void> {
    if (!this.custody || !this.ordersRepo) {
      throw new Error('WigglypopCustodyService not wired into OutboxModule');
    }
    const { orderId } = payload as { orderId: number };
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    await this.custody.cancelOrder(order);
  }

  /**
   * Delivery for an atomic-custody order. Deliberately thin: the saga throws
   * while the order is still owed something, and that throw is what keeps the
   * outbox row pending so the dispatcher tries again with backoff.
   */
  private async handleWigglypopDeliver(payload: Record<string, unknown>): Promise<void> {
    if (!this.saga) {
      throw new Error('WigglypopSagaService not wired into OutboxModule');
    }
    const { orderId } = payload as { orderId: number };
    await this.saga.deliverOrder(orderId);
  }

  private async handleMailVerification(payload: Record<string, unknown>): Promise<void> {
    if (!this.mail) {
      throw new Error('MailService not wired into OutboxModule');
    }
    const { to, token, locale } = payload as {
      to: string;
      token: string;
      locale?: string;
    };
    await this.mail.sendEmailVerification(to, token, locale);
  }

  private async handleMailPasswordReset(payload: Record<string, unknown>): Promise<void> {
    if (!this.mail) {
      throw new Error('MailService not wired into OutboxModule');
    }
    const { to, token, locale } = payload as {
      to: string;
      token: string;
      locale?: string;
    };
    await this.mail.sendPasswordReset(to, token, locale);
  }
}
