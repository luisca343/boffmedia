import { useMemo } from "react";
import { Battle } from "@pkmn/client";
import { Protocol } from "@pkmn/protocol";
import type { BSXMon } from "@/components/boffmedia/primitives";
import type { BSXKeyMove, BSXTickEv, TeamMemberHP } from "../_utils/toBSXMon";
import { toBSXMon, toBSXKeyMoves, requestPokemonToBSXMon, toBSXTicks, toTeamHP } from "../_utils/toBSXMon";

type TimerState = {
  p1: { turnRemaining: number; totalRemaining: number };
  p2: { turnRemaining: number; totalRemaining: number };
  activeSide: "p1" | "p2" | null;
};

interface BattleState {
  battle: Battle;
  status: string;
  currentRequest: Protocol.Request | null;
  isWaitingForChoice: boolean;
  htmlLog: string[];
  messageBar: string[];
  timerState: TimerState | null;
  winner: string | null;
  battleComplete: boolean;
}

export interface BSXLayout {
  bsxAlly: BSXMon | null;
  bsxFoe: BSXMon | null;
  bsxMoves: BSXKeyMove[];
  bsxBench: BSXMon[];
  bsxTicks: BSXTickEv[];
  bsxTimerP1: number;
  bsxTimerP2: number;
  bsxScoreP1: { name: string; rating: string; av: string; team: TeamMemberHP[] } | null;
  bsxScoreP2: { name: string; rating: string; av: string; team: TeamMemberHP[] } | null;
  requestType: "move" | "switch" | "team" | null;
  mechCanTera: boolean;
  mechCanMega: boolean;
  mechCanDyna: boolean;
  mechZMoves: boolean;
  mechTeraType: string | undefined;
  turnText: string;
}

export function useBSXLayout(state: BattleState | null): BSXLayout {
  return useMemo(() => {
    if (!state) {
      return {
        bsxAlly: null, bsxFoe: null,
        bsxMoves: [], bsxBench: [],
        bsxTicks: [], bsxTimerP1: 0, bsxTimerP2: 0,
        bsxScoreP1: null, bsxScoreP2: null,
        requestType: null,
        mechCanTera: false, mechCanMega: false, mechCanDyna: false,
        mechZMoves: false, mechTeraType: undefined,
        turnText: "",
      };
    }

    const { battle, htmlLog, timerState } = state;
    const p1 = battle.p1;
    const p2 = battle.p2;

    const ally = toBSXMon(p1.active[0]);
    const foe = toBSXMon(p2.active[0]);

    const request = state.currentRequest;
    const requestType = request?.requestType || (request?.active ? "move" : request?.side ? "switch" : null) as "move" | "switch" | null;

    const moves = request?.active?.[0]?.moves
      ? toBSXKeyMoves(request.active[0].moves as any)
      : [];

    const bench = (request?.side?.pokemon || []).map((p: any) => requestPokemonToBSXMon(p));

    const ticks = toBSXTicks(htmlLog);

    const timerP1 = timerState ? Math.ceil(timerState.p1.turnRemaining / 1000) : 0;
    const timerP2 = timerState ? Math.ceil(timerState.p2.turnRemaining / 1000) : 0;

    const activeReq = request?.active?.[0];
    const scoreP1 = {
      name: p1.name || "Player",
      rating: `Turn ${battle.turn}`,
      av: (p1.name || "P")[0]?.toUpperCase() || "P",
      team: toTeamHP(p1.team, (p1 as any).totalPokemon),
    };
    const scoreP2 = {
      name: p2.name || "Opponent",
      rating: state.winner ? `Winner: ${state.winner}` : `Turn ${battle.turn}`,
      av: (p2.name || "O")[0]?.toUpperCase() || "O",
      team: toTeamHP(p2.team, (p2 as any).totalPokemon),
    };

    return {
      bsxAlly: ally,
      bsxFoe: foe,
      bsxMoves: moves,
      bsxBench: bench,
      bsxTicks: ticks,
      bsxTimerP1: timerP1,
      bsxTimerP2: timerP2,
      bsxScoreP1: scoreP1,
      bsxScoreP2: scoreP2,
      requestType,
      mechCanTera: !!activeReq?.canTerastallize,
      mechCanMega: !!activeReq?.canMegaEvo,
      mechCanDyna: !!activeReq?.canDynamax,
      mechZMoves: !!activeReq?.zMoves,
      mechTeraType: activeReq?.canTerastallize,
      turnText: `Turn ${battle.turn}`,
    };
  }, [state]);
}
