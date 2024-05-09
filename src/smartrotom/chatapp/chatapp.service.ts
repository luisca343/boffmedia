import { rotomChatMessageReads, rotomChatMessages, rotomChatUsers, rotomChats } from '@/_db/schema/SmartRotomChat';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { asc, desc, eq, max, min } from 'drizzle-orm';
import { last } from 'rxjs';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { ResultSetHeader } from 'mysql2';
import { group } from 'console';

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

        const userGroups = await this.db.getDrizzle().selectDistinct(params).from(rotomChats)
            .leftJoin(rotomChatUsers, eq(rotomChatUsers.chatId, rotomChats.id))
            .where(eq(rotomChatUsers.uuid, uuid))
            .union(this.db.getDrizzle().select({...params}).from(rotomChats).where(eq(rotomChats.type, 0)))


       const groups = await Promise.all(userGroups.map(async (group: {id: number, name: string, type: number, description: string, 
            image: string, createdAt: Date, updatedAt: Date, messages: {id: number, content: string, createdAt: Date}[], unread: number}) => {
            const messages = (await this.db.getDrizzle()
                .select({id: rotomChatMessages.id, content: rotomChatMessages.content, createdAt: rotomChatMessages.createdAt, uuid: rotomChatMessages.senderUUID})
                .from(rotomChatMessages)
                .where(eq(rotomChatMessages.chatId, group.id))
                .orderBy(desc(rotomChatMessages.createdAt))
                .limit(50))

                const chatName = group.type == 0 ? group.name : group.name.split('_').filter((name) => name !== uuid)[0] || 'Mensajes guardados'
                const chatImage = group.type == 0 ? `/smartrotom/img/apps/chatapp/${group.image}` : chatName === 'Mensajes guardados' ? `https://crafatar.com/avatars/${uuid}` : `https://crafatar.com/avatars/${chatName}`
                
                group.messages = messages || [{id: 0, content: '', createdAt: null}]
                group.name = chatName
                group.image = chatImage
                group.unread = 0

                return group
        }))


        groups.sort((a, b) => {
            return a.messages[0]?.createdAt.getTime() - b.messages[0]?.createdAt.getTime()
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
        
        const insert = await this.db.getDrizzle().insert(rotomChatMessages)
            .values({chatId, content: message, senderUUID: uuid}) as ResultSetHeader[]
        
        const insertId = insert[0].insertId


        const users = chatId == 1 ? this.socketGateway.users : await this.getChatMembers(chatId)


        let sentToSelf = false
        users.forEach((user: {uuid: string}) => {
            let socket = this.socketGateway.users.find((u: {uuid: string}) => u.uuid === user.uuid)
            console.log(`Trying to send message to ${user.uuid}`)
            if(user.uuid !== uuid || !sentToSelf) {
                console.log(`Sending message to ${user.uuid}`)
                this.socketGateway.server.to(socket.socketId).emit('chat:message', {chatId, id:insertId, content: message, createdAt: new Date(), uuid: uuid})
                if(user.uuid === uuid) sentToSelf = true
            }

        })

        return {id: chatId, text: message, date: new Date(), uuid: uuid}
    }

    async createChat(player: string, users: string[], name: string){
        let chatName = name
        let chatType = 1
        if(users.length == 1){
            const uuids = [player, users[0]]
            uuids.sort()
            chatName = uuids.join('_')
            const exists = await this.db.getDrizzle().select({id: rotomChats.id}).from(rotomChats)
                .where(eq(rotomChats.name, chatName))
    
            if(exists.length > 0){
                return exists[0].id
            } 

            chatType = 2
        }
        

        const newChat = await this.db.getDrizzle().insert(rotomChats)
            .values({type: chatType, name: chatName, description: 'Chat'}) as ResultSetHeader[]

        const insertId = newChat[0].insertId

        await this.db.getDrizzle().insert(rotomChatUsers)
            .values({chatId: insertId, uuid: player})


        if(chatType == 1){
            users.forEach(async (uuid) => {
                await this.db.getDrizzle().insert(rotomChatUsers)
                    .values({chatId: insertId, uuid})
            })
        }

        return insertId
    }
    
}
