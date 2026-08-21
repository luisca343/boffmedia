import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import {
  CHAT_REPOSITORY_TOKEN,
  CHAT_MEMBER_REPOSITORY_TOKEN,
  CHAT_MESSAGE_REPOSITORY_TOKEN,
  CHAT_USER_REPOSITORY_TOKEN,
} from '@api/_utils/repositories/interfaces/chatapp.repository.token';
import { IChatRepository } from '../repositories/interfaces/chat.repository.interface';
import { IMemberRepository } from '../repositories/interfaces/chat-member.repository.interface';
import { IMessageRepository } from '../repositories/interfaces/chat-message.repository.interface';
import { IUserRepository } from '../repositories/interfaces/chat-user.repository.interface';
import { Group } from '../entities/group.entity';
import { RotomChat } from '@/_db/schema/SmartRotomChat';
import {
  PresenceService,
  PresenceStatus,
} from '@api/_utils/sockets/presence.service';
import { ApiErrorCode } from '@/common/errors/error-codes.generated';
import { ASSET } from '@boffmedia/asset-paths';

@Injectable()
export class GroupService {
  constructor(
    @Inject(CHAT_REPOSITORY_TOKEN)
    private readonly chatRepository: IChatRepository,
    @Inject(CHAT_MEMBER_REPOSITORY_TOKEN)
    private readonly chatMemberRepository: IMemberRepository,
    @Inject(CHAT_MESSAGE_REPOSITORY_TOKEN)
    private readonly chatMessageRepository: IMessageRepository,
    @Inject(CHAT_USER_REPOSITORY_TOKEN)
    private readonly chatUserRepository: IUserRepository,
    private readonly presence: PresenceService,
  ) {}

  async getUserGroups(uuid: string): Promise<Group[]> {
    const userChats = await this.chatRepository.findUserChats(uuid);

    const groups = await Promise.all(
      userChats.map(async (chat) => {
        return this.buildGroupFromChat(chat, uuid);
      }),
    );

    // Sort by last message date
    groups.sort((a, b) => {
      const aDate = a.messages[0]?.createdAt || new Date(0);
      const bDate = b.messages[0]?.createdAt || new Date(0);
      return bDate.getTime() - aDate.getTime();
    });

    return groups;
  }

  async getGroupById(
    groupId: number,
    requestingUserUuid: string,
  ): Promise<Group> {
    const chat = await this.chatRepository.findChatById(groupId);
    if (!chat) {
      throw new Error('Group not found');
    }

    const userInChat = await this.chatMemberRepository.findUserInChat(
      groupId,
      requestingUserUuid,
    );
    if (!userInChat && chat.type !== 0) {
      // Type 0 = public chats
      throw new ForbiddenException({
        message: 'User does not have access to this group',
        code: ApiErrorCode.CHAT_GROUP_NO_ACCESS,
        userMessage: 'No tienes acceso a este grupo.',
      });
    }

    return this.buildGroupFromChat(chat, requestingUserUuid);
  }

  async addMemberToGroup(
    groupId: number,
    uuid: string,
    requestingUserUuid: string,
  ): Promise<void> {
    const chat = await this.chatRepository.findChatById(groupId);
    if (!chat) {
      throw new Error('Group not found');
    }

    // Validate requesting user has access to add members (for group chats)
    if (chat.type === 3) {
      // Group chat
      const requestingUserInChat =
        await this.chatMemberRepository.findUserInChat(
          groupId,
          requestingUserUuid,
        );
      if (!requestingUserInChat) {
        throw new Error(
          'User does not have permission to add members to this group',
        );
      }
    }

    // Check if user is already a member
    const existingMember = await this.chatMemberRepository.findUserInChat(
      groupId,
      uuid,
    );
    if (existingMember) {
      throw new Error('User is already a member of this group');
    }

    await this.chatMemberRepository.addChatMember(groupId, uuid);
  }

  async removeMemberFromGroup(
    groupId: number,
    uuid: string,
    requestingUserUuid: string,
  ): Promise<void> {
    const chat = await this.chatRepository.findChatById(groupId);
    if (!chat) {
      throw new Error('Group not found');
    }

    // Users can remove themselves, or group members can remove others in group chats
    if (uuid !== requestingUserUuid && chat.type === 3) {
      const requestingUserInChat =
        await this.chatMemberRepository.findUserInChat(
          groupId,
          requestingUserUuid,
        );
      if (!requestingUserInChat) {
        throw new Error(
          'User does not have permission to remove members from this group',
        );
      }
    }

    const existingMember = await this.chatMemberRepository.findUserInChat(
      groupId,
      uuid,
    );
    if (!existingMember) {
      throw new Error('User is not a member of this group');
    }

    await this.chatMemberRepository.removeChatMember(groupId, uuid);
  }

