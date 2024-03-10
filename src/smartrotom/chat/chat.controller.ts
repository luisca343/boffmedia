import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('smartrotom/chat')
export class ChatController {
    constructor(private chatService: ChatService) {}
    
    @Post('send')
    async send(@Body() data: { mensaje: string }) {
        return this.chatService.send(data.mensaje);
    }
    
}
