import { BattleGateway } from './battle.gateway';

/**
 * These cover the reason M2 exists: the gateway used to trust whatever identity
 * the client sent. Every test here is a thing that WAS possible.
 *
 * The old suite tested chat fan-out through the hand-rolled `clients` Map. That
 * Map is gone — fan-out is socket.io rooms now — so those tests could only have
 * been kept by reintroducing the design they described.
 */

function mockSocket(user?: { userId: number; name: string }) {
  const socket: any = {
    emit: jest.fn(),
    join: jest.fn(),
    id: Math.random().toString(36).slice(2),
  };
  if (user) socket.battleUser = user;
  return socket;
}

function mockLogger() {
  return { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() } as any;
}

function mockServer(sockets: any[] = []) {
  const emit = jest.fn();
  return {
    to: jest.fn(() => ({ emit })),
    sockets: new Map(sockets.map((s) => [s.id, s])),
    use: jest.fn(),
    __roomEmit: emit,
  } as any;
}

function makeGateway(tickets: any = {}, server = mockServer()) {
  const gateway = new BattleGateway(
    mockLogger(),
    { leaveQueue: jest.fn(), joinQueue: jest.fn(), getQueueSize: jest.fn(() => 0) } as any,
    tickets as any,
    { recordPvpReplay: jest.fn() } as any,
  );
  (gateway as any).server = server;
  return gateway;
}

describe('BattleGateway — handshake', () => {
  it('refuses a socket that presents no ticket', () => {
    const server = mockServer();
    const gateway = makeGateway({ verify: jest.fn() }, server);
    gateway.afterInit(server);

    const middleware = server.use.mock.calls[0][0];
    const next = jest.fn();
    middleware({ handshake: { auth: {} } } as any, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('unauthorized');
  });

  it('refuses a socket whose ticket does not verify', () => {
    const server = mockServer();
    const verify = jest.fn(() => {
      throw new Error('expired');
    });
    const gateway = makeGateway({ verify }, server);
    gateway.afterInit(server);

    const middleware = server.use.mock.calls[0][0];
    const next = jest.fn();
    middleware({ handshake: { auth: { ticket: 'forged' } } } as any, next);

    expect(next.mock.calls[0][0].message).toBe('unauthorized');
  });

  it('attaches the identity from the ticket, not from the payload', () => {
    const server = mockServer();
    const verify = jest.fn(() => ({ userId: 7, name: 'Alice' }));
    const gateway = makeGateway({ verify }, server);
    gateway.afterInit(server);

    const middleware = server.use.mock.calls[0][0];
    const socket: any = { handshake: { auth: { ticket: 'good', userId: 999 } } };
    const next = jest.fn();
    middleware(socket, next);

    expect(next).toHaveBeenCalledWith();
    expect(socket.battleUser).toEqual({ userId: 7, name: 'Alice' });
  });
});

describe('BattleGateway — a battle belongs to its players', () => {
  const ROOM = 'room-1';
  let gateway: BattleGateway;
  let alice: any;
  let mallory: any;

  beforeEach(() => {
    alice = mockSocket({ userId: 1, name: 'Alice' });
    mallory = mockSocket({ userId: 99, name: 'Mallory' });
    gateway = makeGateway({}, mockServer([alice, mallory]));

    // A live room Alice (p1) is playing in and Mallory is not.
    (gateway as any).rooms.set(ROOM, {
      id: ROOM,
      format: 'gen9randombattle',
      status: 'active',
      replay: '',
      sideOf: (userId: number) => (userId === 1 ? 'p1' : null),
      currentRequest: () => null,
      choose: jest.fn(),
      forfeit: jest.fn(),
      undo: jest.fn(),
    });
    alice.emit.mockClear();
    mallory.emit.mockClear();
  });

  it('refuses a choice from someone who is not in the battle', async () => {
    await gateway.handleMakeChoice(mallory, { roomId: ROOM, choice: 'move 1' });

    const room = (gateway as any).rooms.get(ROOM);
    expect(room.choose).not.toHaveBeenCalled();
    expect(mallory.emit).toHaveBeenCalledWith('error', { code: 'not_in_battle' });
  });

  it('resolves the side from the socket identity, never from the payload', async () => {
    // Alice plays p1. Claiming to be p2 must not move p2's Pokémon.
    await gateway.handleMakeChoice(alice, { roomId: ROOM, choice: 'move 1', side: 'p2' } as any);

    const room = (gateway as any).rooms.get(ROOM);
    expect(room.choose).toHaveBeenCalledWith('p1', 'move 1');
  });

  it('refuses to resume a battle the caller has no side in', () => {
    gateway.handleResume(mallory, { roomId: ROOM });

    expect(mallory.emit).toHaveBeenCalledWith('error', { code: 'not_in_battle' });
    expect(mallory.join).not.toHaveBeenCalled();
  });

  it('resumes the caller onto their OWN side', () => {
    gateway.handleResume(alice, { roomId: ROOM });

    expect(alice.join).toHaveBeenCalledWith(ROOM);
    expect(alice.emit).toHaveBeenCalledWith(
      'resumed',
      expect.objectContaining({ roomId: ROOM, side: 'p1' }),
    );
  });

  it('stamps chat with the authenticated name rather than a supplied one', () => {
    const server = (gateway as any).server;
    gateway.handleChat(alice, { roomId: ROOM, message: 'gg', sender: 'Bob' } as any);

    expect(server.to).toHaveBeenCalledWith(ROOM);
    expect(server.__roomEmit).toHaveBeenCalledWith(
      'chatMessage',
      expect.objectContaining({ sender: 'Alice', message: 'gg' }),
    );
  });

  it('truncates an over-long chat message and drops an empty one', () => {
    const server = (gateway as any).server;
    gateway.handleChat(alice, { roomId: ROOM, message: 'x'.repeat(500) });
    expect(server.__roomEmit.mock.calls[0][1].message).toHaveLength(300);

    server.__roomEmit.mockClear();
    gateway.handleChat(alice, { roomId: ROOM, message: '   ' });
    expect(server.__roomEmit).not.toHaveBeenCalled();
  });
});
