import { BattleRoom, type RoomPlayer } from './battle.room';

/**
 * The room's own contract, now that the simulator itself lives in
 * `@boffmedia/battle-core` and is covered there.
 *
 * The old suite here was a "diagnostic" that traced raw `@pkmn` stream chunks —
 * it tested the library, not this file, and none of it survived the engine
 * move. What matters at this layer is the two guards a client can drive: an
 * unknown format string, and a team format with no team.
 */

const P1: RoomPlayer = { userId: 1, name: 'Alice' };
const P2: RoomPlayer = { userId: 2, name: 'Bob' };

const noopCallbacks = () => ({
  onProtocol: jest.fn(),
  onRequestP1: jest.fn(),
  onRequestP2: jest.fn(),
  onBattleEnd: jest.fn(),
  onError: jest.fn(),
});

describe('BattleRoom', () => {
  it('refuses a format the format table does not know', async () => {
    const room = new BattleRoom('r1', 'gen9notarealformat', P1, P2, noopCallbacks());
    await expect(room.start()).rejects.toThrow('unknown_format');
  });

  it('refuses a team format when a side brought no team', async () => {
    // `gen9ou` has no random generator: without a packed team there is nothing
    // to start the battle with, and the old code handed the empty string to the
    // simulator and let it fail somewhere less legible.
    const room = new BattleRoom('r2', 'gen9ou', P1, P2, noopCallbacks());
    await expect(room.start()).rejects.toThrow('team_required');
  });

  it('maps an account id to the side it is playing', () => {
    const room = new BattleRoom('r3', 'gen9randombattle', P1, P2, noopCallbacks());
    expect(room.sideOf(1)).toBe('p1');
    expect(room.sideOf(2)).toBe('p2');
    // A spectator, or anyone else at all.
    expect(room.sideOf(999)).toBeNull();
  });

  it('runs a random-format battle and reports a winner', async () => {
    const callbacks = noopCallbacks();
    const room = new BattleRoom('r4', 'gen9randombattle', P1, P2, callbacks);
    await room.start();
    expect(room.status).toBe('active');

    // Both sides concede-by-default until someone wins; forfeiting p1 is the
    // shortest path to a real ending through the real simulator.
    await room.forfeit('p1');
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(callbacks.onBattleEnd).toHaveBeenCalled();
    expect(room.status).toBe('finished');
    // The log is what gets persisted; an empty one means a truncated replay.
    expect(room.replay.length).toBeGreaterThan(0);
  }, 30_000);
});
