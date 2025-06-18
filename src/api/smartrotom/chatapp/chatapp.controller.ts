import { Body, Controller, Get, Param, Post, Put, Delete, HttpStatus, UseInterceptors, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { ChatappFacadeService, CreateChatMessageRequest } from './chatapp.facade.service';
import { CreateChatRequest } from './services/chat.service';

// Import DTOs
import { CreateChatDto, GetChatsDto, GetChatByIdDto } from './dto/chat.dto';
import { CreateMessageDto, GetMessagesDto, UpdateMessageDto, DeleteMessageDto, MarkMessageReadDto } from './dto/message.dto';
import { AddMemberDto, RemoveMemberDto } from './dto/group.dto';
import { InitiateCallDto, EndCallDto } from './dto/call.dto';

// Import Entities
import { Chat, CreateChatResponse } from './entities/chat.entity';
import { RotomMessage, CreateMessageResponse, MessageResponse } from './entities/message.entity';
import { CallSession, CallResponse } from './entities/call.entity';

@ApiTags('SmartRotom | ChatApp')
@Controller('smartrotom/chatapp')
@UseInterceptors(ResponseInterceptor)
export class ChatappController {
  constructor(
    private readonly chatappFacadeService: ChatappFacadeService,
  ) {}

  // ==================== CHAT ENDPOINTS ====================

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chat created successfully.', type: CreateChatResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid chat data.' })
  @ApiBody({ type: CreateChatDto })
  async createChat(@Body() createChatDto: CreateChatDto): Promise<number> {
    const createChatRequest: CreateChatRequest = {
      player: createChatDto.player,
      users: createChatDto.users,
      name: createChatDto.name
    };
    return await this.chatappFacadeService.createChat(createChatRequest);
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get chats for a player' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chats retrieved successfully.', type: [Chat] })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve chats.' })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getChats(@Param('uuid') uuid: string): Promise<Chat[]> {
    return await this.chatappFacadeService.getChats(uuid);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get a specific chat by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat retrieved successfully.', type: Chat })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getChatById(
    @Param('chatId') chatId: string,
    @Query('uuid') uuid: string
  ): Promise<Chat> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.getChatById(chatIdNum, uuid);
  }

  // ==================== MESSAGE ENDPOINTS ====================

  @Get('messages/:chatId')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.', type: [RotomMessage] })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to retrieve messages.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'limit', description: 'Maximum number of messages', required: false })
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string
  ): Promise<RotomMessage[]> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.getMessages(chatIdNum);
  }

  @Post('messages/:chatId')
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message created successfully.', type: CreateMessageResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid message data.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: CreateMessageDto })
  async createMessage(
    @Param('chatId') chatId: string, 
    @Body() createMessageDto: CreateMessageDto
  ): Promise<RotomMessage> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }

    const createMessageRequest: CreateChatMessageRequest = {
      uuid: createMessageDto.uuid,
      message: createMessageDto.message
    };

    return await this.chatappFacadeService.createMessage(chatIdNum, createMessageRequest);
  }

  @Put('message/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message updated successfully.', type: RotomMessage })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: UpdateMessageDto })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto
  ): Promise<RotomMessage> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.updateMessage(
      messageIdNum, 
      updateMessageDto.content, 
      updateMessageDto.uuid
    );
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message deleted successfully.', type: MessageResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: DeleteMessageDto })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Body() deleteMessageDto: DeleteMessageDto
  ): Promise<MessageResponse> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.deleteMessage(messageIdNum, deleteMessageDto.uuid);
  }

  @Post('message/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message marked as read successfully.', type: MessageResponse })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: MarkMessageReadDto })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Body() markReadDto: MarkMessageReadDto
  ): Promise<MessageResponse> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.markMessageAsRead(messageIdNum, markReadDto.uuid);
  }

  // ==================== GROUP MANAGEMENT ENDPOINTS ====================

  @Post('group/:groupId/member')
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member added successfully.', type: MessageResponse })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiBody({ type: AddMemberDto })
  async addMemberToGroup(
    @Param('groupId') groupId: string,
    @Body() addMemberDto: AddMemberDto
  ): Promise<MessageResponse> {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    return await this.chatappFacadeService.addMemberToGroup(
      groupIdNum, 
      addMemberDto.uuid, 
      addMemberDto.requestingUserUuid
    );
  }

  @Delete('group/:groupId/member/:uuid')
  @ApiOperation({ summary: 'Remove a member from a group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member removed successfully.', type: MessageResponse })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'uuid', description: 'Member UUID to remove' })
  @ApiBody({ type: RemoveMemberDto })
  async removeMemberFromGroup(
    @Param('groupId') groupId: string,
    @Param('uuid') uuid: string,
    @Body() removeMemberDto: RemoveMemberDto
  ): Promise<MessageResponse> {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    return await this.chatappFacadeService.removeMemberFromGroup(
      groupIdNum, 
      uuid, 
      removeMemberDto.requestingUserUuid
    );
  }

  // ==================== CALL ENDPOINTS ====================

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call initiated successfully.', type: CallResponse })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Failed to initiate call.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: InitiateCallDto })
  async initiateCall(
    @Param('chatId') chatId: string, 
    @Body() initiateCallDto: InitiateCallDto
  ): Promise<CallSession> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.initiateCall(chatIdNum, initiateCallDto.uuid);
  }

  @Post('call/:chatId/end')
  @ApiOperation({ summary: 'End a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call ended successfully.', type: RotomMessage })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: EndCallDto })
  async endCall(
    @Param('chatId') chatId: string,
    @Body() endCallDto: EndCallDto
  ): Promise<RotomMessage> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.endCall(chatIdNum, endCallDto.startTime);
  }
}