import { Injectable } from '@nestjs/common';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { Tournament, TournamentMatch } from '@/_db/schema/BoffMediaTournaments';

/**
 * Tournament notification producers. Every method is best-effort: a
 * notification failure must never fail the action that triggered it.
 *
 * Notifications are enqueued to the outbox so failures are retried and visible.
 * The dispatcher will invoke the actual notification delivery.
 */
@Injectable()
export class TournamentNotificationsService {
  constructor(
    private readonly repo: TournamentsRepository,
    private readonly notifications: NotificationsService,
    private readonly outbox: OutboxRepository,
  ) {}

  /**
   * `dedupeKey` makes a notification idempotent for producers that can run
   * twice on the same fact — advance can be re-run, and the champion/phase
   * notifications used to stack a duplicate in the user's list each time.
   * Omit it for genuinely repeatable events (a match becoming ready again
   * after an amend is real news).
   *
   * Enqueues the notification to the outbox. The dispatcher will deliver it
   * and retry on failure. Best-effort: an enqueue failure is logged and swallowed.
   */
  private async notifyUser(
    userId: number,
    title: string,
    body: string,
    link: string,
    dedupeKey?: string,
  ): Promise<void> {
    try {
      await this.outbox.enqueue(
        'notification:create',
        { userId, type: 'tournament', title, body, link, dedupeKey },
        dedupeKey,
      );
    } catch {
      // swallow — notifications are best-effort
    }
  }

  async notifyStart(t: Tournament): Promise<void> {
    try {
      const parts = await this.repo.listParticipants(t.id);
      for (const p of parts) {
        if (p.userId == null) continue;
        await this.notifyUser(
          p.userId,
          'El torneo ha comenzado',
          t.name,
          `/torneos/${t.slug}`,
          `t:${t.id}:start:${p.userId}`,
        );
      }
    } catch {
      // swallow
    }
  }

  async notifyChampion(t: Tournament, participantId: number): Promise<void> {
    try {
      const champ = await this.repo.findParticipant(participantId);
      if (champ?.userId != null) {
        await this.notifyUser(
          champ.userId,
          '¡Has ganado el torneo!',
          t.name,
          `/torneos/${t.slug}`,
          `t:${t.id}:champion:${champ.userId}`,
        );
      }
    } catch {
      // swallow
    }
  }

  /** After a phase closes: tell each entrant whether they advanced or are out. */
  async notifyPhaseOutcome(
    t: Tournament,
    qualifiedIds: number[],
    eliminatedIds: number[],
    phaseId: number | null = null,
  ): Promise<void> {
    try {
      const advanced = new Set(qualifiedIds);
      const byId = new Map(
        (await this.repo.listParticipants(t.id)).map((p) => [p.id, p]),
      );
      for (const pid of [...qualifiedIds, ...eliminatedIds]) {
        const p = byId.get(pid);
        if (p?.userId == null) continue;
        await this.notifyUser(
          p.userId,
          advanced.has(pid) ? 'Has pasado de fase' : 'Has quedado eliminado',
          t.name,
          `/torneos/${t.slug}`,
          `t:${t.id}:phase:${phaseId}:${p.userId}`,
        );
      }
    } catch {
      // swallow
    }
  }

  /** Both players of a match that just became playable. */
  async notifyMatchReady(match: TournamentMatch): Promise<void> {
    try {
      const t = await this.repo.findById(match.tournamentId);
      if (!t) return;
      const link = `/torneos/${t.slug}/partida/${match.id}`;
      for (const pid of [match.topParticipantId, match.botParticipantId]) {
        if (pid == null) continue;
        const p = await this.repo.findParticipant(pid);
        if (p?.userId != null) {
          await this.notifyUser(
            p.userId,
            'Tu partida está lista',
            t.name,
            link,
          );
        }
      }
    } catch {
      // swallow
    }
  }

  /** The rival of a fresh self-report proposal (they must confirm or dispute). */
  async notifyProposal(
    match: TournamentMatch,
    rivalParticipantId: number,
  ): Promise<void> {
    try {
      const t = await this.repo.findById(match.tournamentId);
      const p = await this.repo.findParticipant(rivalParticipantId);
      if (!t || p?.userId == null) return;
      await this.notifyUser(
        p.userId,
        'Resultado reportado — te toca verificar',
        t.name,
        `/torneos/${t.slug}/partida/${match.id}`,
      );
    } catch {
      // swallow
    }
  }
}
