import { Body, Controller, Get, Param, Post, HttpStatus, HttpException, Logger } from '@nestjs/common';
import { ChatappService } from './chatapp.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { CreateChatDto } from './dto/create-chat-dto';
import { CreateChatMessageDto } from './dto/create-chat-message-dto';

@ApiTags('smartrotom/chatapp')
@Controller('smartrotom/chatapp')
export class ChatappController {
  private readonly logger = new Logger(ChatappController.name);

  constructor(
    private readonly chatAppService: ChatappService,
    private readonly responseService: ResponseService,
  ) {}

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call initiated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initiate call.' })
  async call(@Param('chatId') chatId: number, @Body() body: UuidDto) {
    const action = 'initiate call';
    try {
      this.responseService.logRequest(action, { chatId, uuid: body.uuid });
      const result = await this.chatAppService.call(chatId, body.uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Call initiated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { chatId, uuid: body.uuid });
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create chat.' })
  async createChat(@Body() body: CreateChatDto) {
    const action = 'create chat';
    try {
      this.responseService.logRequest(action, body);
      const result = await this.chatAppService.createChat(body.player, body.users, body.name);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Chat created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, body);
    }
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get chats for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve chats.' })
  async getChats(@Param('uuid') uuid: string) {
    const action = 'get chats';
    try {
      this.responseService.logRequest(action, { uuid });
      const result = await this.chatAppService.getChats(uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Chats retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { uuid });
    }
  }

  @Get('messages/:chatId')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  async getMessages(@Param('chatId') chatId: number) {
    const action = 'get messages';
    try {
      this.responseService.logRequest(action, { chatId });
      const result = await this.chatAppService.getMessages(chatId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Messages retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { chatId });
    }
  }

  @Post('messages/:chatId')
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message created successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to create message.' })
  async createMessage(@Param('chatId') chatId: number, @Body() body: CreateChatMessageDto) {
    const action = 'create message';
    try {
      this.responseService.logRequest(action, { chatId, mensaje: body.message, uuid: body.uuid });
      const result = await this.chatAppService.createMessage(chatId, body.message, body.uuid);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Message created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { chatId, mensaje: body.message, uuid: body.uuid });
    }
  }
}