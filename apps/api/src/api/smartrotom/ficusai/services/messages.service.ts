import { Injectable, Inject } from '@nestjs/common';
import { FICUSAI_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IFicusAiRepository } from '../repositories/interfaces/ficusai.interface.repository';
import { FicusMessage } from '../entities/ficus-message.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { FicusMessageContentDto } from '../dto/ficus-message-content.dto';
import { MessageSender } from '../enums/message-sender.enum';
import { MessagePartType } from '../dto/message-part.dto';

@Injectable()
export class MessageService {
  constructor(
    @Inject(FICUSAI_REPOSITORY_TOKEN)
    private readonly ficusaiRepository: IFicusAiRepository,
  ) {}

  async getMessages(
    uuid: string,
    limit: number = 20,
  ): Promise<FicusMessageContentDto[]> {
    this.validateUuid(uuid);

    const messages = await this.ficusaiRepository.findByUuid(uuid, limit);

    // Transform and parse the messages
    const parsedMessages: FicusMessageContentDto[] = [];

    for (const message of messages.reverse()) {
      // Reverse to get chronological order
      try {
        const content =
          typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;

        parsedMessages.push(content);
      } catch (error: any) {
        console.error('Error parsing message content:', error);
        // Skip malformed messages
      }
    }

    return parsedMessages;
  }

  async storeMessage(
    uuid: string,
    messageContent: FicusMessageContentDto,
  ): Promise<FicusMessage> {
    this.validateUuid(uuid);

    const createMessageDto: CreateMessageDto = {
      uuid,
      content: messageContent,
    };

    return this.ficusaiRepository.create(createMessageDto);
  }

  async getMessagesForContext(
    uuid: string,
    contextLimit: number = 5,
  ): Promise<FicusMessageContentDto[]> {
    this.validateUuid(uuid);

    const messages = await this.ficusaiRepository.findRecentByUuid(
      uuid,
      contextLimit,
    );

    return messages
      .map((message) => {
        try {
          return typeof message.content === 'string'
            ? JSON.parse(message.content)
            : message.content;
        } catch (error: any) {
          console.error('Error parsing message content for context:', error);
          return null;
        }
      })
      .filter(Boolean);
  }

  async deleteUserMessages(uuid: string): Promise<boolean> {
    this.validateUuid(uuid);
    return this.ficusaiRepository.deleteByUuid(uuid);
  }

  async getUserMessageCount(uuid: string): Promise<number> {
    this.validateUuid(uuid);
    return this.ficusaiRepository.countByUuid(uuid);
  }

  async createWelcomeMessage(uuid: string): Promise<FicusMessageContentDto> {
    const welcomeMessage: FicusMessageContentDto = {
      sender: MessageSender.BOT,
      parts: [
        {
          type: MessagePartType.TEXT,
          content:
            'Hola, soy Profesor Ficus, tu asistente virtual. ¿En qué puedo ayudarte?',
        },
      ],
    };

    await this.storeMessage(uuid, welcomeMessage);
    return welcomeMessage;
  }

  private validateUuid(uuid: string): void {
    if (!uuid || typeof uuid !== 'string' || uuid.trim() === '') {
      throw new Error('UUID is required and must be a non-empty string');
    }
  }
}
