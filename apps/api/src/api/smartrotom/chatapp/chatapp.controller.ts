import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CurrentMcUuid } from '@api/_utils/decorators/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  ChatappFacadeService,
  CreateChatMessageRequest,
} from './chatapp.facade.service';
import { CreateChatRequest } from './services/chat.service';

// Import DTOs
import {
  CreateChatDto,
  SetChatPinnedDto,
  SetChatMutedDto,
} from './dto/chat.dto';
import {
  CreateMessageDto,
  UpdateMessageDto,
  DeleteMessageDto,
  MarkMessageReadDto,
  MarkChatReadDto,
  ReactMessageDto,
} from './dto/message.dto';
import { AddMemberDto, RemoveMemberDto } from './dto/group.dto';
import { InitiateCallDto, EndCallDto } from './dto/call.dto';

// Import Entities
import { Chat, CreateChatResponse } from './entities/chat.entity';
import {
  RotomMessage,
  CreateMessageResponse,
  MessageResponse,
  MarkChatReadResponse,
} from './entities/message.entity';
import { CallSession, CallResponse } from './entities/call.entity';

@ApiTags('SmartRotom | ChatApp')
@Controller('smartrotom/chatapp')
export class ChatappController {
  constructor(private readonly chatappFacadeService: ChatappFacadeService) {}