  async setPinned(
    chatId: number,
    uuid: string,
    pinned: boolean,
  ): Promise<void> {
    await this.chatMemberRepository.setPinned(chatId, uuid, pinned);
  }

  async setMuted(chatId: number, uuid: string, muted: boolean): Promise<void> {
    await this.chatMemberRepository.setMuted(chatId, uuid, muted);
  }

  private async buildGroupFromChat(
    chat: RotomChat,
    requestingUserUuid: string,
  ): Promise<Group> {
    // Get recent messages
    const messages = await this.chatMessageRepository.findChatMessages(
      chat.id,
      50,
    );

    // Get members
    const members = await this.chatMemberRepository.findChatMembers(chat.id);

    // Determine chat name and image based on type
    let chatName = chat.name;
    let chatImage = chat.image || 'default.webp';

    if (chat.type === 0 || chat.type === 3) {
      // Public or group chat - use configured name and image
      chatName = chat.name;
      chatImage = `${ASSET.smartrotom.img}/apps/chatapp/${chatImage}`;
    } else if (chat.type === 1) {
      // Single user chat (saved messages)
      chatName = 'Mensajes guardados';
      chatImage = `https://mc-heads.net/avatar/${requestingUserUuid}`;
    } else if (chat.type === 2) {
      // Private chat - get other user's name
      const otherPlayerUUID = chat.name
        .split('_')
        .filter((name) => name !== requestingUserUuid)[0];
      if (otherPlayerUUID) {
        const otherUser =
          await this.chatUserRepository.findUserByUuid(otherPlayerUUID);
        chatName = otherUser?.username || 'Unknown User';
        chatImage = `https://mc-heads.net/avatar/${otherPlayerUUID}`;
      } else {
        chatName = 'Private Chat';
        chatImage = `https://mc-heads.net/avatar/${requestingUserUuid}`;
      }
    }

    // ── Enrichment: reactions, read receipts / status, unread, presence, flags ──
    const messageIds = messages.map((m) => m.id);
    const [reactionRows, readRows, flags, unread] = await Promise.all([
      this.chatMessageRepository.findReactionsForMessages(messageIds),
      this.chatMessageRepository.findReadsForMessages(messageIds),
      this.chatMemberRepository.findMemberFlags(chat.id, requestingUserUuid),
      // Counted over the chat's whole history, not just the 50 loaded above.
      this.chatMessageRepository.countUnreadMessages(
        chat.id,
        requestingUserUuid,
      ),
    ]);

    const reactionsByMsg = new Map<number, Map<string, string[]>>();
    for (const r of reactionRows) {
      if (!reactionsByMsg.has(r.messageId))
        reactionsByMsg.set(r.messageId, new Map());
      const em = reactionsByMsg.get(r.messageId)!;
      em.set(r.emoji, [...(em.get(r.emoji) ?? []), r.uuid]);
    }
    const readsByMsg = new Map<number, Set<string>>();
    for (const rd of readRows) {
      if (!readsByMsg.has(rd.messageId))
        readsByMsg.set(rd.messageId, new Set());
      readsByMsg.get(rd.messageId)!.add(rd.uuid);
    }
    const memberUuids = members.map((m) => m.uuid);

    const enrichedMessages = messages.map((m) => {
      const emojiMap = reactionsByMsg.get(m.id);
      const reactions = emojiMap
        ? Array.from(emojiMap.entries()).map(([emoji, by]) => ({ emoji, by }))
        : [];
      const others = memberUuids.filter((u) => u !== m.uuid);
      const readSet = readsByMsg.get(m.id);
      const readByAll =
        others.length > 0 && others.every((u) => readSet?.has(u));
      const deliveredToAny = others.some((u) => this.presence.isOnline(u));
      const status: 'sent' | 'delivered' | 'read' = readByAll
        ? 'read'
        : deliveredToAny
          ? 'delivered'
          : 'sent';
      return { ...m, reactions, status };
    });

    let presence: PresenceStatus | undefined;
    if (chat.type === 2) {
      const other = memberUuids.find((u) => u !== requestingUserUuid);
      if (other) presence = this.presence.get(other);
    }

    return {
      id: chat.id,
      name: chatName,
      type: chat.type,
      description: chat.description,
      image: chatImage,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt!,
      messages: enrichedMessages,
      unread,
      members: members,
      presence,
      pinned: flags.pinned,
      muted: flags.muted,
    };
  }
}
