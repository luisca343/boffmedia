import { Inject, Injectable } from '@nestjs/common';
import { rotomArceuSpeak } from '@/_db/schema/SmartRotom';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { DailyRewardsConfig } from '../arcade/entities/daily-rewards.entity';
import { Logger } from 'nestjs-pino';

// LEGACY_DIRECT_DB: pre-dates the repository rule; extract a repository when next touched
@Injectable()
export class SmartrotomService {
  private rewardsConfig: DailyRewardsConfig;

  constructor(
    private readonly logger: Logger,

    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private starbankService: StarbankFacadeService,
  ) {}

  async getArceuspeak() {
    return await this.db.select().from(rotomArceuSpeak).execute();
  }

  async createOrUpdateArceuspeak(name: string, value: string, format: string) {
    return await this.db
      .insert(rotomArceuSpeak)
      .values({ name, value, format })
      .execute();
  }
}
