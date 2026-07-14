import { Test, TestingModule } from '@nestjs/testing';
import { GroupService } from './group.service';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MEMBER_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
  CHAT_USER_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { PresenceService } from '@api/_utils/sockets/presence.service';

const mockChatRepo = {
  findUserChats: jest.fn(),
  findChatById: jest.fn(),
};

const mockMemberRepo = {
  findUserInChat: jest.fn(),
  findChatMembers: jest.fn(),
  addChatMember: jest.fn(),
  removeChatMember: jest.fn(),
  findMemberFlags: jest.fn(),
};

const mockMessageRepo = {
  findChatMessages: jest.fn(),
  findReactionsForMessages: jest.fn(),
  findReadsForMessages: jest.fn(),
};

const mockUserRepo = {
  findUserByUuid: jest.fn(),
};

const mockPresence = {
  isOnline: jest.fn(),
  get: jest.fn(),
};

const makeChat = (id: number, type: number, name = 'chat') =>
  ({
    id,
    name,
    type,
    image: null,
    description: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as any;

const makeMember = (uuid: string, username = 'Player') =>
  ({ uuid, username }) as any;

const UUID = 'player-uuid';

describe('GroupService', () => {
  let service: GroupService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Default: empty messages and members
    mockMessageRepo.findChatMessages.mockResolvedValue([]);
    mockMemberRepo.findChatMembers.mockResolvedValue([]);
    mockMessageRepo.findReactionsForMessages.mockResolvedValue([]);
    mockMessageRepo.findReadsForMessages.mockResolvedValue([]);
    mockMemberRepo.findMemberFlags.mockResolvedValue({
      pinned: false,
      muted: false,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: CHAT_REPOSITORY_TOKEN, useValue: mockChatRepo },
        { provide: CHAT_MEMBER_REPOSITORY_TOKEN, useValue: mockMemberRepo },
        { provide: CHAT_MESSAGE_REPOSITORY_TOKEN, useValue: mockMessageRepo },
        { provide: CHAT_USER_REPOSITORY_TOKEN, useValue: mockUserRepo },
        { provide: PresenceService, useValue: mockPresence },
      ],
    }).compile();

    service = module.get<GroupService>(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getUserGroups ────────────────────────────────────────────────────────────

  describe('getUserGroups()', () => {
    it('returns groups sorted by last message date (newest first)', async () => {
      const olderDate = new Date('2026-01-01');
      const newerDate = new Date('2026-06-01');

      mockChatRepo.findUserChats.mockResolvedValue([
        makeChat(1, 3, 'Old Group'),
        makeChat(2, 3, 'New Group'),
      ]);

      mockMessageRepo.findChatMessages
        .mockResolvedValueOnce([{ createdAt: olderDate }]) // chat 1
        .mockResolvedValueOnce([{ createdAt: newerDate }]); // chat 2

      const groups = await service.getUserGroups(UUID);

      expect(groups[0].id).toBe(2); // newer first
      expect(groups[1].id).toBe(1);
    });

    it('uses "Mensajes guardados" name and mc-heads avatar for type=1 (saved messages)', async () => {
      mockChatRepo.findUserChats.mockResolvedValue([
        makeChat(1, 1, 'some-name'),
      ]);

      const groups = await service.getUserGroups(UUID);

      expect(groups[0].name).toBe('Mensajes guardados');
      expect(groups[0].image).toContain(UUID);
    });

    it('resolves other user name from chat name for type=2 (private chat)', async () => {
      const otherUUID = 'other-player-uuid';
      const chatName = [UUID, otherUUID].sort().join('_');
      mockChatRepo.findUserChats.mockResolvedValue([makeChat(1, 2, chatName)]);
      mockUserRepo.findUserByUuid.mockResolvedValue({
        username: 'Misty',
        uuid: otherUUID,
      });

      const groups = await service.getUserGroups(UUID);

      expect(groups[0].name).toBe('Misty');
    });
  });

  // ─── getGroupById ─────────────────────────────────────────────────────────────

  describe('getGroupById()', () => {
    it('returns group when user has access', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      mockMemberRepo.findUserInChat.mockResolvedValue(makeMember(UUID));

      const group = await service.getGroupById(1, UUID);

      expect(group.id).toBe(1);
    });

    it('throws when group not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(service.getGroupById(99, UUID)).rejects.toThrow(
        'Group not found',
      );
    });

    it('throws when user has no access to private group chat', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3)); // type=3 (group)
      mockMemberRepo.findUserInChat.mockResolvedValue(null); // not a member

      await expect(service.getGroupById(1, UUID)).rejects.toThrow(
        'does not have access',
      );
    });

    it('allows access to public group (type=0) without membership check', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 0, 'global'));
      mockMemberRepo.findUserInChat.mockResolvedValue(null); // not a member but type=0

      const group = await service.getGroupById(1, UUID);

      expect(group.id).toBe(1);
    });
  });

  // ─── addMemberToGroup ─────────────────────────────────────────────────────────

  describe('addMemberToGroup()', () => {
    it('adds member when requester is in the group', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      mockMemberRepo.findUserInChat
        .mockResolvedValueOnce(makeMember(UUID)) // requester is member
        .mockResolvedValueOnce(null); // new user is not yet member
      mockMemberRepo.addChatMember.mockResolvedValue(undefined);

      await expect(
        service.addMemberToGroup(1, 'new-uuid', UUID),
      ).resolves.toBeUndefined();
      expect(mockMemberRepo.addChatMember).toHaveBeenCalledWith(1, 'new-uuid');
    });

    it('throws when group not found', async () => {
      mockChatRepo.findChatById.mockResolvedValue(null);

      await expect(
        service.addMemberToGroup(99, 'new-uuid', UUID),
      ).rejects.toThrow('Group not found');
    });

    it('throws when requester is not in the group', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      mockMemberRepo.findUserInChat.mockResolvedValue(null); // requester not a member

      await expect(
        service.addMemberToGroup(1, 'new-uuid', UUID),
      ).rejects.toThrow('does not have permission');
    });

    it('throws when new user is already a member', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      mockMemberRepo.findUserInChat
        .mockResolvedValueOnce(makeMember(UUID)) // requester is member
        .mockResolvedValueOnce(makeMember('new-uuid')); // new user already member

      await expect(
        service.addMemberToGroup(1, 'new-uuid', UUID),
      ).rejects.toThrow('already a member');
    });
  });

  // ─── removeMemberFromGroup ────────────────────────────────────────────────────

  describe('removeMemberFromGroup()', () => {
    it('allows user to remove themselves', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      mockMemberRepo.findUserInChat.mockResolvedValue(makeMember(UUID));
      mockMemberRepo.removeChatMember.mockResolvedValue(undefined);

      await expect(
        service.removeMemberFromGroup(1, UUID, UUID),
      ).resolves.toBeUndefined();
      expect(mockMemberRepo.removeChatMember).toHaveBeenCalledWith(1, UUID);
    });

    it('throws when target is not a member', async () => {
      mockChatRepo.findChatById.mockResolvedValue(makeChat(1, 3));
      // requester check passes (first call), member check (second call) returns null
      mockMemberRepo.findUserInChat
        .mockResolvedValueOnce(makeMember(UUID)) // requester ok
        .mockResolvedValueOnce(null); // target not a member

      await expect(
        service.removeMemberFromGroup(1, 'nonmember', UUID),
      ).rejects.toThrow('not a member');
    });
  });
});
