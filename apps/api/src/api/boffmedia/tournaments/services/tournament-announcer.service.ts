import { Injectable, Logger } from '@nestjs/common';
import { Tournament } from '@/_db/schema/Tournaments';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { env } from '@/config/env';

const SITE_URL = env.NEXTAUTH_URL ?? 'https://ficuslab.es';

/**
 * Discord webhook announcements (registration open · start · champion).
 * Configure `TOURNAMENTS_DISCORD_WEBHOOK_URL` (falls back to
 * `DISCORD_WEBHOOK_URL`); silently disabled when neither is set. Best-effort:
 * an announce failure never fails the triggering action.
 */
@Injectable()
export class TournamentAnnouncerService {
  private readonly logger = new Logger(TournamentAnnouncerService.name);

  constructor(private readonly repo: TournamentsRepository) {}

  private get webhookUrl(): string | undefined {
    return env.TOURNAMENTS_DISCORD_WEBHOOK_URL ?? env.DISCORD_WEBHOOK_URL;
  }

  private async post(embed: {
    title: string;
    description?: string;
    url?: string;
    color?: number;
  }): Promise<void> {
    const url = this.webhookUrl;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    } catch (e) {
      this.logger.warn(`Discord announce failed: ${String(e)}`);
    }
  }

  private link(t: Tournament): string {
    return `${SITE_URL}/torneos/${t.slug}`;
  }

  async announceRegistrationOpen(t: Tournament): Promise<void> {
    await this.post({
      title: `📝 Inscripción abierta — ${t.name}`,
      description: t.description ?? undefined,
      url: this.link(t),
      color: 0x22c55e,
    });
  }

  async announceStart(t: Tournament): Promise<void> {
    await this.post({
      title: `🏁 ¡Comienza ${t.name}!`,
      description: 'Sigue los cruces y resultados en directo.',
      url: this.link(t),
      color: 0xf59e0b,
    });
  }

  async announceChampion(t: Tournament, participantId: number): Promise<void> {
    const champ = await this.repo.findParticipant(participantId);
    await this.post({
      title: `🏆 ${champ?.name ?? 'Campeón'} gana ${t.name}`,
      url: this.link(t),
      color: 0xeab308,
    });
  }
}
