import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import {eq} from 'drizzle-orm';
import { tcgSeries, TcgSeries } from '@/_db/schema/TCG';
import { tcgCards } from '@/_db/schema/TCG';
import { tcgSets } from '@/_db/schema/Tcg';
import { ITcgRepository } from './interfaces/tcg.repository.interface';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

@Injectable()
export class TcgRepository implements ITcgRepository {
  async getSetsBySeriesId(seriesId: string): Promise<any[]> {
    return this.db.select().from(tcgSets).where(eq(tcgSets.series_id, seriesId));
  }
  async getCardsBySetId(setId: string): Promise<any[]> {
    return this.db.select().from(tcgCards).where(eq(tcgCards.set_id, setId));
  }
  constructor(@Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>) {}

  async insertSeries(series: TcgSeries[]): Promise<void> {
    const existing = await this.db.select({ id: tcgSeries.id }).from(tcgSeries);
    const existingIds = new Set(existing.map(s => s.id));

    const newSeries = series.filter(s => !existingIds.has(s.id));
    if (newSeries.length > 0) {
      await this.db.insert(tcgSeries).values(newSeries);
    }
  }

  async findAll(): Promise<TcgSeries[]> {
    return this.db.select().from(tcgSeries);
  }
}