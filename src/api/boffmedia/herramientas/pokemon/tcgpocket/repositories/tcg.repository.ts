import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { tcgSeries, TcgSeries } from '@/_db/schema/TCG';
import { ITcgRepository } from './interfaces/tcg.repository.interface';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

@Injectable()
export class TcgRepository implements ITcgRepository {
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