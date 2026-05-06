import { Injectable, NotFoundException } from '@nestjs/common';
import { TrackerRepository } from '../../tracker/tracker.repository';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import { SmogonService } from './smogon.service';
import { VgcPastesService } from './vgcpastes.service';
import { LimitlessService } from './limitless.service';
import type { PokemonUsageEntry } from '../entities/pokemon-usage.entity';
import { SMOGON_DEFAULT_CUTOFF } from '../config/smogon.config';

interface PersonalUsageRow {
  speciesId: string;
  speciesName: string;
  usagePercent: number;
  rawCount: number;
}

function normalizeSpeciesName(speciesName: string | null | undefined): string {
  return speciesName?.trim() || 'Unknown';
}

@Injectable()
export class PersonalMetaAnalyticsService {
  constructor(
    private readonly trackerRepository: TrackerRepository,
    private readonly regulationsRepository: VgcRegulationsRepository,
    private readonly smogonService: SmogonService,
    private readonly vgcPastesService: VgcPastesService,
    private readonly limitlessService: LimitlessService,
  ) {}

  private async getMetaUsageEntries(params: {
    regulationId: string;
    source: 'auto' | 'smogon' | 'champions' | 'limitless';
    month?: string;
    cutoff?: number;
  }): Promise<{ source: 'smogon' | 'champions' | 'limitless'; entries: PokemonUsageEntry[] }> {
    const regulation = await this.regulationsRepository.findById(params.regulationId);
    if (!regulation) {
      throw new NotFoundException(`Regulation "${params.regulationId}" not found`);
    }

    let resolvedSource: 'smogon' | 'champions' | 'limitless';
    if (params.source === 'auto') {
      resolvedSource = regulation.vgcPastesGid ? 'champions' : 'smogon';
    } else {
      resolvedSource = params.source;
    }

    if (resolvedSource === 'champions') {
      if (!regulation.vgcPastesGid) {
        throw new NotFoundException(`No VGCPastes GID configured for "${params.regulationId}"`);
      }
      return {
        source: 'champions',
        entries: await this.vgcPastesService.getUsageEntries(params.regulationId),
      };
    }

    if (resolvedSource === 'limitless') {
      return {
        source: 'limitless',
        entries: await this.limitlessService.getCombinedUsageEntries(params.regulationId),
      };
    }

    const formatId = regulation.formatId;
    const cutoff = params.cutoff ?? SMOGON_DEFAULT_CUTOFF;
    const month = params.month ?? await this.smogonService.resolveLatestMonth();
    return {
      source: 'smogon',
      entries: await this.smogonService.getUsageEntries(formatId, month, cutoff),
    };
  }

  private async getPersonalUsage(userId: number, regulationId: string): Promise<{ sampleSize: number; rows: PersonalUsageRow[] }> {
    const { sessions, matches } = await this.trackerRepository.findAllByUser(userId);
    const allowedSessionIds = new Set(
      sessions
        .filter((s) => s.regulationId === regulationId)
        .map((s) => s.id),
    );

    const filteredMatches = matches.filter((m) => allowedSessionIds.has(m.sessionId));
    const sampleSize = filteredMatches.length;

    if (sampleSize === 0) {
      return { sampleSize, rows: [] };
    }

    const speciesCounts = new Map<string, { name: string; count: number }>();

    for (const match of filteredMatches) {
      const parsedOpponentTeam = typeof match.opponentTeam === 'string'
        ? JSON.parse(match.opponentTeam)
        : match.opponentTeam;

      const seenInMatch = new Set<string>();
      for (const slot of parsedOpponentTeam?.slots ?? []) {
        if (!slot?.speciesId) continue;
        const speciesId = slot.speciesId;
        if (seenInMatch.has(speciesId)) continue;

        seenInMatch.add(speciesId);
        const existing = speciesCounts.get(speciesId);
        if (existing) {
          existing.count += 1;
        } else {
          speciesCounts.set(speciesId, {
            name: normalizeSpeciesName(slot.speciesName) || speciesId,
            count: 1,
          });
        }
      }
    }

    const rows = [...speciesCounts.entries()]
      .map(([speciesId, value]) => ({
        speciesId,
        speciesName: value.name,
        rawCount: value.count,
        usagePercent: (value.count / sampleSize) * 100,
      }))
      .sort((a, b) => b.usagePercent - a.usagePercent);

    return { sampleSize, rows };
  }

  async comparePersonalVsMeta(userId: number, params: {
    regulationId: string;
    source: 'auto' | 'smogon' | 'champions' | 'limitless';
    month?: string;
    cutoff?: number;
  }) {
    const [personal, meta] = await Promise.all([
      this.getPersonalUsage(userId, params.regulationId),
      this.getMetaUsageEntries(params),
    ]);

    const personalMap = new Map(personal.rows.map((row) => [row.speciesId, row]));
    const metaMap = new Map(meta.entries.map((row) => [row.speciesId, row]));
    const allIds = new Set<string>([...personalMap.keys(), ...metaMap.keys()]);

    const rows = [...allIds]
      .map((speciesId) => {
        const p = personalMap.get(speciesId);
        const m = metaMap.get(speciesId);
        const personalUsagePercent = p?.usagePercent ?? 0;
        const metaUsagePercent = m?.usagePercent ?? 0;
        return {
          speciesId,
          speciesName: p?.speciesName ?? m?.speciesName ?? speciesId,
          personalUsagePercent,
          metaUsagePercent,
          deltaPercent: personalUsagePercent - metaUsagePercent,
          absDeltaPercent: Math.abs(personalUsagePercent - metaUsagePercent),
          personalRawCount: p?.rawCount ?? 0,
          metaRawCount: m?.rawCount ?? 0,
        };
      })
      .sort((a, b) => b.absDeltaPercent - a.absDeltaPercent);

    return {
      regulationId: params.regulationId,
      source: meta.source,
      personalSampleSize: personal.sampleSize,
      rowCount: rows.length,
      rows,
    };
  }
}
