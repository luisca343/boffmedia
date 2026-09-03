import { useMemo } from "react";
import { Battle } from "@pkmn/client";
import type { BattleRequest } from "./engine/types";
import type { BSXMon, BSXKeyMove, BSXTickEv, TeamMemberHP } from "./engine/toBSXMon";
import { toBSXMon, toBSXKeyMoves, requestPokemonToBSXMon, toBSXTicks, toTeamHP, makeLogTranslator } from "./engine/toBSXMon";
import { useToolT, BATTLESIM_NS } from "./i18n";

type TimerState = {
  p1: { turnRemaining: number; totalRemaining: number };
  p2: { turnRemaining: number; totalRemaining: number };
  activeSide: "p1" | "p2" | null;
};

interface BattleState {
  battle: Battle;
  status: string;
  currentRequest: BattleRequest | null;
  isWaitingForChoice: boolean;
  htmlLog: string[];
  messageBar: string[];
  timerState: TimerState | null;
  winner: string | null;
  battleComplete: boolean;
}

export type BSXRequestType = "move" | "switch" | "team" | null;

/** One active position the player has to give an order for. */
export interface BSXSlot {
  /** 0-based active slot (0 = a, 1 = b). */
  idx: number;
  mon: BSXMon | null;
  moves: BSXKeyMove[];
  canTera: boolean;
  teraType?: string;
  canMega: boolean;
  canDyna: boolean;
  canZ: boolean;
  trapped: boolean;
  /** Whether this slot needs an order in the current request. */
  needsOrder: boolean;
}

export interface BSXScore { name: string; av: string; team: TeamMemberHP[]; alive: number; total: number }

export interface BSXLayout {
  /** Your first active and the foe's first active (singles view). */
  bsxAlly: BSXMon | null;
  bsxFoe: BSXMon | null;
  /** Every active position, in slot order (doubles has two). */
  bsxAllies: (BSXMon | null)[];
  bsxFoes: (BSXMon | null)[];
  /** Slot 0's moves — kept for the styleguide and single-slot callers. */
  bsxMoves: BSXKeyMove[];
  /** Your whole side from the request, in switch-number order (index + 1). */
  bsxBench: BSXMon[];
  bsxTicks: BSXTickEv[];
  bsxTimerP1: number;
  bsxTimerP2: number;
  bsxTimerYou: number;
  bsxTimerFoe: number;
  bsxScoreYou: BSXScore | null;
  bsxScoreFoe: BSXScore | null;
  requestType: BSXRequestType;
  rqid: number | null;
  noCancel: boolean;
  forceSwitch: boolean[];
  slots: BSXSlot[];
  /** Team preview: how many Pokémon to bring (undefined = the whole team). */
  maxTeamSize?: number;
  gameType: string;
  /** Actives per side for this format (1 singles, 2 doubles…). */
  activeCount: number;
  /** Slot 0 mechanics — compatibility with the previous single-slot dock. */
  mechCanTera: boolean;
  mechCanMega: boolean;
  mechCanDyna: boolean;
  mechZMoves: boolean;
  mechTeraType: string | undefined;
  turn: number;
}

const EMPTY: BSXLayout = {
  bsxAlly: null, bsxFoe: null, bsxAllies: [], bsxFoes: [],
  bsxMoves: [], bsxBench: [],
  bsxTicks: [], bsxTimerP1: 0, bsxTimerP2: 0, bsxTimerYou: 0, bsxTimerFoe: 0,
  bsxScoreYou: null, bsxScoreFoe: null,
  requestType: null, rqid: null, noCancel: false, forceSwitch: [], slots: [],
  maxTeamSize: undefined, gameType: "singles", activeCount: 1,
  mechCanTera: false, mechCanMega: false, mechCanDyna: false,
  mechZMoves: false, mechTeraType: undefined,
  turn: 0,
};

const activesFor = (gameType: string) =>
  gameType === "doubles" ? 2 : gameType === "triples" ? 3 : gameType === "freeforall" ? 1 : 1;

/**
 * The battle state as the HUD reads it. `pov` decides which side is "you":
 * the previous version always read p1, so a PvP player seated as p2 saw the
 * opponent's plates as their own.
 */
