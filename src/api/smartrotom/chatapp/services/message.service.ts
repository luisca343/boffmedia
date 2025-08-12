import { Inject, Injectable } from '@nestjs/common';
import { CHAT_REPOSITORY_TOKEN, CHAT_MESSAGE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { IChatRepository } from '../repositories/interfaces/chat.repository.interface';
import { IMessageRepository } from '../repositories/interfaces/chat-message.repository.interface';
import { RotomMessage } from '../entities/message.entity';


@Injectable()
export class MessageService {
  constructor(
    @Inject(CHAT_REPOSITORY_TOKEN)
    private readonly chatRepository: IChatRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
    private readonly chatMessageRepository: IMessageRepository,
  ) {}

  async getMessages(chatId: number): Promise<RotomMessage[]> {
    const messages = await this.chatMessageRepository.findChatMessagesAscending(chatId);
    
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
  ): Promise<{ messageId: number; message: RotomMessage }> {
    // Validate chat exists
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Create message
    const result = await this.chatMessageRepository.createMessage({
      chatId,
      content: message,
      senderUUID: uuid,
      type
    });

    const rotomMessage: RotomMessage = {
      id: result.insertId,
      text: message,
      date: new Date(),
      uuid: uuid
    };

    return {
      messageId: result.insertId,
      message: rotomMessage
    };
  }

  async updateMessage(messageId: number, content: string, senderUuid: string): Promise<RotomMessage> {
    const existingMessage = await this.chatMessageRepository.findMessageById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Validate sender can edit this message
    if (existingMessage.uuid !== senderUuid) {
      throw new Error('User does not have permission to edit this message');
    }

    await this.chatMessageRepository.updateMessage(messageId, content);
    
    const updatedMessage = await this.chatMessageRepository.findMessageById(messageId);
    return {
      id: updatedMessage.id,
      text: updatedMessage.content,
      date: updatedMessage.createdAt,
      uuid: updatedMessage.uuid
    };
  }

  async deleteMessage(messageId: number, senderUuid: string): Promise<void> {
    const existingMessage = await this.chatMessageRepository.findMessageById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Validate sender can delete this message
    if (existingMessage.uuid !== senderUuid) {
      throw new Error('User does not have permission to delete this message');
    }

    await this.chatMessageRepository.deleteMessage(messageId);
  }

  async markMessageAsRead(messageId: number, uuid: string): Promise<void> {
    const message = await this.chatMessageRepository.findMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    await this.chatMessageRepository.markMessageAsRead(messageId, uuid);
  }
}