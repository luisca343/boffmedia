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
