import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { policiaPlotHistory, PoliciaPlotHistory, NewPoliciaPlotHistory } from '@/_db/schema/PoliciaPlotHistory';

@Injectable()
export class PoliciaPlotHistoryRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findByPlot(town: string, plotNumber: number): Promise<PoliciaPlotHistory[]> {
    return this.db
      .select()
      .from(policiaPlotHistory)
      .where(and(eq(policiaPlotHistory.town, town), eq(policiaPlotHistory.plotNumber, plotNumber)));
  }

  async record(entry: NewPoliciaPlotHistory): Promise<void> {
    await this.db.insert(policiaPlotHistory).values(entry);
  }
}