  // ==================== CHAT ENDPOINTS ====================

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chat created successfully.',
    type: CreateChatResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid chat data.',
  })
  @ApiBody({ type: CreateChatDto })
  async createChat(
    @Body() createChatDto: CreateChatDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<number> {
    const createChatRequest: CreateChatRequest = {
      // The creator is the caller, never `dto.player` — that is whoever the
      // client says it is.
      player: uuid,
      users: createChatDto.users,
      name: createChatDto.name ?? '',
    };
    return await this.chatappFacadeService.createChat(createChatRequest);
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get chats for a player' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chats retrieved successfully.',
    type: [Chat],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve chats.',
  })
  @ApiParam({ name: 'uuid', description: 'Player UUID' })
  async getChats(@CurrentMcUuid() uuid: string): Promise<Chat[]> {
    return await this.chatappFacadeService.getChats(uuid);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get a specific chat by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat retrieved successfully.',
    type: Chat,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getChatById(
    @Param('chatId') chatId: string,
    @CurrentMcUuid() uuid: string,
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
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Messages retrieved successfully.',
    type: [RotomMessage],
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to retrieve messages.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of messages (default 50, max 100)',
    required: false,
  })
  @ApiQuery({
    name: 'before',
    description: 'Load messages before this message ID (keyset pagination)',
    required: false,
  })
  async getMessages(
    @Param('chatId') chatId: string,
    @Query('limit') limitStr?: string,
    @Query('before') beforeStr?: string,
  ): Promise<RotomMessage[]> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;
    const before = beforeStr ? parseInt(beforeStr, 10) : undefined;
    return await this.chatappFacadeService.getMessages(chatIdNum, limit, before);
  }

  @Post('messages/:chatId')
  @ApiOperation({ summary: 'Create a new message in a chat' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Message created successfully.',
    type: CreateMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message data.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: CreateMessageDto })
  async createMessage(
    @Param('chatId') chatId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<RotomMessage> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }

    const createMessageRequest: CreateChatMessageRequest = {
      // Author = caller, not a body field: anyone could post as anyone.
      uuid,
      message: createMessageDto.message,
      type: createMessageDto.type!,
    };

    return await this.chatappFacadeService.createMessage(
      chatIdNum,
      createMessageRequest,
    );
  }

  @Post('global-message')
  @ApiOperation({ summary: 'Create a new global message' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Global message created successfully.',
    type: CreateMessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid global message data.',
  })
  @ApiBody({ type: CreateMessageDto })
  async createGlobalMessage(
    @Body() createMessageDto: CreateMessageDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<RotomMessage> {
    const createMessageRequest: CreateChatMessageRequest = {
      uuid,
      message: createMessageDto.message,
      type: createMessageDto.type!,
    };

    return await this.chatappFacadeService.createGlobalMessage(
      createMessageRequest,
    );
  }

  @Put('message/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message updated successfully.',
    type: RotomMessage,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found.',
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: UpdateMessageDto })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<RotomMessage> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.updateMessage(
      messageIdNum,
      updateMessageDto.content,
      uuid,
    );
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message deleted successfully.',
    type: MessageResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Message not found.',
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: DeleteMessageDto })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Body() _deleteMessageDto: DeleteMessageDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MessageResponse> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.deleteMessage(messageIdNum, uuid);
  }

  @Post('message/:messageId/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message marked as read successfully.',
    type: MessageResponse,
  })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: MarkMessageReadDto })
  async markMessageAsRead(
    @Param('messageId') messageId: string,
    @Body() _markReadDto: MarkMessageReadDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MessageResponse> {
    const messageIdNum = parseInt(messageId, 10);
    if (isNaN(messageIdNum)) {
      throw new Error('Invalid message ID');
    }
    return await this.chatappFacadeService.markMessageAsRead(
      messageIdNum,
      uuid,
    );
  }

  @Post('chat/:chatId/read')
  @ApiOperation({
    summary: 'Mark every unread message in a chat as read for a user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat marked as read successfully.',
    type: MarkChatReadResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat not found.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: MarkChatReadDto })
  async markChatAsRead(
    @Param('chatId') chatId: string,
    @Body() _dto: MarkChatReadDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MarkChatReadResponse> {
    const id = parseInt(chatId, 10);
    if (isNaN(id)) throw new BadRequestException('Chat inválido');
    return await this.chatappFacadeService.markChatAsRead(id, uuid);
  }

  @Post('message/:messageId/react')
  @ApiOperation({ summary: 'Toggle a reaction on a message' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponse })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: ReactMessageDto })
  async reactToMessage(
    @Param('messageId') messageId: string,
    @Body() dto: ReactMessageDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MessageResponse> {
    const id = parseInt(messageId, 10);
    if (isNaN(id)) throw new BadRequestException('Mensaje inválido');
    return await this.chatappFacadeService.toggleReaction(id, uuid, dto.emoji);
  }

  @Post('chat/:chatId/pin')
  @ApiOperation({ summary: 'Pin or unpin a chat for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponse })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: SetChatPinnedDto })
  async setChatPinned(
    @Param('chatId') chatId: string,
    @Body() dto: SetChatPinnedDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MessageResponse> {
    const id = parseInt(chatId, 10);
    if (isNaN(id)) throw new BadRequestException('Chat inválido');
    return await this.chatappFacadeService.setChatPinned(id, uuid, dto.pinned);
  }

  @Post('chat/:chatId/mute')
  @ApiOperation({ summary: 'Mute or unmute a chat for a user' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponse })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: SetChatMutedDto })
  async setChatMuted(
    @Param('chatId') chatId: string,
    @Body() dto: SetChatMutedDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<MessageResponse> {
    const id = parseInt(chatId, 10);
    if (isNaN(id)) throw new BadRequestException('Chat inválido');
    return await this.chatappFacadeService.setChatMuted(id, uuid, dto.muted);
  }

  // ==================== GROUP MANAGEMENT ENDPOINTS ====================

  @Post('group/:groupId/member')
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member added successfully.',
    type: MessageResponse,
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiBody({ type: AddMemberDto })
  async addMemberToGroup(
    @Param('groupId') groupId: string,
    @Body() addMemberDto: AddMemberDto,
    @CurrentMcUuid() requesterUuid: string,
  ): Promise<MessageResponse> {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    // The member being added is request data; WHO is adding them is not.
    return await this.chatappFacadeService.addMemberToGroup(
      groupIdNum,
      addMemberDto.uuid,
      requesterUuid,
    );
  }

  @Delete('group/:groupId/member/:uuid')
  @ApiOperation({ summary: 'Remove a member from a group' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member removed successfully.',
    type: MessageResponse,
  })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'uuid', description: 'Member UUID to remove' })
  @ApiBody({ type: RemoveMemberDto })
  async removeMemberFromGroup(
    @Param('groupId') groupId: string,
    @Param('uuid') uuid: string,
    @Body() _removeMemberDto: RemoveMemberDto,
    @CurrentMcUuid() requesterUuid: string,
  ): Promise<MessageResponse> {
    const groupIdNum = parseInt(groupId, 10);
    if (isNaN(groupIdNum)) {
      throw new Error('Invalid group ID');
    }
    return await this.chatappFacadeService.removeMemberFromGroup(
      groupIdNum,
      uuid,
      requesterUuid,
    );
  }

  // ==================== CALL ENDPOINTS ====================

  @Post('call/:chatId')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call initiated successfully.',
    type: CallResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Failed to initiate call.',
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: InitiateCallDto })
  async initiateCall(
    @Param('chatId') chatId: string,
    @Body() _initiateCallDto: InitiateCallDto,
    @CurrentMcUuid() uuid: string,
  ): Promise<CallSession> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.initiateCall(chatIdNum, uuid);
  }

  @Post('call/:chatId/end')
  @ApiOperation({ summary: 'End a call in a chat' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Call ended successfully.',
    type: RotomMessage,
  })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: EndCallDto })
  async endCall(
    @Param('chatId') chatId: string,
    @Body() endCallDto: EndCallDto,
  ): Promise<RotomMessage> {
    const chatIdNum = parseInt(chatId, 10);
    if (isNaN(chatIdNum)) {
      throw new Error('Invalid chat ID');
    }
    return await this.chatappFacadeService.endCall(
      chatIdNum,
      endCallDto.startTime,
    );
  }
}
