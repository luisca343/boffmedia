import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { vgcPokepastes, VgcPokepaste, VgcMetaSlot } from '@/_db/schema/Vgc';

@Injectable()
export class PastesRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findById(id: number): Promise<VgcPokepaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPokepastes)
      .where(eq(vgcPokepastes.id, id))
      .limit(1);
    return row ?? null;
  }

  async findByPokepasteId(pokepasteId: string): Promise<VgcPokepaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPokepastes)
      .where(eq(vgcPokepastes.pokepasteId, pokepasteId))
      .limit(1);
    return row ?? null;
  }

  async findBySourceKey(sourceKey: string): Promise<VgcPokepaste | null> {
    const [row] = await this.db
      .select()
      .from(vgcPokepastes)
      .where(eq(vgcPokepastes.sourceKey, sourceKey))
      .limit(1);
    return row ?? null;
  }

  async findByFormatId(
    formatId: string,
    limit = 500,
  ): Promise<
    Pick<
      VgcPokepaste,
      'id' | 'parsedSlots' | 'rawText' | 'author' | 'title' | 'replicaCode'
    >[]
  > {
    return this.db
      .select({
        id: vgcPokepastes.id,
        parsedSlots: vgcPokepastes.parsedSlots,
        rawText: vgcPokepastes.rawText,
        author: vgcPokepastes.author,
        title: vgcPokepastes.title,
        replicaCode: vgcPokepastes.replicaCode,
      })
      .from(vgcPokepastes)
      .where(eq(vgcPokepastes.formatId, formatId))
      .limit(limit);
  }

  /** Update author/title/sourceKey/replicaCode without touching rawText or parsedSlots. */
  async updateMeta(
    id: number,
    meta: {
      author?: string | null;
      title?: string | null;
      sourceKey?: string | null;
      replicaCode?: string | null;
    },
  ): Promise<void> {
    const set: Partial<typeof vgcPokepastes.$inferInsert> = {};
    if (meta.author != null) set.author = meta.author;
    if (meta.title != null) set.title = meta.title;
    if (meta.sourceKey != null) set.sourceKey = meta.sourceKey;
    if (meta.replicaCode != null) set.replicaCode = meta.replicaCode;
    if (Object.keys(set).length === 0) return;
    await this.db
      .update(vgcPokepastes)
      .set(set)
      .where(eq(vgcPokepastes.id, id));
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
    replicaCode?: string | null;
  }): Promise<number> {
    const row = {
      pokepasteId: data.pokepasteId ?? null,
      sourceKey: data.sourceKey ?? null,
      rawText: data.rawText,
      parsedSlots: JSON.stringify(data.parsedSlots),
      author: data.author ?? null,
      title: data.title ?? null,
      formatId: data.formatId ?? null,
      replicaCode: data.replicaCode ?? null,
      fetchedAt: new Date(),
    };

    const result = await this.db
      .insert(vgcPokepastes)
      .values(row)
      .onDuplicateKeyUpdate({
        set: {
          rawText: row.rawText,
          parsedSlots: row.parsedSlots,
          fetchedAt: row.fetchedAt,
          // Always overwrite metadata from the importing source so stale values
          // (e.g. pokepast.es scrape artifacts like replica codes in the title) get corrected.
          ...(row.author != null && { author: row.author }),
          ...(row.title != null && { title: row.title }),
          ...(row.sourceKey != null && { sourceKey: row.sourceKey }),
          ...(row.replicaCode != null && { replicaCode: row.replicaCode }),
        },
      });

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
