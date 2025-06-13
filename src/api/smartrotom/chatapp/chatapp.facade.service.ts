import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { MessageService } from './services/message.service';
import { GroupService } from './services/group.service';
import { CallService } from './services/call.service';
import {
  CreateChatRequest,
  CreateChatResponse,
  GetChatsResponse,
  GroupResponse,
  GetMessagesResponse,
  ChatMessageResponse,
  CreateChatMessageRequest,
  CreateChatMessageResponse,
  UpdateChatMessageRequest,
  UpdateChatMessageResponse,
  DeleteChatMessageRequest,
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
  ChatResponse,
  SocketChatMessageEvent,
  SocketCallEvent
} from '@api/smartrotom/chatapp/types/chatapp.types';

// Import the socket gateway (assuming it exists)
// import { SocketsGateway } from '@api/sockets/sockets.gateway';

@Injectable()
export class ChatappFacadeService {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly groupService: GroupService,
    private readonly callService: CallService,
    // @Inject(forwardRef(() => SocketsGateway))
    // private readonly socketGateway: SocketsGateway,
  ) {}

  // ==================== CHAT MANAGEMENT ====================

  async createChat(createChatRequest: CreateChatRequest): Promise<CreateChatResponse> {
    try {
      const chatId = await this.chatService.createChat(createChatRequest);
      return { chatId };
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error(`Failed to create chat: ${error.message}`);
    }
  }

  async getUserChats(uuid: string): Promise<GetChatsResponse> {
    try {
      const groups = await this.groupService.getUserGroups(uuid);
      return { groups };
    } catch (error) {
      console.error(`Error getting chats for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve chats: ${error.message}`);
    }
  }

  async getChatById(chatId: number, requestingUserUuid: string): Promise<GroupResponse> {
    try {
      return await this.groupService.getGroupById(chatId, requestingUserUuid);
    } catch (error) {
      console.error(`Error getting chat ${chatId}:`, error);
      throw new Error(`Failed to retrieve chat: ${error.message}`);
    }
  }

  async updateChat(updateChatRequest: UpdateChatRequest): Promise<ChatResponse> {
    try {
      return await this.chatService.updateChat(
        updateChatRequest.chatId,
        {
          name: updateChatRequest.name,
          description: updateChatRequest.description,
          image: updateChatRequest.image
        }
      );
    } catch (error) {
      console.error(`Error updating chat ${updateChatRequest.chatId}:`, error);
      throw new Error(`Failed to update chat: ${error.message}`);
    }
  }

  async deleteChat(chatId: number, requestingUserUuid: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate user has access to delete (could be admin check)
      const hasAccess = await this.chatService.validateUserAccessToChat(chatId, requestingUserUuid);
      if (!hasAccess) {
        throw new Error('User does not have permission to delete this chat');
      }

      await this.chatService.deleteChat(chatId);
      return {
        success: true,
        message: 'Chat deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      throw new Error(`Failed to delete chat: ${error.message}`);
    }
  }

  // ==================== MESSAGE MANAGEMENT ====================

  async getChatMessages(chatId: number, requestingUserUuid: string): Promise<GetMessagesResponse> {
    try {
      // Validate user has access to chat
      const hasAccess = await this.chatService.validateUserAccessToChat(chatId, requestingUserUuid);
      if (!hasAccess) {
        throw new Error('User does not have access to this chat');
      }

      const messages = await this.messageService.getMessages(chatId);
      return { messages };
    } catch (error) {
      console.error(`Error getting messages for chat ${chatId}:`, error);
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }

  async createChatMessage(chatId: number, createMessageRequest: CreateChatMessageRequest): Promise<CreateChatMessageResponse> {
    try {
      const result = await this.messageService.createMessage(
        chatId,
        createMessageRequest.message,
        createMessageRequest.uuid
      );

      // Emit socket event for real-time messaging
      const socketEvent: SocketChatMessageEvent = {
        chatId,
        id: result.message.id,
        content: result.message.text,
        createdAt: result.message.date,
        uuid: result.message.uuid
      };

      // this.socketGateway.emitToChatRoom(chatId, 'new_message', socketEvent);

      return result.message;
    } catch (error) {
      console.error(`Error creating message in chat ${chatId}:`, error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  async updateChatMessage(updateMessageRequest: UpdateChatMessageRequest): Promise<UpdateChatMessageResponse> {
    try {
      const updatedMessage = await this.messageService.updateMessage(
        updateMessageRequest.messageId,
        updateMessageRequest.content,
        updateMessageRequest.senderUuid
      );

      // Emit socket event for real-time updates
      // this.socketGateway.emitToChatRoom(chatId, 'message_updated', updatedMessage);

      return updatedMessage;
    } catch (error) {
      console.error(`Error updating message ${updateMessageRequest.messageId}:`, error);
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  async deleteChatMessage(deleteMessageRequest: DeleteChatMessageRequest): Promise<DeleteChatMessageResponse> {
    try {
      await this.messageService.deleteMessage(
        deleteMessageRequest.messageId,
        deleteMessageRequest.senderUuid
      );

      // Emit socket event for real-time updates
      // this.socketGateway.emitToChatRoom(chatId, 'message_deleted', { messageId: deleteMessageRequest.messageId });

      return {
        success: true,
        message: 'Message deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting message ${deleteMessageRequest.messageId}:`, error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  // ==================== GROUP MEMBER MANAGEMENT ====================

  async addMemberToGroup(addMemberRequest: AddMemberToGroupRequest): Promise<AddMemberToGroupResponse> {
    try {
      // Validate requesting user has access to the group
      const hasAccess = await this.chatService.validateUserAccessToChat(
        addMemberRequest.groupId,
        addMemberRequest.requestingUserUuid
      );
      if (!hasAccess) {
        throw new Error('User does not have permission to add members to this group');
      }

      await this.chatService.addMemberToChat(addMemberRequest.groupId, addMemberRequest.uuid);

      // Emit socket event for real-time updates
      // this.socketGateway.emitToChatRoom(addMemberRequest.groupId, 'member_added', { uuid: addMemberRequest.uuid });

      return {
        success: true,
        message: 'Member added to group successfully'
      };
    } catch (error) {
      console.error(`Error adding member to group ${addMemberRequest.groupId}:`, error);
      throw new Error(`Failed to add member: ${error.message}`);
    }
  }

  async removeMemberFromGroup(removeMemberRequest: RemoveMemberFromGroupRequest): Promise<RemoveMemberFromGroupResponse> {
    try {
      // Validate requesting user has access to the group
      const hasAccess = await this.chatService.validateUserAccessToChat(
        removeMemberRequest.groupId,
        removeMemberRequest.requestingUserUuid
      );
      if (!hasAccess) {
        throw new Error('User does not have permission to remove members from this group');
      }

      await this.chatService.removeMemberFromChat(removeMemberRequest.groupId, removeMemberRequest.uuid);

      // Emit socket event for real-time updates
      // this.socketGateway.emitToChatRoom(removeMemberRequest.groupId, 'member_removed', { uuid: removeMemberRequest.uuid });

      return {
        success: true,
        message: 'Member removed from group successfully'
      };
    } catch (error) {
      console.error(`Error removing member from group ${removeMemberRequest.groupId}:`, error);
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  // ==================== CALL MANAGEMENT ====================

  async initiateCall(initiateCallRequest: InitiateCallRequest): Promise<CallSessionResponse> {
    try {
      const callSession = await this.callService.initializeCall(
        initiateCallRequest.chatId,
        initiateCallRequest.callerUuid
      );

      // Emit socket event for real-time call notifications
      const socketEvent: SocketCallEvent = callSession;
      // this.socketGateway.emitToChatRoom(initiateCallRequest.chatId, 'call_initiated', socketEvent);

      return {
        chatId: callSession.chatId,
        caller: callSession.caller,
        users: callSession.users
      };
    } catch (error) {
      console.error(`Error initiating call in chat ${initiateCallRequest.chatId}:`, error);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }

  async endCall(endCallRequest: EndCallRequest): Promise<EndCallResponse> {
    try {
      const result = await this.callService.endCall(endCallRequest.chatId, endCallRequest.startTime);

      // Get the call end message
      const message = await this.messageService.getMessages(endCallRequest.chatId);
      const callEndMessage = message.find(m => m.id === result.messageId);

      if (!callEndMessage) {
        throw new Error('Failed to retrieve call end message');
      }

      // Emit socket event for call end
      // this.socketGateway.emitToChatRoom(endCallRequest.chatId, 'call_ended', { duration: result.duration });

      return callEndMessage;
    } catch (error) {
      console.error(`Error ending call in chat ${endCallRequest.chatId}:`, error);
      throw new Error(`Failed to end call: ${error.message}`);
    }
  }

  async getActiveCall(chatId: number): Promise<CallSessionResponse | null> {
    try {
      const activeCall = this.callService.getActiveCall(chatId);
      
      if (!activeCall) {
        return null;
      }

      return {
        chatId: activeCall.chatId,
        caller: activeCall.caller,
        users: activeCall.users
      };
    } catch (error) {
      console.error(`Error getting active call for chat ${chatId}:`, error);
      throw new Error(`Failed to get active call: ${error.message}`);
    }
  }

  async updateCallUserStatus(chatId: number, uuid: string, status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY'): Promise<void> {
    try {
      await this.callService.updateCallUserStatus(chatId, uuid, status);

      // Emit socket event for call status updates
      // this.socketGateway.emitToChatRoom(chatId, 'call_status_updated', { uuid, status });
    } catch (error) {
      console.error(`Error updating call status for user ${uuid} in chat ${chatId}:`, error);
      throw new Error(`Failed to update call status: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateChatAccess(chatId: number, uuid: string): Promise<boolean> {
    try {
      return await this.chatService.validateUserAccessToChat(chatId, uuid);
    } catch (error) {
      console.error(`Error validating chat access for user ${uuid} in chat ${chatId}:`, error);
      return false;
    }
  }

  async validateMessageAccess(messageId: number, uuid: string): Promise<boolean> {
    try {
      return await this.messageService.validateMessageAccess(messageId, uuid);
    } catch (error) {
      console.error(`Error validating message access for user ${uuid} and message ${messageId}:`, error);
      return false;
    }
  }
}