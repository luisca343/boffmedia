import { Injectable } from '@nestjs/common';
import { ChatappRepository } from '@api/_repositories/smartrotom/chatapp.repository';
import {
  CreateChatRequest,
  ChatDetails,
  ChatCreationData
} from '@api/smartrotom/chatapp/types/chatapp.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async createChat(createChatRequest: CreateChatRequest): Promise<number> {
    const chatData: ChatCreationData = {
      type: 1, // Default type for group chat
      name: createChatRequest.name,
      description: '',
      image: null
    };

    const result = await this.chatappRepository.createChat(chatData);
    const chatId = result.insertId;

    // Add creator to chat
    await this.chatappRepository.addUserToChat(chatId, createChatRequest.player);

    // Add other users to chat
    for (const uuid of createChatRequest.users) {
      if (uuid !== createChatRequest.player) {
        await this.chatappRepository.addUserToChat(chatId, uuid);
      }
    }

    return chatId;
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
    return this.chatappRepository.chatExists(chatId);
  }

  async validateUserAccessToChat(chatId: number, uuid: string): Promise<boolean> {
    return this.chatappRepository.isUserInChat(chatId, uuid);
  }

  async addMemberToChat(chatId: number, uuid: string): Promise<void> {
    const chatExists = await this.validateChatExists(chatId);
    if (!chatExists) {
      throw new Error('Chat not found');
    }

    const isAlreadyMember = await this.chatappRepository.isUserInChat(chatId, uuid);
    if (isAlreadyMember) {
      throw new Error('User is already a member of this chat');
    }

    await this.chatappRepository.addUserToChat(chatId, uuid);
  }

  async removeMemberFromChat(chatId: number, uuid: string): Promise<void> {
    const chatExists = await this.validateChatExists(chatId);
    if (!chatExists) {
      throw new Error('Chat not found');
    }

    const isMember = await this.chatappRepository.isUserInChat(chatId, uuid);
    if (!isMember) {
      throw new Error('User is not a member of this chat');
    }

    await this.chatappRepository.removeUserFromChat(chatId, uuid);
  }
}