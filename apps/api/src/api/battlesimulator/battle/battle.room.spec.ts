import type { TimerState } from '@boffmedia/battle-core';
import {
  BattleRoom,
  type BattleRoomCallbacks,
  type RoomPlayer,
  type RoomViewer,
} from './battle.room';

/**
 * The room's own contract, now that the simulator itself lives in
 * `@boffmedia/battle-core` and is covered there.
 *
 * What matters at this layer is the transcript: three viewers, each with its
 * own monotonic sequence, and a snapshot that puts a reconnecting socket in
 * exactly the state it would have been in had it never left.
 */

const P1: RoomPlayer = { userId: 1, name: 'Alice' };
const P2: RoomPlayer = { userId: 2, name: 'Bob' };

interface Recorded {
  viewer: RoomViewer;
  seq: number;
  line: string;
}

function harness() {
  const lines: Recorded[] = [];
  const ends: Array<{ winner: string; seqs: Record<RoomViewer, number> }> = [];
  const errors: string[] = [];
  const callbacks: BattleRoomCallbacks = {
    onLine: (viewer, seq, line) => lines.push({ viewer, seq, line }),
    onBattleEnd: (result, seqs) => ends.push({ winner: result.winner, seqs }),
    onError: (error) => errors.push(error),
  };
  return { callbacks, lines, ends, errors };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

describe('BattleRoom — guards', () => {
  it('refuses a format the format table does not know', async () => {
    const room = new BattleRoom(
      'r1',
      'gen9notarealformat',
      P1,
      P2,
      harness().callbacks,
    );
    await expect(room.start()).rejects.toThrow('unknown_format');
  });

  it('refuses a team format when a side brought no team', async () => {
    // `gen9ou` has no random generator: without a packed team there is nothing
    // to start the battle with, and the old code handed the empty string to the
    // simulator and let it fail somewhere less legible.
    const room = new BattleRoom('r2', 'gen9ou', P1, P2, harness().callbacks);
    await expect(room.start()).rejects.toThrow('team_required');
  });

  it('maps an account id to the side it is playing, and everyone else to spec', () => {
    const room = new BattleRoom(
      'r3',
      'gen9randombattle',
      P1,
      P2,
      harness().callbacks,
    );
    expect(room.sideOf(1)).toBe('p1');
    expect(room.sideOf(2)).toBe('p2');
    expect(room.sideOf(999)).toBeNull();
    expect(room.viewerOf(1)).toBe('p1');
    expect(room.viewerOf(999)).toBe('spec');
  });

  it('does not throw when a room that never started is forfeited', async () => {
    // M6: `forfeit` walked straight into streams that did not exist yet and
    // threw a TypeError out of the gateway's handler.
    const h = harness();
    const room = new BattleRoom('r4', 'gen9randombattle', P1, P2, h.callbacks);
    expect(room.status).toBe('waiting');
    await expect(room.forfeit('p1')).resolves.toBeUndefined();
    expect(room.status).toBe('finished');
    expect(h.ends).toHaveLength(1);
    expect(h.errors).toEqual([]);
  });
});

describe('BattleRoom — the transcript', () => {
  jest.setTimeout(60_000);

  it('gives each viewer its own seq, monotonic from 0, matching its log index', async () => {
    const h = harness();
    const room = new BattleRoom('t1', 'gen9randombattle', P1, P2, h.callbacks);
    await room.start();
    await settle();

    for (const viewer of ['p1', 'p2', 'spec'] as const) {
      const seen = h.lines.filter((l) => l.viewer === viewer);
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.map((l) => l.seq)).toEqual(seen.map((_, index) => index));

      // The room's snapshot is the same array, indexed the same way.
      const snapshot = room.snapshot(viewer);
      expect(snapshot.replay).toEqual(seen.map((l) => l.line));
      expect(snapshot.seq).toBe(seen.length - 1);
    }
    await room.forfeit('p1');
    await settle();
  });

  it("puts each side's |request| line in that side's log and nowhere else", async () => {
    const h = harness();
    const room = new BattleRoom('t2', 'gen9randombattle', P1, P2, h.callbacks);
    await room.start();
    await settle();

    const requests = (viewer: RoomViewer) =>
      room.snapshot(viewer).replay.filter((l) => l.startsWith('|request|'));

    expect(requests('p1').length).toBeGreaterThan(0);
    expect(requests('p2').length).toBeGreaterThan(0);
    // A spectator must never be handed a request: it names a whole team.
    expect(requests('spec')).toHaveLength(0);

    // The snapshot a resuming player replays ENDS with their prompt, which is
    // what makes `resume` re-prompt without any separate request plumbing.
    const p1Requests = requests('p1');
    expect(p1Requests[p1Requests.length - 1]).toBe(
      room.currentRequestLine('p1'),
    );

    await room.forfeit('p1');
    await settle();
  });

  it('refuses a stale rqid and a duplicate choice', async () => {
    const h = harness();
    const room = new BattleRoom('t3', 'gen9randombattle', P1, P2, h.callbacks);
    await room.start();
    await settle();

    const line = room.currentRequestLine('p1')!;
    const rqid = JSON.parse(line.slice('|request|'.length)).rqid as number;

    expect(await room.choose('p1', 'default', rqid - 1)).toEqual({
      ok: false,
      code: 'stale_choice',
    });
    expect(await room.choose('p1', 'default', rqid)).toEqual({ ok: true });
    // The same click again, or the same choice re-sent after a reconnect.
    expect(await room.choose('p1', 'default', rqid)).toEqual({
      ok: false,
      code: 'stale_choice',
    });

    await room.forfeit('p1');
    await settle();
  });

  it('ends once, on every viewer, with a seq past the last line', async () => {
    const h = harness();
    const room = new BattleRoom('t4', 'gen9randombattle', P1, P2, h.callbacks);
    await room.start();
    await settle();

    const before = {
      p1: room.snapshot('p1').replay.length,
      p2: room.snapshot('p2').replay.length,
      spec: room.snapshot('spec').replay.length,
    };

    await room.forfeit('p1');
    await settle();

    expect(h.ends).toHaveLength(1);
    expect(room.status).toBe('finished');
    for (const viewer of ['p1', 'p2', 'spec'] as const) {
      // Exactly one win line each — the ending is not duplicated.
      expect(
        room.snapshot(viewer).replay.filter((l) => l.startsWith('|win|')),
      ).toHaveLength(1);
      expect(h.ends[0].seqs[viewer]).toBeGreaterThanOrEqual(before[viewer]);
      expect(h.ends[0].seqs[viewer]).toBe(room.snapshot(viewer).replay.length);
    }
    // The persisted log is the omniscient one, not any viewer's.
    expect(room.replay.length).toBeGreaterThan(0);
  });
});

