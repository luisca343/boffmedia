
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { smartRotomArceuSpeak } from '@/_db/schema/SmartRotom';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { DailyRewardsConfig } from '../arcade/entities/daily-rewards.entity';

@Injectable()
export class SmartrotomService {
  private rewardsConfig: DailyRewardsConfig;

  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private starbankService: StarbankFacadeService
  ) {}


  async processRaceResult(result: any) {
    console.log(result);
  }

  async getArceuspeak() {
    return await this.db.select().from(smartRotomArceuSpeak).execute();
  }

  async createOrUpdateArceuspeak(name: string, value: string, format: string) {
    return await this.db.insert(smartRotomArceuSpeak).values({name, value, format}).execute();
  }
  

}