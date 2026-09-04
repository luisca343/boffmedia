/**
 * Determinism tests for the seeded AI.
 *
 * These compare the FULL omniscient battle log, not the winner. Comparing
 * winners is a coin flip: two completely unseeded battles agree half the time,
 * so such a test passes even when seeding is broken — which is how the first
 * version of this file passed while the battle PRNG was not seeded at all.
 *
 * They also drive real battles through BattleEngine rather than re-implementing
 * the decision logic, so deleting the seed threading makes them fail.
 */

import { describe, expect, it } from 'vitest';
import { BattleEngine } from './BattleEngine.js';

/**
 * Four distinct, NON-LOCKING moves per mon, on purpose.
 *
 * The first version of this team ran Outrage, which locks the user in for two
 * to three turns. A locked mon has exactly one legal choice, so `chooseMove`
 * is never reached with a real decision and the difficulty tiers have nothing
 * to differ on — the tier test failed for a reason that had nothing to do with
 * the tiers. Varied coverage moves keep a genuine choice open every turn.
 */
const TEAM = [
  {
    species: 'Garchomp',
    level: 50,
    ability: 'Rough Skin',
    moves: ['Earthquake', 'Stone Edge', 'Fire Fang', 'Dragon Claw'],
  },
  {
    species: 'Dragonite',
    level: 50,
    ability: 'Multiscale',
    moves: ['Extreme Speed', 'Fire Punch', 'Thunder Punch', 'Dragon Claw'],
  },
] as any;

/** Plays a battle to its end (or the turn cap) and returns the whole log. */
async function playBattle(
  seed: number | null,
  difficulty: 'easy' | 'medium' | 'hard',
): Promise<string> {
  let request: any = null;
  let finished = false;

  const engine = new BattleEngine(
    'determinism-test',
    {
      onLine: (viewer, line) => {
        if (viewer === 'p1' && line.startsWith('|request|')) {
          const payload = line.slice('|request|'.length);
          if (payload.trim()) request = JSON.parse(payload);
        }
      },
      onBattleEnd: () => {
        finished = true;
      },
      onError: () => {},
    },
    'ai',
  );

  await engine.create(
    'gen9ou',
    { name: 'A', team: TEAM },
    { name: 'B', team: TEAM },
    { aiDifficulty: difficulty, aiSeed: seed },
  );

  // p1 plays a FIXED script, so the only variation left is the seeded RNG and
  // the bot's choices. A random p1 would mask a determinism failure.
  for (let turn = 0; turn < 40 && !finished && !engine.isFinished; turn++) {
    await new Promise((r) => setTimeout(r, 20));
    if (!request) continue;
    const rqid = request.rqid;
    // gen9ou opens with TEAM PREVIEW. Answering that with 'move 1' leaves the
    // battle parked before turn 1 — which is how an earlier version of this
    // file compared two battles that had never actually been played.
    const choice = request.teamPreview
      ? 'team 1'
      : request.forceSwitch
        ? 'switch 2'
        : 'move 1';
    request = null;
    const res = await engine.makeChoice('p1', choice, rqid);
    if (!res.ok) await engine.makeChoice('p1', 'default', rqid);
  }

  // The omniscient stream is not delivered through onLine; it accumulates as
  // the replay, which is exactly the transcript we want to compare.
  //
  // `|t:|` is a wall-clock timestamp the simulator stamps on the battle: it
  // differs between two runs a second apart no matter how well seeded they are,
  // so it is dropped rather than weakening the comparison to something coarser.
  return engine.replayLog
    .split('\n')
    .filter((line) => !line.startsWith('|t:|'))
    .join('\n');
}

describe('seeded AI determinism', () => {
  it('replays identically for the same seed and tier', async () => {
    const a = await playBattle(42069, 'medium');
    const b = await playBattle(42069, 'medium');

    // The whole transcript, not just who won.
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  }, 60000);

  it('diverges for a different seed', async () => {
    const a = await playBattle(1000, 'medium');
    const b = await playBattle(2000, 'medium');

    expect(a).not.toBe(b);
  }, 60000);

  it('plays differently per tier on the same seed', async () => {
    // Same seed, same teams, same p1 script: any difference in the transcript
    // can only come from the tier changing the bot's decisions. This is what
    // makes "hard is not just easy with a different label" checkable.
    const easy = await playBattle(31337, 'easy');
    const hard = await playBattle(31337, 'hard');

    expect(easy).not.toBe(hard);
  }, 60000);
});
