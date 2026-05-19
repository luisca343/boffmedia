import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { MessageService } from './messages.service';
import { FICUSAI_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { MessageSender } from '../enums/message-sender.enum';
import { MessagePartType } from '../dto/message-part.dto';

const mockRepo = {
  findByUuid: jest.fn(),
  findRecentByUuid: jest.fn(),
  create: jest.fn(),
  deleteByUuid: jest.fn(),
  countByUuid: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const UUID = 'player-uuid';

const makeDbMsg = (content: object) => ({ content: JSON.stringify(content) });

const msgContent = {
  sender: MessageSender.BOT,
  parts: [{ type: MessagePartType.TEXT, content: 'Hello!' }],
};

describe('MessageService (ficusai)', () => {
  let service: MessageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: Logger, useValue: mockLogger },
        { provide: FICUSAI_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getMessages ──────────────────────────────────────────────────────────────

  describe('getMessages()', () => {
    it('returns parsed messages in chronological order (reversed)', async () => {
      const msg1 = makeDbMsg({
        sender: 'user',
        parts: [{ type: 'text', content: 'First' }],
      });
      const msg2 = makeDbMsg({
        sender: 'bot',
        parts: [{ type: 'text', content: 'Second' }],
      });
      // findByUuid returns newest-first; reversed = chronological
      mockRepo.findByUuid.mockResolvedValue([msg2, msg1]);

      const result = await service.getMessages(UUID);

      expect(result).toHaveLength(2);
      expect((result[0] as any).parts[0].content).toBe('First');
      expect((result[1] as any).parts[0].content).toBe('Second');
    });

    it('skips malformed messages silently', async () => {
      mockRepo.findByUuid.mockResolvedValue([
        { content: 'not-json' },
        makeDbMsg(msgContent),
      ]);

      const result = await service.getMessages(UUID);

      expect(result).toHaveLength(1);
    });

    it('uses default limit of 20', async () => {
      mockRepo.findByUuid.mockResolvedValue([]);

      await service.getMessages(UUID);

      expect(mockRepo.findByUuid).toHaveBeenCalledWith(UUID, 20);
    });

    it('throws when uuid is empty', async () => {
      await expect(service.getMessages('')).rejects.toThrow('UUID is required');
    });

    it('throws when uuid is whitespace only', async () => {
      await expect(service.getMessages('   ')).rejects.toThrow(
        'UUID is required',
      );
    });
  });

  // ─── storeMessage ─────────────────────────────────────────────────────────────

  describe('storeMessage()', () => {
    it('stores message and returns created entity', async () => {
      const created = {
        id: 1,
        uuid: UUID,
        content: JSON.stringify(msgContent),
      } as any;
      mockRepo.create.mockResolvedValue(created);

      const result = await service.storeMessage(UUID, msgContent);

      expect(result).toEqual(created);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ uuid: UUID, content: msgContent }),
      );
    });
  });

  // ─── getMessagesForContext ────────────────────────────────────────────────────

  describe('getMessagesForContext()', () => {
    it('returns last N messages filtered of nulls (no malformed)', async () => {
      mockRepo.findRecentByUuid.mockResolvedValue([makeDbMsg(msgContent)]);

      const result = await service.getMessagesForContext(UUID, 5);

      expect(result).toHaveLength(1);
      expect(mockRepo.findRecentByUuid).toHaveBeenCalledWith(UUID, 5);
    });

    it('filters out malformed messages', async () => {
      mockRepo.findRecentByUuid.mockResolvedValue([
        { content: 'bad-json' },
        makeDbMsg(msgContent),
      ]);

      const result = await service.getMessagesForContext(UUID);

      expect(result).toHaveLength(1);
    });
  });

  // ─── deleteUserMessages ───────────────────────────────────────────────────────

  describe('deleteUserMessages()', () => {
    it('returns true on success', async () => {
      mockRepo.deleteByUuid.mockResolvedValue(true);

      await expect(service.deleteUserMessages(UUID)).resolves.toBe(true);
      expect(mockRepo.deleteByUuid).toHaveBeenCalledWith(UUID);
    });
  });

  // ─── getUserMessageCount ──────────────────────────────────────────────────────

  describe('getUserMessageCount()', () => {
    it('returns count from repo', async () => {
      mockRepo.countByUuid.mockResolvedValue(7);

      await expect(service.getUserMessageCount(UUID)).resolves.toBe(7);
    });
  });

  // ─── createWelcomeMessage ─────────────────────────────────────────────────────

  describe('createWelcomeMessage()', () => {
    it('stores and returns a bot welcome message', async () => {
      mockRepo.create.mockResolvedValue({} as any);

      const result = await service.createWelcomeMessage(UUID);

      expect(result.sender).toBe(MessageSender.BOT);
      expect(result.parts[0].type).toBe(MessagePartType.TEXT);
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });
});
