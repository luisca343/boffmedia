import { BattleStreams, RandomPlayerAI, Teams } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';
import { getRandomTeam } from '../_utils/teams';

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
              done();
              return;
            }
          }
        }
      } catch (e: any) {
        done(new Error(`Omniscient error: ${e.message}`));
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

              // Auto-play: choose first available move or switch
              setTimeout(() => {
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
            }
          }
        }
      } catch (e: any) {
        done(new Error(`P1 error: ${e.message}`));
      }
    })();

    // Start battle
    void streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1spec)}\n>player p2 ${JSON.stringify(p2spec)}`,
    );

    // Safety timeout
    setTimeout(() => {
      done(
        new Error(
          `Timeout: omniscientLines=${omniscientLines}, p1Chunks=${p1Chunks}, requestCount=${requestCount}, winReceived=${winReceived}`,
        ),
      );
    }, 30_000);
  }, 35_000);
});
