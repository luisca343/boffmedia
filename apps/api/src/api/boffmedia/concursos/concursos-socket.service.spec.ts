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
type Peer = {
  heartbeat?: ReturnType<typeof setInterval>;
  socket: WebSocket;
  frames: ConcursosSocketResponseDto[];
};
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
    for (const peer of peers) {
      clearInterval(peer.heartbeat);
      peer.socket.terminate();
    }
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
    const peer: Peer = { socket, frames };
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
    if (accepted)
      peer.heartbeat = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN)
          socket.send(JSON.stringify({ type: 'ping' }));
      }, 1000);
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

  it('streams private recovery status, transfers on host approval and closes every revoked socket', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    const host = await connect(code, token(1));
    const old = await connect(code, token(2));
    const overlap = await connect(code, token(2));
    const other = await connect(code, token(3));
    await command(host, 'start', { questions: [question] });
    await command(old, 'action', { action: 'choose', questionId: 'q' });
    await command(old, 'action', { action: 'answer', roundId: 1, choice: 1 });
    const before = snapshot(old)!;
    const request = rooms.requestDeviceRecovery(code, token(8), 'A', 'qa');
    const applicant = await connect(code, token(8));
    expect(snapshot(applicant)).toBeUndefined();
    expect(
      applicant.frames.find((frame) => frame.recovery)?.recovery,
    ).toMatchObject({ id: request.id, status: 'pending' });
    expect(
      (
        await command(applicant, 'action', {
          action: 'answer',
          roundId: 1,
          choice: 2,
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (
        await command(host, 'recovery-decision', {
          requestId: 'invalid',
          approve: true,
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await command(other, 'recovery-decision', {
          requestId: request.id,
          approve: true,
        })
      ).statusCode,
    ).toBe(403);
    const approved = await command(host, 'recovery-decision', {
      requestId: request.id,
      approve: true,
    });
    expect(approved.type).toBe('reply');
    await until(() =>
      snapshot(applicant)?.memberId === before.memberId ? true : undefined,
    );
    expect(snapshot(applicant)?.game?.own?.answer).toBe(1);
    expect(snapshot(applicant)?.game?.deadlineAt).toBe(before.game!.deadlineAt);
    for (const peer of [old, overlap]) {
      await until(() =>
        peer.frames.find((frame) => frame.code === 'CONCURSOS_REVOKED'),
      );
      await until(() =>
        peer.socket.readyState === WebSocket.CLOSED ? true : undefined,
      );
    }
    const restored = await connect(code, token(8));
    expect(snapshot(restored)?.memberId).toBe(before.memberId);
    expect(
      (await connect(code, token(2), false)).frames.find(
        (frame) => frame.type === 'error',
      )?.code,
    ).toBe('CONCURSOS_REVOKED');
    expect(snapshot(other)?.pendingRecoveries).toBeUndefined();
  });
  it('acknowledges cancellation privately and pushes host denial without admitting an applicant', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    const host = await connect(code, token(1));
    const first = rooms.requestDeviceRecovery(code, token(8), 'A', 'qa');
    const applicant = await connect(code, token(8));
    const cancelled = await command(applicant, 'recovery-cancel', {
      requestId: first.id,
    });
    expect(cancelled).toMatchObject({
      type: 'reply',
      recovery: { status: 'cancelled' },
    });
    expect(cancelled.data).toBeUndefined();
    const second = rooms.requestDeviceRecovery(code, token(9), 'A', 'qa');
    const denied = await connect(code, token(9));
    await command(host, 'recovery-decision', {
      requestId: second.id,
      approve: false,
    });
    await until(() =>
      denied.frames.find((frame) => frame.recovery?.status === 'denied'),
    );
    expect(snapshot(denied)).toBeUndefined();
    expect(rooms.read(code, token(2)).role).toBe('player');
  });
  it('pushes joins/configuration without polling and acknowledges leaving before disconnecting', async () => {
    const { code } = rooms.create(token(1), 'qa');
    const host = await connect(code, token(1));
    await command(host, 'configuration', { pacing: 'directed' });
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
    await command(host, 'configuration', { pacing: 'directed' });
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
  it.each([
    ['individual', 'automatic'],
    ['individual', 'directed'],
    ['teams', 'automatic'],
    ['teams', 'directed'],
  ] as const)(
    'pauses and resumes the initial round-zero board in %s/%s',
    async (mode, pacing) => {
      const { code } = rooms.create(token(1), 'qa');
      rooms.join(code, token(2), 'A');
      rooms.join(code, token(3), 'B');
      const host = await connect(code, token(1));
      const a = await connect(code, token(2));
      const b = await connect(code, token(3));
      await command(host, 'configuration', { mode, pacing });
      if (mode === 'teams') {
        await command(a, 'group', { entityId: 'team-1' });
        await command(b, 'group', { entityId: 'team-2' });
      }
      const started = await command(host, 'start', { questions: [question] });
      expect(started.data?.game).toMatchObject({
        stage: 'board',
        roundId: 0,
        controlRevision: 0,
      });
      const invalid = await command(host, 'action', {
        action: 'pause',
        roundId: -1,
        controlRevision: 0,
      });
      expect(invalid).toMatchObject({
        type: 'error',
        statusCode: 400,
        code: 'CONCURSOS_GAME',
      });
      const forbidden = await command(a, 'action', {
        action: 'pause',
        roundId: 0,
        controlRevision: 0,
      });
      expect(forbidden).toMatchObject({
        type: 'error',
        statusCode: 403,
        code: 'CONCURSOS_ACCESS',
      });
      const paused = await command(host, 'action', {
        action: 'pause',
        roundId: 0,
        controlRevision: 0,
      });
      expect(paused.type).toBe('reply');
      expect(paused.data?.game).toMatchObject({
        stage: 'board',
        roundId: 0,
        paused: true,
        controlRevision: 1,
        board: [],
      });
      await until(() => (snapshot(b)?.game?.paused ? true : undefined));
      expect(
        (await command(a, 'action', { action: 'choose', questionId: 'q' }))
          .statusCode,
      ).toBe(409);
      const retry = await command(host, 'action', {
        action: 'pause',
        roundId: 0,
        controlRevision: 0,
      });
      expect(retry.data?.game?.controlRevision).toBe(1);
      const resume = await command(host, 'action', {
        action: 'resume',
        roundId: 0,
        controlRevision: 1,
      });
      expect(resume.type).toBe('reply');
      expect(resume.data?.game?.resumeAt).toBeGreaterThan(Date.now());
      const cancelled = await command(host, 'action', {
        action: 'pause',
        roundId: 0,
        controlRevision: 2,
      });
      expect(cancelled.data?.game?.paused).toBe(true);
      expect(cancelled.data?.game?.resumeAt).toBeUndefined();
      await command(host, 'action', {
        action: 'resume',
        roundId: 0,
        controlRevision: 3,
      });
      await until(() =>
        snapshot(b)?.game?.paused === false ? true : undefined,
      );
      expect(snapshot(b)?.game?.stage).toBe('board');
      expect(snapshot(b)?.game?.board).toHaveLength(1);
      expect(
        (await command(a, 'action', { action: 'choose', questionId: 'q' }))
          .type,
      ).toBe('reply');
      expect(snapshot(a)?.game?.roundId).toBe(1);
    },
    10000,
  );
  it('keeps proposals private on every pushed frame and reconnects with the same identity', async () => {
    const { code } = rooms.create(token(1), 'qa');
    for (let n = 2; n <= 5; n++) rooms.join(code, token(n), `P${n}`);
    const host = await connect(code, token(1));
    await command(host, 'configuration', { pacing: 'directed' });
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
    await command(host, 'configuration', { pacing: 'directed' });
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
    await command(host, 'configuration', { pacing: 'directed' });
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
  it('pushes automatic result countdown and advancement without host continuation and preserves it on reconnect', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    const host = await connect(code, token(1));
    const a = await connect(code, token(2));
    const b = await connect(code, token(3));
    const configured = await command(host, 'configuration', {
      pacing: 'automatic',
      resultSeconds: 3,
    });
    expect(configured.data).toMatchObject({
      mode: 'individual',
      pacing: 'automatic',
      resultSeconds: 3,
    });
    await command(host, 'start', { questions: [question] });
    expect(
      (await command(host, 'configuration', { pacing: 'directed' })).statusCode,
    ).toBe(409);
    await command(a, 'action', { action: 'choose', questionId: 'q' });
    await command(a, 'action', { action: 'answer', roundId: 1, choice: 1 });
    await command(b, 'action', { action: 'answer', roundId: 1, choice: 0 });
    await until(() => snapshot(host)?.game?.advanceAt);
    const advanceAt = snapshot(host)!.game!.advanceAt;
    expect(snapshot(a)?.game?.results?.[0].points).toBe(100);
    a.socket.terminate();
    const restored = await connect(code, token(2));
    expect(snapshot(restored)?.game?.advanceAt).toBe(advanceAt);
    await until(() =>
      snapshot(host)?.game?.stage === 'finished' ? true : undefined,
    );
    expect(snapshot(restored)?.entities[0].score).toBe(100);
    expect(snapshot(b)?.game?.advanceAt).toBeUndefined();
  });
  it('pushes masked pause, rejects player controls, restores the countdown and keeps private answers', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    const host = await connect(code, token(1));
    const a = await connect(code, token(2));
    const b = await connect(code, token(3));
    await command(host, 'start', { questions: [question] });
    await command(a, 'action', { action: 'choose', questionId: 'q' });
    await command(a, 'action', { action: 'answer', roundId: 1, choice: 1 });
    const paused = await command(host, 'action', {
      action: 'pause',
      roundId: 1,
      controlRevision: 0,
    });
    expect(paused.type).toBe('reply');
    await until(() => (snapshot(b)?.game?.paused ? true : undefined));
    expect(snapshot(b)?.game?.question).toBeUndefined();
    expect(snapshot(host)?.game?.own).toBeUndefined();
    expect(snapshot(a)?.game?.own?.answer).toBe(1);
    expect(
      (await command(b, 'action', { action: 'answer', roundId: 1, choice: 1 }))
        .statusCode,
    ).toBe(409);
    expect(
      (
        await command(b, 'action', {
          action: 'resume',
          roundId: 1,
          controlRevision: 1,
        })
      ).statusCode,
    ).toBe(403);
    const frozen = paused.data!.game!.remainingMs!;
    a.socket.terminate();
    const refreshed = await connect(code, token(2));
    expect(snapshot(refreshed)?.game?.remainingMs).toBe(frozen);
    const resume = await command(host, 'action', {
      action: 'resume',
      roundId: 1,
      controlRevision: 1,
    });
    expect(resume.data!.game!.resumeAt).toBeGreaterThan(Date.now());
    await until(() => (snapshot(b)?.game?.paused === false ? true : undefined));
    expect(
      snapshot(b)!.game!.deadlineAt! - snapshot(b)!.game!.serverNow,
    ).toBeGreaterThan(frozen - 200);
    expect(
      (
        await command(host, 'action', {
          action: 'pause',
          roundId: 1,
          controlRevision: 0,
        })
      ).statusCode,
    ).toBe(409);
  }, 10000);
  it('automatically pauses on an actual host socket loss and waits for explicit resume after host reconnect', async () => {
    const { code } = rooms.create(token(1), 'qa');
    rooms.join(code, token(2), 'A');
    rooms.join(code, token(3), 'B');
    const host = await connect(code, token(1));
    const a = await connect(code, token(2));
    const b = await connect(code, token(3));
    await command(host, 'configuration', {
      recoverySettings: {
        version: 1,
        hostGraceSeconds: 2,
        hostRetentionMinutes: 1,
        hideQuestionWhilePaused: true,
        allowLocalSelectionWhilePaused: false,
        resumeCountdownSeconds: 1,
      },
    });
    await command(host, 'start', { questions: [question] });
    await command(a, 'action', { action: 'choose', questionId: 'q' });
    host.socket.terminate();
    await until(() =>
      snapshot(b)?.game?.pauseReason === 'host_disconnected' ? true : undefined,
    );
    const remaining = snapshot(b)!.game!.remainingMs!;
    const restored = await connect(code, token(1));
    expect(snapshot(restored)?.hostConnected).toBe(true);
    expect(snapshot(restored)?.game?.paused).toBe(true);
    expect(snapshot(restored)?.game?.remainingMs).toBe(remaining);
    const game = snapshot(restored)!.game!;
    await command(restored, 'action', {
      action: 'resume',
      roundId: game.roundId,
      controlRevision: game.controlRevision,
    });
    await until(() => (snapshot(a)?.game?.paused === false ? true : undefined));
    expect(
      snapshot(a)!.game!.deadlineAt! - snapshot(a)!.game!.serverNow,
    ).toBeGreaterThan(remaining - 200);
  }, 10000);
});
