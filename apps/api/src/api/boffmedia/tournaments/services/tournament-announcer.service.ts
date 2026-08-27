import { Injectable, Logger } from '@nestjs/common';
import { Tournament } from '@/_db/schema/BoffMediaTournaments';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { env } from '@/config/env';

const SITE_URL = env.NEXTAUTH_URL ?? 'https://ficuslab.es';

/**
 * Discord webhook announcements (registration open · start · champion).
 * Configure `TOURNAMENTS_DISCORD_WEBHOOK_URL` (falls back to
 * `DISCORD_WEBHOOK_URL`); silently disabled when neither is set. Best-effort:
 * an announce failure never fails the triggering action.
 *
 * Announcements are enqueued to the outbox for retry on failure and visibility.
 * The dispatcher will execute the actual webhook POST.
 */
@Injectable()
export class TournamentAnnouncerService {
  private readonly logger = new Logger(TournamentAnnouncerService.name);

  constructor(
    private readonly repo: TournamentsRepository,
    private readonly outbox: OutboxRepository,
  ) {}

  private link(t: Tournament): string {
    return `${SITE_URL}/torneos/${t.slug}`;
  }

  /**
   * Post a Discord webhook announcement. This is called by the outbox dispatcher
   * after the message is enqueued. Best-effort with retries.
   */
  async post(embed: {
    title: string;
    description?: string;
    url?: string;
    color?: number;
  }): Promise<void> {
    const url = env.TOURNAMENTS_DISCORD_WEBHOOK_URL ?? env.DISCORD_WEBHOOK_URL;
    if (!url) {
      // Webhook not configured; the outbox will keep retrying, but never succeed.
      // Mark it delivered anyway to avoid infinite retries on a missing config.
      throw new Error('Discord webhook URL not configured');
    }
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    } catch (e) {
      throw new Error(`Discord webhook failed: ${String(e)}`);
    }
  }

  async announceRegistrationOpen(t: Tournament): Promise<void> {
    try {
      await this.outbox.enqueue('tournament:announce:registration-open', {
        tournamentId: t.id,
        eventType: 'registration-open',
      });
    } catch (e) {
      this.logger.warn(
        `Failed to enqueue registration-open announcement for tournament ${t.id}: ${String(e)}`,
      );
    }
  }

  async announceStart(t: Tournament): Promise<void> {
    try {
      await this.outbox.enqueue('tournament:announce:start', {
        tournamentId: t.id,
        eventType: 'start',
      });
    } catch (e) {
      this.logger.warn(
        `Failed to enqueue start announcement for tournament ${t.id}: ${String(e)}`,
      );
    }
  }

  async announceChampion(t: Tournament, participantId: number): Promise<void> {
    try {
      await this.outbox.enqueue('tournament:announce:champion', {
        tournamentId: t.id,
        eventType: 'champion',
        participantId,
      });
    } catch (e) {
      this.logger.warn(
        `Failed to enqueue champion announcement for tournament ${t.id}: ${String(e)}`,
      );
    }
  }
}