describe('BattleRoom — timer', () => {
  // B6: TimerManager was rewritten and then never wired, so the clock existed
  // and did nothing. These use a deliberately short config so expiry is
  // observable; the point of both is that a timer which emits nothing and
  // never fires must FAIL here, which is what the audit's version of the
  // feature would have done.
  const timed = { enabled: true, turnMs: 2_000, totalMs: 4_000 };

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  it('ticks once a battle with an enabled timer is under way', async () => {
    const h = harness();
    const updates: TimerState[] = [];
    const room = new BattleRoom(
      'timer-ticks',
      'gen9randombattle',
      P1,
      P2,
      { ...h.callbacks, onTimerUpdate: (state) => updates.push(state) },
      undefined,
      timed,
    );
    await room.start();
    await wait(1_500);

    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0]).toMatchObject({
      p1: {
        turnRemaining: expect.any(Number),
        totalRemaining: expect.any(Number),
      },
      p2: {
        turnRemaining: expect.any(Number),
        totalRemaining: expect.any(Number),
      },
    });

    await room.forfeit('p1');
    await settle();
  }, 15_000);

  it('ends the battle through the normal forfeit path when a clock runs out', async () => {
    const h = harness();
    const room = new BattleRoom(
      'timer-expiry',
      'gen9randombattle',
      P1,
      P2,
      h.callbacks,
      undefined,
      timed,
    );
    await room.start();

    // Neither side ever chooses. The turn clock is the only thing that can end
    // this, and it must end it the same way a manual forfeit does — one
    // onBattleEnd carrying a winner, not a bespoke timeout result.
    await wait(5_000);

    expect(h.ends).toHaveLength(1);
    // `winner` is the player's NAME, the same field a manual forfeit fills.
    expect([P1.name, P2.name]).toContain(h.ends[0].winner);
    expect(room.status).not.toBe('active');
    expect(h.errors).toEqual([]);
  }, 20_000);

  it('leaves a room without a timer config untimed', async () => {
    const h = harness();
    const updates: TimerState[] = [];
    const room = new BattleRoom('timer-off', 'gen9randombattle', P1, P2, {
      ...h.callbacks,
      onTimerUpdate: (state) => updates.push(state),
    });
    await room.start();
    await wait(1_500);

    expect(updates).toEqual([]);
    expect(room.status).toBe('active');
    expect(h.ends).toEqual([]);

    await room.forfeit('p1');
    await settle();
  }, 15_000);
});
