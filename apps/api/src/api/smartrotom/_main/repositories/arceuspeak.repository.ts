import { Inject, Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomArceuSpeak } from '@/_db/schema/SmartRotom';

@Injectable()
export class ArceuspeakRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async findAll(): Promise<(typeof rotomArceuSpeak.$inferSelect)[]> {
    return this.db.select().from(rotomArceuSpeak).execute();
  }

  async insert(name: string, value: string, format: string): Promise<void> {
    await this.db
      .insert(rotomArceuSpeak)
      .values({ name, value, format })
      .execute();
  }
}
