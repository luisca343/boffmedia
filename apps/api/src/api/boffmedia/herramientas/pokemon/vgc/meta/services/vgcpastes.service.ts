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
import {
  getDexForFormat,
  resolveMoveType,
  resolveSpeciesId,
} from '../utils/dex-resolver';

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

function normalizeHeader(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function findHeaderIndex(
  headers: string[],
  ...expectedNames: string[]
): number {
  const normalizedHeaders = headers.map(normalizeHeader);
  const normalizedNames = expectedNames.map(normalizeHeader);
  return normalizedHeaders.findIndex((header) =>
    normalizedNames.includes(header),
  );
}

function readCell(cols: string[], index: number): string | null {
  if (index < 0) return null;
  const value = cols[index]?.trim();
  return value || null;
}

export interface VgcPastesCsvRow {
  teamId: string;
  /** Present only in the featured-teams sheet; deliberately not persisted. */
  category: string | null;
  teamDescription: string | null;
  playerName: string | null;
  pasteUrl: string | null;
  hasEvs: string | null;
  replicaStatus: string | null;
  dateShared: string | null;
  tournament: string | null;
  rank: string | null;
  sourceUrl: string | null;
  owner: string | null;
  species: string[];
  items: string[];
}

/**
 * Parses either the regular VGCPastes sheet or the featured-teams sheet.
 *
 * The featured sheet inserts Category near the start and calls Replica Status
 * Rental Status. All other positions are therefore resolved from header names
 * (or the numbered Pokemon-slot groups), rather than fixed column offsets.
 */
export function parseVgcPastesCsv(raw: string): VgcPastesCsvRow[] {
  const rows = parseCsv(raw);
  const headerRowIdx = rows.findIndex((cols) => {
    const normalized = cols.map(normalizeHeader);
    return (
      normalized.includes('team id') &&
      normalized.some((header) => header.includes('pokemon text for copypasta'))
    );
  });
  if (headerRowIdx === -1) {
    throw new NotFoundException(
      'Could not find column-header row (needs "Team ID" + "Pokemon Text for Copypasta") in VGCPastes CSV',
    );
  }

  const headers = rows[headerRowIdx];
  const idxTeamId = findHeaderIndex(headers, 'Team ID');
  const idxTeamDescription = findHeaderIndex(headers, 'Team Description');
  const idxFullName = findHeaderIndex(headers, 'Full Name');
  const idxPokepaste = findHeaderIndex(headers, 'Pokepaste');
  const idxHasEvs = findHeaderIndex(headers, 'EVs');
  const idxReplicaStatus = findHeaderIndex(
    headers,
    'Replica Status',
    'Rental Status',
  );
  const idxCategory = findHeaderIndex(headers, 'Category');
  const idxDate = findHeaderIndex(headers, 'Date Shared');
  const idxTournament = findHeaderIndex(headers, 'Tournament / Event');
  const idxRank = findHeaderIndex(headers, 'Rank');
  const idxSourceUrl = findHeaderIndex(headers, 'Link to Source');
  const idxOwner = findHeaderIndex(headers, 'Owner');
  const idxPokeText = headers.findIndex((header) =>
    normalizeHeader(header).includes('pokemon text for copypasta'),
  );

  const requiredColumns = [
    ['Team ID', idxTeamId],
    ['Team Description', idxTeamDescription],
    ['Full Name', idxFullName],
    ['Pokepaste', idxPokepaste],
    ['EVs', idxHasEvs],
    ['Date Shared', idxDate],
    ['Tournament / Event', idxTournament],
    ['Rank', idxRank],
    ['Link to Source', idxSourceUrl],
    ['Owner', idxOwner],
    ['Pokemon Text for Copypasta', idxPokeText],
  ];
  const missingColumn = requiredColumns.find(([, index]) => index === -1);
  if (missingColumn) {
    throw new NotFoundException(
      `VGCPastes CSV is missing required column "${missingColumn[0]}"`,
    );
  }

  // The item cells stay at the same offsets from Pokepaste in both sheet
  // variants; using the anchor column preserves the existing extraction while
  // allowing Category to shift the whole layout by one column.
  const itemCols = [-17, -14, -11, -8, -5, -2].map(
    (offset) => idxPokepaste + offset,
  );

  return rows.slice(headerRowIdx + 1).flatMap((cols) => {
    const teamId = readCell(cols, idxTeamId);
    // Skip blank rows, repeated headers, and anything that cannot be a team ID.
    if (!teamId || teamId.length > 16 || !/^[A-Za-z0-9]+$/.test(teamId)) {
      return [];
    }

    const species = cols
      .slice(idxPokeText, idxPokeText + 6)
      .map((value) => value.trim())
      .filter(Boolean);
    const items = itemCols
      .map((index) => readCell(cols, index))
      .filter((value): value is string => value !== null);

    return [
      {
        teamId,
        category: readCell(cols, idxCategory),
        teamDescription: readCell(cols, idxTeamDescription),
        playerName: readCell(cols, idxFullName),
        pasteUrl: readCell(cols, idxPokepaste),
        hasEvs: readCell(cols, idxHasEvs),
        replicaStatus: readCell(cols, idxReplicaStatus),
        dateShared: readCell(cols, idxDate),
        tournament: readCell(cols, idxTournament),
        rank: readCell(cols, idxRank),
        sourceUrl: readCell(cols, idxSourceUrl),
        owner: readCell(cols, idxOwner),
        species,
        items,
      },
    ];
  });
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

      const parsedRows = parseVgcPastesCsv(await res.text());
      // Featured-sheet Category is source metadata only. The existing table
      // has no category field, and keeping it out avoids a schema migration.
      const seenTeamIds = new Set<string>();

      let count = 0;
      for (const row of parsedRows) {
        if (seenTeamIds.has(row.teamId)) continue;
        await this.vgcPastesRepository.upsertTeam({
          id: row.teamId,
          playerName: row.playerName,
          teamDescription: row.teamDescription,
          pasteUrl: row.pasteUrl,
          hasEvs: row.hasEvs,
          replicaStatus: row.replicaStatus,
          dateShared: row.dateShared,
          tournament: row.tournament,
          rank: row.rank,
          sourceUrl: row.sourceUrl,
          owner: row.owner,
          regulationId,
          species: row.species,
          items: row.items,
        });
        seenTeamIds.add(row.teamId);
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

  // ── Paste fetch ──────────────────────────────────────────────────────────────

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
    const regulation = await this.regulationsRepository.findById(regulationId);
    const dexForFormat = getDexForFormat(regulation?.formatId ?? undefined);
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
      moves: toEntries(moveCounts).map((move) => ({
        ...move,
        type: resolveMoveType(move.name, dexForFormat),
      })),
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
