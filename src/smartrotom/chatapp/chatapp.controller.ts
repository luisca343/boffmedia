import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatappService } from './chatapp.service';

@Controller('smartrotom/chatapp')
export class ChatappController {
    constructor(private readonly chatAppService: ChatappService) {}
    @Get("/chats/:uuid")
    async getChats(@Param("uuid") uuid: string){
        return this.chatAppService.getChats(uuid);
    }
    @Get("/messages/:chatId")
    async getMessages(@Param("chatId") chatId: number){
        return this.chatAppService.getMessages(chatId);
    }
    @Post("/messages/:chatId")
    async createMessage(@Param("chatId") chatId: number, @Body() body: {mensaje: string, uuid: string}){
        return this.chatAppService.createMessage(chatId, body.mensaje, body.uuid);
    }
    @Post("chat")
    async createChat(@Body() body: {player: string, users: string[], name: string}){
        return this.chatAppService.createChat(body.player, body.users, body.name);
    }
    @Post("call/:chatId")
    async call(@Param("chatId") chatId: number, @Body() body: {uuid: string}){
        return this.chatAppService.call(chatId, body.uuid);
    }
}
