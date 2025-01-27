import { Inject, Injectable } from "@nestjs/common"
import { DRIZZLE } from "@/drizzle/drizzle.module"
import type { MySql2Database } from "drizzle-orm/mysql2"
import { smartRotomReplays, smartRotomUserReplays } from "@/_db/schema/SmartRotom";
import { and, desc, eq } from "drizzle-orm";
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

@Injectable()
export class BattleService {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>
  ) {}

  async getRepeticiones(uuid: string) {
    return await this.db
      .select({
        id: smartRotomReplays.id,
        team1: smartRotomReplays.team1,
        team2: smartRotomReplays.team2,
        replay: smartRotomReplays.replay,
        winner: smartRotomReplays.winner,
        side1: smartRotomReplays.side1,
        side2: smartRotomReplays.side2,
        date: smartRotomReplays.createdAt,
      })
      .from(smartRotomReplays)
      .leftJoin(
        smartRotomUserReplays,
        and(
          eq(smartRotomUserReplays.replayId, smartRotomReplays.id),
          eq(smartRotomUserReplays.uuid, uuid),
        ),
      )
      .where(eq(smartRotomUserReplays.uuid, uuid))
      .orderBy(desc(smartRotomReplays.id));
  }

  async getBattleConfig(npcConfigName: string) {
    const dir = path.join(
      __dirname,
      '../../../',
      'public/smartrotom/combates/entrenadores',
    );
    const fileName = path.join(dir, npcConfigName + '/config.json');

    if (!fs.existsSync(fileName)) return { error: 'Config not found' };

    return JSON.parse(await fsPromises.readFile(fileName, 'utf8'));
  }
}

