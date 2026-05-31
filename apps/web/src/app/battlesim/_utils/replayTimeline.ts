import { ArgType, BattleArgsKWArgsTypes, Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";
import { Battle } from "@pkmn/client";
import { Generations } from "@pkmn/data";
import { Dex } from "@pkmn/sim";

export interface ReplayEvent {
  index: number;
  actionType: string;
  args: ArgType;
  kwArgs: BattleArgsKWArgsTypes;
  html: string;
  turnNumber: number;
}

export interface ReplayTimeline {
  events: ReplayEvent[];
  lastTurn: number;
  turnIndices: Map<number, number>;
}

export function parseReplayTimeline(replayText: string): ReplayTimeline {
  const lines = replayText.split('\n');
  const events: ReplayEvent[] = [];
  const turnIndices = new Map<number, number>();

  const battle = new Battle(new Generations(Dex as any) as any);
  const formatter = new LogFormatter('p1', battle);

  let currentTurn = 0;
  let started = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const { args, kwArgs } = Protocol.parseBattleLine(line);

    if (line.includes('|start')) started = true;
    if (!started) battle.add(line);

    if (args[0] === 'turn') {
      currentTurn = parseInt(args[1], 10);
      turnIndices.set(currentTurn, events.length);
    }

    const html = formatter.formatHTML(args, kwArgs);

    events.push({
      index: i,
      actionType: args[0],
      args,
      kwArgs,
      html,
      turnNumber: currentTurn,
    });
  }

  return {
    events,
    lastTurn: currentTurn,
    turnIndices,
  };
}
