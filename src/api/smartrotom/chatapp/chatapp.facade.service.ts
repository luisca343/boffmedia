import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ChatService, CreateChatRequest } from './services/chat.service';
import { MessageService, RotomMessage } from './services/message.service';
import { GroupService, Group } from './services/group.service';
import { CallService, CallSession } from './services/call.service';
import { SocketsGateway } from '../../_utils/sockets/sockets.gateway';

export interface CreateChatMessageRequest {
  uuid: string;
  message: string;
}

@Injectable()
export class ChatappFacadeService {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly groupService: GroupService,
    private readonly callService: CallService,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socketGateway: SocketsGateway,
  ) {}

  // ==================== CHAT MANAGEMENT ====================

  async createChat(createChatRequest: CreateChatRequest): Promise<number> {
    try {
      return await this.chatService.createChat(createChatRequest);
    } catch (error) {
      console.error('Error creating chat:', error);
      throw new Error(`Failed to create chat: ${error.message}`);
    }
  }

  async getChats(uuid: string): Promise<Group[]> {
    try {
      return await this.groupService.getUserGroups(uuid);
    } catch (error) {
      console.error(`Error getting chats for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve chats: ${error.message}`);
    }
  }

  async getChatById(chatId: number, requestingUserUuid: string): Promise<Group> {
    try {
      return await this.groupService.getGroupById(chatId, requestingUserUuid);
    } catch (error) {
      console.error(`Error getting chat ${chatId}:`, error);
      throw new Error(`Failed to retrieve chat: ${error.message}`);
    }
  }

  // ==================== MESSAGE MANAGEMENT ====================

  async getMessages(chatId: number): Promise<RotomMessage[]> {
    try {
      return await this.messageService.getMessages(chatId);
    } catch (error) {
      console.error(`Error getting messages for chat ${chatId}:`, error);
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  }

  async createMessage(
    chatId: number, 
    createMessageRequest: CreateChatMessageRequest
  ): Promise<RotomMessage> {
    try {
      const { messageId, message } = await this.messageService.createMessage(
        chatId,
        createMessageRequest.message,
        createMessageRequest.uuid
      );

      // Emit message to all chat members via WebSocket
      await this.emitMessageToChat(chatId, messageId, createMessageRequest);

      return message;
    } catch (error) {
      console.error(`Error creating message in chat ${chatId}:`, error);
      throw new Error(`Failed to create message: ${error.message}`);
    }
  }

  async updateMessage(
    messageId: number, 
    content: string, 
    senderUuid: string
  ): Promise<RotomMessage> {
    try {
      return await this.messageService.updateMessage(messageId, content, senderUuid);
    } catch (error) {
      console.error(`Error updating message ${messageId}:`, error);
      throw new Error(`Failed to update message: ${error.message}`);
    }
  }

  async deleteMessage(messageId: number, senderUuid: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.messageService.deleteMessage(messageId, senderUuid);
      return {
        success: true,
        message: 'Message deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  async markMessageAsRead(messageId: number, uuid: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.messageService.markMessageAsRead(messageId, uuid);
      return {
        success: true,
        message: 'Message marked as read'
      };
    } catch (error) {
      console.error(`Error marking message ${messageId} as read:`, error);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  // ==================== GROUP MANAGEMENT ====================

  async addMemberToGroup(
    groupId: number, 
    uuid: string, 
    requestingUserUuid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.groupService.addMemberToGroup(groupId, uuid, requestingUserUuid);
      return {
        success: true,
        message: 'Member added to group successfully'
      };
    } catch (error) {
      console.error(`Error adding member to group ${groupId}:`, error);
      throw new Error(`Failed to add member to group: ${error.message}`);
    }
  }

  async removeMemberFromGroup(
    groupId: number, 
    uuid: string, 
    requestingUserUuid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.groupService.removeMemberFromGroup(groupId, uuid, requestingUserUuid);
      return {
        success: true,
        message: 'Member removed from group successfully'
      };
    } catch (error) {
      console.error(`Error removing member from group ${groupId}:`, error);
      throw new Error(`Failed to remove member from group: ${error.message}`);
    }
  }

  // ==================== CALL MANAGEMENT ====================

  async initiateCall(chatId: number, callerUuid: string): Promise<CallSession> {
    try {
      const callSession = await this.callService.initializeCall(chatId, callerUuid);
      
      // Emit call signal to all chat members
      await this.emitCallToChat(callSession);

      return callSession;
    } catch (error) {
      console.error(`Error initiating call in chat ${chatId}:`, error);
      throw new Error(`Failed to initiate call: ${error.message}`);
    }
  }

  async endCall(chatId: number, startTime: number): Promise<RotomMessage> {
    try {
      const { messageId, duration } = await this.callService.endCall(chatId, startTime);
      
      return {
        id: messageId,
        text: duration.toString(),
        date: new Date(),
        uuid: 'system'
      };
    } catch (error) {
      console.error(`Error ending call in chat ${chatId}:`, error);
      throw new Error(`Failed to end call: ${error.message}`);
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async emitMessageToChat(
    chatId: number, 
    messageId: number, 
    messageRequest: CreateChatMessageRequest
  ): Promise<void> {
    try {
      // Get chat members for targeted message sending
      const chatMembers = chatId === 1 
        ? Array.from(this.socketGateway.users.values()) 
        : await this.getChatMembersForSocket(chatId);

      let sentToSelf = false;

      for (const member of chatMembers) {
        const socket = this.socketGateway.users.get(member.uuid);
        
        if (socket && (member.uuid !== messageRequest.uuid || !sentToSelf)) {
          this.socketGateway.server.to(socket.socketId).emit('chat:message', {
            chatId,
            id: messageId,
            content: messageRequest.message,
            createdAt: new Date(),
            uuid: messageRequest.uuid
          });

          if (member.uuid === messageRequest.uuid) {
            sentToSelf = true;
          }
        }
      }
    } catch (error) {
      console.error('Error emitting message to chat:', error);
      // Don't throw error here as message was already saved
    }
  }

  private async emitCallToChat(callSession: CallSession): Promise<void> {
    try {
      const { chatId, caller, users } = callSession;
      
      // Get caller socket
      const callerSocket = this.socketGateway.users.get(caller);
      if (callerSocket) {
        this.socketGateway.server.to(callerSocket.socketId).emit('chat:call', callSession);
      }

      // Emit to all other call participants
      for (const user of users) {
        if (user.uuid !== caller) {
          const userSocket = this.socketGateway.users.get(user.uuid);
          if (userSocket) {
            this.socketGateway.server.to(userSocket.socketId).emit('chat:call', callSession);
          }
        }
      }
    } catch (error) {
      console.error('Error emitting call to chat:', error);
      // Don't throw error here as call was already initialized
    }
  }

  private async getChatMembersForSocket(chatId: number): Promise<{ uuid: string }[]> {
    try {
      return await this.groupService.getGroupById(chatId, 'system').then(group => group.members);
    } catch (error) {
      console.error('Error getting chat members for socket:', error);
      return [];
    }
  }
}