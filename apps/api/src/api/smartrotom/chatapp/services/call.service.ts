import { Injectable, Inject } from '@nestjs/common';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MEMBER_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { IChatRepository } from '../repositories/interfaces/chat.repository.interface';
import { IMemberRepository } from '../repositories/interfaces/chat-member.repository.interface';
import { IMessageRepository } from '../repositories/interfaces/chat-message.repository.interface';
import { randomUUID } from 'crypto';

export interface CallUser {
  uuid: string;
  username?: string;
  status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY';
}

export interface CallSession {
  callId: string;
  chatId: number;
  caller: string;
  users: CallUser[];
}

@Injectable()
export class CallService {
  constructor(
    @Inject(CHAT_REPOSITORY_TOKEN)
    private readonly chatRepository: IChatRepository,
    @Inject(CHAT_MEMBER_REPOSITORY_TOKEN)
    private readonly chatMemberRepository: IMemberRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
    private readonly chatMessageRepository: IMessageRepository,
  ) {}

  async initializeCall(
    chatId: number,
    callerUuid: string,
  ): Promise<CallSession> {
    // Validate chat exists
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Validate caller is in the chat
    const callerInChat = await this.chatMemberRepository.findUserInChat(
      chatId,
      callerUuid,
    );
    if (!callerInChat) {
      throw new Error('Caller is not a member of this chat');
    }

    // Get all chat members except the caller
    const allMembers = await this.chatMemberRepository.findChatMembers(chatId);
    const otherMembers = allMembers.filter(
      (member) => member.uuid !== callerUuid,
    );

    if (otherMembers.length === 0) {
      throw new Error('No other users in chat to call');
    }

    // Build call users list
    const callUsers: CallUser[] = [
      {
        uuid: callerUuid,
        username: allMembers.find((m) => m.uuid === callerUuid)?.username,
        status: 'IN_CALL',
      },
      ...otherMembers.map((member) => ({
        uuid: member.uuid,
        username: member.username,
        status: 'RINGING' as const,
      })),
    ];

    return {
      callId: randomUUID(),
      chatId,
      caller: callerUuid,
      users: callUsers,
    };
  }

  async updateCallUserStatus(
    chatId: number,
    uuid: string,
    _status: CallUser['status'],
  ): Promise<void> {
    // Validate user is in the chat
    const userInChat = await this.chatMemberRepository.findUserInChat(
      chatId,
      uuid,
    );
    if (!userInChat) {
      throw new Error('User is not a member of this chat');
    }

    // Note: In a real implementation, you'd want to store call state in database
    // For now, this is just validation
  }

  async endCall(
    chatId: number,
    startTime: number,
  ): Promise<{ messageId: number; duration: number }> {
    const endTime = new Date().getTime();
    const callDuration = Math.floor((endTime - startTime) / 1000);

    // Create call duration message
    const result = await this.chatMessageRepository.createMessage({
      chatId,
      content: callDuration.toString(),
      senderUUID: 'system',
      type: 'call',
    });

    return {
      messageId: result.insertId,
      duration: callDuration,
    };
  }

  async validateCallPermissions(
    chatId: number,
    uuid: string,
  ): Promise<boolean> {
    const userInChat = await this.chatMemberRepository.findUserInChat(
      chatId,
      uuid,
    );
    return !!userInChat;
  }
}
