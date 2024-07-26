import { smartRotomAchievements, smartRotomUserAchievements } from '@/_db/schema/SmartRotom';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { and, desc, eq, asc, sql } from 'drizzle-orm';
import { LogroCombate } from './smartrotom.controller';

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
                data: smartRotomUserAchievements.data
            })
            .from(smartRotomAchievements)
            .leftJoin(
                smartRotomUserAchievements,
                and(
                    eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
                    eq(smartRotomUserAchievements.uuid, uuid)
                )
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
            uuid: smartRotomUserAchievements.uuid
        })
        .from(smartRotomAchievements)
        .leftJoin(
          smartRotomUserAchievements,
          and(
            eq(smartRotomAchievements.id, smartRotomUserAchievements.achievementId),
            eq(smartRotomUserAchievements.uuid, uuid),
        )
        ).where(eq(smartRotomAchievements.id, achievementId))

        return data
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

        if(data.length === 0) return {error: "Achievement not found"}
        const logro = data[0]
        return {completed: logro.completed}
    }

    async addBattleAchievement(battleAchievement: LogroCombate) {
        const hasAchievement = await this.playerHasAchievement(battleAchievement.uuid, battleAchievement.logro)
        if(hasAchievement.error) return hasAchievement
        if(hasAchievement.completed) return {error: "Achievement already completed"}

        const battleData = {
            team: battleAchievement.equipo,
            replay: battleAchievement.replay,
        }

        return this.db.getDrizzle().insert(smartRotomUserAchievements)
        .values(
            {
            // @ts-ignore
            data: JSON.stringify(battleData),
            uuid: battleAchievement.uuid, 
            achievementId: battleAchievement.logro, 
            progress: 1, 
            completed: 1, 
            completedAt: new Date()}).execute()
    }

}
