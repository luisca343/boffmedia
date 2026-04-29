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

  async findBySourceKey(sourceKey: string): Promise<VgcPaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPastes)
      .where(eq(vgcPastes.sourceKey, sourceKey))
      .limit(1);
    return row ?? null;
  }

  /**
   * Insert or update a paste. Returns the internal ID of the upserted row.
   * For pokepast.es pastes, pass pokepasteId so duplicates are merged.
   * For Limitless and other non-pokepaste sources, pass sourceKey (e.g. 'limitless:{id}:{slug}')
   * so re-imports reuse the existing row instead of creating orphaned duplicates.
   * For truly anonymous inline pastes, omit both keys and rely on the MySQL insertId.
   */
  async upsertPaste(data: {
    pokepasteId?: string | null;
    sourceKey?: string | null;
    rawText: string;
    parsedSlots: VgcMetaSlot[];
    author?: string | null;
    title?: string | null;
    formatId?: string | null;
  }): Promise<number> {
    const row = {
      pokepasteId:  data.pokepasteId ?? null,
      sourceKey:    data.sourceKey   ?? null,
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
    if (data.sourceKey) {
      return (await this.findBySourceKey(data.sourceKey))!.id;
    }
    // No dedup key — rely on MySQL insert metadata
    return result[0].insertId;
  }
}
