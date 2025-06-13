import { Injectable } from '@nestjs/common';
import { ChatappRepository, ChatDetails } from '@repositories/smartrotom/chatapp.repository';

export interface CreateChatRequest {
  player: string;
  users: string[];
  name: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async createChat(createChatRequest: CreateChatRequest): Promise<number> {
    const { player, users, name } = createChatRequest;
    
    const chatUsers = new Set(users);
    chatUsers.add(player);
    const uuids = Array.from(chatUsers);
    
    let chatName = name;
    let chatType = 1;

    if (uuids.length === 1) {
      // Single user chat (saved messages)
      const existingChat = await this.chatappRepository.findChatByName(chatName);
      if (existingChat) {
        return existingChat.id;
      }
      chatType = 1;
    } else if (uuids.length === 2) {
      // Private chat between two users
      uuids.sort();
      chatName = uuids.join('_');
      chatType = 2;

      const existingChat = await this.chatappRepository.findChatByName(chatName);
      if (existingChat) {
        return existingChat.id;
      }
    } else if (uuids.length > 2) {
      // Group chat
      chatType = 3;
    }

    // Create new chat
    const newChat = await this.chatappRepository.createChat({
      type: chatType,
      name: chatName,
      description: 'Chat'
    });

    // Add all users to the chat
    for (const uuid of uuids) {
      await this.chatappRepository.addChatMember(newChat.insertId, uuid);
    }

    return newChat.insertId;
  }

  async getChatById(chatId: number): Promise<ChatDetails> {
    const chat = await this.chatappRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    return chat;
  }

  async updateChat(chatId: number, chatData: { name?: string; description?: string; image?: string }): Promise<ChatDetails> {
    const existingChat = await this.chatappRepository.findChatById(chatId);
    if (!existingChat) {
      throw new Error('Chat not found');
    }

    await this.chatappRepository.updateChat(chatId, chatData);
    return this.getChatById(chatId);
  }

  async deleteChat(chatId: number): Promise<void> {
    const existingChat = await this.chatappRepository.findChatById(chatId);
    if (!existingChat) {
      throw new Error('Chat not found');
    }

    await this.chatappRepository.deleteChat(chatId);
  }

  async validateChatExists(chatId: number): Promise<boolean> {
    const chat = await this.chatappRepository.findChatById(chatId);
    return !!chat;
  }

  async validateUserInChat(chatId: number, uuid: string): Promise<boolean> {
    const membership = await this.chatappRepository.findUserInChat(chatId, uuid);
    return !!membership;
  }
}