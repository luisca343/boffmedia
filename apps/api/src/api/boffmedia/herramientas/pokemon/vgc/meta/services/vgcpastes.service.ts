import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VgcPastesRepository } from '../repositories/vgcpastes.repository';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import {
  BatchFetchResult,
  ChampionsPasteDetail,
  PokemonUsageDetail,
  PokemonUsageEntry,
} from '../entities/pokemon-usage.entity';
import {
  POKEPASTE_CONCURRENCY,
  VGCPASTES_SHEET_BASE,
} from '../config/smogon.config';
import { VgcMetaSlot, StatSpread } from '@/_db/schema/Vgc';
import { PokepasteService } from './pokepaste.service';
import { getDexForFormat, resolveSpeciesId } from '../utils/dex-resolver';

/**
 * Full RFC-4180 CSV parser. Handles quoted fields that contain commas,
 * double-quote escapes, and embedded newlines (e.g. "Replica Code\n(image)").
 * Returns every row as a string array — row boundaries are physical newlines
 * that fall OUTSIDE a quoted field.
 */
function parseCsv(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuotes) {
      if (ch === '"' && raw[i + 1] === '"') {
        field += '"';
        i++;
      } // escaped quote
      else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      } // embedded \n stays in field
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r') {
        /* ignore – handled by \n */
      } else if (ch === '\n') {
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // flush final row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
  }

  return rows;
}

/** Serialize a StatSpread as "hp/atk/def/spa/spd/spe" for grouping/deduplication. */
function formatSpread(s: StatSpread): string {
  return `${s.hp}/${s.atk}/${s.def}/${s.spa}/${s.spd}/${s.spe}`;
}

@Injectable()
export class VgcPastesService {
  private readonly logger = new Logger(VgcPastesService.name);

  constructor(
    private readonly vgcPastesRepository: VgcPastesRepository,
    private readonly regulationsRepository: VgcRegulationsRepository,
    private readonly pokepasteService: PokepasteService,
  ) {}

  async getAvailableRegulations() {
    return this.regulationsRepository.findActive();
  }

