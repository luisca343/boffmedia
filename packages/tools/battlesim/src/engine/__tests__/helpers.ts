import { Battle } from '@pkmn/client';
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { BattleSession, SessionCallbacks } from '../BattleSession';

export const OPENING = [
  '|player|p1|Alice|1|',
  '|player|p2|Bob|2|',
  '|teamsize|p1|3',
  '|teamsize|p2|3',
  '|gametype|singles',
  '|gen|9',
  '|tier|[Gen 9] OU',
  '|start',
  '|switch|p1a: Pikachu|Pikachu, L50, M|200/200',
  '|switch|p2a: Rhydon|Rhydon, L50, M|250/250',
  '|turn|1',
];

export function makeBattle(): Battle {
  return new Battle(new Generations(Dex as any) as any);
}

/** A field element with the slot boxes React would have rendered. */
export function makeField(): HTMLElement {
  const root = document.createElement('div');
  for (const code of ['p1a', 'p2a']) {
    const slot = document.createElement('div');
    slot.id = code;
    const inner = document.createElement('div');
    slot.appendChild(inner);
    root.appendChild(slot);
  }
  document.body.appendChild(root);
  return root;
}

export interface Spy {
  updates: number;
  requests: any[];
  ends: string[];
  gaps: Array<[number, number]>;
  callbacks: SessionCallbacks;
}

export function makeSpy(extra?: Partial<SessionCallbacks>): Spy {
  const spy: Spy = {
    updates: 0,
    requests: [],
    ends: [],
    gaps: [],
    callbacks: null as any,
  };
  spy.callbacks = {
    onUpdate: () => { spy.updates++; extra?.onUpdate?.(); },
    onRequest: (r) => { spy.requests.push(r); extra?.onRequest?.(r); },
    onBattleEnd: (w) => { spy.ends.push(w); extra?.onBattleEnd?.(w); },
    onGap: (a, b) => { spy.gaps.push([a, b]); extra?.onGap?.(a, b); },
  };
  return spy;
}

/**
 * A session with a mounted field and every scene animation stubbed out, so a
 * test measures ORDER rather than duration.
 */
export function makeSession(opts: { acceleration?: number; spy?: Spy } = {}) {
  const spy = opts.spy ?? makeSpy();
  const session = new BattleSession('room-1', spy.callbacks);
  session.setAcceleration(opts.acceleration ?? 8);
  const field = makeField();
  session.initScene(field, 0);
  return { session, spy, field };
}

export function settle(ms = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Drives the macrotask queue until `predicate` holds or the budget runs out. */
export async function waitFor(predicate: () => boolean, budgetMs = 2000): Promise<void> {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > budgetMs) throw new Error('waitFor timed out');
    await settle(5);
  }
}

export async function feed(session: BattleSession, lines: string[]): Promise<void> {
  for (const line of lines) session.addLine(line);
  await waitFor(() => !(session as any).processing && (session as any).lineBuffer.length === 0);
  await settle(5);
}
