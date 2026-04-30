import { Injectable, NotFoundException } from '@nestjs/common';
import { SmogonService } from './smogon.service';
import { LimitlessService } from './limitless.service';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { SMOGON_DEFAULT_CUTOFF } from '../config/smogon.config';
import type { PokemonUsageEntry } from '../entities/pokemon-usage.entity';

export type DivergenceBadge = 'ladder-trap' | 'tournament-staple' | null;

export interface DivergenceRow {
  speciesId: string;
  speciesName: string;
  ladderPercent: number;
  tournamentPercent: number;
  deltaPercent: number;
  absDeltaPercent: number;
  badge: DivergenceBadge;
}

export interface DivergenceResult {
  regulationId: string;
  /** null = combined across all completed tournaments in the regulation */
  tournamentId: number | null;
  ladderFormat: string;
  ladderMonth: string;
  ladderCutoff: number;
  rowCount: number;
  rows: DivergenceRow[];
}

/**
 * Thresholds from META_ANALYSIS.md OQ-D4:
 *   Ladder trap      = ladder >= 10% AND tournament <= 5% AND delta >= +5
 *   Tournament staple = tournament >= 10% AND ladder <= 5% AND delta <= -5
 */
function computeBadge(ladder: number, tournament: number, delta: number): DivergenceBadge {
  if (ladder >= 10 && tournament <= 5 && delta >= 5) return 'ladder-trap';
  if (tournament >= 10 && ladder <= 5 && delta <= -5) return 'tournament-staple';
  return null;
}

@Injectable()
export class DivergenceService {
  constructor(
    private readonly smogonService: SmogonService,
    private readonly limitlessService: LimitlessService,
    private readonly regulationsRepository: VgcRegulationsRepository,
  ) {}

  async compareLadderVsTournament(params: {
    regulationId: string;
    tournamentId?: number;
    month?: string;
    cutoff?: number;
  }): Promise<DivergenceResult> {
    const regulation = await this.regulationsRepository.findById(params.regulationId);
    if (!regulation) {
      throw new NotFoundException(`Regulation "${params.regulationId}" not found`);
    }

    const cutoff = params.cutoff ?? SMOGON_DEFAULT_CUTOFF;

    let month = params.month;
    if (!month) {
      const snapshots = await this.smogonService.getAvailableSnapshots();
      const match = snapshots
        .filter((s) => s.formatId === regulation.formatId && s.cutoff === cutoff)
        .sort((a, b) => b.month.localeCompare(a.month))[0];
      if (!match) {
        throw new NotFoundException(
          `No Smogon snapshot for ${regulation.formatId} at cutoff ${cutoff}. Fetch it from the admin panel first.`,
        );
      }
      month = match.month;
    }

    const [ladderEntries, tournamentEntries]: [PokemonUsageEntry[], PokemonUsageEntry[]] =
      await Promise.all([
        this.smogonService.getUsageEntries(regulation.formatId, month, cutoff),
        params.tournamentId
          ? this.limitlessService.getUsageEntries(params.tournamentId)
          : this.limitlessService.getCombinedUsageEntries(params.regulationId),
      ]);

    const ladderMap = new Map(ladderEntries.map((e) => [e.speciesId, e]));
    const tournamentMap = new Map(tournamentEntries.map((e) => [e.speciesId, e]));
    const allIds = new Set([...ladderMap.keys(), ...tournamentMap.keys()]);

    const rows: DivergenceRow[] = [...allIds]
      .map((speciesId) => {
        const l = ladderMap.get(speciesId);
        const t = tournamentMap.get(speciesId);
        const ladderPercent = l?.usagePercent ?? 0;
        const tournamentPercent = t?.usagePercent ?? 0;
        const deltaPercent = ladderPercent - tournamentPercent;
        return {
          speciesId,
          speciesName: l?.speciesName ?? t?.speciesName ?? speciesId,
          ladderPercent,
          tournamentPercent,
          deltaPercent,
          absDeltaPercent: Math.abs(deltaPercent),
          badge: computeBadge(ladderPercent, tournamentPercent, deltaPercent),
        };
      })
      .sort((a, b) => b.absDeltaPercent - a.absDeltaPercent);

    return {
      regulationId: params.regulationId,
      tournamentId: params.tournamentId ?? null,
      ladderFormat: regulation.formatId,
      ladderMonth: month,
      ladderCutoff: cutoff,
      rowCount: rows.length,
      rows,
    };
  }
}
