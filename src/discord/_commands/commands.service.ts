import { discordUsers, ficusFrases } from '@/_db/schema/Ficus';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';

@Injectable()
export class CommandsService {
    constructor(private db: MySQL2Service) {}

    async getFrases(guildID: string, userID?: string, page = 1, maxQuotes = 10) {
        console.log('Getting frases');
        console.log('GuildID:', guildID);
        console.log('UserID:', userID);
        console.log('Page:', page);
        console.log('MaxQuotes:', maxQuotes);
        const hardcodedGuildID = '516237304101339156';

        let condition;
        if (guildID !== hardcodedGuildID) {
            condition = eq(ficusFrases.serverID, guildID);
        }

        const finalCondition = userID ?
            and(condition, eq(ficusFrases.discordId, userID)) :
            condition;

        const query = this.db.getDrizzle().select(
            {
                id: ficusFrases.id,
                quote: ficusFrases.quote,
                comment: ficusFrases.comment,
                discordId: discordUsers.userId,
                discordName: discordUsers.username,
                serverID: ficusFrases.serverID,
                color: discordUsers.color,
                createdAt: ficusFrases.createdAt,
                avatar: discordUsers.avatar
            }
        )
        .from(ficusFrases)
        .leftJoin(discordUsers, 
            eq(ficusFrases.discordId, discordUsers.userId)
        )
        .where(finalCondition)
        .limit(maxQuotes)
        .offset((page - 1) * maxQuotes)

        return await query;
    }
}
