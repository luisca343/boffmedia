import { Battle } from "@pkmn/client";
import { Generations } from "@pkmn/data";
import { Dex } from "@pkmn/sim";
import { Protocol } from "@pkmn/protocol";
import { LogFormatter } from "@pkmn/view";

export interface BattleStateResult {
  battle: Battle;
  htmlLog: string[];
  actionIndex: number;
}

export class BattleStateBuilder {
  private battleLines: string[];
  private turnIndexMap: Map<number, number>;
  private formatter: LogFormatter;

  constructor(battleLines: string[], turnIndexMap: Map<number, number>) {
    this.battleLines = battleLines;
    this.turnIndexMap = turnIndexMap;
    this.formatter = new LogFormatter('p1', new Battle(new Generations(Dex as any) as any));
  }

  buildStateUntilTurn(targetTurn: number, lastTurn: number): BattleStateResult {
    const isEnd = targetTurn === lastTurn + 1;
    const targetLineIndex = isEnd ? this.battleLines.length : this.turnIndexMap.get(targetTurn);

    const battle = new Battle(new Generations(Dex as any) as any);
    const htmlLog: string[] = [];

    if (targetLineIndex === undefined) {
      // Turn not found — process all lines
      for (let i = 0; i < this.battleLines.length; i++) {
        const line = this.battleLines[i];
        if (!line.trim()) continue;
        const { args, kwArgs } = Protocol.parseBattleLine(line);
        battle.add(line);
        if (args[0] === 'win') battle.winner = args[1] as string;
        htmlLog.push(this.formatter.formatHTML(args, kwArgs));
      }
      return { battle, htmlLog, actionIndex: this.battleLines.length };
    }

    // Process lines up to the target turn
    for (let i = 0; i < this.battleLines.length; i++) {
      const line = this.battleLines[i];
      if (!line.trim()) continue;

      const { args, kwArgs } = Protocol.parseBattleLine(line);
      battle.add(line);

      if (args[0] === 'win') battle.winner = args[1] as string;
      htmlLog.push(this.formatter.formatHTML(args, kwArgs));

      // Stop after processing the target turn's last action
      if (!isEnd && args[0] === 'turn') {
        const currentTurn = parseInt(args[1]);
        if (currentTurn === targetTurn) {
          return { battle, htmlLog, actionIndex: i };
        }
      }
    }

    // Reached end (for isEnd case)
    const lastActionIndex = this.battleLines.filter(line => line.trim()).length;
    return { battle, htmlLog, actionIndex: lastActionIndex };
  }

  buildSetupState(): BattleStateResult {
    const battle = new Battle(new Generations(Dex as any) as any);

    for (const line of this.battleLines) {
      if (line.includes('|start')) {
        battle.add(line);
        break;
      }
      battle.add(line);
    }

    return { battle, htmlLog: [], actionIndex: 0 };
  }
}
