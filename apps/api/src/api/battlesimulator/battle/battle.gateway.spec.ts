import { BattleGateway } from './battle.gateway';

/**
 * Two things are under test here.
 *
 * The first is the reason M2 exists: the gateway used to trust whatever
 * identity the client sent. Every test in the first two blocks is a thing that
 * WAS possible.
 *
 * The second is the wire contract the per-viewer streams introduced —
 * per-viewer rooms, per-viewer `seq`, snapshots that re-prompt, and the
 * rejections a client has to be told about instead of being ignored.
 */

function mockSocket(user?: { userId: number; name: string }) {
  const socket: any = {
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    data: {},
    id: Math.random().toString(36).slice(2),
  };
  if (user) socket.battleUser = user;
  return socket;
}

function mockLogger() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  } as any;
}

/** Records every `server.to(room).emit(event, payload)` with the room it went to. */
function mockServer(sockets: any[] = []): any {
  const sent: Array<{ room: string; event: string; payload: any }> = [];
  const emit = jest.fn();
  const server: any = {
    to: jest.fn((room: string) => ({
      emit: (event: string, payload: any) => {
        sent.push({ room, event, payload });
        emit(event, payload);
      },
    })),
    sockets: new Map(sockets.map((s) => [s.id, s])),
    use: jest.fn(),
    __roomEmit: emit,
    __sent: sent,
    __to(room: string) {
      return sent.filter((s) => s.room === room);
    },
  };
  return server;
}

function makeGateway(
  tickets: any = {},
  server = mockServer(),
  overrides: any = {},
) {
  const gateway = new BattleGateway(
    mockLogger(),
    {
      leaveQueue: jest.fn(),
      joinQueue: jest.fn(),
      requeue: jest.fn(),
      getQueueSize: jest.fn(() => 0),
      ...(overrides.matchmaking ?? {}),
    } as any,
    tickets as any,
    { recordPvpReplay: jest.fn(), ...(overrides.repo ?? {}) } as any,
  );
  (gateway as any).server = server;
  return gateway;
}