  async refreshRegulation(
    regulationId: string,
    gid: string,
  ): Promise<{ count: number }> {
    await this.regulationsRepository.updateImportState(regulationId, {
      importStatus: 'running_csv',
      importError: null,
      importFetchedCount: 0,
      importStartedAt: new Date(),
      importCompletedAt: null,
    });

    try {
      const url = `${VGCPASTES_SHEET_BASE}${gid}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new NotFoundException(
          `Failed to fetch VGCPastes CSV: HTTP ${res.status}`,
        );
      }

      const rows = parseCsv(await res.text());

      // Find the real column-header row by parsed cell values, not raw line text.
      // "Team ID" appears twice (first and last column); "Pokemon Text for Copypasta"
      // uniquely identifies the header row alongside it.
      const headerRowIdx = rows.findIndex(
        (cols) =>
          cols.includes('Team ID') &&
          cols.some((h) => h.includes('Pokemon Text for Copypasta')),
      );
      if (headerRowIdx === -1) {
        throw new NotFoundException(
          'Could not find column-header row (needs "Team ID" + "Pokemon Text for Copypasta") in VGCPastes CSV',
        );
      }

      const headers = rows[headerRowIdx];
      const idxTeamId = headers.indexOf('Team ID'); // first occurrence = col 0
      const idxTeamDesc = headers.indexOf('Team Description');
      const idxFullName = headers.indexOf('Full Name');
      const idxPokepaste = headers.indexOf('Pokepaste');
      const idxHasEvs = headers.indexOf('EVs');
      const idxReplicaStatus = headers.findIndex((h) => h === 'Replica Status');
      const idxDate = headers.indexOf('Date Shared');
      const idxTournament = headers.indexOf('Tournament / Event');
      const idxRank = headers.indexOf('Rank');
      const idxSourceUrl = headers.indexOf('Link to Source');
      const idxOwner = headers.indexOf('Owner');
      const idxPokeText = headers.findIndex((h) =>
        h.includes('Pokemon Text for Copypasta'),
      );
      // Species are in the 6 columns starting AT idxPokeText (the header reads "Pokemon Text for
      // Copypasta" but each data row stores the first Pokémon name there, not paste text).
      const speciesStart = idxPokeText;

      // The per-Pokémon item columns sit in the upper "sprite slot" groups.
      // Each group has 3 sub-cols; the 3rd sub-col (index 2 within the group) is the held item.
      // Groups start at col 5 and repeat every 3 cols → item cols: 7, 10, 13, 16, 19, 22.
      // Relative to idxPokepaste (col 24): offsets are -17, -14, -11, -8, -5, -2.
      const itemCols = [-17, -14, -11, -8, -5, -2].map(
        (offset) => idxPokepaste + offset,
      );

      this.logger.debug(
        `Header at row ${headerRowIdx}: Team ID @ col ${idxTeamId}, ` +
          `PokeText @ col ${idxPokeText}, species @ cols ${speciesStart}–${speciesStart + 5}`,
      );

      const seenTeamIds = new Set<string>();

      let count = 0;
      for (const cols of rows.slice(headerRowIdx + 1)) {
        const teamId = cols[idxTeamId]?.trim();
        // Skip blank rows, repeated headers, and anything that can't be a valid team ID
        if (!teamId || teamId.length > 16 || !/^[A-Za-z0-9]+$/.test(teamId))
          continue;

        const species = cols
          .slice(speciesStart, speciesStart + 6)
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        const items = itemCols
          .map((ci) => cols[ci]?.trim() ?? '')
          .filter((s) => s.length > 0);

        await this.vgcPastesRepository.upsertTeam({
          id: teamId,
          playerName: cols[idxFullName]?.trim() || null,
          teamDescription: cols[idxTeamDesc]?.trim() || null,
          pasteUrl: cols[idxPokepaste]?.trim() || null,
          hasEvs: cols[idxHasEvs]?.trim() || null,
          replicaStatus: cols[idxReplicaStatus]?.trim() || null,
          dateShared: cols[idxDate]?.trim() || null,
          tournament: cols[idxTournament]?.trim() || null,
          rank: cols[idxRank]?.trim() || null,
          sourceUrl: cols[idxSourceUrl]?.trim() || null,
          owner: cols[idxOwner]?.trim() || null,
          regulationId,
          species,
          items,
        });
        seenTeamIds.add(teamId);
        count++;
      }

      const existingIds =
        await this.vgcPastesRepository.findTeamIdsByRegulation(regulationId);
      const staleIds = existingIds.filter((id) => !seenTeamIds.has(id));
      await this.vgcPastesRepository.deleteTeamsByIds(staleIds);

      this.logger.log(
        `Refreshed ${count} teams for regulation ${regulationId} (removed stale=${staleIds.length})`,
      );

      await this.regulationsRepository.updateImportState(regulationId, {
        importStatus: 'running_pastes',
        importError: null,
        importTeamCount: count,
      });

      await this.batchFetchRegulation(regulationId);

      await this.regulationsRepository.updateImportState(regulationId, {
        importStatus: 'done',
        importError: null,
        importTeamCount: count,
        importCompletedAt: new Date(),
      });

      return { count };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.regulationsRepository.updateImportState(regulationId, {
        importStatus: 'error',
        importError: msg,
        importCompletedAt: new Date(),
      });
      throw error;
    }
  }

  // ── Phase 3 — Paste fetch ────────────────────────────────────────────────────

  /**
   * Batch-fetches all paste URLs for a regulation that haven't been linked yet.
   * Processes in chunks of POKEPASTE_CONCURRENCY to respect the rate limit.
   */
  async batchFetchRegulation(regulationId: string): Promise<BatchFetchResult> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    const teams =
      await this.vgcPastesRepository.findTeamsNeedingFetch(regulationId);
    let fetched = 0,
      cached = 0,
      failed = 0;

    await this.regulationsRepository.updateImportState(regulationId, {
      importStatus: 'running_pastes',
      importError: null,
      importFetchedCount: 0,
    });

    try {
      for (let i = 0; i < teams.length; i += POKEPASTE_CONCURRENCY) {
        const chunk = teams.slice(i, i + POKEPASTE_CONCURRENCY);
        await Promise.all(
          chunk.map(async (team) => {
            try {
              const { pasteId, wasCached } =
                await this.pokepasteService.fetchAndCache(
                  team.pasteUrl,
                  regulation?.formatId ?? undefined,
                  {
                    author: team.owner || null,
                    title: team.teamDescription || null,
                    sourceKey: `vgcpastes:${team.id}`,
                  },
                );
              await this.vgcPastesRepository.linkPaste(team.id, pasteId);
              if (wasCached) cached++;
              else fetched++;
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              this.logger.warn(
                `Paste fetch failed for team ${team.id}: ${msg}`,
              );
              failed++;
            }
          }),
        );

        // Write progress after every chunk so the admin panel can poll it
        await this.regulationsRepository.updateImportState(regulationId, {
          importFetchedCount: fetched + cached + failed,
        });
      }

      const status = failed > 0 ? 'error' : 'done';
      await this.regulationsRepository.updateImportState(regulationId, {
        importStatus: status,
        importError: failed > 0 ? `${failed} paste fetches failed` : null,
        importFetchedCount: fetched + cached + failed,
        importCompletedAt: new Date(),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.regulationsRepository.updateImportState(regulationId, {
        importStatus: 'error',
        importError: msg,
        importCompletedAt: new Date(),
      });
      throw error;
    }

    this.logger.log(
      `batchFetchRegulation(${regulationId}): fetched=${fetched} cached=${cached} failed=${failed} / total=${teams.length}`,
    );
    return { total: teams.length, fetched, cached, failed };
  }

  /**
   * Aggregate moves / items / abilities / spreads from fetched pastes for a species.
   * Returns a ChampionsPasteDetail with top-8 entries per category.
   */
  async getPasteDetail(
    regulationId: string,
    speciesId: string,
  ): Promise<ChampionsPasteDetail> {
    const rows =
      await this.vgcPastesRepository.findParsedSlotsByRegulation(regulationId);
    if (rows.length === 0) {
      throw new NotFoundException(
        `No paste data for "${regulationId}". Run fetch-pastes first.`,
      );
    }

    const moveCounts = new Map<string, number>();
    const itemCounts = new Map<string, number>();
    const abilityCounts = new Map<string, number>();
    const spreadCounts = new Map<string, number>();
    let matchCount = 0;
    let speciesName = speciesId;

    for (const { parsedSlots } of rows) {
      const slots = JSON.parse(parsedSlots) as VgcMetaSlot[];
      for (const slot of slots) {
        if (slot.speciesId !== speciesId) continue;
        if (matchCount === 0) speciesName = slot.speciesName; // grab display name once
        matchCount++;

        for (const move of slot.moves) {
          if (move) moveCounts.set(move, (moveCounts.get(move) ?? 0) + 1);
        }
        if (slot.item)
          itemCounts.set(slot.item, (itemCounts.get(slot.item) ?? 0) + 1);
        if (slot.ability)
          abilityCounts.set(
            slot.ability,
            (abilityCounts.get(slot.ability) ?? 0) + 1,
          );
        if (slot.nature && slot.spread) {
          const key = `${slot.nature}|${formatSpread(slot.spread)}`;
          spreadCounts.set(key, (spreadCounts.get(key) ?? 0) + 1);
        }
      }
    }

    if (matchCount === 0) {
      throw new NotFoundException(
        `Species "${speciesId}" not found in paste data for "${regulationId}".`,
      );
    }

    const toEntries = (map: Map<string, number>, limit = 8) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, count]) => ({
          name,
          percent: (count / matchCount) * 100,
        }));

    return {
      speciesId,
      speciesName,
      pasteCount: matchCount,
      abilities: toEntries(abilityCounts),
      items: toEntries(itemCounts),
      moves: toEntries(moveCounts),
      teraTypes: [], // Not used in Champions format
      spreads: [...spreadCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([key, count]) => {
          const [nature, spread] = key.split('|');
          return { nature, spread, percent: (count / matchCount) * 100 };
        }),
    };
  }

  async getUsageList(regulationId: string): Promise<PokemonUsageDetail[]> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    const dexForFormat = getDexForFormat(regulation?.formatId ?? undefined);

    const teams = await this.vgcPastesRepository.findByRegulation(regulationId);
    if (teams.length === 0) {
      throw new NotFoundException(
        `No Champions data for "${regulationId}". Run refresh first.`,
      );
    }

    const totalTeams = teams.length;
    const parsedTeams = teams.map((t) => ({
      species: (JSON.parse(t.species) as string[]).filter(Boolean),
      items: (JSON.parse(t.items ?? '[]') as string[]).filter(Boolean),
    }));

    // ── Count species occurrences ─────────────────────────────────────────────
    const speciesCounts = new Map<string, number>();
    const speciesDisplay = new Map<string, string>();

    for (const { species } of parsedTeams) {
      for (const name of species) {
        const id = resolveSpeciesId(name, dexForFormat);
        speciesCounts.set(id, (speciesCounts.get(id) ?? 0) + 1);
        if (!speciesDisplay.has(id)) {
          const s = dexForFormat.species.get(name);
          speciesDisplay.set(id, s.exists ? s.name : name);
        }
      }
    }

    // ── Item usage per species (per-slot pairing) ─────────────────────────────
    // Each team row has parallel species[i] + items[i] arrays.
    // Map: speciesId → itemName → count
    const itemMatrix = new Map<string, Map<string, number>>();
    for (const { species, items } of parsedTeams) {
      for (let i = 0; i < species.length; i++) {
        const itemName = items[i];
        if (!itemName) continue;
        const id = resolveSpeciesId(species[i], dexForFormat);
        const row = itemMatrix.get(id) ?? new Map<string, number>();
        row.set(itemName, (row.get(itemName) ?? 0) + 1);
        itemMatrix.set(id, row);
      }
    }

    // ── Teammate co-occurrence ────────────────────────────────────────────────
    const teammateMatrix = new Map<string, Map<string, number>>();
    for (const { species } of parsedTeams) {
      const ids = species.map((name) => resolveSpeciesId(name, dexForFormat));
      for (const id of ids) {
        const row = teammateMatrix.get(id) ?? new Map<string, number>();
        for (const other of ids) {
          if (other !== id) row.set(other, (row.get(other) ?? 0) + 1);
        }
        teammateMatrix.set(id, row);
      }
    }

    const sorted = [...speciesCounts.entries()].sort((a, b) => b[1] - a[1]);

    return sorted.map(([speciesId, count], idx) => {
      const speciesName = speciesDisplay.get(speciesId) ?? speciesId;
      const species = dexForFormat.species.get(speciesName);
      const baseStats = species.exists
        ? species.baseStats
        : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      const types = species.exists
        ? ([...species.types] as string[]).filter(Boolean)
        : [];

      const items = [...(itemMatrix.get(speciesId)?.entries() ?? [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, c]) => ({ name, percent: (c / count) * 100 }));

      const teammates = [...(teammateMatrix.get(speciesId)?.entries() ?? [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([tmId, tmCount]) => ({
          name: speciesDisplay.get(tmId) ?? tmId,
          percent: (tmCount / count) * 100,
        }));

      return {
        speciesId,
        speciesName,
        rank: idx + 1,
        types,
        usagePercent: (count / totalTeams) * 100,
        rawCount: count,
        topItem: items[0]?.name,
        baseStats,
        abilities: [],
        items,
        moves: [],
        teraTypes: [],
        teammates,
        spreads: [],
      };
    });
  }

  async getUsageEntries(regulationId: string): Promise<PokemonUsageEntry[]> {
    const rows = await this.getUsageList(regulationId);
    return rows.map((row) => ({
      speciesId: row.speciesId,
      speciesName: row.speciesName,
      rank: row.rank,
      types: row.types,
      usagePercent: row.usagePercent,
      rawCount: row.rawCount,
      topItem: row.topItem,
      topMove: row.topMove,
      topTeraType: row.topTeraType,
    }));
  }
}
