import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendMessageDto } from './dto/send-message.dto';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';

@ApiTags('smartrotom/chat')
@Controller('smartrotom/chat')
@UseInterceptors(ResponseInterceptor)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @Post('first')
  @ApiOperation({ summary: 'Initialize a chat for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat initialized successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initialize chat.' })
  async first(@Body() initializeChatDto: UuidDto) {
    return await this.chatService.first(initializeChatDto.uuid);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to send message.' })
  async send(@Body() sendMessageDto: SendMessageDto) {
    return await this.chatService.send(sendMessageDto.uuid, sendMessageDto.mensaje);
  }

  @Get(':uuid')
  @ApiOperation({ summary: 'Get chat messages for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  async get(@Param('uuid') uuid: string) {
    return await this.chatService.getMessages(uuid);
  }
}