/** A room double with a real per-viewer transcript. */
function fakeRoom(
  id: string,
  options: { status?: string; sides?: Record<number, 'p1' | 'p2'> } = {},
) {
  const sides = options.sides ?? { 1: 'p1' as const };
  const viewLog: Record<string, string[]> = {
    p1: ['|player|p1|Alice', '|turn|1', '|request|{"rqid":4,"active":[]}'],
    p2: ['|player|p1|Alice', '|turn|1', '|request|{"rqid":4,"active":[]}'],
    spec: ['|player|p1|Alice', '|turn|1'],
  };
  return {
    id,
    format: 'gen9randombattle',
    status: options.status ?? 'active',
    createdAt: Date.now(),
    finishedAt: null,
    replay: '',
    sideOf: (userId: number) => sides[userId] ?? null,
    viewerOf: (userId: number) => sides[userId] ?? 'spec',
    snapshot: (viewer: string) => ({
      replay: [...viewLog[viewer]],
      seq: viewLog[viewer].length - 1,
    }),
    currentRequestLine: () => viewLog.p1[viewLog.p1.length - 1],
    choose: jest.fn(async () => ({ ok: true })),
    undo: jest.fn(async () => ({ ok: true })),
    forfeit: jest.fn(async () => undefined),
  };
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
    const socket: any = {
      handshake: { auth: { ticket: 'good', userId: 999 } },
    };
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
    (gateway as any).rooms.set(ROOM, fakeRoom(ROOM));
    alice.emit.mockClear();
    mallory.emit.mockClear();
  });

  it('refuses a choice from someone who is not in the battle', async () => {
    await gateway.handleMakeChoice(mallory, { roomId: ROOM, choice: 'move 1' });

    const room = (gateway as any).rooms.get(ROOM);
    expect(room.choose).not.toHaveBeenCalled();
    expect(mallory.emit).toHaveBeenCalledWith('error', {
      code: 'not_in_battle',
    });
  });

  it('resolves the side from the socket identity, never from the payload', async () => {
    // Alice plays p1. Claiming to be p2 must not move p2's Pokémon.
    await gateway.handleMakeChoice(alice, {
      roomId: ROOM,
      choice: 'move 1',
      rqid: 4,
      side: 'p2',
    } as any);

    const room = (gateway as any).rooms.get(ROOM);
    expect(room.choose).toHaveBeenCalledWith('p1', 'move 1', 4);
  });

  it('refuses to resume a battle the caller has no side in', () => {
    gateway.handleResume(mallory, { roomId: ROOM });

    expect(mallory.emit).toHaveBeenCalledWith('error', {
      code: 'not_in_battle',
    });
    expect(mallory.join).not.toHaveBeenCalled();
  });

  it('stamps chat with the authenticated name rather than a supplied one', () => {
    const server = (gateway as any).server;
    gateway.handleChat(alice, {
      roomId: ROOM,
      message: 'gg',
      sender: 'Bob',
    } as any);

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

describe('BattleGateway — per-viewer snapshots', () => {
  const ROOM = 'room-2';
  let gateway: BattleGateway;
  let alice: any;
  let watcher: any;

  beforeEach(() => {
    alice = mockSocket({ userId: 1, name: 'Alice' });
    watcher = mockSocket({ userId: 50, name: 'Watcher' });
    gateway = makeGateway({}, mockServer([alice, watcher]));
    (gateway as any).rooms.set(ROOM, fakeRoom(ROOM));
    alice.emit.mockClear();
  });

  it('resumes a player into THEIR view room, with their last request line', () => {
    gateway.handleResume(alice, { roomId: ROOM });

    expect(alice.join).toHaveBeenCalledWith(ROOM);
    expect(alice.join).toHaveBeenCalledWith(`${ROOM}:p1`);
    // …and out of the other two, so one socket never straddles two views.
    expect(alice.leave).toHaveBeenCalledWith(`${ROOM}:p2`);
    expect(alice.leave).toHaveBeenCalledWith(`${ROOM}:spec`);

    const payload = alice.emit.mock.calls.find(
      (c: any[]) => c[0] === 'resumed',
    )![1];
    expect(payload).toMatchObject({
      roomId: ROOM,
      side: 'p1',
      status: 'active',
    });
    // The snapshot's seq is the index of its last line — the live stream picks
    // up at seq + 1, with no gap and no overlap.
    expect(payload.seq).toBe(payload.replay.length - 1);
    expect(payload.replay.at(-1)).toMatch(/^\|request\|/);
  });

  it('is idempotent: resuming twice answers the same snapshot', () => {
    gateway.handleResume(alice, { roomId: ROOM });
    const first = alice.emit.mock.calls.find(
      (c: any[]) => c[0] === 'resumed',
    )![1];
    alice.emit.mockClear();
    gateway.handleResume(alice, { roomId: ROOM });
    const second = alice.emit.mock.calls.find(
      (c: any[]) => c[0] === 'resumed',
    )![1];
    expect(second).toEqual(first);
  });

  it('gives a spectator the spectator view, which carries no request', () => {
    gateway.handleSpectate(watcher, { roomId: ROOM });

    expect(watcher.join).toHaveBeenCalledWith(`${ROOM}:spec`);
    const payload = watcher.emit.mock.calls.find(
      (c: any[]) => c[0] === 'spectateJoined',
    )![1];
    expect(payload.side).toBeNull();
    expect(payload.seq).toBe(payload.replay.length - 1);
    expect(payload.replay.some((l: string) => l.startsWith('|request|'))).toBe(
      false,
    );
  });

  it('gives a PLAYER who spectates their own side, and clears their grace timer', () => {
    // A fresh socket that only has a room id must not be silently downgraded to
    // percentage HP and never re-prompted.
    const timer = setTimeout(() => undefined, 60_000);
    (gateway as any).graceTimers.set(1, timer);

    gateway.handleSpectate(alice, { roomId: ROOM });

    expect((gateway as any).graceTimers.has(1)).toBe(false);
    expect(alice.join).toHaveBeenCalledWith(`${ROOM}:p1`);
    const payload = alice.emit.mock.calls.find(
      (c: any[]) => c[0] === 'spectateJoined',
    )![1];
    expect(payload.side).toBe('p1');
    expect(payload.replay.at(-1)).toMatch(/^\|request\|/);
    clearTimeout(timer);
  });

  it('never sends a private `request` event; requests are lines', () => {
    gateway.handleResume(alice, { roomId: ROOM });
    gateway.handleSpectate(alice, { roomId: ROOM });
    const events = alice.emit.mock.calls.map((c: any[]) => c[0]);
    expect(events).not.toContain('request');
  });
});

describe('BattleGateway — rejections reach the client', () => {
  const ROOM = 'room-3';
  let gateway: BattleGateway;
  let alice: any;
  let room: ReturnType<typeof fakeRoom>;

  beforeEach(() => {
    alice = mockSocket({ userId: 1, name: 'Alice' });
    gateway = makeGateway({}, mockServer([alice]));
    room = fakeRoom(ROOM);
    (gateway as any).rooms.set(ROOM, room);
    alice.emit.mockClear();
  });

  it('tells the client when its rqid was stale', async () => {
    room.choose = jest.fn(async () => ({
      ok: false,
      code: 'stale_choice',
    })) as any;
    await gateway.handleMakeChoice(alice, {
      roomId: ROOM,
      choice: 'move 1',
      rqid: 1,
    });
    expect(alice.emit).toHaveBeenCalledWith('error', {
      roomId: ROOM,
      code: 'stale_choice',
    });
  });

  it('tells the client when an undo was refused', async () => {
    room.undo = jest.fn(async () => ({
      ok: false,
      code: 'nothing_to_undo',
    })) as any;
    await gateway.handleUndoChoice(alice, { roomId: ROOM });
    expect(alice.emit).toHaveBeenCalledWith('error', {
      roomId: ROOM,
      code: 'nothing_to_undo',
    });
  });

  it('does not throw forfeiting a room that never started', async () => {
    const waiting = fakeRoom('room-w', { status: 'waiting' });
    (gateway as any).rooms.set('room-w', waiting);
    await expect(
      gateway.handleForfeit(alice, { roomId: 'room-w' }),
    ).resolves.toBeUndefined();
    expect(waiting.forfeit).toHaveBeenCalledWith('p1');
  });
});

describe('BattleGateway — createRoom limits and reaping', () => {
  it('tells BOTH players when a match is rate limited, and puts them back in the queue', async () => {
    const requeue = jest.fn();
    const alice = mockSocket({ userId: 1, name: 'Alice' });
    const bob = mockSocket({ userId: 2, name: 'Bob' });
    const gateway = makeGateway({}, mockServer([alice, bob]), {
      matchmaking: { requeue },
    });
    gateway.handleConnection(alice);
    gateway.handleConnection(bob);

    // Burn Alice's window. Bob's is untouched — the point of evaluating both
    // predicates is that his create still gets counted and he still gets told.
    (gateway as any).createLog.set(
      1,
      Array.from({ length: 10 }, () => Date.now()),
    );

    await (gateway as any).createRoom(
      { userId: 1, name: 'Alice' },
      { userId: 2, name: 'Bob' },
      'gen9randombattle',
      'queue',
    );

    expect((gateway as any).rooms.size).toBe(0);
    for (const socket of [alice, bob]) {
      expect(socket.emit).toHaveBeenCalledWith('error', {
        code: 'rate_limited',
      });
    }
    // Back in the queue WITHOUT re-matching: `joinQueue` here would pair the
    // same two people again and hit the same limit, forever.
    expect(requeue).toHaveBeenCalledTimes(2);
    expect(requeue.mock.calls.map((c) => c[0].playerId).sort()).toEqual([
      '1',
      '2',
    ]);
  });

  it('does not re-queue a rate-limited CHALLENGE; nobody was in a queue', async () => {
    const requeue = jest.fn();
    const alice = mockSocket({ userId: 1, name: 'Alice' });
    const gateway = makeGateway({}, mockServer([alice]), {
      matchmaking: { requeue },
    });
    gateway.handleConnection(alice);
    (gateway as any).createLog.set(
      1,
      Array.from({ length: 10 }, () => Date.now()),
    );

    await (gateway as any).createRoom(
      { userId: 1, name: 'Alice' },
      { userId: 2, name: 'Bob' },
      'gen9randombattle',
      'challenge',
    );

    expect(requeue).not.toHaveBeenCalled();
  });

  it('reaps a room that never left `waiting`', () => {
    const server = mockServer();
    const gateway = makeGateway({}, server);
    const stuck = fakeRoom('stuck', { status: 'waiting' });
    stuck.createdAt = Date.now() - 10 * 60_000;
    (gateway as any).rooms.set('stuck', stuck);
    (gateway as any).hold(1, 'stuck');

    (gateway as any).reap();

    // Three of these used to lock an account out of PvP entirely: they held a
    // side against MAX_ROOMS_PER_USER and nothing ever freed them.
    expect((gateway as any).rooms.has('stuck')).toBe(false);
    expect((gateway as any).userRooms.has(1)).toBe(false);
    expect(server.__to('stuck')).toContainEqual(
      expect.objectContaining({
        event: 'error',
        payload: { roomId: 'stuck', code: 'battle_start_failed' },
      }),
    );
  });

  it('keeps a finished room around until its TTL, then reaps it', () => {
    const gateway = makeGateway();
    const finished = fakeRoom('done', { status: 'finished' });
    (finished as any).finishedAt = Date.now();
    (gateway as any).rooms.set('done', finished);

    (gateway as any).reap();
    expect((gateway as any).rooms.has('done')).toBe(true);

    (finished as any).finishedAt = Date.now() - 10 * 60_000;
    (gateway as any).reap();
    expect((gateway as any).rooms.has('done')).toBe(false);
  });
});

describe('BattleGateway — the ending', () => {
  it('sends battleEnd per viewer, with that viewer’s seq and its own replayId', async () => {
    const server = mockServer();
    const recordPvpReplay = jest.fn(async () => ({
      p1: 'replay-a',
      p2: 'replay-b',
    }));
    const gateway = makeGateway({}, server, { repo: { recordPvpReplay } });
    const room = fakeRoom('end-1');
    (gateway as any).rooms.set('end-1', room);

    await (gateway as any).finishRoom(room, 'Alice', '|start\n|win|Alice', {
      p1: 12,
      p2: 9,
      spec: 7,
    });

    const ends = server.__sent.filter((s: any) => s.event === 'battleEnd');
    expect(ends).toHaveLength(3);
    expect(ends.find((e: any) => e.room === 'end-1:p1')!.payload).toEqual({
      roomId: 'end-1',
      seq: 12,
      winner: 'Alice',
      replayId: 'replay-a',
    });
    expect(ends.find((e: any) => e.room === 'end-1:p2')!.payload).toEqual({
      roomId: 'end-1',
      seq: 9,
      winner: 'Alice',
      replayId: 'replay-b',
    });
    // A spectator owns no replay row.
    expect(
      ends.find((e: any) => e.room === 'end-1:spec')!.payload.replayId,
    ).toBeNull();
  });

  it('still ends the battle when the replay cannot be saved', async () => {
    const server = mockServer();
    const recordPvpReplay = jest.fn(async () => {
      throw new Error('db down');
    });
    const gateway = makeGateway({}, server, { repo: { recordPvpReplay } });
    const room = fakeRoom('end-2');

    await (gateway as any).finishRoom(room, 'Alice', '|win|Alice', {
      p1: 1,
      p2: 1,
      spec: 1,
    });

    const ends = server.__sent.filter((s: any) => s.event === 'battleEnd');
    expect(ends).toHaveLength(3);
    for (const end of ends) expect((end as any).payload.replayId).toBeNull();
  });
});
