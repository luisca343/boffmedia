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

  async upsertTeam(data: Omit<VgcPasteTeam, 'fetchedAt'> & { species: string[] }): Promise<void> {
    const row = { ...data, species: JSON.stringify(data.species), fetchedAt: new Date() };
    await this.db
      .insert(vgcPasteTeams)
      .values(row)
      .onDuplicateKeyUpdate({ set: { species: row.species, fetchedAt: row.fetchedAt } });
  }

  async deleteByRegulation(regulationId: string): Promise<void> {
    await this.db.delete(vgcPasteTeams).where(eq(vgcPasteTeams.regulationId, regulationId));
  }
}
