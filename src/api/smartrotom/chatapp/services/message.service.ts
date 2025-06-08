import { Injectable } from '@nestjs/common';
import { ChatappRepository, ChatMessage } from '@repositories/smartrotom/chatapp.repository';

export interface RotomMessage {
  id: number;
  text: string;
  date: Date;
  uuid: string;
}

@Injectable()
export class MessageService {
  constructor(
    private readonly chatappRepository: ChatappRepository,
  ) {}

  async getMessages(chatId: number): Promise<RotomMessage[]> {
    const messages = await this.chatappRepository.findChatMessagesAscending(chatId);
    
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
    const chat = await this.chatappRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Create message
    const result = await this.chatappRepository.createMessage({
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
    const existingMessage = await this.chatappRepository.findMessageById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Validate sender can edit this message
    if (existingMessage.uuid !== senderUuid) {
      throw new Error('User does not have permission to edit this message');
    }

    await this.chatappRepository.updateMessage(messageId, content);
    
    const updatedMessage = await this.chatappRepository.findMessageById(messageId);
    return {
      id: updatedMessage.id,
      text: updatedMessage.content,
      date: updatedMessage.createdAt,
      uuid: updatedMessage.uuid
    };
  }

  async deleteMessage(messageId: number, senderUuid: string): Promise<void> {
    const existingMessage = await this.chatappRepository.findMessageById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Validate sender can delete this message
    if (existingMessage.uuid !== senderUuid) {
      throw new Error('User does not have permission to delete this message');
    }

    await this.chatappRepository.deleteMessage(messageId);
  }

  async markMessageAsRead(messageId: number, uuid: string): Promise<void> {
    const message = await this.chatappRepository.findMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    await this.chatappRepository.markMessageAsRead(messageId, uuid);
  }
}