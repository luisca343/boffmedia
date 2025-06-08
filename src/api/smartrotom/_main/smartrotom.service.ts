import { StarbankService } from '../starbank/starbank.service';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DailyRewardsConfig, loadRewardsConfig } from './_config/daily-rewards.config';
import { smartRotomArceuSpeak } from '@/_db/schema/SmartRotom';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { TaxiStop } from '../_dto/taxi-stop.dto';
import axios from 'axios';

@Injectable()
export class SmartrotomService implements OnModuleInit {
  private rewardsConfig: DailyRewardsConfig;

  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
    private starbankService: StarbankService
  ) {}

  onModuleInit() {
    this.rewardsConfig = loadRewardsConfig();
    console.log(`Loaded daily rewards configuration: ${this.rewardsConfig.totalDays} total days`);
  }

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