import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcPastes, VgcPaste, VgcMetaSlot } from '@/_db/schema/Vgc';

@Injectable()
export class PastesRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findById(id: number): Promise<VgcPaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPastes)
      .where(eq(vgcPastes.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByPokepasteId(pokepasteId: string): Promise<VgcPaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPastes)
      .where(eq(vgcPastes.pokepasteId, pokepasteId))
      .limit(1);
    return row ?? null;
  }

  /**
   * Insert or update a paste. Returns the internal ID of the upserted row.
   * For pokepast.es pastes, pass pokepasteId so duplicates are merged.
   * For inline Limitless pastes, omit pokepasteId.
   */
  async upsertPaste(data: {
    pokepasteId?: string | null;
    rawText: string;
    parsedSlots: VgcMetaSlot[];
    author?: string | null;
    title?: string | null;
    formatId?: string | null;
  }): Promise<number> {
    const row = {
      pokepasteId:  data.pokepasteId ?? null,
      rawText:      data.rawText,
      parsedSlots:  JSON.stringify(data.parsedSlots),
      author:       data.author ?? null,
      title:        data.title ?? null,
      formatId:     data.formatId ?? null,
      fetchedAt:    new Date(),
    };

    const result = await this.db
      .insert(vgcPastes)
      .values(row)
      .onDuplicateKeyUpdate({ set: { rawText: row.rawText, parsedSlots: row.parsedSlots, fetchedAt: row.fetchedAt } });

    if (data.pokepasteId) {
      return (await this.findByPokepasteId(data.pokepasteId))!.id;
    }
    // Inline pastes have no natural unique key, so rely on the actual insert metadata
    // instead of re-querying by rawText, which can collide across unrelated rows.
    return result[0].insertId;
  }
}
