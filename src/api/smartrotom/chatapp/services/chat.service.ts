import { Injectable, Inject } from '@nestjs/common';
import { CHAT_REPOSITORY_TOKEN, CHAT_MEMBER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { IChatRepository } from '../repositories/interfaces/chat.repository.interface';
import { IMemberRepository } from '../repositories/interfaces/chat-member.repository.interface';
import { ChatDetails } from '../repositories/chatapp.repository';

export interface CreateChatRequest {
  player: string;
  users: string[];
  name: string;
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_REPOSITORY_TOKEN)
    private readonly chatRepository: IChatRepository,
    @Inject(CHAT_MEMBER_REPOSITORY_TOKEN)
    private readonly chatMemberRepository: IMemberRepository,
  ) {}

  async createChat(createChatRequest: CreateChatRequest): Promise<number> {
    const { player, users, name } = createChatRequest;
    const chatUsers = new Set(users);
    chatUsers.add(player);
    const uuids = Array.from(chatUsers);

    let chatName = name;
    let chatType = 1;

    if (uuids.length === 1) {
      const existingChat = await this.chatRepository.findChatByName(chatName);
      if (existingChat) return existingChat.id;
      chatType = 1;
    } else if (uuids.length === 2) {
      uuids.sort();
      chatName = uuids.sort().join('_');
      chatType = 2;
      const existingChat = await this.chatRepository.findChatByName(chatName);
      if (existingChat) return existingChat.id;
    } else if (uuids.length > 2) {
      chatType = 3;
    }

    const newChat = await this.chatRepository.createChat({
      type: chatType,
      name: chatName,
      description: 'Chat'
    });

    for (const uuid of uuids) {
      await this.chatMemberRepository.addChatMember(newChat.insertId, uuid);
    }

    return newChat.insertId;
  }

  async getChatById(chatId: number): Promise<ChatDetails> {
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) throw new Error('Chat not found');
    return chat;
  }

  async updateChat(chatId: number, chatData: { name?: string; description?: string; image?: string }): Promise<ChatDetails> {
    const existingChat = await this.chatRepository.findChatById(chatId);
    if (!existingChat) throw new Error('Chat not found');
    await this.chatRepository.updateChat(chatId, chatData);
    return this.getChatById(chatId);
  }

  async deleteChat(chatId: number): Promise<void> {
    const existingChat = await this.chatRepository.findChatById(chatId);
    if (!existingChat) throw new Error('Chat not found');
    await this.chatRepository.deleteChat(chatId);
  }

  async validateChatExists(chatId: number): Promise<boolean> {
    const chat = await this.chatRepository.findChatById(chatId);
    return !!chat;
  }

  async validateUserInChat(chatId: number, uuid: string): Promise<boolean> {
    const membership = await this.chatMemberRepository.findUserInChat(chatId, uuid);
    return !!membership;
  }
}