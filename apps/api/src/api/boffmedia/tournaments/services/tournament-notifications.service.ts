import { Injectable } from '@nestjs/common';
import { NotificationsService } from '@api/boffmedia/notifications/notifications.service';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { Tournament, TournamentMatch } from '@/_db/schema/BoffMediaTournaments';

/**
 * Tournament notification producers. Every method is best-effort: a
 * notification failure must never fail the action that triggered it.
 */
@Injectable()
export class TournamentNotificationsService {
  constructor(
    private readonly repo: TournamentsRepository,
    private readonly notifications: NotificationsService,
  ) {}

  private async notifyUser(
    userId: number,
    title: string,
    body: string,
    link: string,
  ): Promise<void> {
    try {
      await this.notifications.create({
        userId,
        type: 'tournament',
        title,
        body,
        link,
      });
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
