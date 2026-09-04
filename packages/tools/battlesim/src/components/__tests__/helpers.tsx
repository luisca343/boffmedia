import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { Protocol } from '@pkmn/protocol';

/**
 * A client-view Battle built from REAL protocol lines.
 *
 * Deliberately not a hand-made fixture object: every one of these tests is about
 * whether the rendering follows the client's own state, and a fake `field` or a
 * fake `sideConditions` would only prove that the component reads the shape the
 * test author imagined. `battle.add` is the same call the event processor makes.
 */
export function makeBattle(): Battle {
  return new Battle(new Generations(Dex as any) as any);
}

export function feed(battle: Battle, lines: string[]): void {
  for (const line of lines) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    (battle as any).add(args, kwArgs);
  }
}

/** p1 leads Pyroar (female — it has its own sprite), p2 leads Rhydon. */
export const OPENING = [
  '|player|p1|Alice|1|',
  '|player|p2|Bob|2|',
  '|teamsize|p1|2',
  '|teamsize|p2|2',
  '|gametype|singles',
  '|gen|9',
  '|tier|[Gen 9] OU',
  '|start',
  '|switch|p1a: Pyroar|Pyroar, L50, F|200/200',
  '|switch|p2a: Rhydon|Rhydon, L50, M|250/250',
  '|turn|1',
];

export function openBattle(extra: string[] = []): Battle {
  const battle = makeBattle();
  feed(battle, [...OPENING, ...extra]);
  return battle;
}
