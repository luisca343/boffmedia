import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcLimitlessTournaments,
  vgcLimitlessTeams,
  vgcPastes,
  VgcLimitlessTournament,
  VgcLimitlessTeam,
} from '@/_db/schema/Vgc';

@Injectable()
export class LimitlessRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  // --- Tournaments -----------------------------------------------------------

  async findAllTournaments(): Promise<VgcLimitlessTournament[]> {
    return this.db.select().from(vgcLimitlessTournaments);
  }

  async findTournamentsByRegulation(regulationId: string): Promise<VgcLimitlessTournament[]> {
    return this.db
      .select()
      .from(vgcLimitlessTournaments)
      .where(eq(vgcLimitlessTournaments.regulationId, regulationId));
  }

  async findTournamentById(id: number): Promise<VgcLimitlessTournament | null> {
    const [row] = await this.db
      .select()
      .from(vgcLimitlessTournaments)
      .where(eq(vgcLimitlessTournaments.id, id))
      .limit(1);
    return row ?? null;
  }

  async findTournamentByLimitlessId(limitlessId: string): Promise<VgcLimitlessTournament | null> {
    const [row] = await this.db
      .select()
      .from(vgcLimitlessTournaments)
      .where(eq(vgcLimitlessTournaments.limitlessId, limitlessId))
      .limit(1);
    return row ?? null;
  }

  async upsertTournament(data: {
    limitlessId:  string;
    regulationId: string;
    name?:        string | null;
    date?:        string | null;
    format?:      string | null;
    playerCount?: number | null;
    status?:      string;
    progress?:    number;
    total?:       number;
  }): Promise<number> {
    const now = new Date();
    await this.db
      .insert(vgcLimitlessTournaments)
      .values({
        limitlessId:  data.limitlessId,
        regulationId: data.regulationId,
        name:         data.name         ?? null,
        date:         data.date         ?? null,
        format:       data.format       ?? null,
        playerCount:  data.playerCount  ?? null,
        status:       data.status       ?? 'pending',
        progress:     data.progress     ?? 0,
        total:        data.total        ?? 0,
        fetchedAt:    now,
      })
      .onDuplicateKeyUpdate({
        set: {
          regulationId: data.regulationId,
          status:       data.status   ?? 'pending',
          progress:     data.progress ?? 0,
          total:        data.total    ?? 0,
          fetchedAt:    now,
        },
      });
    return (await this.findTournamentByLimitlessId(data.limitlessId))!.id;
  }

  async updateTournamentStatus(
    id: number,
    patch: {
      name?:        string | null;
      date?:        string | null;
      format?:      string | null;
      playerCount?: number | null;
      regulationId?: string;
      status?:      string;
      progress?:    number;
      total?:       number;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    const set: Partial<typeof vgcLimitlessTournaments.$inferInsert> = {};
    if (patch.name         !== undefined) set.name         = patch.name;
    if (patch.date         !== undefined) set.date         = patch.date;
    if (patch.format       !== undefined) set.format       = patch.format;
    if (patch.playerCount  !== undefined) set.playerCount  = patch.playerCount;
    if (patch.regulationId !== undefined) set.regulationId = patch.regulationId;
    if (patch.status       !== undefined) set.status       = patch.status;
    if (patch.progress     !== undefined) set.progress     = patch.progress;
    if (patch.total        !== undefined) set.total        = patch.total;
    if (patch.errorMessage !== undefined) set.errorMessage = patch.errorMessage;
    if (Object.keys(set).length === 0)   return;

    await this.db
      .update(vgcLimitlessTournaments)
      .set(set)
      .where(eq(vgcLimitlessTournaments.id, id));
  }

  // --- Teams ----------------------------------------------------------------

  async findTeamsByTournament(tournamentId: number): Promise<VgcLimitlessTeam[]> {
    return this.db
      .select()
      .from(vgcLimitlessTeams)
      .where(eq(vgcLimitlessTeams.tournamentId, tournamentId));
  }

  async findTeamsWithPastes(
    tournamentId: number,
  ): Promise<Array<VgcLimitlessTeam & { parsedSlots: string | null }>> {
    const rows = await this.db
      .select({
        id:           vgcLimitlessTeams.id,
        tournamentId: vgcLimitlessTeams.tournamentId,
        playerSlug:   vgcLimitlessTeams.playerSlug,
        playerName:   vgcLimitlessTeams.playerName,
        placing:      vgcLimitlessTeams.placing,
        record:       vgcLimitlessTeams.record,
        pasteId:      vgcLimitlessTeams.pasteId,
        fetchedAt:    vgcLimitlessTeams.fetchedAt,
        parsedSlots:  vgcPastes.parsedSlots,
      })
      .from(vgcLimitlessTeams)
      .leftJoin(vgcPastes, eq(vgcLimitlessTeams.pasteId, vgcPastes.id))
      .where(eq(vgcLimitlessTeams.tournamentId, tournamentId));
    return rows as Array<VgcLimitlessTeam & { parsedSlots: string | null }>;
  }

  async findTeamWithPaste(
    tournamentId: number,
    playerSlug:   string,
  ): Promise<(VgcLimitlessTeam & { parsedSlots: string | null; rawText: string | null }) | null> {
    const [row] = await this.db
      .select({
        id:           vgcLimitlessTeams.id,
        tournamentId: vgcLimitlessTeams.tournamentId,
        playerSlug:   vgcLimitlessTeams.playerSlug,
        playerName:   vgcLimitlessTeams.playerName,
        placing:      vgcLimitlessTeams.placing,
        record:       vgcLimitlessTeams.record,
        pasteId:      vgcLimitlessTeams.pasteId,
        fetchedAt:    vgcLimitlessTeams.fetchedAt,
        parsedSlots:  vgcPastes.parsedSlots,
        rawText:      vgcPastes.rawText,
      })
      .from(vgcLimitlessTeams)
      .leftJoin(vgcPastes, eq(vgcLimitlessTeams.pasteId, vgcPastes.id))
      .where(
        and(
          eq(vgcLimitlessTeams.tournamentId, tournamentId),
          eq(vgcLimitlessTeams.playerSlug, playerSlug),
        ),
      )
      .limit(1);
    return (row as (VgcLimitlessTeam & { parsedSlots: string | null; rawText: string | null }) | undefined) ?? null;
  }

  async insertTeam(data: {
    tournamentId: number;
    playerSlug:   string;
    playerName?:  string | null;
    placing?:     number | null;
    record?:      string | null;
    pasteId?:     number | null;
  }): Promise<void> {
    await this.db.insert(vgcLimitlessTeams).values({
      tournamentId: data.tournamentId,
      playerSlug:   data.playerSlug,
      playerName:   data.playerName ?? null,
      placing:      data.placing    ?? null,
      record:       data.record     ?? null,
      pasteId:      data.pasteId    ?? null,
      fetchedAt:    new Date(),
    });
  }

  async deleteTeamsByTournament(tournamentId: number): Promise<void> {
    await this.db
      .delete(vgcLimitlessTeams)
      .where(eq(vgcLimitlessTeams.tournamentId, tournamentId));
  }

  async linkPaste(teamId: number, pasteId: number): Promise<void> {
    await this.db
      .update(vgcLimitlessTeams)
      .set({ pasteId })
      .where(eq(vgcLimitlessTeams.id, teamId));
  }
}
