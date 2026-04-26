import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  vgcLimitlessTournaments,
  vgcLimitlessTeams,
  VgcLimitlessTournament,
  VgcLimitlessTeam,
  VgcMetaSlot,
} from '@/_db/schema/Vgc';

@Injectable()
export class LimitlessRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  // â”€â”€â”€ Tournaments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async findAllTournaments(): Promise<VgcLimitlessTournament[]> {
    return this.db.select().from(vgcLimitlessTournaments);
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
    limitlessId: string;
    name?: string | null;
    date?: string | null;
    format?: string | null;
    playerCount?: number | null;
  }): Promise<number> {
    const now = new Date();
    await this.db
      .insert(vgcLimitlessTournaments)
      .values({ ...data, name: data.name ?? null, date: data.date ?? null, format: data.format ?? null, playerCount: data.playerCount ?? null, fetchedAt: now })
      .onDuplicateKeyUpdate({ set: { name: data.name ?? null, playerCount: data.playerCount ?? null, fetchedAt: now } });
    return (await this.findTournamentByLimitlessId(data.limitlessId))!.id;
  }

  // â”€â”€â”€ Teams â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async findTeamsByTournament(tournamentId: number): Promise<VgcLimitlessTeam[]> {
    return this.db
      .select()
      .from(vgcLimitlessTeams)
      .where(eq(vgcLimitlessTeams.tournamentId, tournamentId));
  }

  async insertTeam(data: {
    tournamentId: number;
    playerSlug: string;
    playerName?: string | null;
    record?: string | null;
    pasteText?: string | null;
    parsedSlots?: VgcMetaSlot[] | null;
  }): Promise<void> {
    await this.db.insert(vgcLimitlessTeams).values({
      tournamentId: data.tournamentId,
      playerSlug:   data.playerSlug,
      playerName:   data.playerName ?? null,
      record:       data.record ?? null,
      pasteText:    data.pasteText ?? null,
      parsedSlots:  data.parsedSlots ? JSON.stringify(data.parsedSlots) : null,
      fetchedAt:    new Date(),
    });
  }
}
