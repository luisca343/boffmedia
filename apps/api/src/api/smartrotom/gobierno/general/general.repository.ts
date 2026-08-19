import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoAnuncios,
  GobiernoAnuncio,
} from '@/_db/schema/SmartRotomGobierno';
import { CreateAnuncioDto } from './dto/anuncios.dto';

@Injectable()
export class GeneralRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async listAnuncios(
    page: number,
    limit: number,
    filters: {
      kind?: string;
      town?: string;
      audience?: string;
      pinned?: boolean;
    },
  ) {
    const conditions = [
      filters.kind ? eq(gobiernoAnuncios.kind, filters.kind) : undefined,
      filters.town ? eq(gobiernoAnuncios.town, filters.town) : undefined,
      filters.audience
        ? eq(gobiernoAnuncios.audience, filters.audience)
        : undefined,
      filters.pinned !== undefined
        ? eq(gobiernoAnuncios.pinned, filters.pinned)
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoAnuncios)
        .where(where)
        .orderBy(
          desc(gobiernoAnuncios.pinned),
          desc(gobiernoAnuncios.publishedAt),
        )
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoAnuncios)
        .where(where),
    ]);
    return { items, total: Number(totalRows[0]?.total ?? 0) };
  }

  async findAnuncio(id: number): Promise<GobiernoAnuncio | null> {
    const rows = await this.db
      .select()
      .from(gobiernoAnuncios)
      .where(eq(gobiernoAnuncios.id, id));
    return rows[0] ?? null;
  }

  async createAnuncio(data: CreateAnuncioDto): Promise<GobiernoAnuncio> {
    const result = await this.db.insert(gobiernoAnuncios).values({
      kind: data.kind ?? 'anuncio',
      title: data.title,
      body: data.body,
      town: data.town,
      authorUuid: data.authorUuid,
      pinned: data.pinned ?? false,
      audience: data.audience ?? 'public',
    });
    return (await this.findAnuncio(result[0].insertId)) as GobiernoAnuncio;
  }

  async updateAnuncio(
    id: number,
    data: Partial<{
      kind: string;
      title: string;
      body: string;
      town: string;
      pinned: boolean;
      audience: string;
    }>,
  ): Promise<GobiernoAnuncio | null> {
    if (Object.keys(data).length > 0) {
      await this.db
        .update(gobiernoAnuncios)
        .set(data)
        .where(eq(gobiernoAnuncios.id, id));
    }
    return this.findAnuncio(id);
  }

  async deleteAnuncio(id: number): Promise<boolean> {
    const result = await this.db
      .delete(gobiernoAnuncios)
      .where(eq(gobiernoAnuncios.id, id));
    return result[0].affectedRows > 0;
  }
}
