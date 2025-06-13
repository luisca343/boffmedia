import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpStatus, UseInterceptors, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ChatappFacadeService } from './chatapp.facade.service';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import {
  CreateChatRequest,
  CreateChatResponse,
  GetChatsResponse,
  GroupResponse,
  GetMessagesResponse,
  CreateChatMessageRequest,
  CreateChatMessageResponse,
  UpdateChatMessageRequest,
  UpdateChatMessageResponse,
  DeleteChatMessageResponse,
  AddMemberToGroupRequest,
  AddMemberToGroupResponse,
  RemoveMemberFromGroupRequest,
  RemoveMemberFromGroupResponse,
  InitiateCallRequest,
  CallSessionResponse,
  EndCallRequest,
  EndCallResponse,
  UpdateChatRequest,
  ChatResponse
} from '@api/smartrotom/chatapp/types/chatapp.types';

@ApiTags('SmartRotom | ChatApp')
@Controller('smartrotom/chatapp')
@UseInterceptors(ResponseInterceptor)
export class ChatappController {
  constructor(
    private readonly chatappFacadeService: ChatappFacadeService,
  ) {}

  // ==================== CHAT ENDPOINTS ====================

  @Post('chat')
  @ApiOperation({ summary: 'Create a new chat/group' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Chat created successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid chat data.' })
  @ApiBody({ type: Object })
  async createChat(@Body() createChatRequest: CreateChatRequest): Promise<CreateChatResponse> {
    return await this.chatappFacadeService.createChat(createChatRequest);
  }

  @Get('chats/:uuid')
  @ApiOperation({ summary: 'Get all chats for a user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chats retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserChats(@Param('uuid') uuid: string): Promise<GetChatsResponse> {
    return await this.chatappFacadeService.getUserChats(uuid);
  }

  @Get('chat/:chatId')
  @ApiOperation({ summary: 'Get chat details by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getChatById(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('uuid') requestingUserUuid: string
  ): Promise<GroupResponse> {
    return await this.chatappFacadeService.getChatById(chatId, requestingUserUuid);
  }

  @Put('chat/:chatId')
  @ApiOperation({ summary: 'Update chat details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: Object })
  async updateChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() updateData: Omit<UpdateChatRequest, 'chatId'>
  ): Promise<ChatResponse> {
    return await this.chatappFacadeService.updateChat({ chatId, ...updateData });
  }

  @Delete('chat/:chatId')
  @ApiOperation({ summary: 'Delete a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Chat deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async deleteChat(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('uuid') requestingUserUuid: string
  ): Promise<{ success: boolean; message: string }> {
    return await this.chatappFacadeService.deleteChat(chatId, requestingUserUuid);
  }

  // ==================== MESSAGE ENDPOINTS ====================

  @Get('chat/:chatId/messages')
  @ApiOperation({ summary: 'Get messages for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Chat not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getChatMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('uuid') requestingUserUuid: string
  ): Promise<GetMessagesResponse> {
    return await this.chatappFacadeService.getChatMessages(chatId, requestingUserUuid);
  }

  @Post('chat/:chatId/message')
  @ApiOperation({ summary: 'Send a message to a chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Message sent successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid message data.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: Object })
  async createChatMessage(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() createMessageRequest: CreateChatMessageRequest
  ): Promise<CreateChatMessageResponse> {
    return await this.chatappFacadeService.createChatMessage(chatId, createMessageRequest);
  }

  @Put('message/:messageId')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiBody({ type: Object })
  async updateChatMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Body() updateData: Omit<UpdateChatMessageRequest, 'messageId'>
  ): Promise<UpdateChatMessageResponse> {
    return await this.chatappFacadeService.updateChatMessage({ messageId, ...updateData });
  }

  @Delete('message/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found.' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiQuery({ name: 'uuid', description: 'Message sender UUID' })
  async deleteChatMessage(
    @Param('messageId', ParseIntPipe) messageId: number,
    @Query('uuid') senderUuid: string
  ): Promise<DeleteChatMessageResponse> {
    return await this.chatappFacadeService.deleteChatMessage({ messageId, senderUuid });
  }

  // ==================== GROUP MEMBER ENDPOINTS ====================

  @Post('group/:groupId/member')
  @ApiOperation({ summary: 'Add a member to a group' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Member added successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid member data.' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiBody({ type: Object })
  async addMemberToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body() memberData: Omit<AddMemberToGroupRequest, 'groupId'>
  ): Promise<AddMemberToGroupResponse> {
    return await this.chatappFacadeService.addMemberToGroup({ groupId, ...memberData });
  }

  @Delete('group/:groupId/member/:uuid')
  @ApiOperation({ summary: 'Remove a member from a group' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Member removed successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Member not found.' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiParam({ name: 'uuid', description: 'Member UUID' })
  @ApiQuery({ name: 'requestingUserUuid', description: 'Requesting user UUID' })
  async removeMemberFromGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('uuid') uuid: string,
    @Query('requestingUserUuid') requestingUserUuid: string
  ): Promise<RemoveMemberFromGroupResponse> {
    return await this.chatappFacadeService.removeMemberFromGroup({ groupId, uuid, requestingUserUuid });
  }

  // ==================== CALL ENDPOINTS ====================

  @Post('chat/:chatId/call')
  @ApiOperation({ summary: 'Initiate a call in a chat' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Call initiated successfully.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid call data.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: Object })
  async initiateCall(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() callData: Omit<InitiateCallRequest, 'chatId'>
  ): Promise<CallSessionResponse> {
    return await this.chatappFacadeService.initiateCall({ chatId, ...callData });
  }

  @Post('chat/:chatId/call/end')
  @ApiOperation({ summary: 'End a call in a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call ended successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Active call not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: Object })
  async endCall(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() endCallData: Omit<EndCallRequest, 'chatId'>
  ): Promise<EndCallResponse> {
    return await this.chatappFacadeService.endCall({ chatId, ...endCallData });
  }

  @Get('chat/:chatId/call')
  @ApiOperation({ summary: 'Get active call information for a chat' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call information retrieved successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No active call found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  async getActiveCall(@Param('chatId', ParseIntPipe) chatId: number): Promise<CallSessionResponse | null> {
    return await this.chatappFacadeService.getActiveCall(chatId);
  }

  @Put('chat/:chatId/call/status')
  @ApiOperation({ summary: 'Update call user status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Call status updated successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Active call not found.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiBody({ type: Object })
  async updateCallUserStatus(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Body() statusData: { uuid: string; status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY' }
  ): Promise<void> {
    return await this.chatappFacadeService.updateCallUserStatus(chatId, statusData.uuid, statusData.status);
  }

  // ==================== LEGACY ENDPOINTS ====================

  @Get('groups/:uuid')
  @ApiOperation({ summary: 'Get user groups (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Groups retrieved successfully.' })
  @ApiParam({ name: 'uuid', description: 'User UUID' })
  async getUserGroups(@Param('uuid') uuid: string): Promise<GetChatsResponse> {
    // This is just an alias for getUserChats to maintain backward compatibility
    return await this.chatappFacadeService.getUserChats(uuid);
  }

  @Get('messages/:chatId')
  @ApiOperation({ summary: 'Get chat messages (legacy endpoint)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages retrieved successfully.' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiQuery({ name: 'uuid', description: 'Requesting user UUID' })
  async getMessages(
    @Param('chatId', ParseIntPipe) chatId: number,
    @Query('uuid') requestingUserUuid: string
  ): Promise<GetMessagesResponse> {
    // This is just an alias for getChatMessages to maintain backward compatibility
    return await this.chatappFacadeService.getChatMessages(chatId, requestingUserUuid);
  }
}