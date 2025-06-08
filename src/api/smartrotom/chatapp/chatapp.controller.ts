import { Body, Controller, Get, Param, Post, Put, Delete, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ChatappFacadeService, CreateChatMessageRequest } from './chatapp.facade.service';
import { CreateChatRequest } from './services/chat.service';
import { UuidDto } from '../_dto/smartrotom-request-dto';
import { CreateChatDto } from './dto/create-chat-dto';
import { CreateChatMessageDto } from './dto/create-chat-message-dto';

@ApiTags('smartrotom/chatapp')
@Controller('smartrotom/chatapp')
@UseInterceptors(ResponseInterceptor)
export class ChatappController {
  constructor(
    private readonly chatappFacadeService: ChatappFacadeService,
  ) {}

  // ==================== CHAT ENDPOINTS ====================

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chat created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid chat data.' })
  @ApiBody({ type: CreateChatDto })
  async createChat(@Body() createChatDto: CreateChatDto) {
    const createChatRequest: CreateChatRequest = {
      player: createChatDto.player,
      users: createChatDto.users,
      name: createChatDto.name
    };
    return await this.chatappFacadeService.createChat(createChatRequest);
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get chats for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve chats.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getChats(@Param('uuid') uuid: string) {
    return await this.chatappFacadeService.getChats(uuid);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get a specific chat by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getChatById(
    @Param('chatId') chatId: string,
    @Query('uuid') uuid: string
  ) {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.getChatById(chatIdNum, uuid);
  }

  // ==================== MESSAGE ENDPOINTS ====================

  @Get('messages/:chatId')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  async getMessages(@Param('chatId') chatId: string) {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.getMessages(chatIdNum);
  }

  @Post('messages/:chatId')
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid message data.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: CreateChatMessageDto })
  async createMessage(
    @Param('chatId') chatId: string, 
    @Body() createChatMessageDto: CreateChatMessageDto
  ) {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }

    const createMessageRequest: CreateChatMessageRequest = {
      uuid: createChatMessageDto.uuid,
      message: createChatMessageDto.message
    };

    return await this.chatappFacadeService.createMessage(chatIdNum, createMessageRequest);
  }

  @Put('message/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        content: { type: 'string' },
        uuid: { type: 'string' }
      } 
    } 
  })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() body: { content: string; uuid: string }
  ) {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.updateMessage(messageIdNum, body.content, body.uuid);
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiQuery({ name: 'uuid', description: 'User UUID' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Query('uuid') uuid: string
  ) {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.deleteMessage(messageIdNum, uuid);
  }

  @Post('message/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message marked as read successfully.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: UuidDto })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Body() body: UuidDto
  ) {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.markMessageAsRead(messageIdNum, body.uuid);
  }

  // ==================== GROUP MANAGEMENT ENDPOINTS ====================

  @Post('group/:groupId/member')
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member added successfully.' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        uuid: { type: 'string' },
        requestingUserUuid: { type: 'string' }
      } 
    } 
  })
  async addMemberToGroup(
    @Param('groupId') groupId: string,
    @Body() body: { uuid: string; requestingUserUuid: string }
  ) {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    return await this.chatappFacadeService.addMemberToGroup(groupIdNum, body.uuid, body.requestingUserUuid);
  }

  @Delete('group/:groupId/member/:uuid')
  @ApiOperation({ summary: 'Remove a member from a group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member removed successfully.' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'uuid', description: 'Member UUID to remove' })
  @ApiQuery({ name: 'requestingUserUuid', description: 'UUID of user making the request' })
  async removeMemberFromGroup(
    @Param('groupId') groupId: string,
    @Param('uuid') uuid: string,
    @Query('requestingUserUuid') requestingUserUuid: string
  ) {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    return await this.chatappFacadeService.removeMemberFromGroup(groupIdNum, uuid, requestingUserUuid);
  }

  // ==================== CALL ENDPOINTS ====================

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call initiated successfully.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initiate call.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: UuidDto })
  async initiateCall(@Param('chatId') chatId: string, @Body() body: UuidDto) {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.initiateCall(chatIdNum, body.uuid);
  }

  @Post('call/:chatId/end')
  @ApiOperation({ summary: 'End a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call ended successfully.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ 
    schema: { 
      type: 'object', 
      properties: { 
        startTime: { type: 'number' }
      } 
    } 
  })
  async endCall(
    @Param('chatId') chatId: string,
    @Body() body: { startTime: number }
  ) {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.endCall(chatIdNum, body.startTime);
  }

  // ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat (legacy endpoint)' })
  async call(@Param('chatId') chatId: number, @Body() body: UuidDto) {
    // This maintains backward compatibility with the original endpoint
    return await this.chatappFacadeService.initiateCall(chatId, body.uuid);
  }
}