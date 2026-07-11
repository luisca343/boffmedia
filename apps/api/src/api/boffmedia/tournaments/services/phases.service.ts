import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TournamentsRepository } from '../repositories/tournaments.repository';
import {
  Tournament,
  TournamentPhase,
  boffMediaTournamentPhases,
} from '@/_db/schema/Tournaments';
import { CreatePhaseDto, UpdatePhaseDto } from '../dto/create-phase.dto';

@Injectable()
export class PhasesService {
  constructor(private readonly repo: TournamentsRepository) {}

  /**
   * Seed a new tournament's phase list. Explicit `phases` land in array order;
   * omitting them synthesizes a single phase from the tournament format (full
   * back-compat — the legacy single-stage tournament).
   */
  async createInitialPhases(
    t: Tournament,
    phases?: CreatePhaseDto[],
  ): Promise<void> {
    if (phases && phases.length > 0) {
      for (let i = 0; i < phases.length; i++) {
        await this.repo.createPhase(this.toInsert(t.id, i + 1, phases[i]));
      }
      return;
    }
    await this.repo.createPhase({
      tournamentId: t.id,
      phaseOrder: 1,
      name: 'Fase única',
      format: t.format,
      tiebreakProfile: 'points',
    });
  }

  async appendPhase(
    tournamentId: number,
    dto: CreatePhaseDto,
  ): Promise<TournamentPhase> {
    const t = await this.repo.findById(tournamentId);
    if (!t) throw new NotFoundException('Tournament not found');
    if (!['draft', 'registration', 'live'].includes(t.status)) {
      throw new BadRequestException('Cannot add phases to a closed tournament');
    }
    const phases = await this.repo.listPhases(tournamentId);
    const order = phases.length
      ? Math.max(...phases.map((p) => p.phaseOrder)) + 1
      : 1;
    const id = await this.repo.createPhase(
      this.toInsert(tournamentId, order, dto),
    );
    return this.mustFindPhase(id);
  }

  async updatePhase(
    phaseId: number,
    dto: UpdatePhaseDto,
  ): Promise<TournamentPhase> {
    const ph = await this.repo.findPhase(phaseId);
    if (!ph) throw new NotFoundException('Phase not found');
    if (ph.status !== 'pending') {
      throw new BadRequestException('Only pending phases can be edited');
    }
    const patch: Partial<typeof boffMediaTournamentPhases.$inferInsert> = {};
    const set = <K extends keyof UpdatePhaseDto>(k: K) => {
      if (dto[k] !== undefined)
        (patch as Record<string, unknown>)[k] = dto[k] as unknown;
    };
    (
      [
        'name',
        'format',
        'bestOf',
        'finalsBestOf',
        'rounds',
        'groupCount',
        'thirdPlace',
        'carryStandings',
        'advanceType',
        'advanceCount',
        'advanceMaxLosses',
        'tiebreakProfile',
        'startDate',
        'endDate',
      ] as (keyof UpdatePhaseDto)[]
    ).forEach(set);
    if ((patch.format ?? ph.format) === 'groups' && (patch.carryStandings ?? ph.carryStandings)) {
      throw new BadRequestException(
        'A groups phase cannot carry standings — records are per group',
      );
    }
    await this.repo.updatePhase(phaseId, patch);
    return this.mustFindPhase(phaseId);
  }

  async deletePhase(phaseId: number): Promise<{ success: boolean }> {
    const ph = await this.repo.findPhase(phaseId);
    if (!ph) throw new NotFoundException('Phase not found');
    if (ph.status !== 'pending') {
      throw new BadRequestException('Only pending phases can be removed');
    }
    const all = await this.repo.listPhases(ph.tournamentId);
    if (all.length <= 1) {
      throw new BadRequestException('A tournament needs at least one phase');
    }
    await this.repo.deletePhase(phaseId);
    // Keep phase_order contiguous.
    for (const p of all.filter((p) => p.phaseOrder > ph.phaseOrder)) {
      await this.repo.updatePhase(p.id, { phaseOrder: p.phaseOrder - 1 });
    }
    return { success: true };
  }

  private toInsert(
    tournamentId: number,
    order: number,
    dto: CreatePhaseDto,
  ): typeof boffMediaTournamentPhases.$inferInsert {
    if (dto.format === 'groups' && dto.carryStandings) {
      throw new BadRequestException(
        'A groups phase cannot carry standings — records are per group',
      );
    }
    return {
      tournamentId,
      phaseOrder: order,
      name: dto.name,
      format: dto.format,
      bestOf: dto.bestOf ?? null,
      finalsBestOf: dto.finalsBestOf ?? null,
      rounds: dto.rounds ?? null,
      groupCount: dto.groupCount ?? null,
      thirdPlace: dto.thirdPlace ?? false,
      carryStandings: dto.carryStandings ?? false,
      advanceType: dto.advanceType ?? null,
      advanceCount: dto.advanceCount ?? null,
      advanceMaxLosses: dto.advanceMaxLosses ?? null,
      tiebreakProfile: dto.tiebreakProfile ?? 'points',
      startDate: dto.startDate ?? null,
      endDate: dto.endDate ?? null,
    };
  }

  private async mustFindPhase(id: number): Promise<TournamentPhase> {
    const ph = await this.repo.findPhase(id);
    if (!ph) throw new NotFoundException('Phase not found');
    return ph;
  }
}
