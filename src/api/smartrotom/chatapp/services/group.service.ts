import { Injectable } from '@nestjs/common';
import { ChatappRepository } from '@api/_repositories/smartrotom/chatapp.repository';
import {
  GroupResponse,
  ChatMessageSummary,
  ChatMemberResponse
} from '@api/smartrotom/chatapp/types/chatapp.types';

@Injectable()
export class GroupService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async getUserGroups(uuid: string): Promise<GroupResponse[]> {
    const chats = await this.chatappRepository.findUserChats(uuid);
    const groups: GroupResponse[] = [];

    for (const chat of chats) {
      // Get last few messages for preview
      const messages = await this.chatappRepository.findChatMessages(chat.id, 5);
      const messageSummaries: ChatMessageSummary[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt
      }));

      // Get chat members
      const members = await this.chatappRepository.findChatMembers(chat.id);
      const memberResponses: ChatMemberResponse[] = members.map(member => ({
        uuid: member.uuid
      }));

      // Get unread count (placeholder for now)
      const unread = await this.chatappRepository.getUnreadMessageCount(chat.id, uuid);

      groups.push({
        id: chat.id,
        name: chat.name,
        type: chat.type,
        description: chat.description,
        image: chat.image,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: messageSummaries,
        unread,
        members: memberResponses
      });
    }

    return groups;
  }

  async getGroupById(groupId: number, requestingUserUuid: string): Promise<GroupResponse> {
    const chat = await this.chatappRepository.findChatById(groupId);
    if (!chat) {
      throw new Error('Group not found');
    }

    const isUserInChat = await this.chatappRepository.isUserInChat(groupId, requestingUserUuid);
    if (!isUserInChat) {
      throw new Error('User is not a member of this group');
    }

    // Get last few messages for preview
    const messages = await this.chatappRepository.findChatMessages(chat.id, 10);
    const messageSummaries: ChatMessageSummary[] = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt
    }));

    // Get chat members
    const members = await this.chatappRepository.findChatMembers(chat.id);
    const memberResponses: ChatMemberResponse[] = members.map(member => ({
      uuid: member.uuid
    }));

    // Get unread count
    const unread = await this.chatappRepository.getUnreadMessageCount(chat.id, requestingUserUuid);

    return {
      id: chat.id,
      name: chat.name,
      type: chat.type,
      description: chat.description,
      image: chat.image,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      messages: messageSummaries,
      unread,
      members: memberResponses
    };
  }
}