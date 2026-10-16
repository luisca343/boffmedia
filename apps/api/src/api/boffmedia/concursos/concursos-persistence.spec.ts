import { ConcursosPersistenceService } from './concursos-persistence.service';
import { ConcursosRoomsService } from './concursos-rooms.service';
import { ConcursosMemoryStore } from '@/_testing/concursos-memory-store';
import { validateSnapshot } from './concursos-snapshot-validation';
const token = (n: number) => n.toString(16).padStart(48, '0');
const question = {
  id: 'q',
  category: 'Science',
  prompt: 'Private solution',
  choices: ['a', 'b', 'c', 'd'],
  correctIndex: 1,
  seconds: 30,
  points: 100,
  phaseIndex: 0,
  phaseTitle: 'Round',
};
describe('Durable Concursos transitions and restart', () => {
  let store: ConcursosMemoryStore;
  let apis: ConcursosPersistenceService[];
  async function boot() {
    const api = new ConcursosPersistenceService(
      new ConcursosRoomsService(),
      store,
    );
    apis.push(api);
    await api.onModuleInit();
    return api;
  }
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-15T22:00:00Z'));
    store = new ConcursosMemoryStore();
    apis = [];
  });
  afterEach(() => {
    apis.forEach((a) => a.onModuleDestroy());
    jest.useRealTimers();
  });
  async function setup(
    mode: 'individual' | 'teams' = 'individual',
    pacing: 'automatic' | 'directed' = 'automatic',
  ) {
    const api = await boot();
    const { code } = await api.create(token(1), 'qa');
    await api.configure(code, token(1), { mode, pacing });
    for (let n = 2; n <= (mode === 'teams' ? 5 : 3); n++) {
      await api.join(code, token(n), 'Player ' + n);
      if (mode === 'teams')
        await api.group(code, token(n), n < 4 ? 'team-1' : 'team-2');
    }
    await api.startGame(code, token(1), {
      questions: [question, { ...question, id: 'q2' }],
    });
    await api.action(
      code,
      token(2),
      { action: 'choose', questionId: 'q' },
      'choose-once',
    );
    return { api, code };
  }
  for (const mode of ['individual', 'teams'] as const)
    for (const pacing of ['automatic', 'directed'] as const) {
      it(`restores private accepted answers and frozen time in ${mode}/${pacing}`, async () => {
        const { api, code } = await setup(mode, pacing);
        await api.action(
          code,
          token(2),
          { action: 'answer', choice: 1, roundId: 1 },
          'accepted',
        );
        const before = api.read(code, token(2));
        const row = [...store.rows.values()][0];
        api.onModuleDestroy();
        jest.setSystemTime(Date.now() + 12000);
        const restored = await boot();
        const room = restored.restoreHost(token(1));
        expect(room).toMatchObject({
          code,
          status: 'playing',
          mode,
          pacing,
          game: {
            paused: true,
            pauseReason: 'api_restarted',
            stage: 'question',
            roundId: 1,
          },
        });
        expect(room.game!.question).toBeUndefined();
        expect(room.game!.remainingMs).toBe(
          row.snapshot.game!.clock.deadlineAtMs! - row.snapshot.checkpointAtMs,
        );
        expect(room.entities).toEqual(before.entities);
        expect(restored.read(code, token(2)).game!.own!.answer).toBe(1);
        expect(restored.read(code, token(3)).game!.own!.answer).toBe(
          mode === 'teams' ? 1 : undefined,
        );
        expect(room.pendingRecoveries).toEqual([]);
        expect(JSON.stringify(restored.read(code, token(3)))).not.toContain(
          'correctIndex',
        );
        // A replay succeeds after restart without adding another attempt or changing the pause.
        expect(
          (
            await restored.action(
              code,
              token(2),
              { action: 'answer', choice: 1, roundId: 1 },
              'accepted',
            )
          ).game!.paused,
        ).toBe(true);
        await expect(
          restored.action(
            code,
            token(2),
            { action: 'answer', choice: 2, roundId: 1 },
            'accepted',
          ),
        ).rejects.toThrow();
      });
      it(`preserves already scored results without duplicate scoring in ${mode}/${pacing}`, async () => {
        const { api, code } = await setup(mode, pacing);
        await api.action(code, token(2), {
          action: 'answer',
          choice: 1,
          roundId: 1,
        });
        const result = await api.action(
          code,
          token(mode === 'teams' ? 4 : 3),
          { action: 'answer', choice: 1, roundId: 1 },
          'score-once',
        );
        expect(result.entities.map((e) => e.score)).toEqual([100, 100]);
        api.onModuleDestroy();
        jest.setSystemTime(Date.now() + 20000);
        const restored = await boot();
        const room = restored.read(code, token(1));
        expect(room.game).toMatchObject({
          stage: 'result',
          paused: true,
          pauseReason: 'api_restarted',
        });
        expect(room.entities.map((e) => e.score)).toEqual([100, 100]);
        expect(room.game!.results!.every((r) => r.correct)).toBe(true);
        await restored.action(
          code,
          token(mode === 'teams' ? 4 : 3),
          { action: 'answer', choice: 1, roundId: 1 },
          'score-once',
        );
        expect(
          restored.read(code, token(1)).entities.map((e) => e.score),
        ).toEqual([100, 100]);
      });
    }
  it('does not expose a transition before its database acknowledgement, and retains concurrent socket closure', async () => {
    const { api, code } = await setup();
    const connection = Symbol('player');
    api.socketOpened(code, token(2), connection);
    let release!: () => void;
    store.beforeWrite = () =>
      new Promise<void>((r) => {
        release = r;
      });
    const saving = api.action(code, token(2), {
      action: 'answer',
      choice: 1,
      roundId: 1,
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(api.read(code, token(2)).game!.own!.answer).toBeUndefined();
    api.socketClosed(code, token(2), connection);
    store.beforeWrite = undefined;
    release();
    await saving;
    expect(
      api
        .watch(code, token(1), false)
        .data!.members.find((m) => m.id === api.read(code, token(2)).memberId)!
        .connected,
    ).toBe(false);
  });
  it('rolls back failed answers, blocks submissions, and recovers paused without replay', async () => {
    const { api, code } = await setup();
    store.fail = true;
    await expect(
      api.action(code, token(2), { action: 'answer', choice: 1, roundId: 1 }),
    ).rejects.toThrow();
    expect(api.read(code, token(2))).toMatchObject({
      storageStatus: 'unavailable',
      game: {
        paused: true,
        pauseReason: 'storage_unavailable',
        own: { proposals: [] },
      },
    });
    expect(api.read(code, token(2)).game!.own!.answer).toBeUndefined();
    await expect(
      api.action(code, token(1), {
        action: 'resume',
        roundId: 1,
        controlRevision: api.read(code, token(1)).game!.controlRevision,
      }),
    ).rejects.toThrow();
    store.fail = false;
    await jest.advanceTimersByTimeAsync(1100);
    expect(api.read(code, token(2))).toMatchObject({
      storageStatus: 'ready',
      game: { paused: true, pauseReason: 'storage_unavailable' },
    });
    expect(api.read(code, token(2)).game!.own!.answer).toBeUndefined();
  });
  it('reconciles a committed answer whose acknowledgement was lost', async () => {
    const { api, code } = await setup();
    store.failAfterCommit = true;
    await expect(
      api.action(
        code,
        token(2),
        { action: 'answer', choice: 1, roundId: 1 },
        'uncertain',
      ),
    ).rejects.toThrow();
    expect(api.read(code, token(2)).game!.own!.answer).toBeUndefined();
    store.failAfterCommit = false;
    await jest.advanceTimersByTimeAsync(1100);
    expect(api.read(code, token(2)).game!.own!.answer).toBe(1);
    expect(api.read(code, token(2)).game!.paused).toBe(true);
    await api.action(
      code,
      token(2),
      { action: 'answer', choice: 1, roundId: 1 },
      'uncertain',
    );
    expect(api.read(code, token(2)).entities.every((e) => e.score === 0)).toBe(
      true,
    );
  });
  it('keeps recovery proofs, expiry and revoked identities across restarts', async () => {
    const { api, code } = await setup();
    const request = await api.requestDeviceRecovery(
      code,
      token(8),
      'Player 2',
      'qa',
    );
    api.onModuleDestroy();
    jest.setSystemTime(Date.now() + 10000);
    const restored = await boot();
    expect(restored.watch(code, token(8), false).recovery).toMatchObject({
      id: request.id,
      verificationCode: request.verificationCode,
      expiresAt: request.expiresAt,
      status: 'pending',
    });
    await restored.decideDeviceRecovery(code, token(1), request.id, true);
    restored.onModuleDestroy();
    const again = await boot();
    expect(() => again.read(code, token(2))).toThrow();
    expect(again.read(code, token(8)).memberId).toBe(request.memberId);
  });
  it('does not reset retention after repeated startup and expires closed rooms durably', async () => {
    const api = await boot();
    const { code } = await api.create(token(1), 'qa');
    const expiry = [...store.rows.values()][0].expiresAt;
    api.onModuleDestroy();
    jest.setSystemTime(Date.now() + 500000);
    const restored = await boot();
    expect([...store.rows.values()][0].expiresAt).toEqual(expiry);
    restored.onModuleDestroy();
    jest.setSystemTime(expiry.getTime() + 1);
    const expired = await boot();
    expect(() => expired.restoreHost(token(1))).toThrow();
    expect(expired.read(code, token(1)).status).toBe('closed');
    expect([...store.rows.values()][0].status).toBe('closed');
  });
  it('never treats unavailable or corrupt startup storage as an empty room registry', async () => {
    store.fail = true;
    const api = await boot();
    await expect(api.create(token(1), 'qa')).rejects.toThrow();
    expect(store.rows.size).toBe(0);
    store.fail = false;
    await jest.advanceTimersByTimeAsync(1100);
    const room = await api.create(token(1), 'qa');
    expect(room.code).toHaveLength(6);
    const row = [...store.rows.values()][0];
    expect(() => validateSnapshot({ ...row.snapshot, version: 2 })).toThrow();
    expect(() =>
      validateSnapshot({
        ...row.snapshot,
        members: [{ ...row.snapshot.members[0], capabilityHash: 'raw-token' }],
      }),
    ).toThrow();
  });
  it('restores a temporary captain with the original normal rotation cursor', async () => {
    const { api, code } = await setup('teams', 'directed');
    const sockets = [1, 2, 3, 4, 5].map((n) => {
      const connection = Symbol();
      api.socketOpened(code, token(n), connection);
      return connection;
    });
    api.socketClosed(code, token(2), sockets[1]);
    // Keep all other peers alive while waiting for the configured captain grace.
    for (let second = 0; second < 6; second++) {
      for (const n of [1, 3, 4, 5]) api.watch(code, token(n));
      await jest.advanceTimersByTimeAsync(1000);
    }
    const replacement = api.read(code, token(1)).entities[0];
    expect(replacement).toMatchObject({
      captainId: api.read(code, token(3)).memberId,
      temporaryCaptain: true,
    });
    api.onModuleDestroy();
    jest.setSystemTime(Date.now() + 30000);
    const restored = await boot();
    expect(restored.read(code, token(1)).entities[0]).toEqual(replacement);
    for (const n of [1, 2, 3, 4, 5])
      restored.socketOpened(code, token(n), Symbol());
    expect(restored.read(code, token(1)).entities[0].captainId).toBe(
      replacement.captainId,
    );
    const game = restored.read(code, token(1)).game!;
    await restored.action(code, token(1), {
      action: 'resume',
      roundId: 1,
      controlRevision: game.controlRevision,
    });
    for (let i = 0; i < 4; i++) {
      for (const n of [1, 2, 3, 4, 5]) restored.watch(code, token(n));
      await jest.advanceTimersByTimeAsync(1000);
    }
    await restored.action(code, token(3), {
      action: 'answer',
      roundId: 1,
      choice: 1,
      captainRevision: replacement.captainRevision,
    });
    await restored.action(code, token(4), {
      action: 'answer',
      roundId: 1,
      choice: 1,
      captainRevision: 0,
    });
    const next = await restored.action(code, token(1), {
      action: 'next',
      roundId: 1,
    });
    expect(next.entities[0]).toMatchObject({
      captainId: replacement.captainId,
      temporaryCaptain: false,
    });
    expect(next.entities[0].captainRevision).toBe(
      replacement.captainRevision! + 1,
    );
  });
  it('expires overdue phone requests before startup publishes the restored room', async () => {
    const { api, code } = await setup();
    const request = await api.requestDeviceRecovery(
      code,
      token(8),
      'Player 2',
      'qa',
    );
    api.onModuleDestroy();
    jest.setSystemTime(request.expiresAt + 1);
    const restored = await boot();
    expect(restored.watch(code, token(8), false).recovery!.status).toBe(
      'expired',
    );
    expect(restored.read(code, token(1)).pendingRecoveries).toEqual([]);
    await expect(
      restored.decideDeviceRecovery(code, token(1), request.id, true),
    ).rejects.toThrow();
  });
  it('serializes close versus create without acknowledging an unpersisted replacement room', async () => {
    const api = await boot();
    const { code } = await api.create(token(1), 'qa');
    const closing = api.close(code, token(1));
    const creating = api.create(token(1), 'qa');
    await closing;
    try {
      const room = await creating;
      expect(
        [...store.rows.values()].some(
          (r) => r.code === room.code && r.status !== 'closed',
        ),
      ).toBe(true);
    } catch {
      const room = await api.create(token(1), 'qa');
      expect(
        [...store.rows.values()].some(
          (r) => r.code === room.code && r.status !== 'closed',
        ),
      ).toBe(true);
    }
  });
  it('keeps the existing 100-room and source creation limits in durable creation', async () => {
    const api = await boot();
    for (let i = 1; i <= 100; i++) await api.create(token(i), 'source-' + i);
    await expect(api.create(token(101), 'source-101')).rejects.toThrow();
    expect(store.rows.size).toBe(100);
  });
  it('does not let a late heartbeat renew an expired lease during a database outage', async () => {
    const { api, code } = await setup();
    const connection = Symbol('host');
    api.socketOpened(code, token(1), connection);
    api.socketClosed(code, token(1), connection);
    store.fail = true;
    await expect(
      api.action(code, token(2), { action: 'answer', roundId: 1, choice: 1 }),
    ).rejects.toThrow();
    jest.setSystemTime(Date.now() + 601000);
    expect(() => api.read(code, token(1))).toThrow();
    expect(() => api.restoreHost(token(1))).toThrow();
    store.fail = false;
    await jest.advanceTimersByTimeAsync(1100);
    expect([...store.rows.values()][0].status).toBe('closed');
    expect(() => api.restoreHost(token(1))).toThrow();
  });
  it('persists Unicode nicknames and questions accepted by the public DTO lengths', async () => {
    const api = await boot();
    const { code } = await api.create(token(1), 'unicode');
    const nickname = '😀'.repeat(24);
    await api.join(code, token(2), nickname);
    await api.join(code, token(3), 'Other');
    await api.startGame(code, token(1), {
      questions: [
        {
          ...question,
          id: '😀'.repeat(160),
          category: '😀'.repeat(100),
          prompt: '😀'.repeat(2000),
          choices: Array(4).fill('😀'.repeat(500)) as string[],
          phaseTitle: '😀'.repeat(200),
        },
      ],
    });
    api.onModuleDestroy();
    const restored = await boot();
    expect(
      restored
        .read(code, token(2))
        .members.find((m) => m.nickname === nickname),
    ).toBeDefined();
    expect([...store.rows.values()][0].snapshot.game!.questions[0].prompt).toBe(
      '😀'.repeat(2000),
    );
  });
});
