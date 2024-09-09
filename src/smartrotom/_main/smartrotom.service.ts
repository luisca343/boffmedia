import { SmartRotomReplay, SmartRotomUserAchievement, SmartRotomUserReplay, smartRotomAchievements, smartRotomReplays, smartRotomUserAchievements, smartRotomUserReplays } from '@/_db/schema/SmartRotom';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { and, desc, eq, asc, sql } from 'drizzle-orm';
import { LogroCombate } from './smartrotom.controller';
import { repl } from '@nestjs/core';
import { date } from 'drizzle-orm/mysql-core';

import * as fs from 'fs';
import *  as  path from 'path';
import { promises as fsPromises } from 'fs';


@Injectable()
export class SmartrotomService {
    constructor(
      private db: MySQL2Service
    ) {}


    async getStats(uuid: string) {
        return axios.post(`${process.env.WINGULL_API}/stats`, {uuid}).then((res)=>res.data)
    }
    getTeam(uuid: string) {
        return axios.post(`${process.env.WINGULL_API}/equipo`, {uuid}).then((res)=>res.data)
    }

    async getAchievements(uuid: string) {
        return await this.db.getDrizzle()
            .select({
                id: smartRotomAchievements.id,
                name: smartRotomAchievements.name,
                description: smartRotomAchievements.description,
                icon: smartRotomAchievements.icon,
                category: smartRotomAchievements.category,
                subcategory: smartRotomAchievements.subcatecory,
                progress: smartRotomUserAchievements.progress,
                completed: smartRotomUserAchievements.completed,
                completedAt: smartRotomUserAchievements.completedAt,
                uuid: smartRotomUserAchievements.uuid,
                team: smartRotomReplays.team1,
                replay: smartRotomReplays.replay
            })
            .from(smartRotomAchievements)
            .leftJoin(
                smartRotomUserAchievements,
                and(
                    eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
                    eq(smartRotomUserAchievements.uuid, uuid)
                )
            ).leftJoin(
                smartRotomUserReplays,
                and(
                    eq(smartRotomUserReplays.uuid, uuid),
                    eq(smartRotomUserReplays.replayId, smartRotomUserAchievements.dataId)
                )
            ).leftJoin(
                smartRotomReplays,
                eq(smartRotomReplays.id, smartRotomUserReplays.replayId)
            )
            .orderBy(
                asc(
                    sql`CASE WHEN ${smartRotomUserAchievements.completedAt} IS NULL THEN 1 ELSE 0 END`
                ),
                asc(smartRotomUserAchievements.completedAt),
                asc(smartRotomAchievements.order),
                asc(smartRotomAchievements.category),
                asc(smartRotomAchievements.subcatecory),
                asc(smartRotomAchievements.name)
            );
    }

    async getAchievementForPlayer(uuid: string, achievementId: string) {
        const data = await this.db.getDrizzle()
        .select({id: smartRotomAchievements.id,
            name: smartRotomAchievements.name,
            description: smartRotomAchievements.description,
            icon: smartRotomAchievements.icon,
            category: smartRotomAchievements.category,
            subcategory: smartRotomAchievements.subcatecory,
            progress: smartRotomUserAchievements.progress,
            completed: smartRotomUserAchievements.completed,
            completedAt: smartRotomUserAchievements.completedAt,
            uuid: smartRotomUserAchievements.uuid,
            replay: smartRotomReplays.replay
        })
        .from(smartRotomAchievements)
        .leftJoin(
          smartRotomUserAchievements,
          and(
            eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
            eq(smartRotomUserAchievements.uuid, uuid),
        )
        ).leftJoin(
            smartRotomUserReplays,
            and(
                eq(smartRotomUserReplays.uuid, uuid),
                eq(smartRotomUserReplays.replayId, smartRotomUserAchievements.dataId)
            )
        ).leftJoin(
            smartRotomReplays,
            eq(smartRotomReplays.id, smartRotomUserReplays.replayId)
        )
        .where(eq(smartRotomAchievements.id, achievementId))

        
        console.log('data', data)

        return data[0]
    }

    async playerHasAchievement(uuid: string, achievementId: string) {
        const data = await this.db.getDrizzle()
        .select({id: smartRotomAchievements.id,
            completed: smartRotomUserAchievements.completed,
        })
        .from(smartRotomAchievements)
        .leftJoin(
          smartRotomUserAchievements,
          and(
            eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
            eq(smartRotomUserAchievements.uuid, uuid),
        )
        ).where(eq(smartRotomAchievements.id, achievementId))

        console.log('data', data)

        if(data.length === 0) return {error: "Achievement not found"}
        const logro = data[0]
        return {completed: logro.completed}
    }

    async addBattleAchievement(battleAchievement: LogroCombate) {
        console.log('battleAchievement', battleAchievement)
        const hasAchievement = await this.playerHasAchievement(battleAchievement.uuid, battleAchievement.logro)

        const insert = await this.db.getDrizzle().insert(smartRotomReplays).values({
            side1: battleAchievement.name1,
            side2: battleAchievement.name2,
            team1: JSON.stringify(battleAchievement.team1),
            team2: JSON.stringify(battleAchievement.team2),
            replay: battleAchievement.replay,
            winner: battleAchievement.victoria ? 1 : 2
        } as SmartRotomReplay).execute()
        
        const insertId = insert[0].insertId

        const insertRelation = await this.db.getDrizzle().insert(smartRotomUserReplays).values({
            replayId: insertId,
            uuid: battleAchievement.uuid,
            side: 1
        } as SmartRotomUserReplay).execute()

        const relationId = insertRelation[0].insertId
        

        if(hasAchievement.error) return hasAchievement
        if(hasAchievement.completed) return {error: "Achievement already completed"}

        
  

        return this.db.getDrizzle().insert(smartRotomUserAchievements)
        .values(
            {
            dataId: insertId,
            uuid: battleAchievement.uuid, 
            achievementId: battleAchievement.logro, 
            progress: 1, 
            completed: 1, 
            completedAt: new Date()
        } as SmartRotomUserAchievement).execute()
    } 

    async getRepeticiones(uuid: string) {
        return await this.db.getDrizzle()
            .select({id: smartRotomReplays.id, team1: smartRotomReplays.team1, team2: smartRotomReplays.team2, 
                replay: smartRotomReplays.replay, winner: smartRotomReplays.winner, side1: 
                smartRotomReplays.side1, side2: smartRotomReplays.side2,
                date: smartRotomReplays.createdAt,
            })
            .from(smartRotomReplays)
            .leftJoin(
                smartRotomUserReplays,
                and(
                    eq(smartRotomUserReplays.replayId, smartRotomReplays.id),
                    eq(smartRotomUserReplays.uuid, uuid)
                )
            )
            .where(eq(smartRotomUserReplays.uuid, uuid))
            .orderBy(desc(smartRotomReplays.id))
    }

    async getBattleConfig(npcConfigName: string) {
        const dir = path.join(__dirname, '../../../', 'public/smartrotom/combates/entrenadores');
        const fileName = path.join(dir, npcConfigName + '/config.json');
        console.log('fileName', fileName)

        if(!fs.existsSync(fileName)) return {error: 'Config not found'}


        return JSON.parse(await fsPromises.readFile(fileName, 'utf8'))

        
    }

}
