import { ForbiddenException } from '@nestjs/common';
import { SocketsGateway } from './sockets.gateway';

// Call signalling used to trust the client body for both membership and the
// recipient list, which let any authenticated socket ring — or hang up on —
// a conversation it was not in. These tests hold the line: identity comes from
// the socket, recipients come from the chat.

const ACTOR = 'aaaaaaaa-0000-0000-0000-000000000001';
const PEER = 'bbbbbbbb-0000-0000-0000-000000000002';
const STRANGER = 'cccccccc-0000-0000-0000-000000000003';

const socket = (mcUuid: string | null, id = 'sock-actor') =>
  ({
    id,
    identity: mcUuid ? { userId: 1, mcUuid } : { userId: 1 },
    emit: jest.fn(),
  }) as never;

const payload = (
  chatId: number,
  users: { uuid: string; status: string }[],
) => ({
  call: { chatId, users, caller: ACTOR },
  user: { uuid: ACTOR },
  startTime: 1_700_000_000,
});

describe('SocketsGateway — call membership', () => {
  let gateway: SocketsGateway;
  let chat: { getChatById: jest.Mock; endCall: jest.Mock };
  let emit: jest.Mock;
  let to: jest.Mock;
  let logger: { log: jest.Mock; warn: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    chat = { getChatById: jest.fn(), endCall: jest.fn() };
    logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    gateway = new SocketsGateway(
      logger as never,
      chat as never,
      { get: jest.fn(), setOnline: jest.fn(), setOffline: jest.fn() } as never,
      { verify: jest.fn() } as never,
    );

    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    gateway.server = {
      to,
      emit: jest.fn(),
      sockets: { sockets: { size: 2 } },
    } as never;

    // Both the peer and an unrelated stranger hold live sockets.
    gateway.users.set(PEER, { uuid: PEER, socketId: 'sock-peer' });
    gateway.users.set(STRANGER, { uuid: STRANGER, socketId: 'sock-stranger' });
  });

  describe('chat:joincall', () => {
    it('refuses a socket with no proven Minecraft identity', async () => {
      await gateway.handleChatJoin(socket(null), payload(5, []) as never);
      expect(chat.getChatById).not.toHaveBeenCalled();
      expect(to).not.toHaveBeenCalled();
    });

    it('checks membership with the socket identity, never the body', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleChatJoin(socket(ACTOR), {
        call: { chatId: 5, users: [], caller: STRANGER },
        user: { uuid: STRANGER },
      } as never);
      expect(chat.getChatById).toHaveBeenCalledWith(5, ACTOR);
    });

    it('refuses a non-member: nothing is emitted anywhere', async () => {
      chat.getChatById.mockRejectedValue(
        new ForbiddenException('not a member'),
      );
      await gateway.handleChatJoin(
        socket(ACTOR),
        payload(5, [{ uuid: PEER, status: 'IN_CALL' }]) as never,
      );
      expect(to).not.toHaveBeenCalled();
    });

    it('derives recipients from chat membership, not the client payload', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      // The body names a stranger; only the real member may be reached.
      await gateway.handleChatJoin(
        socket(ACTOR),
        payload(5, [{ uuid: STRANGER, status: 'IN_CALL' }]) as never,
      );

      expect(to).toHaveBeenCalledTimes(1);
      expect(to).toHaveBeenCalledWith('sock-peer');
      expect(emit).toHaveBeenCalledWith('chat:joincall', { uuid: ACTOR });
    });

    it('does not echo the signal back to the actor', async () => {
      gateway.users.set(ACTOR, { uuid: ACTOR, socketId: 'sock-actor' });
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleChatJoin(socket(ACTOR), payload(5, []) as never);
      expect(to).not.toHaveBeenCalledWith('sock-actor');
    });
  });

  describe('chat:exitcall', () => {
    it('refuses a socket with no proven Minecraft identity', async () => {
      await gateway.handleChatExit(socket(null), payload(5, []) as never);
      expect(chat.getChatById).not.toHaveBeenCalled();
      expect(chat.endCall).not.toHaveBeenCalled();
    });

    it('does NOT call endCall for a chat the socket is not in', async () => {
      chat.getChatById.mockRejectedValue(
        new ForbiddenException('not a member'),
      );
      // An empty remaining-users list is exactly what would otherwise end the call.
      await gateway.handleChatExit(socket(STRANGER), payload(5, []) as never);
      expect(chat.endCall).not.toHaveBeenCalled();
      expect(to).not.toHaveBeenCalled();
    });

    it('fans out to proven members only', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleChatExit(
        socket(ACTOR),
        payload(5, [{ uuid: STRANGER, status: 'IN_CALL' }]) as never,
      );
      expect(to).toHaveBeenCalledTimes(1);
      expect(to).toHaveBeenCalledWith('sock-peer');
      expect(emit).toHaveBeenCalledWith('chat:exitcall', expect.any(Object));
    });

    it('ends the call on the verified chatId once nobody else is in it', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleChatExit(
        socket(ACTOR),
        payload(5, [{ uuid: ACTOR, status: 'IN_CALL' }]) as never,
      );
      expect(chat.endCall).toHaveBeenCalledWith(5, 1_700_000_000);
    });

    it('leaves the call open while another participant is still in it', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleChatExit(
        socket(ACTOR),
        payload(5, [{ uuid: PEER, status: 'IN_CALL' }]) as never,
      );
      expect(chat.endCall).not.toHaveBeenCalled();
    });
  });

  describe('typing indicators', () => {
    it('will not broadcast typing into a chat the socket is not in', async () => {
      chat.getChatById.mockRejectedValue(
        new ForbiddenException('not a member'),
      );
      await gateway.handleTypingStart(socket(ACTOR), { chatId: 5 } as never);
      await gateway.handleTypingStop(socket(ACTOR), { chatId: 5 } as never);
      expect(to).not.toHaveBeenCalled();
    });

    it('broadcasts typing to the other members only', async () => {
      chat.getChatById.mockResolvedValue({
        members: [{ uuid: ACTOR }, { uuid: PEER }],
      });
      await gateway.handleTypingStart(socket(ACTOR), {
        chatId: 5,
        username: 'ash',
      } as never);
      expect(to).toHaveBeenCalledWith('sock-peer');
      expect(emit).toHaveBeenCalledWith('chat:typing:start', {
        chatId: 5,
        uuid: ACTOR,
        username: 'ash',
      });
    });
  });
});
