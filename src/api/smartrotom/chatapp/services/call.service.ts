import { Injectable } from '@nestjs/common';
import { ChatappRepository } from '@api/_repositories/smartrotom/chatapp.repository';
import {
  CallUser,
  CallSession,
  EndCallResult,
  MessageCreationData
} from '@api/smartrotom/chatapp/types/chatapp.types';

@Injectable()
export class CallService {
  private activeCalls: Map<number, CallSession> = new Map();

  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async initializeCall(chatId: number, callerUuid: string): Promise<CallSession> {
    const chatExists = await this.chatappRepository.chatExists(chatId);
    if (!chatExists) {
      throw new Error('Chat not found');
    }

    const isUserInChat = await this.chatappRepository.isUserInChat(chatId, callerUuid);
    if (!isUserInChat) {
      throw new Error('User is not a member of this chat');
    }

    // Check if there's already an active call
    if (this.activeCalls.has(chatId)) {
      throw new Error('There is already an active call in this chat');
    }

    // Get all chat members
    const members = await this.chatappRepository.findChatMembers(chatId);
    
    const callUsers: CallUser[] = members.map(member => ({
      uuid: member.uuid,
      status: member.uuid === callerUuid ? 'IN_CALL' : 'RINGING'
    }));

    const callSession: CallSession = {
      chatId,
      caller: callerUuid,
      users: callUsers
    };

    this.activeCalls.set(chatId, callSession);

    return callSession;
  }

  async updateCallUserStatus(
    chatId: number, 
    uuid: string, 
    status: CallUser['status']
  ): Promise<void> {
    const callSession = this.activeCalls.get(chatId);
    if (!callSession) {
      throw new Error('No active call found for this chat');
    }

    const user = callSession.users.find(u => u.uuid === uuid);
    if (!user) {
      throw new Error('User is not part of this call');
    }

    user.status = status;

    // If all users have declined or left, end the call
    const activeUsers = callSession.users.filter(u => 
      u.status === 'IN_CALL' || u.status === 'RINGING'
    );

    if (activeUsers.length === 0) {
      this.activeCalls.delete(chatId);
    }
  }

  async endCall(chatId: number, startTime: number): Promise<EndCallResult> {
    const callSession = this.activeCalls.get(chatId);
    if (!callSession) {
      throw new Error('No active call found for this chat');
    }

    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds

    // Create a call end message
    const messageData: MessageCreationData = {
      chatId,
      content: `Call ended. Duration: ${this.formatDuration(duration)}`,
      senderUUID: 'system',
      type: 'call_end'
    };

    const result = await this.chatappRepository.createMessage(messageData);

    // Remove the call from active calls
    this.activeCalls.delete(chatId);

    return {
      messageId: result.insertId,
      duration
    };
  }

  getActiveCall(chatId: number): CallSession | null {
    return this.activeCalls.get(chatId) || null;
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
}