import { RotomChatMessage, rotomChatMessageReads, rotomChatMessages, rotomChatUsers, rotomChats } from '@/_db/schema/SmartRotomChat';
import { DRIZZLE } from '@/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { asc, desc, eq, max, min } from 'drizzle-orm';
import { SocketsGateway } from '../../sockets/sockets.gateway';
import { smartrotomUsers } from '@/_db/schema/SmartRotom';
import { ResultSetHeader } from 'mysql2';

@Injectable()
export class ChatappService {
    constructor(
        @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
        @Inject(forwardRef(() => SocketsGateway))
        private socketGateway: SocketsGateway
    ) {}

    async getChats(uuid: string): Promise<Group[]>{
        const params = {id:rotomChats.id , name: rotomChats.name, type: rotomChats.type, description: rotomChats.description, 
            image: rotomChats.image, createdAt: rotomChats.createdAt, updatedAt: rotomChats.updatedAt
        }

        const userGroups = await this.db.selectDistinct(params).from(rotomChats)
            .leftJoin(rotomChatUsers, eq(rotomChatUsers.chatId, rotomChats.id))
            .where(eq(rotomChatUsers.uuid, uuid))
            .union(this.db.select({...params}).from(rotomChats).where(eq(rotomChats.type, 0)))


       const groups = await Promise.all(userGroups.map(async (group: {id: number, name: string, type: number, description: string, 
            image: string, createdAt: Date, updatedAt: Date, messages: {id: number, content: string, createdAt: Date}[], unread: number, members: {uuid: string}[]}) => {
            const messages = (await this.db
                .select({id: rotomChatMessages.id, content: rotomChatMessages.content, createdAt: rotomChatMessages.createdAt, uuid: rotomChatMessages.senderUUID, type: rotomChatMessages.type})
                .from(rotomChatMessages)
                .where(eq(rotomChatMessages.chatId, group.id))
                .orderBy(desc(rotomChatMessages.createdAt))
                .limit(50))

                const members = await this.getChatMembers(group.id)

                const otherPlayerUUID = group.name.split('_').filter((name) => name !== uuid)[0]
                const otherPlayerName = (await this.db.select({name: smartrotomUsers.username}).from(smartrotomUsers).where(eq(smartrotomUsers.uuid, otherPlayerUUID)))[0]?.name || 'Mensajes guardados'
                
                const chatName = group.type == 0 || group.type == 3 ? group.name : otherPlayerName || 'Mensajes guardados'
                const imageName = group.image || 'default.webp'
                const chatImage = group.type == 0 || group.type == 3  ? `/smartrotom/img/apps/chatapp/${imageName}` : chatName === 'Mensajes guardados' ? `https://crafatar.com/avatars/${uuid}` : `https://crafatar.com/avatars/${otherPlayerUUID}`
                
                group.messages = messages || [{id: 0, content: '', createdAt: null}]
                group.name = chatName
                group.image = chatImage
                group.unread = 0
                group.members = members

                return group
        })) as Group[]


        groups.sort((a, b) => {
            const aDate = a.messages[0]?.createdAt || new Date()
            const bDate = b.messages[0]?.createdAt || new Date()

            return bDate.getTime() - aDate.getTime()
        })
        
        return groups

        /*
        return this.db.select({...params, lastMessage: rotomChatMessages.chatId}).from(rotomChats)
            .leftJoin(rotomChatUsers, eq(rotomChats.id, rotomChatUsers.chatId))
            .leftJoin(rotomChatMessages, eq(rotomChats.id, rotomChatMessages.chatId))
            .leftJoin(rotomChatMessageReads, eq(rotomChatMessages.id, rotomChatMessageReads.messageId))
            .where(eq(rotomChatUsers.uuid, uuid))
            .orderBy(desc(rotomChatMessages.createdAt))
            .having(eq(rotomChatMessages.id, max(rotomChatMessages.id)))
            .union(
                this.db.select({...params, lastMessage: rotomChatMessages.chatId}).from(rotomChats)
                .leftJoin(rotomChatMessages, eq(rotomChats.id, rotomChatMessages.chatId))
                .where(eq(rotomChats.type, 0))
            )*/

            
    }

