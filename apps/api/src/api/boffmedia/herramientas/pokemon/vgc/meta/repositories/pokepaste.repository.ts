import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcPasteDetails, VgcPasteDetail, VgcMetaSlot } from '@/_db/schema/Vgc';

@Injectable()
export class PokepasteRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findByPasteId(pasteId: string): Promise<VgcPasteDetail | null> {
    const [row] = await this.db
      .select()
      .from(vgcPasteDetails)
      .where(eq(vgcPasteDetails.pasteId, pasteId))
      .limit(1);
    return row ?? null;
  }

  async upsertDetail(data: {
    pasteId: string;
    author?: string | null;
    title?: string | null;
    formatId?: string | null;
    parsedSlots: VgcMetaSlot[];
  }): Promise<void> {
    const row = {
      pasteId:     data.pasteId,
      author:      data.author ?? null,
      title:       data.title ?? null,
      formatId:    data.formatId ?? null,
      parsedSlots: JSON.stringify(data.parsedSlots),
      fetchedAt:   new Date(),
    };
    await this.db
      .insert(vgcPasteDetails)
      .values(row)
      .onDuplicateKeyUpdate({ set: { parsedSlots: row.parsedSlots, fetchedAt: row.fetchedAt } });
  }
}
