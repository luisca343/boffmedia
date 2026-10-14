import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import { Server as SocketIoServer } from 'socket.io';
import { WebSocket } from 'ws';
import { ConcursosModule } from './concursos.module';
import { ConcursosRoomsService } from './concursos-rooms.service';
import type {
  ConcursosRoomDto,
  ConcursosSocketResponseDto,
} from './concursos.dto';

const token = (n: number) => n.toString(16).padStart(48, '0');
type Peer = { socket: WebSocket; frames: ConcursosSocketResponseDto[] };
async function until<T>(read: () => T | undefined, timeout = 4000): Promise<T> {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = read();
    if (value !== undefined) return value;
    await new Promise((r) => setTimeout(r, 10));
  }
  throw new Error('WebSocket test timed out');
}
const snapshot = (peer: Peer) =>
  [...peer.frames].reverse().find((f) => f.data)?.data;

describe('Concursos real WebSocket transport', () => {
  let app: INestApplication;
  let rooms: ConcursosRoomsService;
  let url: string;
  let io: SocketIoServer;
  let peers: Peer[];
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ConcursosModule],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    rooms = app.get(ConcursosRoomsService);
    const port = (app.getHttpServer().address() as AddressInfo).port;
    url = `ws://127.0.0.1:${port}/concursos/socket`;
    // Exercise coexistence with Engine.IO upgrade listeners on the same port.
    io = new SocketIoServer(app.getHttpServer());
    peers = [];
  });
  afterEach(async () => {
    for (const peer of peers) peer.socket.terminate();
    io.disconnectSockets(true);
    await app.close();
  });
  async function connect(
    code: string,
    capability: string,
    accepted = true,
  ): Promise<Peer> {
    const socket = new WebSocket(url);
    const frames: ConcursosSocketResponseDto[] = [];
    const peer = { socket, frames };
    peers.push(peer);
    socket.on('message', (raw) => frames.push(JSON.parse(raw.toString())));
    await new Promise<void>((resolve, reject) => {
      socket.once('open', resolve);
      socket.once('error', reject);
    });
    socket.send(JSON.stringify({ type: 'auth', code, token: capability }));
    await until(() =>
      frames.find((f) => f.type === (accepted ? 'ready' : 'error')),
    );
    return peer;
  }
  let sequence = 0;
  async function command(peer: Peer, operation: string, body: object = {}) {
    const id = String(++sequence);
    peer.socket.send(JSON.stringify({ type: 'command', id, operation, body }));
    return until(() =>
      peer.frames.find(
        (f) => f.id === id && ['reply', 'error'].includes(f.type),
      ),
    );
  }
  const question = {
    id: 'q',
    category: 'Ciencia',
    prompt: '¿Cuál?',
    choices: ['A', 'B', 'C', 'D'],
    correctIndex: 1,
    seconds: 30,
    points: 100,
    phaseIndex: 0,
    phaseTitle: 'Primera',
  };

  it('pushes joins/configuration without polling and acknowledges leaving before disconnecting', async () => {
    const { code } = rooms.create(token(1), 'qa');
    const host = await connect(code, token(1));
    const start = Date.now();
    rooms.join(code, token(2), 'Lucía');
    await until(() =>
      snapshot(host)?.members.length === 1 ? true : undefined,
    );
    expect(Date.now() - start).toBeLessThan(700);
    const player = await connect(code, token(2));
    expect((await command(host, 'configuration', { mode: 'teams' })).type).toBe(
      'reply',
    );
    await until(() => (snapshot(player)?.mode === 'teams' ? true : undefined));
    expect((await command(player, 'leave')).type).toBe('reply');
    await until(() =>
      snapshot(host)?.members.length === 0 ? true : undefined,
    );
  });
  it('rejects unknown capabilities, forged host commands and invalid nested command fields', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'Ana');
    expect(
      (await connect(code, token(3), false)).frames.find(
        (f) => f.type === 'error',
      )?.statusCode,
    ).toBe(403);
    const player = await connect(code, token(2));
    expect(
      (await command(player, 'configuration', { mode: 'teams' })).statusCode,
    ).toBe(403);
    expect(
      (await command(player, 'action', { action: 'answer', choice: 8 }))
        .statusCode,
    ).toBe(400);
    const host = await connect(code, token(1));
    expect(
      (
        await command(host, 'start', {
          questions: [{ ...question, correctIndex: 7 }],
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await command(host, 'configuration', { mode: 'teams', extra: true }))
        .statusCode,
    ).toBe(400);
  });
  it('keeps proposals private on every pushed frame and reconnects with the same identity', async () => {
    const { code } = rooms.create(token(1), 'qa');
    for (let n = 2; n <= 5; n++) rooms.join(code, token(n), `P${n}`);
    const host = await connect(code, token(1));
    await command(host, 'configuration', { mode: 'teams' });
    const players = await Promise.all(
      [2, 3, 4, 5].map((n) => connect(code, token(n))),
    );
    for (let i = 0; i < players.length; i++)
      await command(players[i], 'group', {
        entityId: i < 2 ? 'team-1' : 'team-2',
      });
    await command(host, 'start', { questions: [question] });
    await command(players[0], 'action', { action: 'choose', questionId: 'q' });
    const before = snapshot(players[1]) as ConcursosRoomDto;
    const started = Date.now();
    await command(players[1], 'action', {
      action: 'propose',
      roundId: 1,
      choice: 2,
    });
    await until(() =>
      snapshot(players[0])?.game?.own?.proposals.length === 1
        ? true
        : undefined,
    );
    expect(Date.now() - started).toBeLessThan(700);
    for (const frame of host.frames) {
      expect(frame.data?.game?.own).toBeUndefined();
      expect(frame.data?.game?.question?.correctIndex).toBeUndefined();
    }
    for (const frame of players[2].frames)
      expect(frame.data?.game?.own?.proposals ?? []).toHaveLength(0);
    players[1].socket.terminate();
    const restored = await connect(code, token(3));
    expect(snapshot(restored)?.memberId).toBe(before.memberId);
    expect(snapshot(restored)?.game?.deadlineAt).toBe(before.game?.deadlineAt);
    expect(snapshot(restored)?.game?.own?.proposals).toHaveLength(1);
  });
  it('pushes individual answers/results immediately and rejects stale answers after advancing', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'Ana');
    rooms.join(code, token(3), 'Luis');
    const host = await connect(code, token(1));
    const a = await connect(code, token(2));
    const b = await connect(code, token(3));
    await command(host, 'start', {
      questions: [question, { ...question, id: 'q2' }],
    });
    await command(a, 'action', { action: 'choose', questionId: 'q' });
    await command(a, 'action', { action: 'answer', roundId: 1, choice: 1 });
    expect(snapshot(b)?.game?.own?.answer).toBeUndefined();
    const start = Date.now();
    await command(b, 'action', { action: 'answer', roundId: 1, choice: 0 });
    await until(() =>
      snapshot(host)?.game?.stage === 'result' ? true : undefined,
    );
    expect(Date.now() - start).toBeLessThan(700);
    expect(snapshot(host)?.entities[0].score).toBe(100);
    await command(host, 'action', { action: 'next', roundId: 1 });
    expect(
      (await command(a, 'action', { action: 'answer', roundId: 1, choice: 1 }))
        .statusCode,
    ).toBe(409);
    expect(snapshot(a)?.entities.every((e) => !e.captainId)).toBe(true);
  });
  it('closes by server deadline without any client read, and pushes host closure to all guests', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    const host = await connect(code, token(1));
    const a = await connect(code, token(2));
    const b = await connect(code, token(3));
    await command(host, 'start', { questions: [{ ...question, seconds: 1 }] });
    await command(a, 'action', { action: 'choose', questionId: 'q' });
    await until(() =>
      snapshot(b)?.game?.stage === 'result' ? true : undefined,
    );
    expect(snapshot(b)?.game?.question?.correctIndex).toBe(1);
    expect(snapshot(host)?.entities.map((e) => e.score)).toEqual([0, 0]);
    await command(host, 'close');
    await until(() => (snapshot(b)?.status === 'closed' ? true : undefined));
  });
});
