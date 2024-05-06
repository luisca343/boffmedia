import { rotomChatMessageReads, rotomChatMessages, rotomChatUsers, rotomChats } from '@/_db/schema/SmartRotomChat';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { asc, desc, eq, max, min } from 'drizzle-orm';
import { last } from 'rxjs';

@Injectable()
export class ChatappService {
    constructor(
        private db: MySQL2Service,
    ) {}

    async getChats(uuid: string){
        const params = {id:rotomChats.id , name: rotomChats.name, type: rotomChats.type, description: rotomChats.description, 
            image: rotomChats.image, createdAt: rotomChats.createdAt, updatedAt: rotomChats.updatedAt
        }

        const userGroups = await this.db.getDrizzle().selectDistinct(params).from(rotomChatUsers)
            .leftJoin(rotomChats, eq(rotomChatUsers.chatId, rotomChats.id))
            .where(eq(rotomChatUsers.uuid, uuid))
            .union(this.db.getDrizzle().select({...params}).from(rotomChats).where(eq(rotomChats.type, 0)))

        console.log('GRUPOS')
        console.log(userGroups)
        

       const groups = await Promise.all(userGroups.map(async (group: {id: number, name: string, type: number, description: string, 
            image: string, createdAt: Date, updatedAt: Date, lastMessage: {id: number, content: string, createdAt: Date}}) => {
            console.log('GRUPO')
            const lastMessage = (await this.db.getDrizzle()
                .select({id: rotomChatMessages.id, content: rotomChatMessages.content, createdAt: rotomChatMessages.createdAt})
                .from(rotomChatMessages)
                .where(eq(rotomChatMessages.chatId, group.id))
                .orderBy(desc(rotomChatMessages.createdAt))
                .limit(1))[0]

                console.log('LAST MESSAGE')
                console.log(lastMessage)
                group.lastMessage = lastMessage  
                return group
        }))
        
        return groups

        /*
        return this.db.getDrizzle().select({...params, lastMessage: rotomChatMessages.chatId}).from(rotomChats)
            .leftJoin(rotomChatUsers, eq(rotomChats.id, rotomChatUsers.chatId))
            .leftJoin(rotomChatMessages, eq(rotomChats.id, rotomChatMessages.chatId))
            .leftJoin(rotomChatMessageReads, eq(rotomChatMessages.id, rotomChatMessageReads.messageId))
            .where(eq(rotomChatUsers.uuid, uuid))
            .orderBy(desc(rotomChatMessages.createdAt))
            .having(eq(rotomChatMessages.id, max(rotomChatMessages.id)))
            .union(
                this.db.getDrizzle().select({...params, lastMessage: rotomChatMessages.chatId}).from(rotomChats)
                .leftJoin(rotomChatMessages, eq(rotomChats.id, rotomChatMessages.chatId))
                .where(eq(rotomChats.type, 0))
            )*/

            
    }

    async getMessages(chatId: number){
        return this.db.getDrizzle().select({id: rotomChatMessages.id, text: rotomChatMessages.content, date: rotomChatMessages.createdAt, uuid: rotomChatMessages.senderUUID})
            .from(rotomChatMessages)
            .where(eq(rotomChatMessages.chatId, chatId))
            .orderBy(asc(rotomChatMessages.createdAt))
    }

    async createMessage(chatId: number, message: string, uuid: string){
        return this.db.getDrizzle().insert(rotomChatMessages)
            .values({chatId, content: message, senderUUID: uuid}).execute();
    }
    
}
