import { Injectable, NotFoundException } from '@nestjs/common';
import { SmogonService } from './smogon.service';
import { LimitlessService } from './limitless.service';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { SMOGON_DEFAULT_CUTOFF } from '../config/smogon.config';
import type { PokemonUsageEntry } from '../entities/pokemon-usage.entity';
import { getDexForFormat, toBaseFormId } from '../utils/dex-resolver';

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
 * Normalizes mega-evolution and primal-reversion entries to their base species
 * and merges usage from entries that collapse to the same base ID.
 *
 * This is needed for cross-format comparisons where the ladder uses base forms
 * (megas do not exist in standard Gen 9 VGC) but tournament data from the
 * Champions format stores the mega form explicitly (e.g. "charizardmegay").
 */
function mergeToBaseForms(
  entries: PokemonUsageEntry[],
  dex: ReturnType<typeof getDexForFormat>,
): PokemonUsageEntry[] {
  const merged = new Map<string, PokemonUsageEntry>();

  for (const entry of entries) {
    const baseId = toBaseFormId(entry.speciesId, dex);

    if (baseId === entry.speciesId) {
      // Not a mega/primal — insert as-is if not already present, otherwise keep
      if (!merged.has(baseId)) merged.set(baseId, entry);
      continue;
    }

    // Mega/primal/eternal → collapse to base form
    const baseName = dex.species.get(baseId).name ?? entry.speciesName;
    const existing = merged.get(baseId);
    if (existing) {
      merged.set(baseId, {
        ...existing,
        usagePercent: existing.usagePercent + entry.usagePercent,
        rawCount: existing.rawCount + entry.rawCount,
        rank: Math.min(existing.rank, entry.rank),
      });
    } else {
      merged.set(baseId, {
        ...entry,
        speciesId: baseId,
        speciesName: baseName,
      });
    }
  }

  return [...merged.values()];
}

/**
 * Thresholds from META_ANALYSIS.md OQ-D4:
 *   Ladder trap      = ladder >= 10% AND tournament <= 5% AND delta >= +5
 *   Tournament staple = tournament >= 10% AND ladder <= 5% AND delta <= -5
 */
function computeBadge(
  ladder: number,
  tournament: number,
  delta: number,
): DivergenceBadge {
  if (ladder >= 10 && tournament <= 5 && delta >= 5) return 'ladder-trap';
  if (tournament >= 10 && ladder <= 5 && delta <= -5)
    return 'tournament-staple';
  return null;
}

@Injectable()
export class DivergenceService {
  /** In-process cache for divergence results, keyed by regulation+tournament+month+cutoff.
   * TTL is 10 minutes (600000ms). This is per-instance; multi-instance deployments will
   * have independent caches. For a distributed cache, use Redis or similar. */
  private readonly cache = new Map<
    string,
    { result: DivergenceResult; timestamp: number }
  >();
  private readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly smogonService: SmogonService,
    private readonly limitlessService: LimitlessService,
    private readonly regulationsRepository: VgcRegulationsRepository,
  ) {}

  /** Generate a cache key from divergence query parameters. */
  private getCacheKey(params: {
    regulationId: string;
    tournamentId?: number;
    month?: string;
    cutoff?: number;
  }): string {
    return `${params.regulationId}:${params.tournamentId ?? 'combined'}:${params.month ?? 'latest'}:${params.cutoff ?? 'default'}`;
  }

  /** Check if a cached entry is still valid (not expired). */
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL_MS;
  }

  async compareLadderVsTournament(params: {
    regulationId: string;
    tournamentId?: number;
    month?: string;
    cutoff?: number;
  }): Promise<DivergenceResult> {
    const cacheKey = this.getCacheKey(params);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.result;
    }
    const regulation = await this.regulationsRepository.findById(
      params.regulationId,
    );
    if (!regulation) {
      throw new NotFoundException(
        `Regulation "${params.regulationId}" not found`,
      );
    }

    const cutoff = params.cutoff ?? SMOGON_DEFAULT_CUTOFF;

    let month = params.month;
    if (!month) {
      const snapshots = await this.smogonService.getAvailableSnapshots();
      const match = snapshots
        .filter(
          (s) => s.formatId === regulation.formatId && s.cutoff === cutoff,
        )
        .sort((a, b) => b.month.localeCompare(a.month))[0];
      if (!match) {
        throw new NotFoundException(
          `No Smogon snapshot for ${regulation.formatId} at cutoff ${cutoff}. Fetch it from the admin panel first.`,
        );
      }
      month = match.month;
    }

    const [ladderEntries, tournamentEntries]: [
      PokemonUsageEntry[],
      PokemonUsageEntry[],
    ] = await Promise.all([
      this.smogonService.getUsageEntries(regulation.formatId, month, cutoff),
      params.tournamentId
        ? this.limitlessService.getUsageEntries(params.tournamentId)
        : this.limitlessService.getCombinedUsageEntries(params.regulationId),
    ]);

    const dex = getDexForFormat(regulation.formatId);
    const normalizedLadder = mergeToBaseForms(ladderEntries, dex);
    const normalizedTournament = mergeToBaseForms(tournamentEntries, dex);
    const ladderMap = new Map(normalizedLadder.map((e) => [e.speciesId, e]));
    const tournamentMap = new Map(
      normalizedTournament.map((e) => [e.speciesId, e]),
    );
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

    const result: DivergenceResult = {
      regulationId: params.regulationId,
      tournamentId: params.tournamentId ?? null,
      ladderFormat: regulation.formatId,
      ladderMonth: month,
      ladderCutoff: cutoff,
      rowCount: rows.length,
      rows,
    };

    // Store in cache for 10 minutes.
    this.cache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  }
}
