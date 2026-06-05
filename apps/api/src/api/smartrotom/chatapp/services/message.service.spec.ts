import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { MessageService } from './message.service';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockChatRepo = {
  findChatById: jest.fn(),
};

const mockMessageRepo = {
  findChatMessagesAscending: jest.fn(),
  createMessage: jest.fn(),
  findMessageById: jest.fn(),
  updateMessage: jest.fn(),
  deleteMessage: jest.fn(),
  markMessageAsRead: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const makeDbMsg = (id: number, uuid = 'player-uuid', content = 'hello') =>
  ({
    id,
    content,
    uuid,
    type: 'text',
    createdAt: new Date('2026-01-01'),
  }) as any;

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: Logger, useValue: mockLogger },
        { provide: CHAT_REPOSITORY_TOKEN, useValue: mockChatRepo },
        { provide: CHAT_MESSAGE_REPOSITORY_TOKEN, useValue: mockMessageRepo },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getMessages ──────────────────────────────────────────────────────────────

  describe('getMessages()', () => {
    it('maps db messages to RotomMessage shape', async () => {
      mockMessageRepo.findChatMessagesAscending.mockResolvedValue([
        makeDbMsg(1, 'uuid-A', 'Hello world'),
      ]);

      const result = await service.getMessages(1);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 1,
        text: 'Hello world',
        uuid: 'uuid-A',
      });
    });
  });

  // ─── createMessage ────────────────────────────────────────────────────────────

  describe('createMessage()', () => {
    it('creates a text message in an existing chat', async () => {
      mockChatRepo.findChatById.mockResolvedValue({ id: 1 });
      mockMessageRepo.createMessage.mockResolvedValue({ insertId: 42 });

      const result = await service.createMessage(1, {
        message: 'Hello!',
        uuid: 'player-uuid',
        type: 'text',
      });

      expect(result.messageId).toBe(42);
      expect(result.message.text).toBe('Hello!');
      expect(mockMessageRepo.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ chatId: 1, content: 'Hello!', type: 'text' }),
      );
    });

    it('throws when chat does not exist', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(
        service.createMessage(99, {
          message: 'Hi',
          uuid: 'uuid',
          type: 'text',
        }),
      ).rejects.toThrow('Chat not found');
    });

    it('handles image type by parsing and saving base64 to disk', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { promises: fsMock } = require('fs');
      mockChatRepo.findChatById.mockResolvedValue({ id: 1 });
      mockMessageRepo.createMessage.mockResolvedValue({ insertId: 10 });

      const imagePayload = JSON.stringify({
        screenshot: {
          id: 'shot-1',
          image: 'data:image/png;base64,iVBORw0KGgo=',
        },
      });

      await service.createMessage(1, {
        message: imagePayload,
        uuid: 'player-uuid',
        type: 'image',
      });

      expect(fsMock.writeFile).toHaveBeenCalled();
    });

    it('stores URL directly when screenshot.image is already a URL (not base64)', async () => {
      mockChatRepo.findChatById.mockResolvedValue({ id: 1 });
      mockMessageRepo.createMessage.mockResolvedValue({ insertId: 10 });

      const imagePayload = JSON.stringify({
        screenshot: {
          id: 'shot-1',
          image: '/uploads/existing.png',
        },
      });

      const result = await service.createMessage(1, {
        message: imagePayload,
        uuid: 'player-uuid',
        type: 'image',
      });

      const storedContent = JSON.parse(result.message.text);
      expect(storedContent.imageUrl).toBe('/uploads/existing.png');
    });
  });

  // ─── updateMessage ────────────────────────────────────────────────────────────

  describe('updateMessage()', () => {
    it('updates message content when sender matches', async () => {
      const msg = makeDbMsg(1, 'player-uuid');
      mockMessageRepo.findMessageById
        .mockResolvedValueOnce(msg)
        .mockResolvedValueOnce({ ...msg, content: 'Updated' });
      mockMessageRepo.updateMessage.mockResolvedValue(undefined);

      const result = await service.updateMessage(1, 'Updated', 'player-uuid');

      expect(result.text).toBe('Updated');
    });

    it('throws when message not found', async () => {
      mockMessageRepo.findMessageById.mockResolvedValue(null);

      await expect(service.updateMessage(99, 'X', 'uuid')).rejects.toThrow(
        'Message not found',
      );
    });

    it('throws when sender does not own the message', async () => {
      mockMessageRepo.findMessageById.mockResolvedValue(
        makeDbMsg(1, 'owner-uuid'),
      );

      await expect(
        service.updateMessage(1, 'Hack', 'other-uuid'),
      ).rejects.toThrow('does not have permission');
    });
  });

  // ─── deleteMessage ────────────────────────────────────────────────────────────

  describe('deleteMessage()', () => {
    it('deletes message when sender matches', async () => {
      mockMessageRepo.findMessageById.mockResolvedValue(
        makeDbMsg(1, 'player-uuid'),
      );
      mockMessageRepo.deleteMessage.mockResolvedValue(undefined);

      await expect(
        service.deleteMessage(1, 'player-uuid'),
      ).resolves.toBeUndefined();
      expect(mockMessageRepo.deleteMessage).toHaveBeenCalledWith(1);
    });

    it('throws when sender does not own the message', async () => {
      mockMessageRepo.findMessageById.mockResolvedValue(
        makeDbMsg(1, 'owner-uuid'),
      );

      await expect(service.deleteMessage(1, 'other-uuid')).rejects.toThrow(
        'does not have permission',
      );
    });
  });
});
