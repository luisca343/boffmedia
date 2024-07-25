import { smartRotomAchievements, smartRotomUserAchievements } from '@/_db/schema/SmartRotom';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { and, desc, eq, asc } from 'drizzle-orm';

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
            eq(smartRotomUserAchievements.uuid, uuid)
        )
        ).orderBy(desc(smartRotomUserAchievements.completedAt), asc(smartRotomAchievements.order), asc(smartRotomAchievements.category), 
        asc(smartRotomAchievements.subcatecory), asc(smartRotomAchievements.name))
    }

}
