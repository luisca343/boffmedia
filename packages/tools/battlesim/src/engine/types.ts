import { Battle } from "@pkmn/client";
import { Protocol } from "@pkmn/protocol";

/**
 * Loose view of a choice request as the battle UI consumes it. `@pkmn/protocol`
 * types `Request` as a strict move/switch/team/wait union; these components read
 * `active`/`side`/`forceSwitch` defensively (raw PS requests can omit `requestType`).
 */
export interface BattleRequest {
  requestType?: Protocol.Request["requestType"];
  rqid?: number;
  active?: (Protocol.Request.ActivePokemon | null)[] | null;
  side?: Protocol.Request.SideInfo;
  forceSwitch?: boolean[];
  noCancel?: boolean;
}

/**
 * Position data for scene elements
 */
export interface ScenePos {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
  xscale?: number;
  yscale?: number;
  opacity?: number;
  time?: number;
  display?: string;
}

/**
 * Animation data object
 */
export interface AnimationData {
  animType: string;
  transition: ScenePos;
  type?: string;
  callback?: () => void;
}

/**
 * Starting position for animations
 */
export interface StartingPosition {
  top: number;
  left: number;
}

/**
 * Props for animations
 */
export interface AnimationProps {
  startingPosition: StartingPosition;
  [key: string]: any;
}

export interface ReplayData {
  side1: string
  side2: string
  team1: string
  team2: string
  replay: string
  winner: number
  createdAt: string
}

// Extend the Battle type to include winner property
declare module "@pkmn/client" {
  interface Battle {
    winner?: string;
  }
}