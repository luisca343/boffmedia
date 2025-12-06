import { Inject, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
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
      type: message.type,
      text: message.content,
      date: message.createdAt,
      uuid: message.uuid
    }));
  }

  async createMessage(
    chatId: number, 
    createMessageRequest: { message: string; uuid: string; type: string }
  ): Promise<{ messageId: number; message: RotomMessage }> {
    // Validate chat exists
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    console.log(`Creating message in chat ${chatId} from user ${createMessageRequest.uuid}`);
    console.log(`Message type: ${createMessageRequest.type}`);
    console.log(`Message content (truncated): ${createMessageRequest.message.substring(0, 200)}...`);

    return;
    // If message is an image payload, parse it and save the decoded image to disk
    let contentToStore = createMessageRequest.message;
    if (createMessageRequest.type === 'image') {
      try {
        const parsed = JSON.parse(createMessageRequest.message);
        const screenshot = parsed?.screenshot;
        if (screenshot && typeof screenshot.image === 'string') {
          const matches = screenshot.image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (matches) {
            const mime = matches[1];
            const b64 = matches[2];
            const ext = mime.split('/')[1] || 'png';
            const buffer = Buffer.from(b64, 'base64');

            const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat-screenshots');
            await fs.mkdir(uploadDir, { recursive: true });

            const safeId = (screenshot.id || `screenshot-${Date.now()}`).replace(/[^a-zA-Z0-9-_\.]/g, '-');
            const filename = `${safeId}-${Math.random().toString(36).slice(2,8)}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            await fs.writeFile(filePath, buffer);

            const publicUrl = `/uploads/chat-screenshots/${filename}`;

            const meta = { ...screenshot };
            delete meta.image;

            contentToStore = JSON.stringify({ imageUrl: publicUrl, meta });
            console.log(`Saved chat image to ${filePath}`);
          } else {
            console.warn('Image payload did not match data URL pattern');
          }
        } else {
          console.warn('Image payload missing screenshot.image');
        }
      } catch (err) {
        console.error('Failed to parse/process image message', err);
      }
    }

    // Create message
    const result = await this.chatMessageRepository.createMessage({
      chatId,
      content: contentToStore,
      senderUUID: createMessageRequest.uuid,
      type: createMessageRequest.type
    });

    const rotomMessage: RotomMessage = {
      id: result.insertId,
      text: contentToStore,
      date: new Date(),
      uuid: createMessageRequest.uuid
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