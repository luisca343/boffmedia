import { rotomChatMessageReads, rotomChatMessages, rotomChatUsers, rotomChats } from '@/_db/schema/SmartRotomChat';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { asc, desc, eq, max, min } from 'drizzle-orm';
import { last } from 'rxjs';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { ResultSetHeader } from 'mysql2';

@Injectable()
export class ChatappService {
    constructor(
        private db: MySQL2Service,
        private socketGateway: SocketsGateway
    ) {}

    async getChats(uuid: string){
        const params = {id:rotomChats.id , name: rotomChats.name, type: rotomChats.type, description: rotomChats.description, 
            image: rotomChats.image, createdAt: rotomChats.createdAt, updatedAt: rotomChats.updatedAt
        }

        const userGroups = await this.db.getDrizzle().selectDistinct(params).from(rotomChatUsers)
            .leftJoin(rotomChats, eq(rotomChatUsers.chatId, rotomChats.id))
            .where(eq(rotomChatUsers.uuid, uuid))
            .union(this.db.getDrizzle().select({...params}).from(rotomChats).where(eq(rotomChats.type, 0)))


       const groups = await Promise.all(userGroups.map(async (group: {id: number, name: string, type: number, description: string, 
            image: string, createdAt: Date, updatedAt: Date, lastMessage: {id: number, content: string, createdAt: Date}, unread: number}) => {
            console.log('GRUPO')
            const lastMessage = (await this.db.getDrizzle()
                .select({id: rotomChatMessages.id, content: rotomChatMessages.content, createdAt: rotomChatMessages.createdAt})
                .from(rotomChatMessages)
                .where(eq(rotomChatMessages.chatId, group.id))
                .orderBy(desc(rotomChatMessages.createdAt))
                .limit(1))[0]

                const chatName = group.type == 0 ? group.name : group.name.split('_').filter((name) => name !== uuid)[0] || 'Mensajes guardados'
                const chatImage = group.type == 0 ? `/smartrotom/img/apps/chatapp/${group.image}` : chatName === 'Mensajes guardados' ? `https://crafatar.com/avatars/${uuid}` : `https://crafatar.com/avatars/${chatName}`
                
                group.lastMessage = lastMessage || {id: 0, content: '', createdAt: null}
                group.name = chatName
                group.image = chatImage
                group.unread = 0

                console.log('GRUPO')
                console.log(group)
                return group
        }))


        groups.sort((a, b) => {
            return a.lastMessage.createdAt > b.lastMessage.createdAt ? -1 : 1
        })
        
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

    async getChatMembers(chatId: number){
        return this.db.getDrizzle().select({uuid: rotomChatUsers.uuid}).from(rotomChatUsers)
            .where(eq(rotomChatUsers.chatId, chatId))
    }


    async createMessage(chatId: number, message: string, uuid: string){
        console.log('CREATING MESSAGE')
        
        await this.db.getDrizzle().insert(rotomChatMessages)
            .values({chatId, content: message, senderUUID: uuid}).execute();


        const users = chatId == 1 ? this.socketGateway.users : await this.getChatMembers(chatId)


        let sentToSelf = false
        users.forEach((user: {uuid: string}) => {
            let socket = this.socketGateway.users.find((u: {uuid: string}) => u.uuid === user.uuid)
            console.log(`Trying to send message to ${user.uuid}`)
            if(user.uuid !== uuid || !sentToSelf) {
                console.log(`Sending message to ${user.uuid}`)
                this.socketGateway.server.to(socket.socketId).emit('chat:message', {id: chatId, text: message, date: new Date(), uuid: uuid})
                if(user.uuid === uuid) sentToSelf = true
            }

        })

        return {id: chatId, text: message, date: new Date(), uuid: uuid}
    }

    async createChat(uuid1: string, uuid2: string){
        const uuids = [uuid1, uuid2]
        uuids.sort()
        const chatName = uuids.join('_')
        const exists = await this.db.getDrizzle().select({id: rotomChats.id}).from(rotomChats)
            .where(eq(rotomChats.name, chatName))

        if(exists.length > 0){
            return exists[0].id
        } 

        const newChat = await this.db.getDrizzle().insert(rotomChats)
            .values({type: 1, name: chatName, description: 'Chat'}) as ResultSetHeader[]

        const insertId = newChat[0].insertId

        await this.db.getDrizzle().insert(rotomChatUsers)
            .values({chatId: insertId, uuid: uuid1})

        await this.db.getDrizzle().insert(rotomChatUsers)
            .values({chatId: insertId, uuid: uuid2})


        return insertId
    }
    
}
