import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Dex } from '@pkmn/sim';
import { SmogonRepository } from '../repositories/smogon.repository';
import { PokemonUsageDetail, PokemonUsageEntry } from '../entities/pokemon-usage.entity';
import { VgcSmogonSnapshot, VgcSmogonPokemonRow } from '@/_db/schema/Vgc';
import { smogonUsageUrl, smogonMovesetUrl } from '../config/smogon.config';
import { parseUsageTxt } from '../utils/parse-usage-txt';
import { parseMovesetTxt } from '../utils/parse-moveset-txt';
import { getDexForFormat, resolveSpeciesId } from '../utils/dex-resolver';

@Injectable()
export class SmogonService {
  private readonly logger = new Logger(SmogonService.name);

  constructor(private readonly smogonRepository: SmogonRepository) {}

  // ─── Admin ──────────────────────────────────────────────────────────────────

  async getAvailableSnapshots(): Promise<VgcSmogonSnapshot[]> {
    return this.smogonRepository.findAvailableSnapshots();
  }

  /**
   * [Admin] Fetch stats.txt + moveset.txt from Smogon, parse, and store as
   * normalised per-Pokémon rows. Replaces any existing snapshot for the same key.
   */
  async fetchAndStore(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<{ count: number }> {
    const [usageRes, movesetRes] = await Promise.all([
      fetch(smogonUsageUrl(formatId, month, cutoff)),
      fetch(smogonMovesetUrl(formatId, month, cutoff)),
    ]);

    if (!usageRes.ok) {
      throw new NotFoundException(
        `Smogon usage data unavailable for ${month}/${formatId}-${cutoff} (HTTP ${usageRes.status})`,
      );
    }
    if (!movesetRes.ok) {
      throw new NotFoundException(
        `Smogon moveset data unavailable for ${month}/${formatId}-${cutoff} (HTTP ${movesetRes.status})`,
      );
    }

    const [usageTxt, movesetTxt] = await Promise.all([
      usageRes.text(),
      movesetRes.text(),
    ]);

    const usageEntries = parseUsageTxt(usageTxt);
    const movesetMap   = parseMovesetTxt(movesetTxt);
    const now          = new Date();

    const rows = usageEntries.map((entry) => {
      const moveset = movesetMap[entry.name] ?? {
        abilities: [], items: [], moves: [], teraTypes: [], teammates: [], spreads: [],
      };
      return {
        formatId,
        month,
        cutoff,
        speciesId:    resolveSpeciesId(entry.name, Dex),
        speciesName:  entry.name,
        rank:         entry.rank,
        usagePercent: entry.usagePercent,
        rawCount:     entry.rawCount,
        topItem:      moveset.items[0]?.name     ?? null,
        topMove:      moveset.moves[0]?.name     ?? null,
        topTeraType:  moveset.teraTypes[0]?.name ?? null,
        abilities:    JSON.stringify(moveset.abilities),
        items:        JSON.stringify(moveset.items),
        moves:        JSON.stringify(moveset.moves),
        teraTypes:    JSON.stringify(moveset.teraTypes),
        teammates:    JSON.stringify(moveset.teammates),
        spreads:      JSON.stringify(moveset.spreads),
        fetchedAt:    now,
      };
    });

    await this.smogonRepository.deletePokemon(formatId, month, cutoff);
    await this.smogonRepository.insertPokemonBatch(rows);
    await this.smogonRepository.upsertSnapshot({ formatId, month, cutoff, pokemonCount: rows.length });

    this.logger.log(`Stored ${rows.length} Pokémon for ${formatId} ${month}-${cutoff}`);
    return { count: rows.length };
  }

  async deleteSnapshot(formatId: string, month: string, cutoff: number): Promise<void> {
    await this.smogonRepository.deletePokemon(formatId, month, cutoff);
    await this.smogonRepository.deleteSnapshot(formatId, month, cutoff);
    this.logger.log(`Deleted snapshot for ${formatId} ${month}-${cutoff}`);
  }

  // ─── Public read ────────────────────────────────────────────────────────────

  /**
   * Returns full detail for every Pokémon in a snapshot.
   * The frontend loads this once and builds a Map for instant per-click lookup.
   */
  async getUsageList(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<PokemonUsageDetail[]> {
    const rows = await this.smogonRepository.findAllPokemon(formatId, month, cutoff);
    if (rows.length === 0) {
      throw new NotFoundException(
        `No data for ${formatId} ${month}-${cutoff}. Fetch from the admin panel first.`,
      );
    }
    const dex = getDexForFormat(formatId);
    return rows.map((row) => this.toDetail(row, dex));
  }

  async getUsageEntries(
    formatId: string,
    month: string,
    cutoff: number,
  ): Promise<PokemonUsageEntry[]> {
    const rows = await this.smogonRepository.findAllPokemon(formatId, month, cutoff);
    if (rows.length === 0) {
      throw new NotFoundException(
        `No data for ${formatId} ${month}-${cutoff}. Fetch from the admin panel first.`,
      );
    }
    const dex = getDexForFormat(formatId);
    return rows.map((row) => this.toEntry(row, dex));
  }

  async getPokemonDetail(
    formatId: string,
    month: string,
    cutoff: number,
    speciesId: string,
  ): Promise<PokemonUsageDetail> {
    const row = await this.smogonRepository.findPokemon(formatId, month, cutoff, speciesId);
    if (!row) {
      throw new NotFoundException(
        `Species "${speciesId}" not found in ${formatId} ${month}-${cutoff}`,
      );
    }
    return this.toDetail(row, getDexForFormat(formatId));
  }

  /** Probe Smogon index for the latest available month — used as a helper in the admin panel */
  async resolveLatestMonth(): Promise<string> {
    try {
      const res = await fetch('https://www.smogon.com/stats/');
      const html = await res.text();
      const matches = [...html.matchAll(/href="(\d{4}-\d{2})\/"/g)];
      if (matches.length) return matches[matches.length - 1][1];
    } catch {
      this.logger.warn('Failed to probe Smogon stats index');
    }
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private toDetail(row: VgcSmogonPokemonRow, dex: typeof Dex): PokemonUsageDetail {
    const species  = dex.species.get(row.speciesName);
    const baseStats = species.exists
      ? species.baseStats
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };

    return {
      speciesId:    row.speciesId,
      speciesName:  row.speciesName,
      rank:         row.rank,
      types:        species.exists ? ([...species.types] as string[]).filter(Boolean) : [],
      usagePercent: row.usagePercent,
      rawCount:     row.rawCount,
      topItem:      row.topItem     ?? undefined,
      topMove:      row.topMove     ?? undefined,
      topTeraType:  row.topTeraType ?? undefined,
      baseStats,
      abilities:    JSON.parse(row.abilities),
      items:        JSON.parse(row.items),
      moves:        JSON.parse(row.moves),
      teraTypes:    JSON.parse(row.teraTypes),
      teammates:    JSON.parse(row.teammates),
      spreads:      JSON.parse(row.spreads),
    };
  }

  private toEntry(row: VgcSmogonPokemonRow, dex: typeof Dex): PokemonUsageEntry {
    const species = dex.species.get(row.speciesName);
    return {
      speciesId:    row.speciesId,
      speciesName:  row.speciesName,
      rank:         row.rank,
      types:        species.exists ? ([...species.types] as string[]).filter(Boolean) : [],
      usagePercent: row.usagePercent,
      rawCount:     row.rawCount,
      topItem:      row.topItem ?? undefined,
      topMove:      row.topMove ?? undefined,
      topTeraType:  row.topTeraType ?? undefined,
    };
  }
}
