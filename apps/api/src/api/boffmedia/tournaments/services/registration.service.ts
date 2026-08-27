import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import { AddParticipantDto } from '../dto/add-participant.dto';
import { RegisterParticipantDto } from '../dto/register-participant.dto';
import { UpdateParticipantDto } from '../dto/update-participant.dto';
import { Competitor } from '../entities/competitor.entity';
import { toCompetitor } from '../tournaments.mapper';
import {
  boffMediaTournamentParticipants,
  boffMediaTournamentRoster,
  TournamentParticipant,
} from '@/_db/schema/BoffMediaTournaments';
import { RosterMemberDto } from '../dto/add-participant.dto';

@Injectable()
export class RegistrationService {
  constructor(private readonly repo: TournamentsRepository) {}

  // Admin adds an entrant.
  async addParticipant(
    tournamentId: number,
    dto: AddParticipantDto,
  ): Promise<Competitor> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');

    let avatar: string | null = null;
    if (dto.userId != null) {
      const user = await this.repo.findUserBasic(dto.userId);
      avatar = user?.profilePicture ?? null;
    }

    const values: typeof boffMediaTournamentParticipants.$inferInsert = {
      tournamentId,
      kind: dto.kind ?? t.competitorKind,
      userId: dto.userId ?? null,
      name: dto.name,
      tag: dto.tag ?? null,
      avatar,
      seed: dto.seed ?? null,
      country: dto.country ?? null,
      hue: dto.hue ?? null,
      score: dto.score ?? null,
      meta: dto.meta ?? null,
      verified: dto.verified ?? false,
    };
    const id = await this.repo.addParticipant(values);
    await this.insertRoster(id, dto.roster);
    return this.loadCompetitor(id);
  }

  // Logged-in user self-registers.
  async register(
    tournamentId: number,
    userId: number,
    dto: RegisterParticipantDto,
  ): Promise<Competitor> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');
    if (t.status !== 'registration' || !t.registrationOpen) {
      throw new ForbiddenException('Registration is closed');
    }
    // Lazy auto-close: the start date is the registration deadline.
    if (t.startDate && new Date() >= t.startDate) {
      await this.repo.update(t.id, { registrationOpen: false });
      throw new ForbiddenException('Registration is closed');
    }

    // A tournament attached to an event draws its field from that event's
    // members. This is what gives an attached tournament the access controls
    // tournaments do not have of their own: a private event's invite list is
    // its tournament's entry list, with nothing duplicated.
    if (t.eventId != null) {
      const member = await this.repo.hasActiveEventMembership(
        t.eventId,
        userId,
      );
      if (!member) {
        throw new ForbiddenException(
          userError(
            ApiErrorCode.TOURNAMENT_EVENT_MEMBERSHIP_REQUIRED,
            'Join the event before registering for its tournament',
          ),
        );
      }
    }

    const user = await this.repo.findUserBasic(userId);

    // Count and insert under a lock on the tournament row. Registration opening
    // is the single most concurrent moment a tournament has, and a plain
    // check-then-insert lets N+1 players past a cap of N — which then has to be
    // undone by deleting a seeded entrant, the thing `removeParticipant` now
    // refuses. `tp_user_uq` covers the same user twice; it cannot cover this.
    const id = await this.repo.transaction(async (tx) => {
      await tx.lockTournament(tournamentId);

      const existing = await tx.findParticipantByUser(tournamentId, userId);
      if (existing) throw new ConflictException('Already registered');

      if (t.maxParticipants != null) {
        const counts = await tx.participantCounts([tournamentId]);
        if ((counts.get(tournamentId) ?? 0) >= t.maxParticipants) {
          throw new ForbiddenException('Tournament is full');
        }
      }

      const values: typeof boffMediaTournamentParticipants.$inferInsert = {
        tournamentId,
        kind: t.competitorKind,
        userId,
        name: dto.name || user?.username || 'Jugador',
        tag: dto.tag ?? null,
        avatar: user?.profilePicture ?? null,
        country: dto.country ?? null,
      };
      const newId = await tx.addParticipant(values);
      await this.insertRosterWith(tx, newId, dto.roster);
      return newId;
    });
    return this.loadCompetitor(id);
  }

  async withdraw(
    tournamentId: number,
    userId: number,
  ): Promise<{ success: boolean }> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');
    const existing = await this.repo.findParticipantByUser(
      tournamentId,
      userId,
    );
    if (!existing) throw new NotFoundException('Not registered');
    if (t.status !== 'registration' && t.status !== 'draft') {
      throw new BadRequestException(
        'Cannot withdraw once the tournament has started',
      );
    }
    await this.repo.removeParticipant(existing.id);
    return { success: true };
  }

  async updateParticipant(
    tournamentId: number,
    id: number,
    dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    // Called for the ownership guard; the row itself is not needed here.
    await this.mustOwnParticipant(tournamentId, id);
    const patch: Partial<typeof boffMediaTournamentParticipants.$inferInsert> =
      {};
    (
      [
        'name',
        'tag',
        'country',
        'seed',
        'hue',
        'score',
        'meta',
        'verified',
        'groupId',
        'status',
      ] as (keyof UpdateParticipantDto)[]
    ).forEach((k) => {
      if (dto[k] !== undefined)
        (patch as Record<string, unknown>)[k] = dto[k] as unknown;
    });
    await this.repo.updateParticipant(id, patch);
    return this.loadCompetitor(id);
  }

  async removeParticipant(
    tournamentId: number,
    id: number,
  ): Promise<{ success: boolean }> {
    await this.mustOwnParticipant(tournamentId, id);
    // A seeded entrant is referenced by matches whose participant FKs are
    // ON DELETE SET NULL, so deleting one leaves half-empty matches that
    // standings and advancement silently skip — the phase can then "complete"
    // with a hole in it. Withdrawal keeps the row and its record intact.
    const matches = await this.repo.listMatches(tournamentId);
    if (
      matches.some(
        (m) => m.topParticipantId === id || m.botParticipantId === id,
      )
    ) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_PARTICIPANT_IN_BRACKET,
          'This entrant is already in the bracket — set their status to withdrew or disqualified instead of deleting them',
        ),
      );
    }
    await this.repo.removeParticipant(id);
    return { success: true };
  }

  /** An entrant addressed through `/:id/participants/:pid` must belong to `:id`. */
  private async mustOwnParticipant(
    tournamentId: number,
    id: number,
  ): Promise<TournamentParticipant> {
    const p = await this.repo.findParticipant(id);
    if (!p || p.tournamentId !== tournamentId) {
      throw new NotFoundException('Participant not found');
    }
    return p;
  }

  /** Player check-in while the admin has the window open. */
  async setCheckIn(
    tournamentId: number,
    userId: number,
    checkedIn: boolean,
  ): Promise<{ success: boolean; checkedInAt: string | null }> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');
    if (!t.checkInOpen) {
      throw new BadRequestException(
        userError(ApiErrorCode.TOURNAMENT_CHECKIN_CLOSED, 'Check-in is closed'),
      );
    }
    const me = await this.repo.findParticipantByUser(tournamentId, userId);
    if (!me) throw new NotFoundException('Not registered');
    // On a teamsheet tournament the list IS half of entering, and checking in
    // without one would show the player as ready while the field resolution
    // would still drop them. Refuse now, while they can still fix it.
    if (checkedIn && t.teamsheetRequired && !me.teamsheet) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.TOURNAMENT_TEAMSHEET_REQUIRED,
          'Submit your teamsheet before checking in',
        ),
      );
    }
    const at = checkedIn ? new Date() : null;
    await this.repo.updateParticipant(me.id, { checkedInAt: at });
    return { success: true, checkedInAt: at ? at.toISOString() : null };
  }

  /**
   * Leaderboard self-submission: upsert the caller's own entry with a new
   * score + evidence line. Every submission drops back to unverified so an
   * admin re-validates it. Auto-registers while registration is open.
   */
  async submitScore(
    tournamentId: number,
    userId: number,
    score: number,
    meta?: string,
  ): Promise<Competitor> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');
    if (t.format !== 'leaderboard') {
      throw new BadRequestException('Not a leaderboard tournament');
    }
    if (t.status !== 'registration' && t.status !== 'live') {
      throw new BadRequestException('Submissions are closed');
    }

    let me = await this.repo.findParticipantByUser(tournamentId, userId);
    if (!me) {
      if (t.status !== 'registration' || !t.registrationOpen) {
        throw new ForbiddenException('Registration is closed');
      }
      const user = await this.repo.findUserBasic(userId);
      const id = await this.repo.addParticipant({
        tournamentId,
        kind: t.competitorKind,
        userId,
        name: user?.username || 'Jugador',
        avatar: user?.profilePicture ?? null,
      });
      me = await this.repo.findParticipant(id);
      if (!me) throw new NotFoundException('Participant not found');
    }

    await this.repo.updateParticipant(me.id, {
      score,
      meta: meta ?? null,
      verified: false,
    });
    return this.loadCompetitor(me.id);
  }

  private async insertRoster(
    participantId: number,
    roster?: RosterMemberDto[],
  ): Promise<void> {
    await this.insertRosterWith(this.repo, participantId, roster);
  }

  /** Roster insert against a caller-supplied (possibly tx-scoped) repository. */
  private async insertRosterWith(
    repo: TournamentsRepository,
    participantId: number,
    roster?: RosterMemberDto[],
  ): Promise<void> {
    if (!roster?.length) return;
    const rows: (typeof boffMediaTournamentRoster.$inferInsert)[] = roster.map(
      (m) => ({
        participantId,
        userId: m.userId ?? null,
        name: m.name,
        role: m.role ?? null,
      }),
    );
    await repo.addRosterMembers(rows);
  }

  private async loadCompetitor(id: number): Promise<Competitor> {
    const p = await this.repo.findParticipant(id);
    if (!p) throw new NotFoundException('Participant not found');
    const roster =
      p.kind === 'team' ? await this.repo.listRoster([id]) : undefined;
    return toCompetitor(p, roster);
  }
}
