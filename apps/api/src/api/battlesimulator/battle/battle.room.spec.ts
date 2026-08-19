import { BattleStreams, RandomPlayerAI, Teams } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { getRandomTeam } from '../_utils/teams';

/**
 * Runs a full random battle to completion to trace the stream data flow.
 *
 * Everything this test starts MUST be torn down through `finish()`. It shares a
 * process with every other suite under `--runInBand`, and it previously left its
 * 30s safety timer armed after the battle had already been won: the timer fired
 * ~30s later, inside whatever unrelated suite was running by then, and failed it
 * with an empty body ("Caught error after test environment was torn down").
 * The victim differed run to run, which is what made it look like a random flake.
 */
describe('BattleRoom — diagnostic', () => {
  it('should trace the stream data flow', (done) => {
    const team1 = getRandomTeam();
    const team2 = getRandomTeam();

    const streams = BattleStreams.getPlayerStreams(
      new BattleStreams.BattleStream(),
    );

    const ai = new RandomPlayerAI(streams.p2);
    void ai.start();

    const spec = { formatid: 'gen9randombattle' };
    const p1spec = { name: 'Player', team: Teams.pack(team1) };
    const p2spec = { name: 'Bot', team: Teams.pack(team2) };

    // `done` must run exactly once, and nothing may outlive it.
    let settled = false;
    const pending = new Set<ReturnType<typeof setTimeout>>();

    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      for (const t of pending) clearTimeout(t);
      pending.clear();
      // The streams are deliberately NOT destroyed: the sim closes them itself
      // once the battle ends, and tearing omniscient down early while p1/p2 are
      // still draining throws `Push after end of read stream` and kills the run.
      // Only the timers can outlive the test, so only the timers are cleared.
      done(err);
    };

    let omniscientLines = 0;
    let p1Chunks = 0;
    let requestCount = 0;
    let winReceived = false;

    // Read omniscient
    void (async () => {
      try {
        for await (const chunk of streams.omniscient) {
          for (const line of chunk.split('\n')) {
            if (!line.trim()) continue;
            omniscientLines++;
            const { args } = Protocol.parseBattleLine(line);
            if (args[0] === 'win') {
              winReceived = true;
              finish();
              return;
            }
          }
        }
      } catch (e: any) {
        finish(new Error(`Omniscient error: ${e.message}`));
      }
    })();

    // Read p1
    void (async () => {
      try {
        for await (const chunk of streams.p1) {
          p1Chunks++;
          const trimmed = chunk.trim();
          if (!trimmed) continue;

          // Try to find request lines in the chunk
          for (const line of trimmed.split('\n')) {
            const { args } = Protocol.parseBattleLine(line);
            if (args[0] === 'request') {
              requestCount++;
              const request = JSON.parse(args[1] as string);

              // The raw sim request has no `requestType` field — derive it the
              // same way production (battle.room.ts) does.
              if (!request.requestType) {
                if (request.active) {
                  request.requestType = 'move';
                } else if (request.teamPreview) {
                  request.requestType = 'team';
                } else if (request.side) {
                  request.requestType = 'switch';
                }
              }

              // Auto-play: choose first available move or switch
              const turn = setTimeout(() => {
                pending.delete(turn);
                if (settled) return;
                if (request.requestType === 'move' && request.active) {
                  const moves = request.active[0].moves;
                  const moveIndex = moves.findIndex((m: any) => !m.disabled);
                  if (moveIndex >= 0) {
                    streams.p1.write(`move ${moveIndex + 1}`);
                  }
                } else if (request.requestType === 'switch' && request.side) {
                  const switchIndex = request.side.pokemon.findIndex(
                    (p: any, _i: number) =>
                      !p.active && !p.condition.includes('fnt'),
                  );
                  if (switchIndex >= 0) {
                    streams.p1.write(`switch ${switchIndex + 1}`);
                  }
                } else if (request.requestType === 'team') {
                  streams.p1.write('team 1');
                }
              }, 10);
              pending.add(turn);
            }
          }
        }
      } catch (e: any) {
        finish(new Error(`P1 error: ${e.message}`));
      }
    })();

    // Start battle
    void streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1spec)}\n>player p2 ${JSON.stringify(p2spec)}`,
    );

    // Safety timeout — tracked in `pending`, so `finish()` clears it and it
    // cannot outlive the test.
    const safety = setTimeout(() => {
      finish(
        new Error(
          `Timeout: omniscientLines=${omniscientLines}, p1Chunks=${p1Chunks}, requestCount=${requestCount}, winReceived=${winReceived}`,
        ),
      );
    }, 30_000);
    pending.add(safety);
  }, 35_000);
});
