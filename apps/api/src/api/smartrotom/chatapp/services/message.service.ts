import { Inject, Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { IChatRepository } from '../repositories/interfaces/chat.repository.interface';
import { IMessageRepository } from '../repositories/interfaces/chat-message.repository.interface';
import { RotomMessage } from '../entities/message.entity';
import { Logger } from 'nestjs-pino';

@Injectable()
export class MessageService {
  constructor(
    private readonly logger: Logger,

    @Inject(CHAT_REPOSITORY_TOKEN)
    private readonly chatRepository: IChatRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
    private readonly chatMessageRepository: IMessageRepository,
  ) {}

  async getMessages(chatId: number): Promise<RotomMessage[]> {
    const messages =
      await this.chatMessageRepository.findChatMessagesAscending(chatId);

    return messages.map((message) => ({
      id: message.id,
      type: message.type,
      text: message.content,
      date: message.createdAt,
      uuid: message.uuid,
    }));
  }

  async createMessage(
    chatId: number,
    createMessageRequest: { message: string; uuid: string; type: string },
  ): Promise<{ messageId: number; message: RotomMessage }> {
    // Validate chat exists
    const chat = await this.chatRepository.findChatById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // If message is an image payload, parse it and save the decoded image to disk
    let contentToStore = createMessageRequest.message;
    if (createMessageRequest.type === 'image') {
      try {
        const parsed = JSON.parse(createMessageRequest.message);
        const screenshot = parsed?.screenshot;
        const caption = parsed?.caption;

        if (screenshot && typeof screenshot.image === 'string') {
          const matches = screenshot.image.match(
            /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
          );
          if (matches) {
            const mime = matches[1];
            const b64 = matches[2];
            const ext = mime.split('/')[1] || 'png';
            const buffer = Buffer.from(b64, 'base64');

            const uploadDir = path.join(
              process.cwd(),
              'public',
              'uploads',
              'chat-screenshots',
            );
            await fs.mkdir(uploadDir, { recursive: true });

            const safeId = (
              screenshot.id || `screenshot-${Date.now()}`
            ).replace(/[^a-zA-Z0-9-_\.]/g, '-');
            const filename = `${safeId}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            await fs.writeFile(filePath, buffer);

            const publicUrl = `/uploads/chat-screenshots/${filename}`;

            const meta: Record<string, unknown> = { ...screenshot };
            delete meta.image;
            if (caption !== undefined) {
              meta.caption = caption;
            }

            contentToStore = JSON.stringify({ imageUrl: publicUrl, meta });
            this.logger.log(`Saved chat image to ${filePath}`);
          } else {
            // Image is already a URL path, not base64
            const meta: Record<string, unknown> = { ...screenshot };
            delete meta.image;
            if (caption !== undefined) {
              meta.caption = caption;
            }

            contentToStore = JSON.stringify({
              imageUrl: screenshot.image,
              meta,
            });
            this.logger.log(`Using existing image URL: ${screenshot.image}`);
          }
        } else {
          this.logger.warn('Image payload missing screenshot.image');
        }
      } catch (err: any) {
        this.logger.error('Failed to parse/process image message', err);
      }
    }

    // Create message
    const result = await this.chatMessageRepository.createMessage({
      chatId,
      content: contentToStore,
      senderUUID: createMessageRequest.uuid,
      type: createMessageRequest.type,
    });

    const rotomMessage: RotomMessage = {
      id: result.insertId,
      text: contentToStore,
      date: new Date(),
      uuid: createMessageRequest.uuid,
    };

    return {
      messageId: result.insertId,
      message: rotomMessage,
    };
  }

  async createGlobalMessage(createMessageRequest: {
    message: string;
    uuid: string;
    type: string;
  }): Promise<{ messageId: number; message: RotomMessage }> {
    return this.createMessage(-1, createMessageRequest);
  }

  async updateMessage(
    messageId: number,
    content: string,
    senderUuid: string,
  ): Promise<RotomMessage> {
    const existingMessage =
      await this.chatMessageRepository.findMessageById(messageId);
    if (!existingMessage) {
      throw new Error('Message not found');
    }

    // Validate sender can edit this message
    if (existingMessage.uuid !== senderUuid) {
      throw new Error('User does not have permission to edit this message');
    }

    await this.chatMessageRepository.updateMessage(messageId, content);

    const updatedMessage =
      await this.chatMessageRepository.findMessageById(messageId);
    return {
      id: updatedMessage!.id,
      text: updatedMessage!.content,
      date: updatedMessage!.createdAt,
      uuid: updatedMessage!.uuid,
    };
  }

  async deleteMessage(messageId: number, senderUuid: string): Promise<void> {
    const existingMessage =
      await this.chatMessageRepository.findMessageById(messageId);
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
    if (await this.chatMessageRepository.hasRead(messageId, uuid)) return;
    await this.chatMessageRepository.markMessageAsRead(messageId, uuid);
  }

  /** Toggle a reaction on/off, returning the message's chat + the fresh set. */
  async toggleReaction(
    messageId: number,
    uuid: string,
    emoji: string,
  ): Promise<{ chatId: number | null; reactions: { emoji: string; by: string[] }[]; added: boolean }> {
    const has = await this.chatMessageRepository.hasReaction(
      messageId,
      uuid,
      emoji,
    );
    if (has) {
      await this.chatMessageRepository.removeReaction(messageId, uuid, emoji);
    } else {
      await this.chatMessageRepository.addReaction(messageId, uuid, emoji);
    }

    const rows = await this.chatMessageRepository.findReactionsForMessages([
      messageId,
    ]);
    const map = new Map<string, string[]>();
    for (const r of rows) map.set(r.emoji, [...(map.get(r.emoji) ?? []), r.uuid]);
    const reactions = Array.from(map.entries()).map(([e, by]) => ({
      emoji: e,
      by,
    }));
    const chatId =
      await this.chatMessageRepository.findMessageChatId(messageId);
    return { chatId, reactions, added: !has };
  }
}
