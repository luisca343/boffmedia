import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Dex } from '@pkmn/sim';
import { LimitlessRepository } from '../repositories/limitless.repository';
import { PastesRepository } from '../repositories/pastes.repository';
import { VgcRegulationsRepository } from '../repositories/regulations.repository';
import {
  PokemonUsageDetail,
  PokemonUsageEntry,
  LimitlessPlayer,
  MetaOverview,
} from '../entities/pokemon-usage.entity';
import { VgcMetaSlot } from '@/_db/schema/Vgc';
import { LIMITLESS_API_BASE } from '../config/smogon.config';
import {
  getDexForFormat,
  resolveMoveType,
  resolveSpeciesId,
  withMoveTypes,
} from '../utils/dex-resolver';

// ─── Limitless API types ─────────────────────────────────────────────────────

interface LimitlessApiDecklist {
  id: string;
  name: string;
  item: string;
  ability: string;
  attacks: string[];
  tera: string | null;
}

interface LimitlessApiStanding {
  player: string;
  name: string;
  placing: number | null; // null for players who dropped before a final placing was assigned
  record: { wins: number; losses: number; ties: number };
  drop: number | null;
  decklist: LimitlessApiDecklist[] | null;
}

interface LimitlessApiDetails {
  id: string;
  game: string;
  name: string;
  date: string;
  format: string;
  players: number;
  decklists: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a canonical species name from a Limitless decklist entry.
 * The `id` field in the Limitless API response already uses the Showdown slug
 * (e.g. "rotom-wash", "ninetales-alola") so we prefer it over the display name.
 */
function resolveSpeciesName(
  entry: LimitlessApiDecklist,
  dex: typeof Dex,
): string {
  const byId = dex.species.get(entry.id);
  if (byId.exists) return byId.name;
  // Fallback: try the display name directly
  const byName = dex.species.get(entry.name);
  if (byName.exists) return byName.name;
  return entry.name;
}

/**
 * Converts a Limitless decklist to minimal Pokémon Showdown paste text.
 * Limitless does not expose EVs, natures or levels, so those fields are omitted.
 */
function decklistToText(
  decklist: LimitlessApiDecklist[],
  dex: typeof Dex,
): string {
  return decklist
    .map((entry) => {
      const name = resolveSpeciesName(entry, dex);
      const lines: string[] = [entry.item ? `${name} @ ${entry.item}` : name];
      if (entry.ability) lines.push(`Ability: ${entry.ability}`);
      lines.push('Level: 50');
      if (entry.tera) lines.push(`Tera Type: ${entry.tera}`);
      for (const move of entry.attacks ?? []) {
        if (move) lines.push(`- ${move}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

function formatRecord(r: {
  wins: number;
  losses: number;
  ties: number;
}): string {
  return `${r.wins}-${r.losses}-${r.ties}`;
}

/** Aggregate VgcMetaSlot[] arrays from all teams into PokemonUsageDetail[] */
function aggregateSlots(
  teamSlots: VgcMetaSlot[][],
  dexForFormat: typeof Dex,
): PokemonUsageDetail[] {
  if (teamSlots.length === 0) return [];

  const totalTeams = teamSlots.length;
  const speciesCounts = new Map<string, number>();
  const speciesNames = new Map<string, string>();
  const moveCounts = new Map<string, Map<string, number>>();
  const itemCounts = new Map<string, Map<string, number>>();
  const abilityCounts = new Map<string, Map<string, number>>();
  const teraCounts = new Map<string, Map<string, number>>();
  const teammateMat = new Map<string, Map<string, number>>();

  for (const slots of teamSlots) {
    const ids = slots.map((s) => s.speciesId);

    for (const slot of slots) {
      const id = slot.speciesId;
      speciesCounts.set(id, (speciesCounts.get(id) ?? 0) + 1);
      if (!speciesNames.has(id)) speciesNames.set(id, slot.speciesName);

      const mc = moveCounts.get(id) ?? new Map<string, number>();
      for (const move of slot.moves ?? []) {
        if (move) mc.set(move, (mc.get(move) ?? 0) + 1);
      }
      moveCounts.set(id, mc);

      if (slot.item) {
        const ic = itemCounts.get(id) ?? new Map<string, number>();
        ic.set(slot.item, (ic.get(slot.item) ?? 0) + 1);
        itemCounts.set(id, ic);
      }
      if (slot.ability) {
        const ac = abilityCounts.get(id) ?? new Map<string, number>();
        ac.set(slot.ability, (ac.get(slot.ability) ?? 0) + 1);
        abilityCounts.set(id, ac);
      }
      if (slot.tera) {
        const tc = teraCounts.get(id) ?? new Map<string, number>();
        tc.set(slot.tera, (tc.get(slot.tera) ?? 0) + 1);
        teraCounts.set(id, tc);
      }

      const tm = teammateMat.get(id) ?? new Map<string, number>();
      for (const other of ids) {
        if (other !== id) tm.set(other, (tm.get(other) ?? 0) + 1);
      }
      teammateMat.set(id, tm);
    }
  }

  const sorted = [...speciesCounts.entries()].sort((a, b) => b[1] - a[1]);

  return sorted.map(([speciesId, count], idx) => {
    const speciesName = speciesNames.get(speciesId) ?? speciesId;
    const species = dexForFormat.species.get(speciesName);
    const baseStats = species.exists
      ? species.baseStats
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const types = species.exists
      ? ([...species.types] as string[]).filter(Boolean)
      : [];

    const toList = (
      map: Map<string, number> | undefined,
      total: number,
      limit = 8,
    ) =>
      [...(map?.entries() ?? [])]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, c]) => ({ name, percent: (c / total) * 100 }));

    const teammates = [...(teammateMat.get(speciesId)?.entries() ?? [])]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tmId, tmCount]) => ({
        name: speciesNames.get(tmId) ?? tmId,
        percent: (tmCount / count) * 100,
      }));

    return {
      speciesId,
      speciesName,
      rank: idx + 1,
      types,
      usagePercent: (count / totalTeams) * 100,
      rawCount: count,
      topItem: toList(itemCounts.get(speciesId), count, 1)[0]?.name,
      topMove: toList(moveCounts.get(speciesId), count, 1)[0]?.name,
      topTeraType: toList(teraCounts.get(speciesId), count, 1)[0]?.name,
      baseStats,
      abilities: toList(abilityCounts.get(speciesId), count),
      items: toList(itemCounts.get(speciesId), count),
      moves: toList(moveCounts.get(speciesId), count).map((move) => ({
        ...move,
        type: resolveMoveType(move.name, dexForFormat),
      })),
      teraTypes: toList(teraCounts.get(speciesId), count),
      teammates,
      spreads: [],
    } satisfies PokemonUsageDetail;
  });
}

function combinations<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];

  function visit(start: number, picked: T[]) {
    if (picked.length === size) {
      result.push(picked);
      return;
    }
    for (let i = start; i <= values.length - (size - picked.length); i++) {
      visit(i + 1, [...picked, values[i]]);
    }
  }

  visit(0, []);
  return result;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class LimitlessService {
  private readonly logger = new Logger(LimitlessService.name);

  constructor(
    private readonly limitlessRepository: LimitlessRepository,
    private readonly pastesRepository: PastesRepository,
    private readonly regulationsRepository: VgcRegulationsRepository,
  ) {}

  private extractLimitlessId(url: string): string {
    const match = url.match(/\/tournament\/([^/\?#]+)/);
    if (!match) throw new Error(`Cannot extract Limitless ID from URL: ${url}`);
    return match[1];
  }

  private convertDecklist(
    decklist: LimitlessApiDecklist[] | null,
    dexForFormat: typeof Dex,
  ): VgcMetaSlot[] {
    if (!decklist?.length) return [];
    return decklist.slice(0, 6).map((entry, i) => {
      const speciesName = resolveSpeciesName(entry, dexForFormat);
      return {
        slotIndex: i as 0 | 1 | 2 | 3 | 4 | 5,
        speciesId: resolveSpeciesId(speciesName, dexForFormat),
        speciesName,
        item: entry.item || undefined,
        ability: entry.ability || undefined,
        moves: entry.attacks ?? [],
        tera: entry.tera || undefined,
      };
    });
  }

  async importTournament(
    url: string,
    regulationId: string,
    maxPlayers?: number,
  ): Promise<{ tournamentId: number }> {
    const limitlessId = this.extractLimitlessId(url);

    const tournamentId = await this.limitlessRepository.upsertTournament({
      limitlessId,
      regulationId,
      status: 'running',
      progress: 0,
      total: 0,
    });

    await this.limitlessRepository.deleteTeamsByTournament(tournamentId);

    // Fire-and-forget background job
    this.runImport(tournamentId, limitlessId, regulationId, maxPlayers).catch(
      async (err) => {
        this.logger.error(
          `Tournament import failed for ${limitlessId}: ${err.message}`,
        );
        await this.limitlessRepository.updateTournamentStatus(tournamentId, {
          status: 'error',
          errorMessage: String(err.message ?? err),
        });
      },
    );

    return { tournamentId };
  }

  private async runImport(
    tournamentId: number,
    limitlessId: string,
    regulationId: string,
    maxPlayers?: number,
  ): Promise<void> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    const dexForFormat = getDexForFormat(regulation?.formatId ?? undefined);

    const detailsRes = await fetch(
      `${LIMITLESS_API_BASE}/tournaments/${limitlessId}/details`,
    );
    if (!detailsRes.ok)
      throw new Error(`Details fetch failed: HTTP ${detailsRes.status}`);
    const details = (await detailsRes.json()) as LimitlessApiDetails;

    const standingsRes = await fetch(
      `${LIMITLESS_API_BASE}/tournaments/${limitlessId}/standings`,
    );
    if (!standingsRes.ok)
      throw new Error(`Standings fetch failed: HTTP ${standingsRes.status}`);
    const standings = (await standingsRes.json()) as LimitlessApiStanding[];

    // The API does not guarantee ordering — sort by placing ascending so that
    // maxPlayers slicing gives the actual top-N finishers.  Players without a
    // final placing (dropped mid-tournament) are pushed to the end.
    standings.sort((a, b) => {
      if (a.placing == null && b.placing == null) return 0;
      if (a.placing == null) return 1;
      if (b.placing == null) return -1;
      return a.placing - b.placing;
    });

    const toProcess = maxPlayers ? standings.slice(0, maxPlayers) : standings;

    await this.limitlessRepository.updateTournamentStatus(tournamentId, {
      name: details.name,
      date: details.date,
      format: details.format,
      playerCount: standings.length,
      total: toProcess.length,
      progress: 0,
      status: 'running',
    });

    this.logger.log(
      `Importing ${limitlessId}: processing ${toProcess.length}/${standings.length} players`,
    );

    for (let i = 0; i < toProcess.length; i++) {
      const standing = toProcess[i];
      const slots = this.convertDecklist(standing.decklist, dexForFormat);

      const pasteId = await this.pastesRepository.upsertPaste({
        sourceKey: `limitless:${limitlessId}:${standing.player}`,
        rawText: decklistToText(standing.decklist ?? [], dexForFormat),
        parsedSlots: slots,
        formatId: regulation?.formatId ?? null,
      });

      await this.limitlessRepository.insertTeam({
        tournamentId,
        playerSlug: standing.player,
        playerName: standing.name,
        placing: standing.placing,
        record: formatRecord(standing.record),
        pasteId,
      });

      await this.limitlessRepository.updateTournamentStatus(tournamentId, {
        progress: i + 1,
      });
    }

    await this.limitlessRepository.updateTournamentStatus(tournamentId, {
      status: 'done',
    });
    this.logger.log(
      `Tournament ${limitlessId} imported: ${toProcess.length} players`,
    );
  }

  async getJobStatus(tournamentId: number) {
    const t = await this.limitlessRepository.findTournamentById(tournamentId);
    if (!t) throw new NotFoundException(`Tournament ${tournamentId} not found`);
    return {
      tournamentId: t.id,
      status: t.status,
      progress: t.progress,
      total: t.total,
      errorMessage: t.errorMessage ?? undefined,
    };
  }

  async listTournaments() {
    return this.limitlessRepository.findAllTournaments();
  }

  async listTournamentsByRegulation(regulationId: string) {
    return this.limitlessRepository.findTournamentsByRegulation(regulationId);
  }

  async getUsageList(tournamentId: number): Promise<PokemonUsageDetail[]> {
    const tournament =
      await this.limitlessRepository.findTournamentById(tournamentId);
    if (!tournament) {
      throw new NotFoundException(`Tournament ${tournamentId} not found`);
    }
    const regulation = await this.regulationsRepository.findById(
      tournament.regulationId ?? '',
    );
    const dexForFormat = getDexForFormat(
      regulation?.formatId ?? tournament.format ?? undefined,
    );

    const teams =
      await this.limitlessRepository.findTeamsWithPastes(tournamentId);
    if (teams.length === 0) {
      throw new NotFoundException(
        `No team data for tournament ${tournamentId}. Import it first.`,
      );
    }
    const teamSlots = teams
      .filter(
        (t): t is typeof t & { parsedSlots: string } => t.parsedSlots !== null,
      )
      .map((t) => JSON.parse(t.parsedSlots) as VgcMetaSlot[]);
    return aggregateSlots(teamSlots, dexForFormat);
  }

  async getUsageEntries(tournamentId: number): Promise<PokemonUsageEntry[]> {
    const rows = await this.getUsageList(tournamentId);
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

  async getCombinedUsage(regulationId: string): Promise<PokemonUsageDetail[]> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    const dexForFormat = getDexForFormat(regulation?.formatId ?? undefined);

    const tournaments =
      await this.limitlessRepository.findTournamentsByRegulation(regulationId);
    if (tournaments.length === 0) {
      throw new NotFoundException(
        `No tournaments found for regulation "${regulationId}".`,
      );
    }
    const done = tournaments.filter((t) => t.status === 'done');
    if (done.length === 0) {
      throw new NotFoundException(
        `No completed tournaments for regulation "${regulationId}".`,
      );
    }
    const allSlots: VgcMetaSlot[][] = [];
    for (const t of done) {
      const teams = await this.limitlessRepository.findTeamsWithPastes(t.id);
      for (const team of teams) {
        if (team.parsedSlots)
          allSlots.push(
            withMoveTypes(JSON.parse(team.parsedSlots) as VgcMetaSlot[], dexForFormat),
          );
      }
    }
    return aggregateSlots(allSlots, dexForFormat);
  }

  async getCombinedUsageEntries(
    regulationId: string,
  ): Promise<PokemonUsageEntry[]> {
    const rows = await this.getCombinedUsage(regulationId);
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

  async getMetaOverview(regulationId: string): Promise<MetaOverview> {
    const regulation = await this.regulationsRepository.findById(regulationId);
    const dexForFormat = getDexForFormat(regulation?.formatId ?? undefined);
    const tournaments = (
      await this.limitlessRepository.findTournamentsByRegulation(regulationId)
    )
      .filter((t) => t.status === 'done')
      .sort((a, b) => {
        const left = a.date ?? a.fetchedAt.toISOString();
        const right = b.date ?? b.fetchedAt.toISOString();
        return right.localeCompare(left) || b.id - a.id;
      });

    if (tournaments.length === 0) {
      return { totalTeams: 0, cores: [], recentTeams: [] };
    }

    const teams: Array<{
      tournamentId: number;
      tournamentName: string | null;
      tournamentDate: string | null;
      playerSlug: string;
      playerName: string | null;
      placing: number | null;
      record: string | null;
      slots: VgcMetaSlot[];
      rawText: string;
    }> = [];

    for (const tournament of tournaments) {
      const rows = await this.limitlessRepository.findTeamsWithPastes(
        tournament.id,
      );
      for (const row of rows) {
        if (!row.parsedSlots) continue;
        const slots = withMoveTypes(
          JSON.parse(row.parsedSlots) as VgcMetaSlot[],
          dexForFormat,
        );
        if (slots.length === 0) continue;
        teams.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentDate: tournament.date,
          playerSlug: row.playerSlug,
          playerName: row.playerName,
          placing: row.placing,
          record: row.record,
          slots,
          rawText: row.rawText ?? '',
        });
      }
    }

    type CoreCount = {
      count: number;
      pokemon: MetaOverview['cores'][number]['pokemon'];
    };
    const coreCounts = new Map<number, Map<string, CoreCount>>();
    for (const team of teams) {
      const pokemon = [
        ...new Map(team.slots.map((slot) => [slot.speciesId, slot])).values(),
      ].sort((a, b) => a.speciesId.localeCompare(b.speciesId));
      for (const size of [2, 3, 4]) {
        const sizeCounts: Map<string, CoreCount> =
          coreCounts.get(size) ?? new Map<string, CoreCount>();
        for (const core of combinations(pokemon, size)) {
          const key = core.map((slot) => slot.speciesId).join('|');
          const existing = sizeCounts.get(key);
          sizeCounts.set(key, {
            count: (existing?.count ?? 0) + 1,
            pokemon: core.map((slot) => ({
              speciesId: slot.speciesId,
              speciesName: slot.speciesName,
            })),
          });
        }
        coreCounts.set(size, sizeCounts);
      }
    }

    const cores = [2, 3, 4].flatMap((size) => {
      const sizeCounts: Map<string, CoreCount> =
        coreCounts.get(size) ?? new Map<string, CoreCount>();
      return [...sizeCounts.values()]
        .sort(
          (a, b) =>
            b.count - a.count ||
            a.pokemon
              .map((p) => p.speciesId)
              .join('|')
              .localeCompare(b.pokemon.map((p) => p.speciesId).join('|')),
        )
        .slice(0, 5)
        .map((core) => ({
          size,
          pokemon: core.pokemon,
          teamCount: core.count,
          usagePercent:
            teams.length > 0 ? (core.count / teams.length) * 100 : 0,
        }));
    });

    const perTournament = new Map<number, number>();
    const recentTeams = [...teams]
      .sort((a, b) => {
        const date = (b.tournamentDate ?? '').localeCompare(
          a.tournamentDate ?? '',
        );
        return date || (a.placing ?? 9999) - (b.placing ?? 9999);
      })
      .filter((team) => {
        const count = perTournament.get(team.tournamentId) ?? 0;
        if (count >= 3) return false;
        perTournament.set(team.tournamentId, count + 1);
        return true;
      })
      .slice(0, 10)
      .map((team) => ({
        id: `${team.tournamentId}:${team.playerSlug}`,
        tournamentId: team.tournamentId,
        tournamentName: team.tournamentName,
        tournamentDate: team.tournamentDate,
        playerName: team.playerName ?? team.playerSlug,
        placing: team.placing ?? 0,
        record: team.record ?? '',
        slots: team.slots,
        rawText: team.rawText,
      }));

    return { totalTeams: teams.length, cores, recentTeams };
  }

  async getPlayerList(tournamentId: number): Promise<LimitlessPlayer[]> {
    const teams =
      await this.limitlessRepository.findTeamsByTournament(tournamentId);
    return teams
      .sort((a, b) => (a.placing ?? 9999) - (b.placing ?? 9999))
      .map((t) => ({
        playerSlug: t.playerSlug,
        playerName: t.playerName ?? t.playerSlug,
        placing: t.placing ?? null,
        record: t.record ?? '',
        drop: null,
        hasTeam: !!t.pasteId,
      }));
  }

  async getPlayerTeam(tournamentId: number, playerSlug: string) {
    const row = await this.limitlessRepository.findTeamWithPaste(
      tournamentId,
      playerSlug,
    );
    if (!row) {
      throw new NotFoundException(
        `Player "${playerSlug}" not found in tournament ${tournamentId}`,
      );
    }
    const tournament = await this.limitlessRepository.findTournamentById(tournamentId);
    const regulation = tournament?.regulationId
      ? await this.regulationsRepository.findById(tournament.regulationId)
      : null;
    const dexForFormat = getDexForFormat(
      regulation?.formatId ?? tournament?.format ?? undefined,
    );
    return {
      playerSlug: row.playerSlug,
      playerName: row.playerName ?? row.playerSlug,
      placing: row.placing ?? null,
      record: row.record ?? '',
      rawText: row.rawText ?? '',
      slots: row.parsedSlots
        ? withMoveTypes(JSON.parse(row.parsedSlots) as VgcMetaSlot[], dexForFormat)
        : [],
    };
  }
}
