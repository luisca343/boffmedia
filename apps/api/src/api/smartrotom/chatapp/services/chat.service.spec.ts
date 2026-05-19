import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { ChatService } from './chat.service';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MEMBER_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';

const mockChatRepo = {
  findUserChats: jest.fn(),
  findChatByName: jest.fn(),
  findChatById: jest.fn(),
  createChat: jest.fn(),
  updateChat: jest.fn(),
  deleteChat: jest.fn(),
};

const mockMemberRepo = {
  addChatMember: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const makeChat = (id: number, name = 'chat', type = 2) =>
  ({ id, name, type }) as any;

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: Logger, useValue: mockLogger },
        { provide: CHAT_REPOSITORY_TOKEN, useValue: mockChatRepo },
        { provide: CHAT_MEMBER_REPOSITORY_TOKEN, useValue: mockMemberRepo },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createChat ───────────────────────────────────────────────────────────────

  describe('createChat()', () => {
    describe('single user chat (type=1)', () => {
      it('returns existing chat id when same-name chat already exists', async () => {
        mockChatRepo.findUserChats.mockResolvedValue([
          makeChat(5, 'Mensajes Guardados', 1),
        ]);

        const result = await service.createChat({
          player: 'uuid-A',
          users: [],
          name: 'Mensajes Guardados',
        });

        expect(result).toBe(5);
        expect(mockChatRepo.createChat).not.toHaveBeenCalled();
      });

      it('creates new single-user chat when not found', async () => {
        mockChatRepo.findUserChats.mockResolvedValue([]);
        mockChatRepo.createChat.mockResolvedValue({ insertId: 10 });

        const result = await service.createChat({
          player: 'uuid-A',
          users: [],
          name: 'Mensajes Guardados',
        });

        expect(result).toBe(10);
        expect(mockChatRepo.createChat).toHaveBeenCalled();
        expect(mockMemberRepo.addChatMember).toHaveBeenCalledWith(10, 'uuid-A');
      });
    });

    describe('private chat between two users (type=2)', () => {
      it('returns existing chat when private chat between two users exists', async () => {
        const chatName = ['uuid-A', 'uuid-B'].sort().join('_');
        mockChatRepo.findChatByName.mockResolvedValue(makeChat(7, chatName, 2));

        const result = await service.createChat({
          player: 'uuid-A',
          users: ['uuid-B'],
          name: 'ignored',
        });

        expect(result).toBe(7);
        expect(mockChatRepo.createChat).not.toHaveBeenCalled();
      });

      it('creates new private chat when none exists', async () => {
        mockChatRepo.findChatByName.mockResolvedValue(null);
        mockChatRepo.createChat.mockResolvedValue({ insertId: 20 });

        const result = await service.createChat({
          player: 'uuid-A',
          users: ['uuid-B'],
          name: 'ignored',
        });

        expect(result).toBe(20);
        expect(mockMemberRepo.addChatMember).toHaveBeenCalledWith(
          20,
          expect.any(String),
        );
      });
    });

    describe('group chat (type=3)', () => {
      it('creates group chat when 3+ unique users', async () => {
        mockChatRepo.createChat.mockResolvedValue({ insertId: 30 });

        const result = await service.createChat({
          player: 'uuid-A',
          users: ['uuid-B', 'uuid-C'],
          name: 'My Group',
        });

        expect(result).toBe(30);
        expect(mockChatRepo.createChat).toHaveBeenCalledWith(
          expect.objectContaining({ type: 3 }),
        );
        // All 3 members added
        expect(mockMemberRepo.addChatMember).toHaveBeenCalledTimes(3);
      });
    });
  });

  // ─── getChatById ──────────────────────────────────────────────────────────────

  describe('getChatById()', () => {
    it('returns chat when found', async () => {
      const chat = makeChat(1);
      mockChatRepo.findChatById.mockResolvedValue(chat);

      await expect(service.getChatById(1)).resolves.toEqual(chat);
    });

    it('throws when chat not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(service.getChatById(99)).rejects.toThrow('Chat not found');
    });
  });

  // ─── deleteChat ───────────────────────────────────────────────────────────────

  describe('deleteChat()', () => {
    it('deletes existing chat', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1));
      mockChatRepo.deleteChat.mockResolvedValue(undefined);

      await expect(service.deleteChat(1)).resolves.toBeUndefined();
      expect(mockChatRepo.deleteChat).toHaveBeenCalledWith(1);
    });

    it('throws when chat not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(service.deleteChat(99)).rejects.toThrow('Chat not found');
    });
  });

  // ─── validateChatExists / validateUserInChat ──────────────────────────────────

  describe('validateChatExists()', () => {
    it('returns true when chat exists', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1));

      await expect(service.validateChatExists(1)).resolves.toBe(true);
    });

    it('returns false when chat not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(service.validateChatExists(99)).resolves.toBe(false);
    });
  });
});
