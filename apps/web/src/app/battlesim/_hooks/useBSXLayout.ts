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
  bsxAlly2: BSXMon | null;
  /** Third active ally slot (triples only). */
  bsxAlly3: BSXMon | null;
  bsxFoe: BSXMon | null;
  bsxFoe2: BSXMon | null;
  /** Third active foe slot (triples only). */
  bsxFoe3: BSXMon | null;
  bsxMoves: BSXKeyMove[];
  bsxMoves2: BSXKeyMove[];
  /** Moves for the third active slot (triples only). */
  bsxMoves3: BSXKeyMove[];
  bsxBench: BSXMon[];
  /** 1-based switch indices into the full side.pokemon array (excludes active slots). */
  bsxBenchSwitchIndices: number[];
  bsxTicks: BSXTickEv[];
  bsxTimerP1: number;
  bsxTimerP2: number;
  bsxScoreP1: { name: string; rating: string; av: string; team: TeamMemberHP[] } | null;
  bsxScoreP2: { name: string; rating: string; av: string; team: TeamMemberHP[] } | null;
  requestType: "move" | "switch" | "team" | "wait" | null;
  /** True for doubles AND triples (any multi-active format). */
  isDoubles: boolean;
  /** True when 3 Pokémon are active per side; isDoubles is also true in this case. */
  isTriple: boolean;
  mechCanTera: boolean;
  mechCanMega: boolean;
  mechCanDyna: boolean;
  mechZMoves: boolean;
  mechTeraType: string | undefined;
  /** Mechanics for the second active slot (doubles/triples phase 1). */
  mechCanTera2: boolean;
  mechCanMega2: boolean;
  mechCanDyna2: boolean;
  mechZMoves2: boolean;
  mechTeraType2: string | undefined;
  /** Mechanics for the third active slot (triples phase 2). */
  mechCanTera3: boolean;
  mechCanMega3: boolean;
  mechCanDyna3: boolean;
  mechZMoves3: boolean;
  mechTeraType3: string | undefined;
  turnText: string;
}

export function useBSXLayout(state: BattleState | null): BSXLayout {
  return useMemo(() => {
    if (!state) {
      return {
        bsxAlly: null, bsxAlly2: null, bsxAlly3: null,
        bsxFoe: null, bsxFoe2: null, bsxFoe3: null,
        bsxMoves: [], bsxMoves2: [], bsxMoves3: [],
        bsxBench: [], bsxBenchSwitchIndices: [],
        bsxTicks: [], bsxTimerP1: 0, bsxTimerP2: 0,
        bsxScoreP1: null, bsxScoreP2: null,
        requestType: null, isDoubles: false, isTriple: false,
        mechCanTera: false, mechCanMega: false, mechCanDyna: false,
        mechZMoves: false, mechTeraType: undefined,
        mechCanTera2: false, mechCanMega2: false, mechCanDyna2: false,
        mechZMoves2: false, mechTeraType2: undefined,
        mechCanTera3: false, mechCanMega3: false, mechCanDyna3: false,
        mechZMoves3: false, mechTeraType3: undefined,
        turnText: "",
      } as BSXLayout;
    }

    const { battle, htmlLog, timerState } = state;
    const p1 = battle.p1;
    const p2 = battle.p2;

    const ally = toBSXMon(p1.active[0]);
    const ally2 = p1.active.length > 1 ? toBSXMon(p1.active[1]) : null;
    const ally3 = p1.active.length > 2 ? toBSXMon(p1.active[2]) : null;
    const foe = toBSXMon(p2.active[0]);
    const foe2 = p2.active.length > 1 ? toBSXMon(p2.active[1]) : null;
    const foe3 = p2.active.length > 2 ? toBSXMon(p2.active[2]) : null;

    const request = state.currentRequest;
    const requestType = request?.requestType || (request?.active ? "move" : request?.side ? "switch" : null) as "move" | "switch" | null;

    const activeCount = request?.active?.length ?? 0;
    const isDoubles = activeCount > 1;
    const isTriple = activeCount > 2;

    const moves = request?.active?.[0]?.moves
      ? toBSXKeyMoves(request.active[0].moves as any)
      : [];

    const moves2 = isDoubles && request?.active?.[1]?.moves
      ? toBSXKeyMoves(request.active[1].moves as any)
      : [];

    const moves3 = isTriple && request?.active?.[2]?.moves
      ? toBSXKeyMoves(request.active[2].moves as any)
      : [];

    // Exclude currently-active slots; preserve original 1-based indices for switch commands.
    const rawPokemon = (request?.side?.pokemon || []) as any[];
    const benchEntries = rawPokemon
      .map((p, i) => ({ p, switchIdx: i + 1 }))
      .filter(({ p }) => !p.active);
    const bench = benchEntries.map(({ p }) => requestPokemonToBSXMon(p));
    const benchSwitchIndices = benchEntries.map(({ switchIdx }) => switchIdx);

    const ticks = toBSXTicks(htmlLog);

    const timerP1 = timerState ? Math.ceil(timerState.p1.turnRemaining / 1000) : 0;
    const timerP2 = timerState ? Math.ceil(timerState.p2.turnRemaining / 1000) : 0;

    const activeReq = request?.active?.[0];
    const activeReq2 = request?.active?.[1];
    const activeReq3 = request?.active?.[2];
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
      bsxAlly2: ally2,
      bsxAlly3: ally3,
      bsxFoe: foe,
      bsxFoe2: foe2,
      bsxFoe3: foe3,
      bsxMoves: moves,
      bsxMoves2: moves2,
      bsxMoves3: moves3,
      bsxBench: bench,
      bsxBenchSwitchIndices: benchSwitchIndices,
      bsxTicks: ticks,
      bsxTimerP1: timerP1,
      bsxTimerP2: timerP2,
      bsxScoreP1: scoreP1,
      bsxScoreP2: scoreP2,
      requestType,
      isDoubles,
      isTriple,
      mechCanTera: !!activeReq?.canTerastallize,
      mechCanMega: !!activeReq?.canMegaEvo,
      mechCanDyna: !!activeReq?.canDynamax,
      mechZMoves: !!activeReq?.zMoves,
      mechTeraType: activeReq?.canTerastallize,
      mechCanTera2: !!activeReq2?.canTerastallize,
      mechCanMega2: !!activeReq2?.canMegaEvo,
      mechCanDyna2: !!activeReq2?.canDynamax,
      mechZMoves2: !!activeReq2?.zMoves,
      mechTeraType2: activeReq2?.canTerastallize,
      mechCanTera3: !!activeReq3?.canTerastallize,
      mechCanMega3: !!activeReq3?.canMegaEvo,
      mechCanDyna3: !!activeReq3?.canDynamax,
      mechZMoves3: !!activeReq3?.zMoves,
      mechTeraType3: activeReq3?.canTerastallize,
      turnText: `Turn ${battle.turn}`,
    };
  }, [state]);
}