    async getMessages(chatId: number): Promise<RotomMessage[]>{
        return this.db.select({id: rotomChatMessages.id, text: rotomChatMessages.content, date: rotomChatMessages.createdAt, uuid: rotomChatMessages.senderUUID})
            .from(rotomChatMessages)
            .where(eq(rotomChatMessages.chatId, chatId))
            .orderBy(asc(rotomChatMessages.createdAt))
    }

    async getChatMembers(chatId: number){
        return this.db.select({uuid: rotomChatUsers.uuid}).from(rotomChatUsers)
            .where(eq(rotomChatUsers.chatId, chatId))
    }


    async createMessage(chatId: number, message: string, uuid: string, type: string = 'text'): Promise<RotomMessage>{
        const insert = await this.db.insert(rotomChatMessages)
            .values({chatId, content: message, senderUUID: uuid, type} as RotomChatMessage) as ResultSetHeader[]
        
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

        return {id: chatId, text: message, date: new Date(), uuid: uuid} as RotomMessage
    }

    async createChat(player: string, users: string[], name: string): Promise<number>{
        const chatUsers = new Set(users)
        chatUsers.add(player)
        const uuids = Array.from(chatUsers)
        let chatName = name
        let chatType = 1
        if(uuids.length == 1){
            const exists = await this.db.select({id: rotomChats.id}).from(rotomChats)
                .where(eq(rotomChats.name, chatName))
    
            if(exists.length > 0){
                return exists[0].id
            }

            chatType = 1

            console.log('Creating single chat')
            console.log(chatName)
        } else if (uuids.length == 2){
            uuids.sort()
            chatName = uuids.join('_')
            chatType = 2

            const chatExists = await this.db.select({id: rotomChats.id}).from(rotomChats)
                .where(eq(rotomChats.name, chatName))

            if(chatExists.length > 0){
                console.log('Chat already exists')
                return chatExists[0].id
            }
            
            console.log('Creating private chat')
            console.log(chatName)
        } else if (uuids.length > 2){
            chatType = 3
            console.log('Creating group chat')
            console.log(chatName)
        }

        const newChat = await this.db.insert(rotomChats)
            .values({type: chatType, name: chatName, description: 'Chat'}) as ResultSetHeader[]

        const insertId = newChat[0].insertId

        uuids.forEach(async (uuid) => {
            await this.db.insert(rotomChatUsers)
                .values({chatId: insertId, uuid})
        })

        return insertId
    }

    async call(chatId: number, uuid: string){
        let users = await this.getChatMembers(chatId)
        users = users.filter((user: {uuid: string}) => user.uuid !== uuid)
        
        if(users.length == 0) return {error: 'No users in chat'}

        const userSocket = this.socketGateway.users.find((user: {uuid: string}) => user.uuid === uuid)
        if(!userSocket) return {error: 'User not connected'}

        const callUsers = users.map((user: {uuid: string}) => ({uuid: user.uuid, status: 'RINGING'}));
        const connectedUsers = callUsers.filter((user: {uuid: string}) => this.socketGateway.users.find((u: {uuid: string}) => u.uuid === user.uuid))

        if(connectedUsers.length == 0) return {error: 'No users connected'}

        connectedUsers.push({uuid, status: 'IN_CALL'})

        this.socketGateway.server.to(userSocket.socketId).emit('chat:call', {chatId,caller: uuid, users: connectedUsers})
        
        this.socketGateway.users.forEach((user: {uuid: string, socketId: string}) => {
            if(users.find((u: {uuid: string}) => u.uuid === user.uuid)){
                this.socketGateway.server.to(user.socketId).emit('chat:call', {chatId, caller: uuid, users: connectedUsers})
            } else { 
                console.log(`User ${user.uuid} not in chat`)
            }
        })

        return {chatId, caller: uuid, users: connectedUsers}
    }

    endCall(chatId: number, startTime: number){
        const endTime = new Date().getTime()
        const callDuration = Math.floor((endTime - startTime) / 1000)

        return this.createMessage(chatId, `${callDuration}`, 'system', 'call') 
    }
    
}
