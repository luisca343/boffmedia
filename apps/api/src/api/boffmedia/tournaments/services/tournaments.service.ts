import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  TournamentsRepository,
  TournamentListRow,
} from '../repositories/tournaments.repository';
import {
  Tournament,
  boffMediaTournaments,
} from '@/_db/schema/BoffMediaTournaments';
import { CreateTournamentDto } from '../dto/create-tournament.dto';
import { UpdateTournamentDto } from '../dto/update-tournament.dto';
import { TournamentSummary } from '../entities/tournament.entity';
import { ListTournamentsQueryDto } from '../dto/list-tournaments-query.dto';
import { slugify } from '../tournaments.mapper';
import type { TournamentStatus } from '../tournaments.types';

@Injectable()
export class TournamentsService {
  constructor(private readonly repo: TournamentsRepository) {}

  async create(dto: CreateTournamentDto): Promise<Tournament> {
    const slug = await this.uniqueSlug(slugify(dto.slug || dto.name));
    const values: typeof boffMediaTournaments.$inferInsert = {
      slug,
      name: dto.name,
      format: dto.format,
      competitorKind: dto.competitorKind ?? 'solo',
      gameId: dto.gameId ?? null,
      eventId: dto.eventId ?? null,
      metric: dto.metric ?? null,
      unit: dto.unit ?? null,
      maxParticipants: dto.maxParticipants ?? null,
      registrationOpen: dto.registrationOpen ?? false,
      bestOf: dto.bestOf ?? 1,
      autoVerifyMinutes: dto.autoVerifyMinutes ?? null,
      groupCount: dto.groupCount ?? null,
      advanceCount: dto.advanceCount ?? null,
      description: dto.description ?? null,
      rules: dto.rules ?? null,
      prizes: dto.prizes ?? null,
      checkInOpen: dto.checkInOpen ?? false,
      teamsheetRequired: dto.teamsheetRequired ?? false,
      entryDeadline: dto.entryDeadline ?? null,
      banner: dto.banner ?? null,
      icon: dto.icon ?? null,
      hue: dto.hue ?? null,
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
    };
    const id = await this.repo.create(values);
    return this.getById(id);
  }

  async getById(id: number): Promise<Tournament> {
    const t = await this.repo.findById(id);
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async getMetaBySlug(slug: string): Promise<TournamentListRow> {
    const t = await this.repo.findBySlug(slug);
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async getMetaById(id: number): Promise<TournamentListRow> {
    const t = await this.repo.findByIdRow(id);
    if (!t) throw new NotFoundException('Tournament not found');
    return t;
  }

  async list(query: ListTournamentsQueryDto): Promise<TournamentSummary[]> {
    const rows = await this.repo.list({
      status: query.status,
      format: query.format,
      gameId: query.gameId,
      q: query.q,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
    const counts = await this.repo.participantCounts(rows.map((r) => r.id));
    return rows.map((r) => this.toSummary(r, counts.get(r.id) ?? 0));
  }

  /** Tournaments the caller has entered (profile panel), newest first. */
  async mine(
    userId: number,
  ): Promise<
    (TournamentSummary & { myStatus: string; isChampion: boolean })[]
  > {
    const rows = await this.repo.listByParticipantUser(userId);
    const counts = await this.repo.participantCounts(rows.map((r) => r.id));
    return rows.map((r) => ({
      ...this.toSummary(r, counts.get(r.id) ?? 0),
      myStatus: r.myStatus,
      isChampion:
        r.championParticipantId != null &&
        r.championParticipantId === r.myParticipantId,
    }));
  }

  async update(id: number, dto: UpdateTournamentDto): Promise<Tournament> {
    await this.getById(id);
    const patch: Partial<typeof boffMediaTournaments.$inferInsert> = {};
    const assign = <K extends keyof UpdateTournamentDto>(k: K) => {
      if (dto[k] !== undefined)
        (patch as Record<string, unknown>)[k] = dto[k] as unknown;
    };
    (
      [
        'name',
        'format',
        'competitorKind',
        'gameId',
        'eventId',
        'metric',
        'unit',
        'maxParticipants',
        'registrationOpen',
        'bestOf',
        'autoVerifyMinutes',
        'groupCount',
        'advanceCount',
        'description',
        'rules',
        'prizes',
        'checkInOpen',
        'teamsheetRequired',
        'entryDeadline',
        'banner',
        'icon',
        'hue',
        'startDate',
        'endDate',
      ] as (keyof UpdateTournamentDto)[]
    ).forEach(assign);

    if (dto.slug !== undefined) {
      patch.slug = await this.uniqueSlug(slugify(dto.slug), id);
    }
    await this.repo.update(id, patch);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    await this.getById(id);
    await this.repo.softDelete(id);
    return { success: true };
  }

  /**
   * Allowed lifecycle moves. Only `completed → *` used to be refused, which let
   * a live tournament be dropped back to `registration` — new entrants then
   * join a field the bracket was already built from, and nothing reconciles the
   * two. Cancelling is always available; a cancelled tournament may be revived
   * to draft, but only while it has no matches (checked below).
   */
  private static readonly TRANSITIONS: Readonly<
    Record<TournamentStatus, readonly TournamentStatus[]>
  > = {
    draft: ['registration', 'live', 'cancelled'],
    registration: ['draft', 'live', 'cancelled'],
    live: ['completed', 'cancelled'],
    completed: [],
    cancelled: ['draft'],
  };

  async setStatus(id: number, status: TournamentStatus): Promise<Tournament> {
    const t = await this.getById(id);
    if (t.status === status) return t;

    const allowed = TournamentsService.TRANSITIONS[t.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        t.status === 'completed'
          ? 'A completed tournament cannot reopen'
          : `A tournament cannot go from ${t.status} to ${status}`,
      );
    }

    // Reviving a cancelled tournament is only safe while nothing was played:
    // its bracket, standings and eliminations would otherwise be resurrected
    // half-way through.
    if (t.status === 'cancelled') {
      const matches = await this.repo.listMatches(id);
      if (matches.length > 0) {
        throw new BadRequestException(
          'This tournament already has a bracket — delete it instead of reviving it',
        );
      }
    }

    await this.repo.update(id, { status });
    return this.getById(id);
  }

  toSummary(
    row: TournamentListRow,
    participantCount: number,
  ): TournamentSummary {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      format: row.format,
      competitorKind: row.competitorKind,
      status: row.status,
      gameId: row.gameId,
      gameTitle: row.gameTitle,
      banner: row.banner,
      icon: row.icon,
      hue: row.hue,
      maxParticipants: row.maxParticipants,
      registrationOpen: row.registrationOpen,
      participantCount,
      championName: row.championName,
      startDate: row.startDate ? row.startDate.toISOString() : null,
      endDate: row.endDate ? row.endDate.toISOString() : null,
    };
  }

  private async uniqueSlug(base: string, excludeId?: number): Promise<string> {
    const root = base || 'torneo';
    let slug = root;
    let n = 1;
    // Non-deleted collision check; the slug column is globally unique so a
    // soft-deleted collision would surface as a clear DB error (rare).
    for (;;) {
      const existing = await this.repo.findBySlug(slug);
      if (!existing || existing.id === excludeId) return slug;
      n += 1;
      slug = `${root}-${n}`;
    }
  }
}
