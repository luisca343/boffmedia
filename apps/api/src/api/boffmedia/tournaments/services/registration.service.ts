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
} from '@/_db/schema/Tournaments';
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

    const existing = await this.repo.findParticipantByUser(
      tournamentId,
      userId,
    );
    if (existing) throw new ConflictException('Already registered');

    if (t.maxParticipants != null) {
      const counts = await this.repo.participantCounts([tournamentId]);
      if ((counts.get(tournamentId) ?? 0) >= t.maxParticipants) {
        throw new ForbiddenException('Tournament is full');
      }
    }

    const user = await this.repo.findUserBasic(userId);
    const values: typeof boffMediaTournamentParticipants.$inferInsert = {
      tournamentId,
      kind: t.competitorKind,
      userId,
      name: dto.name || user?.username || 'Jugador',
      tag: dto.tag ?? null,
      avatar: user?.profilePicture ?? null,
      country: dto.country ?? null,
    };
    const id = await this.repo.addParticipant(values);
    await this.insertRoster(id, dto.roster);
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
    id: number,
    dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    const p = await this.repo.findParticipant(id);
    if (!p) throw new NotFoundException('Participant not found');
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

  async removeParticipant(id: number): Promise<{ success: boolean }> {
    const p = await this.repo.findParticipant(id);
    if (!p) throw new NotFoundException('Participant not found');
    await this.repo.removeParticipant(id);
    return { success: true };
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
    if (!roster?.length) return;
    const rows: (typeof boffMediaTournamentRoster.$inferInsert)[] = roster.map(
      (m) => ({
        participantId,
        userId: m.userId ?? null,
        name: m.name,
        role: m.role ?? null,
      }),
    );
    await this.repo.addRosterMembers(rows);
  }

  private async loadCompetitor(id: number): Promise<Competitor> {
    const p = await this.repo.findParticipant(id);
    if (!p) throw new NotFoundException('Participant not found');
    const roster =
      p.kind === 'team' ? await this.repo.listRoster([id]) : undefined;
    return toCompetitor(p, roster);
  }
}
