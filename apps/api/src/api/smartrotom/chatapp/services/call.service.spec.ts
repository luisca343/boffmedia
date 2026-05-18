import { Test, TestingModule } from '@nestjs/testing';
import { CallService } from './call.service';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MEMBER_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';

const mockChatRepo = {
  findChatById: jest.fn(),
};

const mockMemberRepo = {
  findUserInChat: jest.fn(),
  findChatMembers: jest.fn(),
};

const mockMessageRepo = {
  createMessage: jest.fn(),
};

const makeChat = (id: number) => ({ id, name: 'group', type: 3 }) as any;
const makeMember = (uuid: string, username = 'Player') => ({ uuid, username }) as any;

describe('CallService', () => {
  let service: CallService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallService,
        { provide: CHAT_REPOSITORY_TOKEN, useValue: mockChatRepo },
        { provide: CHAT_MEMBER_REPOSITORY_TOKEN, useValue: mockMemberRepo },
        { provide: CHAT_MESSAGE_REPOSITORY_TOKEN, useValue: mockMessageRepo },
      ],
    }).compile();

    service = module.get<CallService>(CallService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── initializeCall ───────────────────────────────────────────────────────────

  describe('initializeCall()', () => {
    it('returns call session with caller IN_CALL and others RINGING', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1));
      mockMemberRepo.findUserInChat.mockResolvedValue(makeMember('caller-uuid'));
      mockMemberRepo.findChatMembers.mockResolvedValue([
        makeMember('caller-uuid', 'Ash'),
        makeMember('other-uuid', 'Misty'),
      ]);

      const session = await service.initializeCall(1, 'caller-uuid');

      expect(session.chatId).toBe(1);
      expect(session.caller).toBe('caller-uuid');
      expect(session.callId).toMatch(/^[0-9a-f-]{36}$/);

      const caller = session.users.find((u) => u.uuid === 'caller-uuid');
      const other = session.users.find((u) => u.uuid === 'other-uuid');
      expect(caller!.status).toBe('IN_CALL');
      expect(other!.status).toBe('RINGING');
    });

    it('throws when chat not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(service.initializeCall(99, 'caller-uuid')).rejects.toThrow('Chat not found');
    });

    it('throws when caller is not a chat member', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1));
      mockMemberRepo.findUserInChat.mockResolvedValue(null);

      await expect(service.initializeCall(1, 'stranger')).rejects.toThrow(
        'Caller is not a member',
      );
    });

    it('throws when no other members exist to call', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1));
      mockMemberRepo.findUserInChat.mockResolvedValue(makeMember('caller-uuid'));
      mockMemberRepo.findChatMembers.mockResolvedValue([makeMember('caller-uuid')]);

      await expect(service.initializeCall(1, 'caller-uuid')).rejects.toThrow(
        'No other users in chat',
      );
    });
  });

  // ─── endCall ──────────────────────────────────────────────────────────────────

  describe('endCall()', () => {
    it('creates call duration message and returns messageId and duration', async () => {
      const startTime = Date.now() - 30_000; // 30 seconds ago
      mockMessageRepo.createMessage.mockResolvedValue({ insertId: 99 });

      const result = await service.endCall(1, startTime);

      expect(result.messageId).toBe(99);
      expect(result.duration).toBeGreaterThanOrEqual(29);
      expect(mockMessageRepo.createMessage).toHaveBeenCalledWith(
        expect.objectContaining({ chatId: 1, type: 'call', senderUUID: 'system' }),
      );
    });
  });

  // ─── validateCallPermissions ──────────────────────────────────────────────────

  describe('validateCallPermissions()', () => {
    it('returns true when user is in chat', async () => {
      mockMemberRepo.findUserInChat.mockResolvedValue(makeMember('uuid'));

      await expect(service.validateCallPermissions(1, 'uuid')).resolves.toBe(true);
    });

    it('returns false when user is not in chat', async () => {
      mockMemberRepo.findUserInChat.mockResolvedValue(null);

      await expect(service.validateCallPermissions(1, 'stranger')).resolves.toBe(false);
    });
  });
});
