import { Test, TestingModule } from '@nestjs/testing';
import { SocketsGateway } from './sockets.gateway';
import { PresenceService } from './presence.service';
import { ChatappFacadeService } from '@api/smartrotom/chatapp/chatapp.facade.service';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';

/**
 * Tests for global presence bookkeeping in the socket gateway.
 *
 * Key scenarios:
 * 1. Connection sends full presence list to new client
 * 2. User disconnect removes from presence
 * 3. Presence broadcast reaches all clients
 * 4. Multi-connection from same user (multi-tab) is handled correctly
 */

describe('SocketsGateway - Presence', () => {
  let gateway: SocketsGateway;
  let presenceService: PresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketsGateway,
        PresenceService,
        {
          provide: ChatappFacadeService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<SocketsGateway>(SocketsGateway);
    presenceService = module.get<PresenceService>(PresenceService);
  });

  describe('sendPresenceList', () => {
    it('sends initial online list to connecting client', () => {
      // Add two users to presence
      presenceService.setOnline('uuid-1', false);
      presenceService.setOnline('uuid-2', true);

      gateway.users.set('uuid-1', { uuid: 'uuid-1', socketId: 'socket-1' });
      gateway.users.set('uuid-2', { uuid: 'uuid-2', socketId: 'socket-2' });

      // Mock socket
      const mockSocket = {
        emit: jest.fn(),
      };

      // Call the private method through gateway instance
      const sendPresenceList = (gateway as any).sendPresenceList.bind(gateway);
      sendPresenceList(mockSocket);

      // Should emit presence:list with all online users
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'presence:list',
        expect.arrayContaining([
          { uuid: 'uuid-1', status: 'online' },
          { uuid: 'uuid-2', status: 'ingame' },
        ]),
      );
    });

    it('sends empty list when no users are online', () => {
      const mockSocket = {
        emit: jest.fn(),
      };

      const sendPresenceList = (gateway as any).sendPresenceList.bind(gateway);
      sendPresenceList(mockSocket);

      expect(mockSocket.emit).toHaveBeenCalledWith('presence:list', []);
    });

    it('only includes online users in presence list', () => {
      presenceService.setOnline('uuid-1', false);
      presenceService.setOnline('uuid-2', true);
      presenceService.setOnline('uuid-3', false);

      gateway.users.set('uuid-1', { uuid: 'uuid-1', socketId: 'socket-1' });
      gateway.users.set('uuid-2', { uuid: 'uuid-2', socketId: 'socket-2' });
      gateway.users.set('uuid-3', { uuid: 'uuid-3', socketId: 'socket-3' });

      const mockSocket = {
        emit: jest.fn(),
      };

      const sendPresenceList = (gateway as any).sendPresenceList.bind(gateway);
      sendPresenceList(mockSocket);

      // All users in users map should be in the list
      // (offline status is still sent, clients need to know who's offline)
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'presence:list',
        expect.arrayContaining([
          { uuid: 'uuid-1', status: 'online' },
          { uuid: 'uuid-2', status: 'ingame' },
          { uuid: 'uuid-3', status: 'online' },
        ]),
      );
    });
  });

  /** These drive the REAL handleDisconnect. The first version of this file
   *  re-implemented the disconnect loop inside the test, so it passed no matter
   *  what the gateway did — and it was passing while the gateway still dropped a
   *  two-tab user offline. */
  const connect = (uuid: string, socketId: string, inGame = false) => {
    const client: any = {
      id: socketId,
      identity: { mcUuid: uuid },
      emit: jest.fn(),
    };
    gateway.handleSmartRotomConnection(client, { inGame });
    return client;
  };

  beforeEach(() => {
    // handleSmartRotomConnection and handleDisconnect both broadcast.
    (gateway as any).server = {
      emit: jest.fn(),
      sockets: { sockets: new Map() },
    };
  });

  describe('multi-tab user handling', () => {
    it('keeps a user online when one of two tabs closes', () => {
      const uuid = 'user-multi-tab';
      const tab1 = connect(uuid, 'socket-tab-1');
      connect(uuid, 'socket-tab-2');

      gateway.handleDisconnect(tab1 as any);

      expect(presenceService.isOnline(uuid)).toBe(true);
      expect(gateway.users.has(uuid)).toBe(true);
    });

    it('keeps them online when the NEWER tab closes first', () => {
      // The regression this file exists for: `users` held only the newest
      // socket, so closing it took the player offline while tab 1 was live.
      const uuid = 'user-multi-tab-reverse';
      connect(uuid, 'socket-tab-1');
      const tab2 = connect(uuid, 'socket-tab-2');

      gateway.handleDisconnect(tab2 as any);

      expect(presenceService.isOnline(uuid)).toBe(true);
      // And the surviving tab is the one a targeted emit will now reach.
      expect(gateway.users.get(uuid)?.socketId).toBe('socket-tab-1');
    });

    it('goes offline only once the last tab closes', () => {
      const uuid = 'user-last-tab';
      const tab1 = connect(uuid, 'socket-tab-1');
      const tab2 = connect(uuid, 'socket-tab-2');

      gateway.handleDisconnect(tab1 as any);
      gateway.handleDisconnect(tab2 as any);

      expect(presenceService.isOnline(uuid)).toBe(false);
      expect(gateway.users.has(uuid)).toBe(false);
    });
  });

  describe('presence cleanup on disconnect', () => {
    it('takes a single-tab user offline and tells everyone', () => {
      const uuid = 'user-to-disconnect';
      const client = connect(uuid, 'socket-1');

      gateway.handleDisconnect(client as any);

      expect(presenceService.isOnline(uuid)).toBe(false);
      expect((gateway as any).server.emit).toHaveBeenCalledWith(
        'presence:update',
        expect.objectContaining({ uuid }),
      );
    });

    it('ignores a socket that never registered presence', () => {
      const uuid = 'user-still-here';
      connect(uuid, 'socket-1');

      gateway.handleDisconnect({ id: 'some-other-socket' } as any);

      expect(presenceService.isOnline(uuid)).toBe(true);
    });
  });
});
