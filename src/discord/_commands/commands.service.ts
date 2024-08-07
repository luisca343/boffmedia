import { DiscordUser, FicusFrase, discordUsers, ficusFrases } from '@/_db/schema/Ficus';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { User } from 'discord.js';
import { and, eq, or, sql } from 'drizzle-orm';

@Injectable()
export class CommandsService {
    constructor(private db: MySQL2Service) {}
    private testServerGUID = '516237304101339156';
    
    async getFrases(guildID: string, userID?: string, page = 1, maxQuotes = 10) {
        let condition;
        if (guildID !== this.testServerGUID) {
            condition = eq(ficusFrases.serverID, guildID);
        }
        
        const finalCondition = userID ?
        and(condition, eq(ficusFrases.discordId, userID)) :
        condition;
        
        // Count the total number of quotes
        const totalCountQuery = await this.db.getDrizzle().select({
            count: sql`COUNT(*)`
        })
        .from(ficusFrases)
        .where(finalCondition);
        
        const totalCount = totalCountQuery[0].count as number;
        const totalPages = Math.ceil(totalCount / maxQuotes);
        
        // Fetch the quotes with pagination
        const query = await this.db.getDrizzle().select(
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
        .offset((page - 1) * maxQuotes);
        
        return {
            frases: query,
            totalPages: totalPages
        };
    }
    
    async addQuote(guildID: string, user: User, quote: string, comment?: string) {
        // Check if user exists
        const userExists = await this.db.getDrizzle().select()
        .from(discordUsers)
        .where(eq(discordUsers.userId, user.id))
        .limit(1);
        
        if (userExists.length === 0) {
            await this.db.getDrizzle()
            .insert(discordUsers)
            .values({
                userId: user.id,
                username: user.username,
                avatar: user.avatar,
                color: user.hexAccentColor
            } as DiscordUser);
        }
        
        // Insert quote
        await this.db.getDrizzle()
        .insert(ficusFrases)
        .values({
            discordId: user.id,
            serverID: guildID,
            quote: quote,
            comment: comment
        } as FicusFrase);
        
        return { content: 'Frase añadida correctamente', ephemeral: true };
        
    }
    async getQuote(guildID: string, userId: string, quoteNum: number = 0, global = false) {
        console.log('Getting quote', guildID, userId, quoteNum, global);
        if (quoteNum === 0) {
            console.log('Getting random quote');
            // Get a random quote
            const queryBuilder = this.db.getDrizzle().select(
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
            ).from(ficusFrases)
            .leftJoin(discordUsers, 
                eq(ficusFrases.discordId, discordUsers.userId));
                
                if (userId && global) {
                    queryBuilder.where(eq(ficusFrases.discordId, userId));
                } else if (userId && !global) {
                    queryBuilder.where(and(eq(ficusFrases.serverID, guildID), eq(ficusFrases.discordId, userId)));
                } else {
                    queryBuilder.where(eq(ficusFrases.serverID, guildID));
                }
                
                const query = await queryBuilder
                .orderBy(sql`RAND()`)
                .limit(1);
                
                return query[0];
            }
            const queryBuilder = this.db.getDrizzle().select(
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
            );
            
            if (userId && global) {
                queryBuilder.where(eq(ficusFrases.discordId, userId));
            } else if (userId && !global) {
                queryBuilder.where(and(eq(ficusFrases.serverID, guildID), eq(ficusFrases.discordId, userId)));
            } else {
                queryBuilder.where(eq(ficusFrases.serverID, guildID));
            }
            
            const query = await queryBuilder
            .offset(quoteNum - 1)
            .limit(1);
            
            return query[0];
        }
    }
    