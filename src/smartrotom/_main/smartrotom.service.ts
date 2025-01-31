import {
  SmartRotomReplay,
  SmartRotomUserAchievement,
  SmartRotomUserReplay,
  smartRotomAchievements,
  smartRotomReplays,
  smartRotomUserAchievements,
  smartRotomUserReplays,
} from '@/_db/schema/SmartRotom';

import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';


import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class SmartrotomService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  

  async getPerformance() {
    const performance = await axios.get(`${process.env.WINGULL_API}/performance`);
    return performance.data;
  }
}
