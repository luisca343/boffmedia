import { Body, Controller, Get, Param, Post, HttpStatus, UseInterceptors } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { CreateChatDto } from './dto/create-chat-dto';
import { CreateChatMessageDto } from './dto/create-chat-message-dto';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('smartrotom/chatapp')
@Controller('smartrotom/chatapp')
@UseInterceptors(ResponseInterceptor)
export class ChatappController {
  constructor(
    private readonly chatAppService: ChatappService,
  ) {}

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call initiated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initiate call.' })
  async call(@Param('chatId') chatId: number, @Body() body: UuidDto) {
    return await this.chatAppService.call(chatId, body.uuid);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create chat.' })
  async createChat(@Body() body: CreateChatDto) {
    return await this.chatAppService.createChat(body.player, body.users, body.name);
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get chats for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve chats.' })
  async getChats(@Param('uuid') uuid: string) {
    return await this.chatAppService.getChats(uuid);
  }

  @Get('messages/:chatId')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  async getMessages(@Param('chatId') chatId: number) {
    return await this.chatAppService.getMessages(chatId);
  }

  @Post('messages/:chatId')
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create message.' })
  async createMessage(@Param('chatId') chatId: number, @Body() body: CreateChatMessageDto) {
    return await this.chatAppService.createMessage(chatId, body.message, body.uuid);
  }
}