import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcPasteTeams, VgcPasteTeam } from '@/_db/schema/Vgc';

@Injectable()
export class VgcPastesRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findByRegulation(regulationId: string): Promise<VgcPasteTeam[]> {
    return this.db.select().from(vgcPasteTeams).where(eq(vgcPasteTeams.regulationId, regulationId));
  }

  async upsertTeam(data: {
    id: string;
    pasteId?: number | null;
    pasteUrl?: string | null;
    playerName?: string | null;
    tournament?: string | null;
    dateShared?: string | null;
    rank?: string | null;
    regulationId?: string | null;
    species: string[];
  }): Promise<void> {
    const row = {
      ...data,
      pasteId:  data.pasteId ?? null,
      species:  JSON.stringify(data.species),
      fetchedAt: new Date(),
    };
    await this.db
      .insert(vgcPasteTeams)
      .values(row)
      .onDuplicateKeyUpdate({ set: { pasteId: row.pasteId, species: row.species, fetchedAt: row.fetchedAt } });
  }

  async linkPaste(teamId: string, pasteId: number): Promise<void> {
    await this.db
      .update(vgcPasteTeams)
      .set({ pasteId })
      .where(eq(vgcPasteTeams.id, teamId));
  }

  async deleteByRegulation(regulationId: string): Promise<void> {
    await this.db.delete(vgcPasteTeams).where(eq(vgcPasteTeams.regulationId, regulationId));
  }
}
