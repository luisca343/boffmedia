import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService, FicusMessage } from './chat.service';

@Controller('smartrotom/chat')
export class ChatController {
    constructor(private chatService: ChatService) {}
    
    @Get(':uuid')
    async get(@Param('uuid') uuid: string) {
        return this.chatService.getMessages(uuid);
    }


    @Post('send')
    async send(@Body()  {uuid, mensaje } : {uuid: string, mensaje: FicusMessage}) {
        return this.chatService.send(uuid, mensaje);
    }

    @Post('first')
    async first(@Body() {uuid}: {uuid: string}) {
        return this.chatService.first(uuid);
    }
    
}
