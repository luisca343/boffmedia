import { StarbankService } from '../starbank/starbank.service';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { DailyRewardsConfig, loadRewardsConfig } from './_config/daily-rewards.config';
import { DailyRewardItem } from './_config/daily-rewards.config';
import { smartRotomArcadeStreaks, smartRotomArceuSpeak } from '@/_db/schema/SmartRotom';
import { ArcadeStreak, ClaimRewardResponse } from '../_dto/arcade-streak.dto';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
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

  async getPerformance() {
    const performance = await axios.get(`${process.env.WINGULL_API}/performance`);
    return performance.data;
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
  
  async getTaxiStops(): Promise<Record<string, TaxiStop>> {
    try {
      const response = await axios.get(`${process.env.WINGULL_API}/taxi/stops`);
      console.log('Taxi stops:', response.data);
      return response.data as Record<string, TaxiStop>;
    } catch (error) {
      console.error('Error fetching taxi stops:', error);
      throw error;
    }
  }

  async teleportPlayer(id: string, uuid: string): Promise<boolean> {
    try {
      console.log('Teleporting player:', id, uuid);
      const response = await axios.post(`${process.env.WINGULL_API}/taxi/teleport`, {
        id,
        uuid
      });
      return response.data as boolean;
    } catch (error) {
      console.error('Error teleporting player:', error);
      throw error;
    }
  }
}