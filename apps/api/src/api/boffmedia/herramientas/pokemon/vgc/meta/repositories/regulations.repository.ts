import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcRegulations, VgcRegulation } from '@/_db/schema/Vgc';

@Injectable()
export class VgcRegulationsRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findAll(): Promise<VgcRegulation[]> {
    return this.db.select().from(vgcRegulations);
  }

  async findActive(): Promise<VgcRegulation[]> {
    return this.db
      .select()
      .from(vgcRegulations)
      .where(eq(vgcRegulations.active, 1));
  }

  async findById(id: string): Promise<VgcRegulation | null> {
    const [row] = await this.db
      .select()
      .from(vgcRegulations)
      .where(eq(vgcRegulations.id, id))
      .limit(1);
    return row ?? null;
  }

  async upsert(data: {
    id:           string;
    formatId:     string;
    name:         string;
    gameType?:    string;
    vgcPastesGid?: string | null;
    active?:      number;
  }): Promise<void> {
    const now = new Date();
    await this.db
      .insert(vgcRegulations)
      .values({
        id:           data.id,
        formatId:     data.formatId,
        name:         data.name,
        gameType:     data.gameType    ?? 'doubles',
        vgcPastesGid: data.vgcPastesGid ?? null,
        active:       data.active      ?? 1,
        createdAt:    now,
      })
      .onDuplicateKeyUpdate({
        set: {
          formatId:     data.formatId,
          name:         data.name,
          gameType:     data.gameType    ?? 'doubles',
          vgcPastesGid: data.vgcPastesGid ?? null,
          active:       data.active      ?? 1,
        },
      });
  }
}
