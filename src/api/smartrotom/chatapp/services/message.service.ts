import { Injectable } from '@nestjs/common';
import { ChatappRepository } from '@api/_repositories/smartrotom/chatapp.repository';
import {
  ChatMessageResponse,
  CreateMessageResult,
  MessageCreationData
} from '@api/smartrotom/chatapp/types/chatapp.types';

@Injectable()
export class MessageService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async getMessages(chatId: number): Promise<ChatMessageResponse[]> {
    const chatExists = await this.chatappRepository.chatExists(chatId);
    if (!chatExists) {
      throw new Error('Chat not found');
    }

    const messages = await this.chatappRepository.findChatMessages(chatId);
    
    return messages.map(message => ({
      id: message.id,
      text: message.content,
      date: message.createdAt,
      uuid: message.uuid
    }));
  }

  async createMessage(
    chatId: number, 
    message: string, 
    uuid: string, 
    type: string = 'text'
  ): Promise<CreateMessageResult> {
    const chatExists = await this.chatappRepository.chatExists(chatId);
    if (!chatExists) {
      throw new Error('Chat not found');
    }

    const isUserInChat = await this.chatappRepository.isUserInChat(chatId, uuid);
    if (!isUserInChat) {
      throw new Error('User is not a member of this chat');
    }

    const messageData: MessageCreationData = {
      chatId,
      content: message,
      senderUUID: uuid,
      type
    };

    const result = await this.chatappRepository.createMessage(messageData);
    const messageId = result.insertId;

    const createdMessage = await this.chatappRepository.findMessageById(messageId);
    if (!createdMessage) {
      throw new Error('Failed to retrieve created message');
    }

    const messageResponse: ChatMessageResponse = {
      id: createdMessage.id,
      text: createdMessage.content,
      date: createdMessage.createdAt,
      uuid: createdMessage.uuid
    };

    return {
      messageId,
      message: messageResponse
    };
  }

  async updateMessage(messageId: number, content: string, senderUuid: string): Promise<ChatMessageResponse> {
    const messageExists = await this.chatappRepository.messageExists(messageId);
    if (!messageExists) {
      throw new Error('Message not found');
    }

    const isOwner = await this.chatappRepository.isMessageOwner(messageId, senderUuid);
    if (!isOwner) {
      throw new Error('User is not the owner of this message');
    }

    await this.chatappRepository.updateMessage(messageId, content);

    const updatedMessage = await this.chatappRepository.findMessageById(messageId);
    if (!updatedMessage) {
      throw new Error('Failed to retrieve updated message');
    }

    return {
      id: updatedMessage.id,
      text: updatedMessage.content,
      date: updatedMessage.createdAt,
      uuid: updatedMessage.uuid
    };
  }

  async deleteMessage(messageId: number, senderUuid: string): Promise<void> {
    const messageExists = await this.chatappRepository.messageExists(messageId);
    if (!messageExists) {
      throw new Error('Message not found');
    }

    const isOwner = await this.chatappRepository.isMessageOwner(messageId, senderUuid);
    if (!isOwner) {
      throw new Error('User is not the owner of this message');
    }

    await this.chatappRepository.deleteMessage(messageId);
  }

  async validateMessageAccess(messageId: number, uuid: string): Promise<boolean> {
    const message = await this.chatappRepository.findMessageById(messageId);
    if (!message) {
      return false;
    }

    return this.chatappRepository.isUserInChat(message.id, uuid);
  }
}