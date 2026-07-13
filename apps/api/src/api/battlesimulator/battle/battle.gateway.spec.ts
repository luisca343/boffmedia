import { BattleGateway } from './battle.gateway';

function mockSocket() {
  return { emit: jest.fn(), id: Math.random().toString(36).slice(2) } as any;
}

function mockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any;
}

describe('BattleGateway — chatMessage', () => {
  let gateway: BattleGateway;
  let p1Socket: any;
  let p2Socket: any;
  let strangerSocket: any;

  const ROOM = 'room-1';

  beforeEach(() => {
    gateway = new BattleGateway(mockLogger(), {} as any, {} as any);

    p1Socket = mockSocket();
    p2Socket = mockSocket();
    strangerSocket = mockSocket();

    gateway.handleRegister(p1Socket, { clientId: 'alice' });
    gateway.handleRegister(p2Socket, { clientId: 'bob' });
    gateway.handleRegister(strangerSocket, { clientId: 'mallory' });

    // Place alice and bob in the same room
    const clients = (gateway as any).clients as Map<string, any>;
    clients.get('alice').roomIds.set(ROOM, 'p1');
    clients.get('bob').roomIds.set(ROOM, 'p2');

    // Clear the 'connected' emits from registration
    p1Socket.emit.mockClear();
    p2Socket.emit.mockClear();
    strangerSocket.emit.mockClear();
  });

  it('broadcasts a chat message to both room members with sender and timestamp', () => {
    gateway.handleChatMessage(p1Socket, { roomId: ROOM, message: 'hola!' });

    for (const sock of [p1Socket, p2Socket]) {
      expect(sock.emit).toHaveBeenCalledWith(
        'chatMessage',
        expect.objectContaining({
          roomId: ROOM,
          sender: 'alice',
          message: 'hola!',
          timestamp: expect.any(Number),
        }),
      );
    }
    expect(strangerSocket.emit).not.toHaveBeenCalledWith(
      'chatMessage',
      expect.anything(),
    );
  });

  it('rejects messages from clients outside the room', () => {
    gateway.handleChatMessage(strangerSocket, {
      roomId: ROOM,
      message: 'intrusión',
    });

    expect(strangerSocket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ roomId: ROOM, message: 'Not in this battle' }),
    );
    expect(p1Socket.emit).not.toHaveBeenCalledWith(
      'chatMessage',
      expect.anything(),
    );
    expect(p2Socket.emit).not.toHaveBeenCalledWith(
      'chatMessage',
      expect.anything(),
    );
  });

  it('ignores empty messages and truncates messages over 300 chars', () => {
    gateway.handleChatMessage(p1Socket, { roomId: ROOM, message: '   ' });
    expect(p2Socket.emit).not.toHaveBeenCalled();

    const long = 'x'.repeat(500);
    gateway.handleChatMessage(p1Socket, { roomId: ROOM, message: long });
    expect(p2Socket.emit).toHaveBeenCalledWith(
      'chatMessage',
      expect.objectContaining({ message: 'x'.repeat(300) }),
    );
  });

  it('delivers to the current socket after a reconnect', () => {
    const newP2Socket = mockSocket();
    gateway.handleRegister(newP2Socket, { clientId: 'bob' });
    newP2Socket.emit.mockClear();

    gateway.handleChatMessage(p1Socket, {
      roomId: ROOM,
      message: 'sigues ahí?',
    });

    expect(newP2Socket.emit).toHaveBeenCalledWith(
      'chatMessage',
      expect.objectContaining({ message: 'sigues ahí?' }),
    );
    expect(p2Socket.emit).not.toHaveBeenCalledWith(
      'chatMessage',
      expect.anything(),
    );
  });
});
