import { Injectable } from '@nestjs/common';
import { ChatappRepository } from '@repositories/smartrotom/chatapp.repository';

export interface CallUser {
  uuid: string;
  status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY';
}

export interface CallSession {
  chatId: number;
  caller: string;
  users: CallUser[];
}

@Injectable()
export class CallService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async initializeCall(chatId: number, callerUuid: string): Promise<CallSession> {
    // Validate chat exists
    const chat = await this.chatappRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Validate caller is in the chat
    const callerInChat = await this.chatappRepository.findUserInChat(chatId, callerUuid);
    if (!callerInChat) {
      throw new Error('Caller is not a member of this chat');
    }

    // Get all chat members except the caller
    const allMembers = await this.chatappRepository.findChatMembers(chatId);
    const otherMembers = allMembers.filter(member => member.uuid !== callerUuid);

    if (otherMembers.length === 0) {
      throw new Error('No other users in chat to call');
    }

    // Build call users list
    const callUsers: CallUser[] = [
      { uuid: callerUuid, status: 'IN_CALL' },
      ...otherMembers.map(member => ({ uuid: member.uuid, status: 'RINGING' as const }))
    ];

    return {
      chatId,
      caller: callerUuid,
      users: callUsers
    };
  }

  async updateCallUserStatus(
    chatId: number, 
    uuid: string, 
    status: CallUser['status']
  ): Promise<void> {
    // Validate user is in the chat
    const userInChat = await this.chatappRepository.findUserInChat(chatId, uuid);
    if (!userInChat) {
      throw new Error('User is not a member of this chat');
    }

    // Note: In a real implementation, you'd want to store call state in database
    // For now, this is just validation
  }

  async endCall(chatId: number, startTime: number): Promise<{ messageId: number; duration: number }> {
    const endTime = new Date().getTime();
    const callDuration = Math.floor((endTime - startTime) / 1000);

    // Create call duration message
    const result = await this.chatappRepository.createMessage({
      chatId,
      content: callDuration.toString(),
      senderUUID: 'system',
      type: 'call'
    });

    return {
      messageId: result.insertId,
      duration: callDuration
    };
  }

  async validateCallPermissions(chatId: number, uuid: string): Promise<boolean> {
    const userInChat = await this.chatappRepository.findUserInChat(chatId, uuid);
    return !!userInChat;
  }
}