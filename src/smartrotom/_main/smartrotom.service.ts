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
import { and, desc, eq, asc, sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import { BattleAchievementDto } from '../_dto/battle-achievement-dto';


import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class SmartrotomService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}
}