export function useBSXLayout(state: BattleState | null, pov: 0 | 1 = 0): BSXLayout {
  const t = useToolT(BATTLESIM_NS);
  // The engine's log comes out of @pkmn/view in English whatever the UI locale
  // is; this re-renders the templates we know from the catalog.
  const translateLog = useMemo(() => makeLogTranslator(t), [t]);
  return useMemo(() => {
    if (!state) return EMPTY;

    const { battle, htmlLog, timerState } = state;
    const you = pov === 0 ? battle.p1 : battle.p2;
    const foe = pov === 0 ? battle.p2 : battle.p1;
    const gameType = String(battle.gameType || "singles").toLowerCase();
    const activeCount = activesFor(gameType);

    const allies = Array.from({ length: activeCount }, (_, i) => toBSXMon(you.active[i] ?? null));
    const foes = Array.from({ length: activeCount }, (_, i) => toBSXMon(foe.active[i] ?? null));

    const request = state.currentRequest;
    const rt = request?.requestType;
    const requestType: BSXRequestType =
      rt === "move" || rt === "switch" || rt === "team"
        ? rt
        : (request as any)?.teamPreview
          ? "team"
          : request?.active
            ? "move"
            : request?.forceSwitch
              ? "switch"
              : null;

    const bench = (request?.side?.pokemon || []).map((p: any) => requestPokemonToBSXMon(p));
    const forceSwitch = (request?.forceSwitch || []).map(Boolean);

    const slots: BSXSlot[] = [];
    if (requestType === "move" && request?.active) {
      request.active.forEach((a, i) => {
        const mon = bench[i] ?? allies[i] ?? null;
        const fainted = !!mon?.fnt;
        slots.push({
          idx: i,
          mon,
          moves: a ? toBSXKeyMoves(a.moves as any) : [],
          canTera: !!(a as any)?.canTerastallize,
          teraType: (a as any)?.canTerastallize || undefined,
          canMega: !!a?.canMegaEvo,
          canDyna: !!a?.canDynamax,
          canZ: !!a?.zMoves,
          trapped: !!(a as any)?.trapped,
          needsOrder: !!a && !fainted && !(a as any)?.commanding,
        });
      });
    } else if (requestType === "switch") {
      forceSwitch.forEach((needs, i) => {
        slots.push({
          idx: i, mon: bench[i] ?? allies[i] ?? null, moves: [],
          canTera: false, canMega: false, canDyna: false, canZ: false, trapped: false,
          needsOrder: needs,
        });
      });
    }

    const ticks = toBSXTicks(htmlLog, translateLog);

    const timerP1 = timerState ? Math.ceil(timerState.p1.turnRemaining / 1000) : 0;
    const timerP2 = timerState ? Math.ceil(timerState.p2.turnRemaining / 1000) : 0;

    const score = (side: typeof you): BSXScore => {
      const team = toTeamHP(side.team, (side as any).totalPokemon);
      return {
        name: side.name || "",
        av: (side.name || "?")[0]?.toUpperCase() || "?",
        team,
        alive: team.filter((m) => !m.fnt).length,
        total: team.length,
      };
    };

    const slot0 = slots[0];

    return {
      bsxAlly: allies[0] ?? null,
      bsxFoe: foes[0] ?? null,
      bsxAllies: allies,
      bsxFoes: foes,
      bsxMoves: slot0?.moves ?? [],
      bsxBench: bench,
      bsxTicks: ticks,
      bsxTimerP1: timerP1,
      bsxTimerP2: timerP2,
      bsxTimerYou: pov === 0 ? timerP1 : timerP2,
      bsxTimerFoe: pov === 0 ? timerP2 : timerP1,
      bsxScoreYou: score(you),
      bsxScoreFoe: score(foe),
      requestType,
      rqid: request?.rqid ?? null,
      noCancel: !!request?.noCancel,
      forceSwitch,
      slots,
      maxTeamSize: (request as any)?.maxTeamSize ?? (request as any)?.maxChosenTeamSize ?? undefined,
      gameType,
      activeCount,
      mechCanTera: !!slot0?.canTera,
      mechCanMega: !!slot0?.canMega,
      mechCanDyna: !!slot0?.canDyna,
      mechZMoves: !!slot0?.canZ,
      mechTeraType: slot0?.teraType,
      turn: battle.turn,
    };
  }, [state, pov, translateLog]);
}
